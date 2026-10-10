#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/test-framework"
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lumbre-static-ui.XXXXXX")"
BASE_URL="${BASE_URL:-http://127.0.0.1:3001}" \
  .venv/bin/pytest projects/lumbre/tests -m portal \
    --output="$RUN_DIR/artifacts" \
    --junitxml="$RUN_DIR/results.xml" --html="$RUN_DIR/report.html" \
    --self-contained-html "$@"
