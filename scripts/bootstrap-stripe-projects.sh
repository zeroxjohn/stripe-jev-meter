#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v stripe >/dev/null; then
  echo "Install the Stripe CLI first: npm install -g @stripe/cli && stripe plugin install projects"
  exit 1
fi

status_json() {
  stripe projects status --json
}

if ! status_json | python3 -c 'import json,sys; raise SystemExit(0 if json.load(sys.stdin).get("ok") else 1)'; then
  echo "Initializing Stripe Projects in this repo"
  stripe projects init --preflight --json
  stripe projects init --accept-tos --yes --json
fi

has_service() {
  local needle="$1"
  stripe projects status --json | python3 -c "
import json, sys
needle = sys.argv[1]
data = json.load(sys.stdin)
blob = json.dumps(data).lower()
raise SystemExit(0 if needle.lower() in blob else 1)
" "$needle"
}

if ! has_service "vercel/hobby"; then
  stripe projects add vercel/hobby --accept-tos --yes --json
fi
if ! has_service "vercel/project"; then
  stripe projects add vercel/project \
    --name hosting \
    --config '{"name":"stripe-jev-meter"}' \
    --accept-tos --yes --json
fi
if ! has_service "neon/free"; then
  stripe projects add neon/free --accept-tos --yes --json
fi
if ! has_service "neon/postgres"; then
  stripe projects add neon/postgres --name ledger --accept-tos --yes --json
fi

stripe projects env --refresh --json || stripe projects env list --json

if [[ -n "${TYPESAFE_API_KEY:-}" ]]; then
  stripe projects variables set jev --env-key TYPESAFE_API_KEY --value "$TYPESAFE_API_KEY"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Ledger will use DATABASE_URL once the demo process is restarted."
fi

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if bash scripts/sync-stripe-env.sh; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -n "${STRIPE_SECRET_KEY:-}" && "${STRIPE_SECRET_KEY}" != rkcs_* ]]; then
  bash scripts/setup-stripe-meters.sh
else
  echo "Skip meter create until STRIPE_SECRET_KEY is a claimed test secret, not rkcs_."
fi

echo "Projects bootstrap finished. Confirm with: stripe projects status --json"
