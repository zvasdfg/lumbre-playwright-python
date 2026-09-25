#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGING_BASE_URL="${STAGING_BASE_URL:-https://lumbre-portal-staging.lumbre-portal.workers.dev}"

case "$STAGING_BASE_URL" in
  https://*) ;;
  *)
    echo "STAGING_BASE_URL must use HTTPS; received: $STAGING_BASE_URL" >&2
    exit 2
    ;;
esac

case "$STAGING_BASE_URL" in
  *localhost* | *127.0.0.1*)
    echo "The staging runner requires an explicit remote target." >&2
    exit 2
    ;;
esac

cd "$ROOT_DIR/test-framework"

RUN_TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
REPORT_PATH="reports/runs/lumbre-staging-smoke-$RUN_TIMESTAMP.html"
JUNIT_PATH="reports/runs/lumbre-staging-smoke-$RUN_TIMESTAMP.xml"
mkdir -p reports/runs

echo "Running read-only staging smoke checks against: $STAGING_BASE_URL"

PLAYWRIGHT_PROXY="${PLAYWRIGHT_PROXY:-${HTTPS_PROXY:-${HTTP_PROXY:-}}}"

env \
  BASE_URL="$STAGING_BASE_URL" \
  HEADLESS="${HEADLESS:-true}" \
  PLAYWRIGHT_PROXY="$PLAYWRIGHT_PROXY" \
  .venv/bin/pytest \
    projects/lumbre/remote_smoke \
    -m remote_smoke \
    --html="$REPORT_PATH" \
    --junitxml="$JUNIT_PATH" \
    --self-contained-html \
    --css=automation/core/reporting/report.css \
    "$@"

echo
echo "Archived staging report: $ROOT_DIR/test-framework/$REPORT_PATH"
echo "Archived staging JUnit: $ROOT_DIR/test-framework/$JUNIT_PATH"
