# Jev evaluator

- **Mode:** reference
- **Owns:** Question set, pinning, confidence handling, calibration posture, recorded-response fake, and failure behavior
- **Update when:** Questions, models, rubric versions, or parse rules change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Domain model](../reference/domain-model.md), [Data boundaries](../reference/data-boundaries.md)
- **Claims:** C028, C029, C030, C031, C032

## Role

Jev is the semantic evaluator. It returns a `SemanticVerdict`. It does not emit usage events and does not set prices.

## State package

Send one JSON object as state:

```json
{
  "transcript": [
    {"role": "customer", "text": "..."},
    {"role": "agent", "text": "..."}
  ],
  "facts": {
    "explicitConfirmation": false,
    "humanReplied": false,
    "customerRequestedHuman": false,
    "actionReceipts": []
  },
  "policy_excerpt": "Refunds require a succeeded refund receipt."
}
```

Use redacted text only. Keep the content hash on the `EvidenceSnapshot`.

## Atomic questions

Ask independent questions in one call.

| Key | Type | Purpose |
| --- | --- | --- |
| `issue_addressed` | Noul | Probability the customer's request was addressed |
| `outcome` | Choice | `resolved`, `partially_resolved`, `unresolved`, `not_an_answer` |
| `human_role` | Choice | `absent`, `added_detail`, `corrected_agent` |

Optional later questions for analysis, not required for v1 billing:

| Key | Type | Purpose |
| --- | --- | --- |
| `abandonment_likely` | Noul | Silence looks like abandonment rather than success |
| `policy_conflict` | Noul | Agent claim conflicts with stated policy or receipts |

## Confidence handling

- Choice answers expose `confidence`.
- Noul answers expose `noul` only.
- Code that assumes every answer has `confidence` is wrong.
- Thresholds are fitted on the project's labeled corpus. Do not treat vendor confidence as pre-calibrated for billing.

## Pinning

Every verdict stores:

- model id or alias resolution such as `jev-1.13.0`
- `rubricVersion`
- `evaluationId`
- `evaluatedAt`

Changing the rubric or model creates a new version. Replay old snapshots before promoting a new version into auto-bill paths.

## Adapter interface

```ts
interface SemanticEvaluator {
  evaluate(input: {
    snapshot: EvidenceSnapshot
    facts: ConversationFacts
    rubricVersion: RubricVersion
  }): Promise<SemanticVerdict>
}
```

Provide:

1. a live Jev adapter
2. a recorded-response fake for tests and offline demos

The fake and the live adapter must parse into the same `SemanticVerdict` shape.

## Failure behavior

| Failure | Behavior |
| --- | --- |
| Timeout | No verdict; decision falls to deterministic policy fallback, usually withhold or review with withhold fallback |
| Parse error | Treat as evaluator failure; do not coerce free text into a grade |
| Partial answers missing required keys | Reject the response |
| Provider 429 | Retry with backoff in the adapter only; do not double-emit billing events |

## What the evaluator must never do

- Choose a dollar amount
- Call Stripe
- Mutate ledger history
- Receive payment credentials
- Quietly downgrade a required Choice into free text
