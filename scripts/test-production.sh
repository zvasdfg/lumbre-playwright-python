#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRODUCTION_BASE_URL="${PRODUCTION_BASE_URL:-https://lumbre-portal.lumbre-portal.workers.dev}"

DEPLOYED_BASE_URL="$PRODUCTION_BASE_URL" \
DEPLOYMENT_LABEL="production" \
  exec "$ROOT_DIR/scripts/test-deployed.sh" "$@"
