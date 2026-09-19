# stripe-jev-meter

An auditable semantic layer above Stripe Billing for AI support outcome pricing.

This repository currently holds the documentation foundation for the project. Application code comes later.

**Start here:** [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)

## What this is

AI support vendors often charge per resolution. Stripe and Metronome meter and invoice the usage events those vendors send. They do not independently establish whether an ambiguous conversation was a real resolution, an abandonment, or a wrong answer that a human silently fixed.

This project designs a confidence-gated evaluation and policy layer that turns support conversations into auditable billing candidates, then emits approved events to Stripe.

## Status

Documentation foundation in progress. No runtime billing path yet.
