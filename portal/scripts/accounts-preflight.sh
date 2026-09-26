#!/usr/bin/env bash
set -euo pipefail

PORTAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export WRANGLER_LOG_PATH="${WRANGLER_LOG_PATH:-/tmp/lumbre-wrangler-logs}"

cd "$PORTAL_DIR"

echo "[1/6] Validate the readiness gate"
npm run test:readiness

echo "[2/6] Validate the controlled production-account contract"
node ./scripts/deployment-readiness.mjs \
  --environment production \
  --profile accounts-preview

echo "[3/6] Check TypeScript"
npm run typecheck

echo "[4/6] Check lint rules"
npm run lint

echo "[5/6] Build the production artifact"
npm run build

echo "[6/6] Validate the Cloudflare deployment package"
npm run deploy:production:check

echo "Controlled account preflight passed. No deployment was performed."
