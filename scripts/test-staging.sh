#!/usr/bin/env bash
set -euo pipefail

STAGING_BASE_URL="${STAGING_BASE_URL:?Set STAGING_BASE_URL to a deployed static preview; the retired backend is not a valid target}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DEPLOYED_BASE_URL="$STAGING_BASE_URL" \
DEPLOYMENT_LABEL="staging" \
  exec "$ROOT_DIR/scripts/test-deployed.sh" "$@"
