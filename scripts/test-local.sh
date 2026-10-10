#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="http://127.0.0.1:3001"
export NO_PROXY="localhost,127.0.0.1,::1"
export no_proxy="$NO_PROXY"

for argument in "$@"; do
  case "$argument" in
    -n | -n* | --numprocesses | --numprocesses=*)
      echo "The full local suite runs sequentially: specialized PDF tests share artifact paths." >&2
      echo "Parallelize only matrix-marked cases against an explicit preview." >&2
      exit 2
      ;;
  esac
done

# Never reuse or stop another process listening on the required preview port.
python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 3001)); s.close()'
RUN_TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
RUN_DIR="$ROOT_DIR/test-framework/reports/runs/lumbre-local-$RUN_TIMESTAMP-$$"
mkdir -p "$RUN_DIR"

cd "$ROOT_DIR/portal"
if ! npm run build:static > "$RUN_DIR/build.log" 2>&1; then
  tail -n 80 "$RUN_DIR/build.log" >&2
  exit 1
fi
python3 -m http.server 3001 --bind 127.0.0.1 --directory dist-static > "$RUN_DIR/preview.log" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

READY=false
for _ in {1..80}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    tail -n 80 "$RUN_DIR/preview.log" >&2
    exit 1
  fi
  if curl --noproxy '*' --silent --fail "$BASE_URL/" >/dev/null; then
    READY=true
    break
  fi
  sleep 0.25
done
if [[ "$READY" != true ]]; then
  echo "Static preview did not become available. Log: $RUN_DIR/preview.log" >&2
  exit 1
fi

cd "$ROOT_DIR/test-framework"
REPORT_ARGS=(--html="$RUN_DIR/report.html" --self-contained-html --css=automation/core/reporting/report.css)
for argument in "$@"; do
  case "$argument" in
    --html | --html=*) REPORT_ARGS=(); break ;;
  esac
done
if BASE_URL="$BASE_URL" PLAYWRIGHT_PROXY="" .venv/bin/pytest   -m 'framework_unit or portal' --output="$RUN_DIR/artifacts"   --junitxml="$RUN_DIR/results.xml" "${REPORT_ARGS[@]}" "$@"; then
  TEST_STATUS=0
else
  TEST_STATUS=$?
fi
if [[ -f "$RUN_DIR/report.html" ]]; then
  cp "$RUN_DIR/report.html" reports/lumbre-report.html
  echo "HTML report: $RUN_DIR/report.html"
  echo "Latest report: $ROOT_DIR/test-framework/reports/lumbre-report.html"
fi
echo "Run artifacts: $RUN_DIR"
exit "$TEST_STATUS"
