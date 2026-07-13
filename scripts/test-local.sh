#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3100}"
BASE_URL="http://localhost:${PORT}"
SERVER_LOG="${TMPDIR:-/tmp}/lumbre-portal-${PORT}.log"
export NO_PROXY="localhost,127.0.0.1,::1"
export no_proxy="$NO_PROXY"

cd "$ROOT_DIR/portal"
npm run dev -- --hostname localhost --port "$PORT" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
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
BASE_URL="$BASE_URL" .venv/bin/pytest "$@"
