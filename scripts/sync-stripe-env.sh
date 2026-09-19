#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python3 - <<'PY'
from pathlib import Path
import re

config = Path.home() / ".config/stripe/config.toml"
env_path = Path(".env.local")
if not config.exists():
    raise SystemExit("Stripe CLI is not logged in. Run stripe login first.")

text = config.read_text()
key_match = re.search(r"test_mode_api_key\s*=\s*['\"]([^'\"]+)['\"]", text)
if not key_match:
    raise SystemExit("No test_mode_api_key in the Stripe CLI profile.")
key = key_match.group(1)
if key.startswith("rkcs_"):
    raise SystemExit("CLI still has a claimable sandbox key. Finish stripe login or sandbox claim first.")

lines = env_path.read_text().splitlines() if env_path.exists() else []
replaced = False
out = []
for line in lines:
    if line.startswith("STRIPE_SECRET_KEY="):
        out.append(f"STRIPE_SECRET_KEY={key}")
        replaced = True
    else:
        out.append(line)
if not replaced:
    out.append(f"STRIPE_SECRET_KEY={key}")
env_path.write_text("\n".join(out) + "\n")
print("Wrote a claimed test secret to .env.local as STRIPE_SECRET_KEY.")
print("Restart `pnpm dev` so the demo emits live meter events.")
PY
