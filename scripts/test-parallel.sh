#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKERS="${WORKERS:-4}"
BASE_PORT="${BASE_PORT:-3200}"
REPORT_RUN_DIR="reports/runs"
SERVER_PIDS=()
STATE_DIRS=()
SERVER_LOGS=()
WORKER_URLS=()

if ! [[ "$WORKERS" =~ ^[1-9][0-9]*$ ]]; then
  echo "WORKERS must be a positive integer; received: $WORKERS" >&2
  exit 2
fi

if ! [[ "$BASE_PORT" =~ ^[1-9][0-9]*$ ]]; then
  echo "BASE_PORT must be a positive integer; received: $BASE_PORT" >&2
  exit 2
fi

for argument in "$@"; do
  case "$argument" in
    -n | -n[0-9]* | --numprocesses | --numprocesses=* | --dist | --dist=*)
      echo "The parallel runner owns -n and --dist; configure WORKERS instead." >&2
      exit 2
      ;;
  esac
done

cleanup() {
  local pid
  local state_dir
  for pid in "${SERVER_PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  for pid in "${SERVER_PIDS[@]:-}"; do
    wait "$pid" 2>/dev/null || true
  done
  for state_dir in "${STATE_DIRS[@]:-}"; do
    rm -rf -- "${state_dir:?}"
  done
}
trap cleanup EXIT INT TERM

cd "$ROOT_DIR/portal"

for ((worker_index = 0; worker_index < WORKERS; worker_index += 1)); do
  port=$((BASE_PORT + worker_index))
  base_url="http://localhost:${port}"
  state_dir="$(mktemp -d "${TMPDIR:-/tmp}/lumbre-test-d1-gw${worker_index}.XXXXXX")"
  server_log="${TMPDIR:-/tmp}/lumbre-portal-gw${worker_index}-${port}.log"

  STATE_DIRS+=("$state_dir")
  SERVER_LOGS+=("$server_log")
  WORKER_URLS+=("$base_url")

  : >"$server_log"
  if ! CI=1 ./node_modules/.bin/wrangler d1 migrations apply lumbre-db \
    --local \
    --persist-to "$state_dir" >>"$server_log" 2>&1; then
    echo "Could not migrate the isolated database for gw${worker_index}. Log: $server_log" >&2
    tail -n 80 "$server_log" >&2
    exit 1
  fi
  if ! ./node_modules/.bin/wrangler d1 execute lumbre-db \
    --local \
    --persist-to "$state_dir" \
    --file ./db/seed.sql >>"$server_log" 2>&1; then
    echo "Could not seed the isolated database for gw${worker_index}. Log: $server_log" >&2
    tail -n 80 "$server_log" >&2
    exit 1
  fi

  env \
    CI=1 \
    NO_PROXY="localhost,127.0.0.1,::1" \
    no_proxy="localhost,127.0.0.1,::1" \
    VINEXT_NO_DEV_LOCK=1 \
    LUMBRE_ENV=test \
    NEXT_PUBLIC_LUMBRE_ENV=test \
    LUMBRE_D1_STATE_DIR="$state_dir" \
    LUMBRE_VITE_CACHE_DIR="$state_dir/vite-cache" \
    BETTER_AUTH_URL="$base_url" \
    BETTER_AUTH_SECRET="lumbre-test-auth-secret-not-for-production-2026" \
    STRIPE_WEBHOOK_SECRET="whsec_lumbre_test_webhook_secret_2026" \
    npm run dev -- --hostname localhost --port "$port" >>"$server_log" 2>&1 &
  SERVER_PIDS+=("$!")
  echo "Prepared gw${worker_index}: $base_url"
done

for ((worker_index = 0; worker_index < WORKERS; worker_index += 1)); do
  base_url="${WORKER_URLS[$worker_index]}"
  server_pid="${SERVER_PIDS[$worker_index]}"
  server_log="${SERVER_LOGS[$worker_index]}"

  for _ in {1..120}; do
    if curl --noproxy '*' --silent --fail "$base_url/api/health" >/dev/null; then
      break
    fi
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "Worker gw${worker_index} stopped before becoming available. Log: $server_log" >&2
      tail -n 80 "$server_log" >&2
      exit 1
    fi
    sleep 0.25
  done

  if ! curl --noproxy '*' --silent --fail "$base_url/api/health" >/dev/null; then
    echo "Worker gw${worker_index} did not respond at $base_url. Log: $server_log" >&2
    tail -n 80 "$server_log" >&2
    exit 1
  fi

  reset_ready=false
  for _ in {1..6}; do
    if curl --noproxy '*' --silent --fail --max-time 120 \
      --request POST "$base_url/api/test/reset" >/dev/null; then
      reset_ready=true
      break
    fi
    sleep 0.25
  done
  if [[ "$reset_ready" == false ]]; then
    echo "Worker gw${worker_index} could not warm the test reset route. Log: $server_log" >&2
    tail -n 80 "$server_log" >&2
    exit 1
  fi

  app_ready=false
  for _ in {1..6}; do
    if curl --noproxy '*' --silent --fail --max-time 120 "$base_url/" >/dev/null; then
      app_ready=true
      break
    fi
    sleep 0.25
  done
  if [[ "$app_ready" == false ]]; then
    echo "Worker gw${worker_index} could not warm the application route. Log: $server_log" >&2
    tail -n 80 "$server_log" >&2
    exit 1
  fi
done

worker_base_urls="$(IFS=,; echo "${WORKER_URLS[*]}")"

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
  GENERATED_REPORT_PATH="$REPORT_RUN_DIR/lumbre-parallel-report-$RUN_TIMESTAMP.html"
  mkdir -p "$REPORT_RUN_DIR"
  REPORT_ARGS=(
    --html="$GENERATED_REPORT_PATH"
    --self-contained-html
    --css=automation/core/reporting/report.css
  )
fi

echo "Running with $WORKERS isolated workers: $worker_base_urls"

if env \
  BASE_URL="${WORKER_URLS[0]}" \
  AUTOMATION_WORKER_BASE_URLS="$worker_base_urls" \
  .venv/bin/pytest \
    -n "$WORKERS" \
    --dist worksteal \
    "${REPORT_ARGS[@]}" \
    "$@"; then
  TEST_STATUS=0
else
  TEST_STATUS=$?
fi

if [[ -n "$GENERATED_REPORT_PATH" && -f "$GENERATED_REPORT_PATH" ]]; then
  cp "$GENERATED_REPORT_PATH" reports/lumbre-report.html
  echo
  echo "Archived parallel report: $ROOT_DIR/test-framework/$GENERATED_REPORT_PATH"
  echo "Latest HTML report:       $ROOT_DIR/test-framework/reports/lumbre-report.html"
fi

exit "$TEST_STATUS"
