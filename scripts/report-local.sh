#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/test-framework/reports"
REPORT_PATH="$REPORT_DIR/lumbre-report.html"

mkdir -p "$REPORT_DIR"

if "$ROOT_DIR/scripts/test-local.sh" \
  -q \
  --html=reports/lumbre-report.html \
  --self-contained-html \
  --css=framework/reporting/lumbre_report.css \
  "$@"; then
  TEST_STATUS=0
else
  TEST_STATUS=$?
fi

echo
echo "HTML report: $REPORT_PATH"
exit "$TEST_STATUS"
