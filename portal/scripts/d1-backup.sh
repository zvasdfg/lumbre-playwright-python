#!/usr/bin/env bash
set -euo pipefail

PORTAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-staging}"
BACKUP_TIMESTAMP="${D1_BACKUP_TIMESTAMP:-$(date -u +"%Y-%m-%dT%H-%M-%SZ")}"
BACKUP_DIR="${D1_BACKUP_DIR:-$PORTAL_DIR/.d1-backups}"
WRANGLER="$PORTAL_DIR/node_modules/.bin/wrangler"

case "$TARGET" in
  staging)
    DATABASE_LABEL="lumbre-db-staging"
    DATABASE_SELECTOR="DB"
    WRANGLER_ENV_ARGS=(--env staging)
    ;;
  production)
    if [[ "${D1_PRODUCTION_BACKUP_CONFIRM:-}" != "lumbre-db" ]]; then
      echo "Production export requires D1_PRODUCTION_BACKUP_CONFIRM=lumbre-db." >&2
      exit 2
    fi
    DATABASE_LABEL="lumbre-db"
    DATABASE_SELECTOR="DB"
    WRANGLER_ENV_ARGS=(--env production)
    ;;
  *)
    echo "Usage: $0 [staging|production]" >&2
    exit 2
    ;;
esac

if [[ ! -x "$WRANGLER" ]]; then
  echo "Wrangler is unavailable. Run npm ci in $PORTAL_DIR first." >&2
  exit 2
fi

mkdir -p "$BACKUP_DIR"
BACKUP_PREFIX="$BACKUP_DIR/$DATABASE_LABEL-$BACKUP_TIMESTAMP"
SQL_PATH="$BACKUP_PREFIX.sql"
INFO_PATH="$BACKUP_PREFIX.info.json"
BOOKMARK_PATH="$BACKUP_PREFIX.bookmark.json"
CHECKSUM_PATH="$SQL_PATH.sha256"
EXPORT_LOG="$(mktemp "${TMPDIR:-/tmp}/lumbre-d1-export.XXXXXX")"

cleanup() {
  rm -f -- "$EXPORT_LOG"
}
trap cleanup EXIT INT TERM

export WRANGLER_LOG_PATH="${WRANGLER_LOG_PATH:-$PORTAL_DIR/.wrangler/logs}"

cd "$PORTAL_DIR"

echo "Capturing D1 metadata for $DATABASE_LABEL..."
"$WRANGLER" d1 info "$DATABASE_SELECTOR" "${WRANGLER_ENV_ARGS[@]}" --json > "$INFO_PATH"
"$WRANGLER" d1 time-travel info "$DATABASE_SELECTOR" "${WRANGLER_ENV_ARGS[@]}" --json > "$BOOKMARK_PATH"

echo "Exporting schema and data from $DATABASE_LABEL..."
if ! "$WRANGLER" d1 export "$DATABASE_SELECTOR" \
  "${WRANGLER_ENV_ARGS[@]}" \
  --remote \
  --skip-confirmation \
  --output "$SQL_PATH" >"$EXPORT_LOG" 2>&1; then
  echo "D1 export failed. Wrangler output follows with signed URLs redacted:" >&2
  sed -E 's#https://[^[:space:]]+#<redacted-export-url>#g' "$EXPORT_LOG" >&2
  exit 1
fi

if [[ ! -s "$SQL_PATH" ]]; then
  echo "D1 export did not produce a non-empty SQL file." >&2
  exit 1
fi

(cd "$BACKUP_DIR" && shasum -a 256 "$(basename "$SQL_PATH")" > "$(basename "$CHECKSUM_PATH")")

echo "D1 backup complete."
echo "  SQL: $SQL_PATH"
echo "  Checksum: $CHECKSUM_PATH"
echo "  Metadata: $INFO_PATH"
echo "  Bookmark: $BOOKMARK_PATH"

trap - EXIT INT TERM
rm -f -- "$EXPORT_LOG"
