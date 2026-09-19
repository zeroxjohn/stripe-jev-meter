# Proof of concept

- **Mode:** how-to
- **Owns:** The test-mode demonstration path and its acceptance checks
- **Update when:** Fixtures, baseline rules, demo surfaces, or PoC acceptance criteria change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Evaluation](evaluation.md), [Outcome grades](../reference/outcome-grades.md), [Stripe billing](../integration/stripe-billing.md)

## Goal

Show one thing:

> For conversations in the ambiguous silence bucket, a semantic grade plus deterministic policy produces a different, auditable billing decision than the industry assumed-resolution default, and only approved decisions become Stripe test-mode meter events.

## Demo story

Acme Support AI charges buying businesses $0.99 per full resolution and $0.40 per partial resolution.

An operator uploads a fixture pack of support conversations. The system shows:

1. conversation and redacted evidence
2. `ConversationFacts`
3. baseline deterministic decision
4. `SemanticVerdict` from Jev or the recorded fake
5. `BillingDecision` from policy
6. review state when needed
7. resulting Stripe test-mode usage event or withhold reason

## Fixture pack

Include at least these cases:

| Fixture | Expected baseline | Expected semantic path |
| --- | --- | --- |
| Real confirmed resolution | Bill full | Bill full |
| Quiet real resolution | Bill assumed full | Bill full |
| Abandonment after weak answer | Bill assumed full | Withhold |
| Partial answer | Bill assumed full | Bill partial or withhold per contract |
| Wrong AI answer silently corrected by human | Bill assumed full | Withhold or review |
| Failed refund action with optimistic agent text | Bill assumed full | Withhold |
| Customer reopen after assumed charge | Reverse | Reverse |
| Adversarial instruction in transcript | Depends on facts | Withhold or review; never trust instruction to force a bill |

## Baseline classifier

Reproduce the documented industry rule:

1. If explicit confirmation and no failed required action, bill full.
2. Else if customer requested human, withhold.
3. Else if silence exceeds the window and agent answered, bill assumed full.
4. If later reopen, append reversal.

This baseline exists to measure disagreement, not as the product destination.

## Semantic path

1. Capture `EvidenceSnapshot`.
2. Evaluate with pinned rubric through Jev or recorded fake.
3. Apply `BillingPolicy`.
4. If review, group by reason pattern rather than forcing one human decision per 99¢ row.
5. Emit `UsageEvent` only for approved bill decisions.
6. Append `LedgerEntry` and store `Receipt`.

## Surfaces to build later

Minimum demo UI:

- conversation inbox with baseline vs semantic decision
- evaluation inspector with probabilities and reason codes
- billing ledger with emit and reverse results

No production helpdesk sync is required for the PoC.

## Acceptance checks

The PoC passes when all of the following are true:

1. Every fixture produces facts, baseline decision, semantic decision, and ledger outcome.
2. Re-running the same approved fixture does not create a second Stripe charge.
3. The abandonment and silent-correction fixtures are not auto-billed as full resolutions by the semantic path.
4. The failed-action fixture withholds even if the transcript claims success.
5. The reopen fixture appends a reversal linked to the original billing event id.
6. No fixture path lets Jev choose a dollar amount.

## Out of scope for the PoC

- live production Stripe keys
- automatic sync from Intercom, Zendesk, or Gorgias
- training a custom model
- dynamic prices
- reviewing every low-confidence conversation individually as the default UX
