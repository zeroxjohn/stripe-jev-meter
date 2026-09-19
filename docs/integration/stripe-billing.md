# Stripe billing integration

- **Mode:** reference
- **Owns:** Meter ownership, event identity, deduplication, reversals, credit notes, test-mode constraints, and the Metronome adapter boundary
- **Update when:** The billing provider interface or event contract changes
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Domain model](../reference/domain-model.md), [Outcome grades](../reference/outcome-grades.md)
- **Claims:** C005, C006, C033, C001, C003

## Role split

| System | Owns |
| --- | --- |
| This project | Facts, evidence, verdict intake, policy decision, idempotent event emission, ledger |
| Stripe Billing | Meters, aggregation, invoices, collection, hosted customer surfaces |
| Metronome | High-volume rating, credits, contracts, multidimensional packaging when used |

Stripe and Metronome trust the usage event. They do not read the transcript to invent a resolution.

## Proof-of-concept provider choice

Default for the PoC: Stripe Billing test-mode meters, because the Fin case study already documents that path.

Keep a narrow provider adapter so the same `UsageEvent` can later target Metronome without changing the domain model.

```ts
interface UsageBillingProvider {
  emit(event: UsageEvent): Promise<Receipt>
  reverse(input: {
    reverses: BillingEventId
    reason: string
  }): Promise<Receipt>
}
```

## Event contract

Required fields on emit:

- `billingEventId`
- `idempotencyKey`
- `customerId` known to Stripe
- `meter`
- `quantity` as a positive integer
- `occurredAt`

Recommended metadata:

- `conversationId`
- `policyVersion`
- `grade`
- `evaluationId`

Do not put full transcripts or payment credentials in metadata.

## Idempotency

Derive:

```text
billingEventId = sha256(conversationId + ":" + policyVersion + ":" + grade)
idempotencyKey = billingEventId
```

Running the pipeline twice over the same inputs must produce one accepted charge and one duplicate receipt, not two invoices.

If policy version or grade changes after a charge, do not overwrite. Append a reversal, then emit the new event if the new decision bills.

## Reversals

Create a credit note or equivalent reversal when:

- the customer reopens inside the contract window
- review overrides a prior charge
- a required action later proves failed
- a policy correction invalidates the prior grade

Link the reversal to the original `billingEventId` in the ledger.

## Test-mode constraints

- Use Stripe test keys only in the PoC.
- Use restricted keys with the minimum meter and customer permissions needed.
- Verify webhook signatures if webhooks are used for invoice state.
- Never claim production readiness from test-mode screenshots alone.

## What this integration deliberately does not do

- Dynamic pricing inside the evaluator
- Editing historical usage rows in place
- Treating Stripe Radar as a semantic resolution oracle
- Assuming Metronome access is required for the first demo
