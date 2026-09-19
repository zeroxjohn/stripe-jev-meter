# stripe-jev-meter

An auditable semantic layer above Stripe Billing for AI support outcome pricing.

This repository currently holds the documentation foundation for the project. Application code comes later.

**Start here:** [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)

## What this is

AI support vendors often charge per resolution. Stripe's Fin case study shows the commercial rule clearly: charge when the customer confirms, or when they do not ask for more help after the last AI answer.

Silence after an AI answer does not necessarily mean the issue was resolved. Current Fin-style billing often bills it anyway. Stripe and Metronome meter and invoice the events vendors send. They do not independently establish whether that silent exit was a real resolution, an abandonment, or a wrong answer that a human silently fixed.

This project designs a confidence-gated evaluation and policy layer that turns support conversations into auditable billing candidates, then emits approved events to Stripe.

## Status

Documentation foundation in progress. No runtime billing path yet.
