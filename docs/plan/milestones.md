# Milestones

- **Mode:** how-to
- **Owns:** Future implementation sequence and the check that ends each unit
- **Update when:** Milestone order or acceptance checks change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Proof of concept](poc.md), [Evaluation](evaluation.md)

Each milestone ends in a real check. Do not start the next milestone until the current check is green.

## M0. Documentation foundation

Status: this branch.

Check:

- every planned doc exists
- every doc declares mode and ownership
- claims ledger covers external claims
- local links resolve

## M1. Typed domain package

Create a TypeScript package that encodes [domain-model.md](../reference/domain-model.md) with no billing side effects.

Check:

- `tsc --noEmit` passes
- illegal `BillingDecision` shapes fail to compile
- fixture facts parse into `ConversationFacts`

## M2. Deterministic policy

Implement baseline and semantic policy as pure functions over facts and verdicts.

Check:

- table-driven tests assert literal decisions for the fixture pack
- reopen creates a reversal entry rather than mutating the charge

## M3. Evaluator adapter

Implement the Jev adapter and a recorded-response fake behind one interface.

Check:

- fake and one live call parse to the same `SemanticVerdict` shape
- missing Noul confidence cannot be read as a required field
- timeout yields no invented verdict

## M4. Stripe test-mode emission

Emit approved usage events through Stripe Billing test mode with derived idempotency keys.

Check:

- running the same approved fixture twice yields one charge and one duplicate receipt
- withhold fixtures emit no meter event
- reverse links to the original billing event id

## M5. Demo UI

Build the chat + live evaluation dashboard described in [poc.md](poc.md). Consult the vendored Apple Design skill before implementing UI.

Check:

- left pane: support chat for the 3–4 live demo scenarios
- right pane: facts, baseline, `SemanticVerdict`, policy, `BillingDecision`, rough $, and Stripe test receipt or withhold — updated after terminal chat state
- baseline and semantic decisions appear side by side so unfair assumed-resolution bills are visible
- control scenario (confirmed resolution) bills full on both paths

## M6. Labeled evaluation run

Execute [evaluation.md](evaluation.md).

Check:

- report published with versions, metrics, and go or no-go
- if no-go, auto-bill remains disabled

## M7. Pattern review

Only if M6 is go.

Replace per-conversation review defaults with grouped reason patterns and samples.

Check:

- review cost model shows avoided false bills exceed review and evaluator cost on the evaluation set

## Explicit non-milestones

Do not schedule these until M6 is go:

- production Stripe keys
- helpdesk marketplace apps
- Metronome-only packaging
- custom model training
