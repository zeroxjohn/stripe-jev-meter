# Data boundaries

- **Mode:** reference
- **Owns:** What may cross each system boundary and what never leaves
- **Update when:** Integrators, redaction rules, or allowed fields change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Domain model](domain-model.md), [Jev evaluator](../integration/jev-evaluator.md), [Stripe billing](../integration/stripe-billing.md)

## Boundary map

```text
Support system
  -> ConversationFacts + EvidenceSnapshot
    -> Jev evaluator
      -> SemanticVerdict
        -> BillingPolicy
          -> BillingDecision
            -> UsageEvent
              -> Stripe or Metronome
                -> Receipt + LedgerEntry
```

Validate at every boundary. Trust typed records inside the core once parsed.

## Into ConversationFacts

Allowed:

- conversation and customer identifiers
- timestamps
- confirmation and human-request flags
- reopen duration
- action receipts from systems of record

Rejected:

- raw card numbers
- payment method identifiers
- unrestricted employee secrets
- unverified free-text claims treated as facts

## Into EvidenceSnapshot

Allowed:

- redacted transcript reference
- content hash
- policy excerpt needed for the questions
- stable reference IDs

Rejected:

- payment credentials
- government IDs unless the product later defines a regulated path
- full unredacted PII when a redacted form can answer the questions

## Into Jev

Allowed:

- redacted transcript text or structured turns
- factual fields needed for the questions
- rubric instructions and criteria

Rejected:

- secret API keys
- Stripe customer payment methods
- unrestricted internal admin notes that are unnecessary for the grade

If Jev is unavailable, do not invent a verdict. Emit no usage event unless policy fallback explicitly allows a deterministic path.

## Into Stripe or Metronome

Allowed:

- customer billing identifier known to Stripe
- meter name
- quantity
- timestamp
- idempotency key
- opaque metadata that cannot re-identify unnecessary PII

Rejected:

- full transcripts
- model probabilities as the price
- mutable "edit this charge" calls that overwrite history

## Out to buyers and reviewers

Allowed:

- decision kind and reason codes
- grade
- confidence summaries
- short evidence excerpts or references
- ledger and receipt status

Rejected by default:

- unrestricted raw transcripts to every seat
- payment credentials
- evaluator prompts that contain secrets

## Retention and immutability

- Evidence snapshots are immutable after capture.
- Semantic verdicts are immutable after write.
- Ledger entries are append-only.
- Policy, model, and rubric versions are retained so old decisions remain explainable.
