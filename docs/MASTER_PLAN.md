# Master plan

- **Mode:** explanation
- **Owns:** Corrected thesis, falsifiable ambiguity, reading order, actor impact, scope, falsification condition, and the complete documentation index
- **Update when:** Thesis, scope, falsification condition, or the document set changes
- **Related:** Every file linked below

## Corrected thesis

We want a demoable layer above Stripe Billing that helps the buying business inspect charges and helps the AI support vendor defend only the resolutions that deserve a meter event.

The chosen use case is AI support outcome billing. That domain is ambiguous in a specific way:

> A silent response after an AI answer does **not** necessarily mean the issue was resolved. Current industry billing often bills it anyway.

Stripe's Fin case study states the commercial rule directly. A resolution is charged when the customer confirms, **or** when they do not ask for more help after the last AI answer. Intercom's outcomes docs call the second path an assumed resolution, and their FAQ says a frustrated customer who simply leaves is still charged.

Industry standards already navigate some ambiguity with deterministic rules: confirmation, clarifying-question abandonment, human-request escalations, and later customer-reopen deductions. Static per-resolution pricing is not itself the failure. Stripe can meter and invoice those events. It cannot tell semantic truth from a transcript.

The residual failure is narrower:

> After Fin answers and the customer goes silent, deterministic facts cannot separate success from abandonment. That silent-exit bucket remains binary, vendor-reported, and billable by default. A human can also silently correct a wrong AI answer without triggering the customer-reopen reversal.

Jev produces a versioned `SemanticVerdict`. A deterministic policy produces the `BillingDecision`. Stripe or Metronome prices and invoices the approved event. Jev never invents a price and never emits an event directly.

## The one ambiguity under test

When a support conversation ends after an AI answer without explicit customer confirmation, without an explicit human request, and without a reopen inside the window, deterministic facts cannot tell a real resolution apart from abandonment or a silently corrected wrong answer. Under assumed-resolution rules, that bucket is billed at full price by default, even when the customer left because the answer was wrong.

The proof of concept must show:

1. A semantic evaluator separates that bucket into contract-defined grades.
2. Each grade maps to bill, withhold, or review through deterministic policy.
3. The disagreement versus the assumed-resolution baseline is measurable in dollars on a labeled set.

## Falsification condition

If dollar-weighted disagreement is under roughly 2% of baseline billed volume on the labeled ambiguous bucket, and false-billing is not clearly improved, stop. Publish the negative result. Do not keep building auto-bill on faith.

Details live in [plan/evaluation.md](plan/evaluation.md).

## Who this helps

| Actor | What changes |
| --- | --- |
| Buying business | Sees evidence, reason codes, and reversible ledger entries instead of an opaque resolution count |
| AI support vendor | Can defend charges with an auditable grade and reduce dispute risk |
| Stripe or Metronome | Continues to meter and invoice clean events; does not become a transcript judge |
| End consumer | Still outside the commercial transaction; their silence is no longer treated as unquestioned proof of success |

This is not a claim that every actor wins equally. It moves adjudication power into a shared record. See [concepts/actors-and-incentives.md](concepts/actors-and-incentives.md).

## Scope of this repository pass

In scope:

- private GitHub repository
- linked documentation set
- domain model for later code
- PoC and evaluation plans
- agent rules

Out of scope for this pass:

- application runtime
- production Stripe keys
- helpdesk OAuth apps
- custom model training

## Reading order

1. This master plan
2. [evidence/case-studies.md](evidence/case-studies.md)
3. [concepts/ambiguous-outcomes.md](concepts/ambiguous-outcomes.md)
4. [reference/domain-model.md](reference/domain-model.md)
5. [plan/poc.md](plan/poc.md)
6. [plan/evaluation.md](plan/evaluation.md)

## Document index

| Document | Mode | Owns |
| --- | --- | --- |
| [MASTER_PLAN.md](MASTER_PLAN.md) | explanation | Thesis, index, falsification, scope |
| [concepts/ambiguous-outcomes.md](concepts/ambiguous-outcomes.md) | explanation | Why silence is not proof of success |
| [concepts/actors-and-incentives.md](concepts/actors-and-incentives.md) | explanation | Actors and error costs |
| [reference/domain-model.md](reference/domain-model.md) | reference | All core types |
| [reference/outcome-grades.md](reference/outcome-grades.md) | reference | Grades and default billing actions |
| [reference/data-boundaries.md](reference/data-boundaries.md) | reference | Allowed and rejected fields per boundary |
| [reference/glossary.md](reference/glossary.md) | reference | Canonical names |
| [integration/stripe-billing.md](integration/stripe-billing.md) | reference | Meters, idempotency, reversals |
| [integration/stripe-projects.md](integration/stripe-projects.md) | reference | Projects init, catalog services, env |
| [integration/jev-evaluator.md](integration/jev-evaluator.md) | reference | Questions, pinning, failures |
| [evidence/claims.md](evidence/claims.md) | reference | External claims ledger |
| [evidence/case-studies.md](evidence/case-studies.md) | explanation | What each example proves |
| [plan/poc.md](plan/poc.md) | how-to | Demo path and acceptance checks |
| [plan/evaluation.md](plan/evaluation.md) | how-to | Metrics and go or no-go |
| [plan/milestones.md](plan/milestones.md) | how-to | Future build sequence |
| [plan/open-questions.md](plan/open-questions.md) | explanation | Unresolved questions |

## Evidence anchors

Primary anchors for the thesis:

- Stripe Fin case study: $0.99 per resolution when confirmed **or** when the customer does not ask for more help; events flow into Stripe Billing meters
- Intercom outcomes help: confirmed vs assumed resolution; reopen deduction; clarifying-question no-reply is not billed
- Intercom outcomes FAQ: frustrated customer who just leaves after Fin answers is still an assumed resolution and is charged
- Intercom community reports: silent human correction can still be billed under assumed resolution
- Stripe Metronome acquisition: usage metering scale is solved; semantic truth is not
- TypeSafe Jev docs: typed semantic evaluation is available; calibration remains our job

Full ledger: [evidence/claims.md](evidence/claims.md).

## Next implementation step

After this documentation branch merges, start [plan/milestones.md](plan/milestones.md) milestone **M0.5**: initialize Stripe Projects in this repo and provision hosting + database. Then M1: encode the domain model in TypeScript with compile-time illegal-state checks and no billing side effects.
