# AGENTS.md

Rules for agents working in this repository.

## Start here

1. Read [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) before changing product docs or future code.
2. Treat that file as the only complete index of the documentation set.
3. Prefer the smallest change that preserves the documented domain model.

## Corrected thesis

Silence after an AI answer does not necessarily mean the issue was resolved. Current Fin-style billing often bills it anyway as an assumed resolution. Industry rules already handle some ambiguity. The residual problem is that silent-exit bucket. Static per-resolution pricing is not the failure. See the master plan before restating the thesis.

## Canonical vocabulary

Use these names only. Do not invent synonyms. Definitions live in [docs/reference/glossary.md](docs/reference/glossary.md) and [docs/reference/domain-model.md](docs/reference/domain-model.md).

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
4. Keep Chatbase's own Stripe billing path and other vendors' processors as `unknown` until a primary source appears.

## Document ownership

Each documentation file owns one topic. Update the owning file when that topic changes.

Rules:

- Do not restate domain types outside [docs/reference/domain-model.md](docs/reference/domain-model.md).
- Sideways links should target the owning document, not a copy.
- Leaf docs link up to the master plan.
- The master plan is the only file that indexes everything.

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
- Noul answers expose a probability only. Do not assume a Choice/Score confidence field on Noul.
- Human review operates on recurring patterns and samples, not every low-value conversation by default.
- Honor the evaluation falsification condition before expanding auto-bill scope.

## UI design

Any UI change — new screens, layout, motion, materials, typography, or interaction polish — must consult the vendored Apple Design skill before implementing:

- [`.cursor/skills/apple-design/SKILL.md`](.cursor/skills/apple-design/SKILL.md)
- [`.claude/skills/apple-design/SKILL.md`](.claude/skills/apple-design/SKILL.md)

Read the skill in full for the relevant sections (response, springs, materials, typography, reduced motion). Do not invent a competing visual language. PoC demo UI (chat + evaluation dashboard) follows this skill.

## Scope

This repository currently ships the documentation foundation plus future milestones described in [docs/plan/milestones.md](docs/plan/milestones.md). Do not add application scaffolding unless a milestone asks for it.

## Document map

| Path | Owner summary |
| --- | --- |
| `docs/MASTER_PLAN.md` | Thesis, index, falsification |
| `docs/concepts/ambiguous-outcomes.md` | Ambiguity explanation |
| `docs/concepts/actors-and-incentives.md` | Actors and incentives |
| `docs/reference/domain-model.md` | Core types |
| `docs/reference/outcome-grades.md` | Grades and actions |
| `docs/reference/data-boundaries.md` | Boundary rules |
| `docs/reference/glossary.md` | Canonical names |
| `docs/integration/stripe-billing.md` | Stripe/Metronome event contract |
| `docs/integration/jev-evaluator.md` | Jev adapter contract |
| `docs/evidence/claims.md` | Claims ledger |
| `docs/evidence/case-studies.md` | Case study readings |
| `docs/plan/poc.md` | PoC path |
| `docs/plan/evaluation.md` | Metrics and go/no-go |
| `docs/plan/milestones.md` | Build sequence |
| `docs/plan/open-questions.md` | Open questions |
