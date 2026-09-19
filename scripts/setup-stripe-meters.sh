#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${STRIPE_SECRET_KEY:-}" && -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY is missing. Claim the sandbox or run stripe login first."
  exit 1
fi

if [[ "$STRIPE_SECRET_KEY" == rkcs_* ]]; then
  echo "This is a claimable sandbox key. Claim it, then run stripe login, then retry."
  echo "stripe sandbox claim"
  exit 1
fi

has_meter() {
  stripe billing meters list --limit 100 --json | python3 -c "
import json, sys
needle = sys.argv[1]
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get('data', [])
raise SystemExit(0 if any(item.get('event_name') == needle for item in items) else 1)
" "$1"
}

if ! has_meter support_resolution_full; then
  stripe billing meters create \
    --display-name "Support resolution full" \
    --event-name support_resolution_full \
    '--default-aggregation[formula]=sum'
fi

if ! has_meter support_resolution_partial; then
  stripe billing meters create \
    --display-name "Support resolution partial" \
    --event-name support_resolution_partial \
    '--default-aggregation[formula]=sum'
fi

if ! stripe products list --limit 100 --json | python3 -c '
import json, sys
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get("data", [])
raise SystemExit(0 if any(item.get("id") == "prod_acme_resolution_full" for item in items) else 1)
'; then
  stripe products create \
    --id prod_acme_resolution_full \
    --name "Acme support resolution full" \
    --type service
fi

if ! stripe products list --limit 100 --json | python3 -c '
import json, sys
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get("data", [])
raise SystemExit(0 if any(item.get("id") == "prod_acme_resolution_partial" for item in items) else 1)
'; then
  stripe products create \
    --id prod_acme_resolution_partial \
    --name "Acme support resolution partial" \
    --type service
fi

if ! stripe customers list --email acme-shop@example.com --json | python3 -c '
import json, sys
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get("data", [])
print(items[0]["id"] if items else "")
raise SystemExit(0 if items else 1)
'; then
  stripe customers create \
    --name "Acme Shop" \
    --email "acme-shop@example.com"
fi

echo "Meters, products, and Acme Shop customer are ready."
