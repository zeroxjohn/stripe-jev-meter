# Outcome grades

- **Mode:** reference
- **Owns:** The grade table and the default mapping from grades to billing actions
- **Update when:** Grades, meters, or default policy mappings change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Domain model](domain-model.md), [Ambiguous outcomes](../concepts/ambiguous-outcomes.md)

## Grades

| Grade | Meaning | Default billing action |
| --- | --- | --- |
| `verified` | Explicit confirmation, or high-confidence semantic resolution with no conflicting facts | Bill full meter |
| `partial` | Some of the request was handled; material work remains | Bill partial meter, or withhold if contract forbids partial |
| `unresolved` | The issue was not handled | Withhold |
| `not_an_answer` | The agent did not provide a substantive answer | Withhold |
| `review_required` | Signals conflict or confidence is below auto-act thresholds | Hold for pattern review, then fall back |

These grades are contract vocabulary. They are not Stripe price objects by themselves.

## Meter mapping

Use one Stripe or Metronome meter per priced grade. Do not invent fractional cents inside the evaluator.

| Grade action | Example meter name | Example contract price |
| --- | --- | --- |
| Full resolution | `support_resolution_full` | $0.99 |
| Partial resolution | `support_resolution_partial` | $0.40 |

Exact prices belong in the vendor contract and rate card, not in Jev output.

## Deterministic overrides

These facts win over semantic grades:

| Fact | Action |
| --- | --- |
| `explicitConfirmation = true` and no failed required action | Prefer full bill unless review policy says otherwise |
| `customerRequestedHuman = true` before resolution | Withhold |
| `humanRole = corrected_agent` | Withhold or review; do not auto-bill as AI resolution |
| Required `actionReceipts` include `failed` | Withhold |
| `reopenedAfter` within window after a charge | Append reversal |
| Evaluator unavailable or parse failure | Withhold or review with withhold fallback |

## Confidence gates

Default starting gates for the proof of concept. Fit them on labeled data before production claims.

| Decision | Gate |
| --- | --- |
| Auto-bill full | `outcome.choice = resolved` and `outcome.confidence >= 0.90` and `issueAddressed.noul >= 0.90` and no deterministic withhold |
| Auto-bill partial | `outcome.choice = partially_resolved` and `outcome.confidence >= 0.85` |
| Auto-withhold | `outcome.choice` in `unresolved` or `not_an_answer` and confidence above review floor |
| Review | Confidence between review floor and auto thresholds, or conflicting facts |

Noul answers contribute `issueAddressed.noul` only. Do not read a missing confidence field on Noul.

## What grades deliberately do not do

- They do not set money.
- They do not mutate prior ledger rows.
- They do not replace reopen reversals.
- They do not declare a conversation "good support quality" beyond the billing decision needed for the meter.
