# Actors and incentives

- **Mode:** explanation
- **Owns:** Who participates in AI support outcome billing and who bears each error
- **Update when:** The product changes who can review, dispute, or emit meter events
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Case studies](../evidence/case-studies.md), [Data boundaries](../reference/data-boundaries.md)

## The four commercial actors

| Actor | Role | What they want |
| --- | --- | --- |
| AI support vendor | Delivers the agent and currently reports outcomes | Revenue aligned with real success, low dispute cost |
| Buying business | Pays the vendor for AI resolutions | Only pay for work that actually helped |
| End consumer | Asks the support question | A correct answer; usually unaware of billing |
| Stripe or Metronome | Meters, rates, invoices, and collects | Trustworthy events and clean money movement |

Two supporting actors sit beside them:

| Actor | Role |
| --- | --- |
| Reviewer | Adjudicates sampled or patterned disputes |
| Jev | Returns typed semantic judgments over evidence |

## Where adjudication power sits today

In the Fin-style market, the vendor both delivers the service and decides whether the service succeeded. The buying business pays and often sees only a count of resolutions. After an AI answer, the end consumer's silence becomes billable evidence of success under assumed-resolution rules, even though that silence is not semantic proof of resolution. Stripe remains neutral and bills the events it receives.

Ambiguous cases therefore default toward the vendor unless a customer reopen or an explicit dispute arrives later.

## What this layer changes

This project does not claim that every actor wins equally.

It moves adjudication from an opaque vendor count into a shared, auditable record:

1. Deterministic facts are visible.
2. Semantic grades and probabilities are visible.
3. Policy decisions and reason codes are visible.
4. Approved meter events are idempotent and reversible.

The buying business gains evidence and dispute leverage. The vendor gains a credible resolution definition that can reduce churn and chargebacks. Stripe gains cleaner events. The end consumer remains outside the commercial transaction and still cannot be consulted for every silent exit. Say that plainly. Do not invent a fake "everyone wins" story.

## Error costs

| Error | Who pays first | Secondary cost |
| --- | --- | --- |
| False billable resolution | Buying business | Dispute, churn, trust loss for vendor |
| False withhold | Vendor | Lost revenue, understated product value |
| Over-review | Both | Human cost can exceed the 99¢ charge |
| Double charge from retries | Buying business | Ledger and support load |
| Silent mutation of history | Everyone | Audit failure |

Because a human review of one 99¢ conversation is usually uneconomic, review must operate on recurring patterns and samples, not on every low-confidence row.

## Incentive alignment the docs must preserve

- The vendor cannot be the only party that can inspect why a charge happened.
- The evaluator cannot set prices.
- The billing system cannot invent semantic truth from a transcript.
- Policy thresholds belong in versioned contracts, not prompt prose.
- Reversals stay first-class. Corrections do not rewrite history.
