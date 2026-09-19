# Domain model

- **Mode:** reference
- **Owns:** Every core type in this project. No other file defines these types.
- **Update when:** Any field, invariant, or relationship among these types changes
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Outcome grades](outcome-grades.md), [Glossary](glossary.md)

## Design rule

Keep three decisions separate:

1. `ConversationFacts` are checkable.
2. `SemanticVerdict` is what Jev returned.
3. `BillingDecision` is what the versioned policy decided.

If verdict and decision collapse into one object, you cannot re-run policy without re-running the model, and you cannot tell which layer was wrong.

## Identifiers

```ts
type ConversationId = string & { readonly brand: "ConversationId" }
type CustomerId = string & { readonly brand: "CustomerId" }
type SnapshotId = string & { readonly brand: "SnapshotId" }
type EvaluationId = string & { readonly brand: "EvaluationId" }
type BillingEventId = string & { readonly brand: "BillingEventId" }
type PolicyVersion = string & { readonly brand: "PolicyVersion" }
type RubricVersion = string & { readonly brand: "RubricVersion" }
type MeterName = string & { readonly brand: "MeterName" }
```

## ConversationFacts

Observed from logs and systems of record. No model involved.

```ts
type ConversationFacts = {
  conversationId: ConversationId
  customerId: CustomerId
  agentAnswered: boolean
  humanReplied: boolean
  customerRequestedHuman: boolean
  explicitConfirmation: boolean
  reopenedAfter: Duration | null
  lastAgentMessageAt: Timestamp
  actionReceipts: ActionReceipt[]
}

type ActionReceipt = {
  action: "refund" | "cancel" | "update_subscription" | "other"
  status: "succeeded" | "failed" | "not_attempted"
  at: Timestamp
}
```

Invariants:

- `reopenedAfter` is one nullable duration, not a boolean plus a separate duration that must stay in sync.
- Action claims in the transcript do not override `actionReceipts`.

## EvidenceSnapshot

Immutable package evaluated at a point in time.

```ts
type EvidenceSnapshot = {
  snapshotId: SnapshotId
  conversationId: ConversationId
  contentHash: string
  capturedAt: Timestamp
  redactedTranscriptRef: string
  policyExcerptRef: string | null
  references: string[]
}
```

The snapshot stores references and a content hash. It does not store payment credentials.

## SemanticVerdict

Immutable Jev response. Model and rubric versions are pinned.

```ts
type Graded<T extends string> = {
  choice: T
  probabilities: Record<T, number>
  confidence: number
}

type SemanticVerdict = {
  evaluationId: EvaluationId
  conversationId: ConversationId
  snapshotId: SnapshotId
  model: string
  rubricVersion: RubricVersion
  evaluatedAt: Timestamp
  issueAddressed: { noul: number }
  outcome: Graded<"resolved" | "partially_resolved" | "unresolved" | "not_an_answer">
  humanRole: Graded<"absent" | "added_detail" | "corrected_agent">
}
```

Invariants:

- `issueAddressed` uses Noul and has no Choice/Score confidence field.
- `outcome` and `humanRole` carry confidence because they are Choice answers.
- Replaying the same snapshot with the same model and rubric should reproduce the same structured fields for audit, subject to provider guarantees.

## BillingPolicy

Deterministic rules versioned independently from the model.

```ts
type BillingPolicy = {
  policyVersion: PolicyVersion
  silenceWindow: Duration
  autoBillConfidence: number
  reviewConfidenceFloor: number
  gradeMeters: {
    full: MeterName
    partial: MeterName
  }
}
```

## BillingDecision

Pure function of facts, verdict, and policy.

```ts
type WithholdReason =
  | "unresolved"
  | "not_an_answer"
  | "failed_action"
  | "human_corrected"
  | "customer_requested_human"
  | "low_confidence_fallback"

type ReviewReason =
  | "ambiguous_silence"
  | "borderline_partial"
  | "conflicting_signals"

type BillingDecision =
  | {
      kind: "bill"
      grade: "full" | "partial"
      meter: MeterName
      billingEventId: BillingEventId
      reasonCodes: string[]
      decidedAt: Timestamp
      policyVersion: PolicyVersion
    }
  | {
      kind: "withhold"
      reason: WithholdReason
      reasonCodes: string[]
      decidedAt: Timestamp
      policyVersion: PolicyVersion
    }
  | {
      kind: "review"
      reason: ReviewReason
      expiresAt: Timestamp
      fallback: "bill" | "withhold"
      reasonCodes: string[]
      decidedAt: Timestamp
      policyVersion: PolicyVersion
    }
```

Invariants:

- A billed decision always names a meter.
- A review always names an expiry and a fallback so unanswered reviews converge.
- Illegal combinations such as `billed: true` without a meter are unrepresentable.

## UsageEvent

Event sent to Stripe Billing or Metronome after approval.

```ts
type UsageEvent = {
  billingEventId: BillingEventId
  conversationId: ConversationId
  customerId: CustomerId
  meter: MeterName
  quantity: number
  occurredAt: Timestamp
  idempotencyKey: string
}
```

`billingEventId` and `idempotencyKey` derive from:

```text
sha256(conversationId + policyVersion + grade)
```

Retries converge. A policy change that changes the grade produces a new id and requires an explicit reversal of any prior charge.

## LedgerEntry and Receipt

Append-only commercial history.

```ts
type LedgerEntry =
  | {
      kind: "charged"
      billingEventId: BillingEventId
      usageEvent: UsageEvent
      at: Timestamp
    }
  | {
      kind: "reversed"
      reverses: BillingEventId
      creditNoteId: string
      reason: "customer_reopen" | "review_override" | "failed_action" | "policy_correction"
      at: Timestamp
    }

type Receipt = {
  billingEventId: BillingEventId
  provider: "stripe" | "metronome"
  providerEventId: string | null
  status: "accepted" | "duplicate" | "rejected"
  at: Timestamp
  detail: string | null
}
```

Never update a charged row in place. Corrections append a `reversed` entry.

## Aggregate view for one conversation

```ts
type OutcomeRecord = {
  schemaVersion: "1"
  facts: ConversationFacts
  evidence: EvidenceSnapshot
  evaluation: SemanticVerdict | null
  decision: BillingDecision | null
  ledger: LedgerEntry[]
  receipts: Receipt[]
}
```

This aggregate is a read model. The source of truth remains the separated records above.
