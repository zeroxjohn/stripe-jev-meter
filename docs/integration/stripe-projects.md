# Stripe Projects

- **Mode:** reference
- **Owns:** Hackathon stack provisioning via Stripe Projects (init, catalog services, env sync) and how it relates to Stripe Billing meters
- **Update when:** The provisioned service set, template choice, or Projects workflow changes
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Stripe billing](stripe-billing.md), [Proof of concept](../plan/poc.md), [Milestones](../plan/milestones.md)
- **Claims:** C037, C038

## Two different Stripe things

| Layer | Job in this product |
| --- | --- |
| **Stripe Projects** | Scaffold / provision the app stack and credentials (`stripe projects init`, `add`, `env`) |
| **Stripe Billing meters** | Receive approved `UsageEvent`s and invoice buying businesses |

Hackathon examples are Projects compositions (Vercel + Neon + auth + …). Our thesis still needs Billing meters. Use both.

## Will it make sense?

Yes. Projects does not replace the semantic meter. It is how we stand up hosting, database, and env without dashboard paste. The product demo remains: chat → Jev → policy → meter event or withhold.

Do **not** rebuild the repo from a template in a way that throws away `docs/`. Prefer:

1. Keep this repository as the source of truth.
2. `stripe projects init` here.
3. Add catalog services.
4. Build the Next.js (or equivalent) app inside this repo when M1+ starts.

Optional: consult `stripe projects build … --template stripe/nextjs-saas` only as a **reference** for Stripe Billing wiring — copy patterns, do not replace the docs foundation.

## What we provision

Default PoC stack (mirror the hackathon “one job per service” style):

| Need | Stripe Projects service (intent) | Why |
| --- | --- | --- |
| Hosting | Vercel project | Chat + evaluation dashboard |
| Database | Neon Postgres (or Supabase if auth is bundled) | Ledger, fixtures, evaluation runs |
| Auth (optional) | Clerk or Supabase Auth | Operator-only demo gate |
| Billing | Stripe account / Billing APIs already on the Projects account | Meters, test-mode customers, invoices |
| Async silence window (optional) | Inngest | Fire evaluation after terminal silence without fake timers in the UI |
| Observability (optional) | Sentry | Demo reliability |

Exact provider IDs come from `stripe projects catalog` / [projects.dev/providers](https://projects.dev/providers) at provision time — do not invent CLI names in code comments without checking the catalog.

## What stays outside Projects catalog

| Secret / system | How |
| --- | --- |
| Jev / TypeSafe API key | `stripe projects variables set` as a project variable, then bind into env |
| Synthetic fixture packs | Repo files, not a cloud service |
| Metronome | Out of PoC unless volume packaging forces it |

## Required workflow before app code ships

1. Install Stripe CLI ≥ 1.40 with `npm install -g @stripe/cli`, then `stripe plugin install projects`. Homebrew on this machine failed because Xcode is below the tap's required version.
2. Use a claimed test account for meters. `rkcs_` keys stay on the in-process memory meter. Projects init still needs live-mode credentials (C039, C040). That is Stripe’s provider-billing gate, not a demo requirement. Do not re-run `stripe login` to paper over `PROJECTS_ACCOUNT_IDENTITY_UNCONFIRMED`. Do not hand-edit `.projects/` to fake init.
3. `scripts/bootstrap-stripe-projects.sh` runs `stripe projects init --accept-tos --yes`, then adds `vercel/hobby` + `vercel/project` and `neon/free` + `neon/postgres`, then refreshes env. The app writes the append-only ledger to `DATABASE_URL` when that variable is present.
4. Keep the installed `.claude/skills/stripe-projects-cli` skill (and mirror into `.cursor/skills/` if useful).
5. Never commit secret values from `stripe projects env`.
6. Meter emission still follows [stripe-billing.md](stripe-billing.md). The app falls back to an in-process memory meter until `STRIPE_SECRET_KEY` is a claimed test secret.

## What this deliberately does not do

- Treat Projects as the semantic adjudicator
- Replace Billing meters with Checkout-only demos
- Claim Metronome is provisioned through Projects by default
- Hand-edit `.projects/` or generated env as source of truth
