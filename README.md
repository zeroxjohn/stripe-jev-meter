# stripe-jev-meter

An auditable semantic layer above Stripe Billing for AI support outcome pricing.

Silence after an AI answer is not proof the issue was resolved. Fin-style billing often bills that silence as an assumed resolution. This PoC grades the silent-exit bucket, then emits only approved events to Stripe test-mode meters.

**Start here:** [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)

## Run the PoC

```bash
pnpm install
cp env.example .env.local
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Walk the four scenarios in the chat. End each thread with Leave silent, That worked, or I already fixed it. The right pane shows the assumed-resolution baseline next to the semantic decision.

`STRIPE_SECRET_KEY`, `TYPESAFE_API_KEY`, and `OPENROUTER_API_KEY` are optional. Without an evaluator key the demo uses a recorded Jev fake. Without a Stripe secret it uses an in-memory meter.

## Stripe Projects

Init in this repository when you are ready to provision hosting and a database. See [docs/integration/stripe-projects.md](docs/integration/stripe-projects.md). Projects does not replace Billing meters.
