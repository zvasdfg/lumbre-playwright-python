#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/test-framework"
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lumbre-store-ui.XXXXXX")"
BASE_URL="${BASE_URL:-https://metodolumbre.com}" \
PLAYWRIGHT_PROXY="${PLAYWRIGHT_PROXY:-${HTTPS_PROXY:-${HTTP_PROXY:-}}}" \
  .venv/bin/pytest projects/lumbre_static/store \
    --output="$RUN_DIR/artifacts" --junitxml="$RUN_DIR/results.xml" \
    --html="$RUN_DIR/report.html" --self-contained-html "$@"
