#!/usr/bin/env bash
set -euo pipefail

STAGING_BASE_URL="${STAGING_BASE_URL:-https://lumbre-portal-staging.lumbre-portal.workers.dev}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEPLOYED_BASE_URL="$STAGING_BASE_URL" \
DEPLOYMENT_LABEL="staging" \
  exec "$ROOT_DIR/scripts/test-deployed.sh" "$@"
