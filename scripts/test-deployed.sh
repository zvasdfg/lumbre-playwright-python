#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOYED_BASE_URL="${DEPLOYED_BASE_URL:?DEPLOYED_BASE_URL is required}"
DEPLOYMENT_LABEL="${DEPLOYMENT_LABEL:-remote}"

if [[ ! "$DEPLOYMENT_LABEL" =~ ^[a-z0-9-]+$ ]]; then
  echo "DEPLOYMENT_LABEL must contain only lowercase letters, digits, and hyphens." >&2
  exit 2
fi

case "$DEPLOYED_BASE_URL" in
  https://*) ;;
  *)
    echo "DEPLOYED_BASE_URL must use HTTPS; received: $DEPLOYED_BASE_URL" >&2
    exit 2
    ;;
esac

case "$DEPLOYED_BASE_URL" in
  *localhost* | *127.0.0.1*)
    echo "The deployed runner requires an explicit remote target." >&2
    exit 2
    ;;
esac

cd "$ROOT_DIR/test-framework"

RUN_TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
REPORT_PATH="reports/runs/lumbre-$DEPLOYMENT_LABEL-smoke-$RUN_TIMESTAMP.html"
JUNIT_PATH="reports/runs/lumbre-$DEPLOYMENT_LABEL-smoke-$RUN_TIMESTAMP.xml"
mkdir -p reports/runs

echo "Running read-only $DEPLOYMENT_LABEL smoke checks against: $DEPLOYED_BASE_URL"

PLAYWRIGHT_PROXY="${PLAYWRIGHT_PROXY:-${HTTPS_PROXY:-${HTTP_PROXY:-}}}"

env \
  BASE_URL="$DEPLOYED_BASE_URL" \
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
echo "Archived $DEPLOYMENT_LABEL report: $ROOT_DIR/test-framework/$REPORT_PATH"
echo "Archived $DEPLOYMENT_LABEL JUnit: $ROOT_DIR/test-framework/$JUNIT_PATH"
