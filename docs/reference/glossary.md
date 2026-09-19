# Glossary

- **Mode:** reference
- **Owns:** One canonical name for every domain term used in this repository
- **Update when:** A term is added, renamed, or retired
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Domain model](domain-model.md)

Use these names only. Do not introduce synonyms in docs or future code.

| Term | Meaning |
| --- | --- |
| Assumed resolution | Fin-style rule that bills a resolution when the customer does not ask for more help after the last AI answer, including some frustrated silent exits |
| Billing candidate | A conversation that has facts and optionally a verdict, but is not yet an approved usage event |
| BillingDecision | Result of the versioned policy: bill, withhold, or review |
| BillingPolicy | Deterministic rules that map facts and verdicts to decisions |
| Buying business | The vendor's customer that pays for AI resolutions |
| Confirmed resolution | Customer explicitly indicates the answer helped |
| ConversationFacts | Checkable fields from logs and systems of record |
| End consumer | The person asking the support question |
| EvidenceSnapshot | Immutable package of redacted evidence evaluated at a point in time |
| False billable resolution | Charge emitted for a conversation that should not have been billed |
| False withhold | No charge for a conversation that should have been billed under the contract |
| Grade | Contract vocabulary such as verified, partial, unresolved, not_an_answer, review_required |
| Idempotency key | Derived key that makes retries converge on one meter event |
| Jev | TypeSafe System One model used as the semantic evaluator |
| LedgerEntry | Append-only charged or reversed commercial record |
| Meter | Stripe or Metronome usage meter that carries a contract price |
| OutcomeRecord | Read-model aggregate of facts, evidence, verdict, decision, ledger, and receipts |
| Receipt | Provider acknowledgement for an emitted usage event |
| Reopen | Customer returns seeking further help on the same conversation or issue |
| Review | Human or patterned adjudication path with expiry and fallback |
| SemanticVerdict | Versioned Jev response with pinned model and rubric |
| Silent human correction | Human agent fixes a wrong AI answer without a customer human-request or reopen |
| UsageEvent | Meter event sent to Stripe or Metronome after approval |
| Vendor | AI support platform that sells resolutions to buying businesses |

Retired phrases. Do not use them as canonical terms:

- "billing truth" for a model score
- "AI price" for a grade
- "resolved flag" as a substitute for `BillingDecision`
