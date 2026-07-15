#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3100}"
BASE_URL="http://localhost:${PORT}"
SERVER_LOG="${TMPDIR:-/tmp}/lumbre-portal-${PORT}.log"
HYPOTHESIS_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lumbre-test-hypotheses.XXXXXX")"
export NO_PROXY="localhost,127.0.0.1,::1"
export no_proxy="$NO_PROXY"
export LUMBRE_ENV="test"
export NEXT_PUBLIC_LUMBRE_ENV="test"
export LUMBRE_HYPOTHESIS_DIR="$HYPOTHESIS_DIR"

cp "$ROOT_DIR"/portal/data/hypotheses/*.json "$HYPOTHESIS_DIR"/

cd "$ROOT_DIR/portal"
npm run dev -- --hostname localhost --port "$PORT" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  rm -rf -- "${HYPOTHESIS_DIR:?}"
}
trap cleanup EXIT INT TERM

for _ in {1..80}; do
  if curl --noproxy '*' --silent --fail "$BASE_URL/api/health" >/dev/null; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "The portal stopped before becoming available. Log: $SERVER_LOG" >&2
    tail -n 80 "$SERVER_LOG" >&2
    exit 1
  fi
  sleep 0.25
done

if ! curl --noproxy '*' --silent --fail "$BASE_URL/api/health" >/dev/null; then
  echo "The portal did not respond at $BASE_URL. Log: $SERVER_LOG" >&2
  tail -n 80 "$SERVER_LOG" >&2
  exit 1
fi

cd "$ROOT_DIR/test-framework"

REPORT_ARGS=()
HTML_REPORT_REQUESTED=false
GENERATED_REPORT_PATH=""
for argument in "$@"; do
  case "$argument" in
    --html | --html=*)
      HTML_REPORT_REQUESTED=true
      break
      ;;
  esac
done

if [[ "$HTML_REPORT_REQUESTED" == false ]]; then
  RUN_TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
  REPORT_RUN_DIR="reports/runs"
  GENERATED_REPORT_PATH="$REPORT_RUN_DIR/lumbre-report-$RUN_TIMESTAMP.html"
  mkdir -p "$REPORT_RUN_DIR"
  REPORT_ARGS=(
    --html="$GENERATED_REPORT_PATH"
    --self-contained-html
    --css=framework/reporting/lumbre_report.css
  )
fi

if BASE_URL="$BASE_URL" .venv/bin/pytest "${REPORT_ARGS[@]}" "$@"; then
  TEST_STATUS=0
else
  TEST_STATUS=$?
fi

if [[ -n "$GENERATED_REPORT_PATH" && -f "$GENERATED_REPORT_PATH" ]]; then
  cp "$GENERATED_REPORT_PATH" reports/lumbre-report.html
  echo
  echo "Archived HTML report: $ROOT_DIR/test-framework/$GENERATED_REPORT_PATH"
  echo "Latest HTML report:   $ROOT_DIR/test-framework/reports/lumbre-report.html"
fi

exit "$TEST_STATUS"
