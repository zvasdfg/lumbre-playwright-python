#!/usr/bin/env bash
set -euo pipefail

PORTAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$PORTAL_DIR/.." && pwd)"
WRANGLER="$PORTAL_DIR/node_modules/.bin/wrangler"
RUN_TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
BACKUP_DIR="${D1_BACKUP_DIR:-$PORTAL_DIR/.d1-backups}"
BACKUP_PREFIX="$BACKUP_DIR/lumbre-db-staging-$RUN_TIMESTAMP"
BACKUP_SQL="$BACKUP_PREFIX.sql"
BOOKMARK_FILE="$BACKUP_PREFIX.bookmark.json"
LOCAL_STATE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lumbre-d1-restore.XXXXXX")"
PROBE_TABLE="restore_probe_${RUN_TIMESTAMP//[-:TZ]/_}"
PROBE_PRESENT=false

COUNTS_SQL="SELECT '__schema_tables' AS table_name, COUNT(*) AS row_count FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' UNION ALL SELECT 'catalog_products', COUNT(*) FROM catalog_products UNION ALL SELECT 'catalog_events', COUNT(*) FROM catalog_events UNION ALL SELECT 'hypotheses', COUNT(*) FROM hypotheses UNION ALL SELECT 'system_metadata', COUNT(*) FROM system_metadata ORDER BY table_name;"

cleanup() {
  if [[ "$PROBE_PRESENT" == true ]]; then
    echo "Cleaning up the remote rehearsal probe..." >&2
    "$WRANGLER" d1 execute DB --env staging --remote --yes \
      --command "DROP TABLE IF EXISTS $PROBE_TABLE;" >/dev/null || true
  fi
  rm -rf -- "$LOCAL_STATE_DIR"
}
trap cleanup EXIT INT TERM

if [[ "${D1_RESTORE_REHEARSAL_CONFIRM:-}" != "lumbre-db-staging" ]]; then
  echo "This operation temporarily mutates and restores staging." >&2
  echo "Rerun with D1_RESTORE_REHEARSAL_CONFIRM=lumbre-db-staging." >&2
  exit 2
fi

export WRANGLER_LOG_PATH="${WRANGLER_LOG_PATH:-$PORTAL_DIR/.wrangler/logs}"

cd "$PORTAL_DIR"

echo "Step 1/6: create a portable staging backup and recovery bookmark."
D1_BACKUP_TIMESTAMP="$RUN_TIMESTAMP" D1_BACKUP_DIR="$BACKUP_DIR" \
  "$PORTAL_DIR/scripts/d1-backup.sh" staging

BOOKMARK="$(node -e 'const fs=require("node:fs"); const value=JSON.parse(fs.readFileSync(process.argv[1], "utf8")).bookmark; if (!value) process.exit(1); process.stdout.write(value);' "$BOOKMARK_FILE")"

echo "Step 2/6: capture the remote baseline."
REMOTE_COUNTS_BEFORE="$($WRANGLER d1 execute DB --env staging --remote --json --command "$COUNTS_SQL")"

echo "Step 3/6: import the backup into an isolated local D1 database."
(cd "$BACKUP_DIR" && shasum -a 256 -c "$(basename "$BACKUP_SQL.sha256")")
"$WRANGLER" d1 execute lumbre-db --local --persist-to "$LOCAL_STATE_DIR" \
  --yes --file "$BACKUP_SQL" >/dev/null
LOCAL_COUNTS="$($WRANGLER d1 execute lumbre-db --local --persist-to "$LOCAL_STATE_DIR" --json --command "$COUNTS_SQL")"

node -e '
const remote = JSON.parse(process.argv[1]);
const local = JSON.parse(process.argv[2]);
const rows = payload => payload.flatMap(entry => entry.results ?? []);
const normalize = payload => Object.fromEntries(rows(payload).map(row => [row.table_name, Number(row.row_count)]));
const expected = normalize(remote);
const restored = normalize(local);
if (JSON.stringify(expected) !== JSON.stringify(restored)) {
  console.error("Local restore counts do not match the remote backup:", { expected, restored });
  process.exit(1);
}
console.log("Portable restore validated:", restored);
' "$REMOTE_COUNTS_BEFORE" "$LOCAL_COUNTS"

echo "Step 4/6: write a uniquely named probe after the recovery bookmark."
"$WRANGLER" d1 execute DB --env staging --remote --yes \
  --command "CREATE TABLE $PROBE_TABLE (id INTEGER PRIMARY KEY, marker TEXT NOT NULL); INSERT INTO $PROBE_TABLE (id, marker) VALUES (1, 'restore-rehearsal');" >/dev/null
PROBE_PRESENT=true

PROBE_COUNT="$($WRANGLER d1 execute DB --env staging --remote --json --command "SELECT COUNT(*) AS row_count FROM $PROBE_TABLE;")"
node -e '
const payload = JSON.parse(process.argv[1]);
const count = Number(payload[0]?.results?.[0]?.row_count);
if (count !== 1) {
  console.error(`Expected one recovery probe row, observed ${count}.`);
  process.exit(1);
}
' "$PROBE_COUNT"

echo "Step 5/6: restore staging to the pre-probe Time Travel bookmark."
RESTORE_RESULT="$($WRANGLER d1 time-travel restore DB --env staging --bookmark "$BOOKMARK" --json)"
node -e '
const result = JSON.parse(process.argv[1]);
if (!result.bookmark || !result.previous_bookmark) {
  console.error("Time Travel did not return recovery and undo bookmarks.", result);
  process.exit(1);
}
console.log("Time Travel restore completed; an undo bookmark was returned.");
' "$RESTORE_RESULT"

echo "Step 6/6: prove the probe disappeared and business data stayed intact."
PROBE_SCHEMA_COUNT="$($WRANGLER d1 execute DB --env staging --remote --json --command "SELECT COUNT(*) AS row_count FROM sqlite_schema WHERE type = 'table' AND name = '$PROBE_TABLE';")"
REMOTE_COUNTS_AFTER="$($WRANGLER d1 execute DB --env staging --remote --json --command "$COUNTS_SQL")"

node -e '
const probe = JSON.parse(process.argv[1]);
const before = JSON.parse(process.argv[2]);
const after = JSON.parse(process.argv[3]);
const rows = payload => payload.flatMap(entry => entry.results ?? []);
const normalize = payload => Object.fromEntries(rows(payload).map(row => [row.table_name, Number(row.row_count)]));
const probeCount = Number(probe[0]?.results?.[0]?.row_count);
const expected = normalize(before);
const observed = normalize(after);
if (probeCount !== 0) {
  console.error(`Recovery probe still exists; observed schema count ${probeCount}.`);
  process.exit(1);
}
if (JSON.stringify(expected) !== JSON.stringify(observed)) {
  console.error("Post-restore counts do not match the baseline:", { expected, observed });
  process.exit(1);
}
console.log("Remote point-in-time recovery validated:", observed);
' "$PROBE_SCHEMA_COUNT" "$REMOTE_COUNTS_BEFORE" "$REMOTE_COUNTS_AFTER"
PROBE_PRESENT=false

trap - EXIT INT TERM
rm -rf -- "$LOCAL_STATE_DIR"

echo
echo "D1 restore rehearsal passed."
echo "Backup artifact: $BACKUP_SQL"
echo "Run the remote smoke gate next: $ROOT_DIR/scripts/test-staging.sh -q"
