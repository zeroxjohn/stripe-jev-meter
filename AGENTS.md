# AGENTS.md

Rules for agents working in this repository.

## Start here

1. Read [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) before changing product docs or future code.
2. Treat that file as the only complete index of the documentation set.
3. Prefer the smallest change that preserves the documented domain model.

## Canonical vocabulary

Use these names only. Do not invent synonyms.

- `ConversationFacts` for checkable facts from logs
- `EvidenceSnapshot` for the immutable evidence package evaluated
- `SemanticVerdict` for the versioned Jev response
- `BillingPolicy` for the deterministic, versioned decision rules
- `BillingDecision` for the policy result: bill, withhold, or review
- `UsageEvent` for the Stripe or Metronome meter event
- `LedgerEntry` for append-only charged or reversed records
- `Receipt` for the billing-system acknowledgement

Jev produces a `SemanticVerdict`. A deterministic policy produces the `BillingDecision`. Stripe or Metronome prices and invoices the approved event. Jev never invents a price and never emits a billing event directly.

## Evidence rules

Before repeating an external claim in docs or discussion:

1. Check [docs/evidence/claims.md](docs/evidence/claims.md).
2. If the claim is missing, add a row with status `verified`, `vendor_claim`, `inference`, or `unknown`.
3. Never upgrade `unknown` or `inference` to `verified` without a primary URL.

## Document ownership

Each documentation file owns one topic. Update the owning file when that topic changes. Do not restate domain types outside [docs/reference/domain-model.md](docs/reference/domain-model.md). Sideways links should target the owning document, not a copy.

Every documentation file must declare:

- Diátaxis mode (`explanation`, `reference`, or `how-to`)
- What it owns
- What changes require an update

## Billing safety

- Keep deterministic facts outside Jev.
- Pin model and rubric versions on every evaluation.
- Use derived, idempotent billing-event identifiers.
- Correct mistakes with append-only reversals, never silent mutation.
- Do not send payment credentials or unnecessary PII to Jev.
- Human review operates on recurring patterns and samples, not every low-value conversation by default.

## Scope of this pass

This repository currently ships documentation only. Do not add application scaffolding unless a later plan milestone asks for it.
