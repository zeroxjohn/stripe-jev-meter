#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  if [[ -f .env.local ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
  fi
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

stripe billing meters create \
  --display-name "Support resolution full" \
  --event-name support_resolution_full \
  '--default-aggregation[formula]=sum'

stripe billing meters create \
  --display-name "Support resolution partial" \
  --event-name support_resolution_partial \
  '--default-aggregation[formula]=sum'

stripe customers create \
  --name "Acme Shop" \
  --email "acme-shop@example.com"
