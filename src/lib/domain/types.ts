import type {
  BillingEventId,
  ConversationId,
  CustomerId,
  Duration,
  EvaluationId,
  MeterName,
  PolicyVersion,
  RubricVersion,
  SnapshotId,
  Timestamp,
} from "./ids";

export type ActionReceipt = {
  action: "refund" | "cancel" | "update_subscription" | "other";
  status: "succeeded" | "failed" | "not_attempted";
  at: Timestamp;
};

export type ConversationFacts = {
  conversationId: ConversationId;
  customerId: CustomerId;
  agentAnswered: boolean;
  humanReplied: boolean;
  customerRequestedHuman: boolean;
  explicitConfirmation: boolean;
  reopenedAfter: Duration | null;
  lastAgentMessageAt: Timestamp;
  actionReceipts: ActionReceipt[];
};

export type EvidenceSnapshot = {
  snapshotId: SnapshotId;
  conversationId: ConversationId;
  contentHash: string;
  capturedAt: Timestamp;
  redactedTranscriptRef: string;
  policyExcerptRef: string | null;
  references: string[];
};

export type OutcomeChoice =
  | "resolved"
  | "partially_resolved"
  | "unresolved"
  | "not_an_answer";

export type HumanRoleChoice = "absent" | "added_detail" | "corrected_agent";

export type Graded<T extends string> = {
  choice: T;
  probabilities: Record<T, number>;
  confidence: number;
};

export type SemanticVerdict = {
  evaluationId: EvaluationId;
  conversationId: ConversationId;
  snapshotId: SnapshotId;
  model: string;
  rubricVersion: RubricVersion;
  evaluatedAt: Timestamp;
  issueAddressed: { noul: number };
  outcome: Graded<OutcomeChoice>;
  humanRole: Graded<HumanRoleChoice>;
};

export type BillingPolicy = {
  policyVersion: PolicyVersion;
  silenceWindow: Duration;
  autoBillConfidence: number;
  reviewConfidenceFloor: number;
  gradeMeters: {
    full: MeterName;
    partial: MeterName;
  };
};

export type WithholdReason =
  | "unresolved"
  | "not_an_answer"
  | "failed_action"
  | "human_corrected"
  | "customer_requested_human"
  | "low_confidence_fallback";

export type ReviewReason =
  | "ambiguous_silence"
  | "borderline_partial"
  | "conflicting_signals";

export type BillingDecision =
  | {
      kind: "bill";
      grade: "full" | "partial";
      meter: MeterName;
      billingEventId: BillingEventId;
      reasonCodes: string[];
      decidedAt: Timestamp;
      policyVersion: PolicyVersion;
    }
  | {
      kind: "withhold";
      reason: WithholdReason;
      reasonCodes: string[];
      decidedAt: Timestamp;
      policyVersion: PolicyVersion;
    }
  | {
      kind: "review";
      reason: ReviewReason;
      expiresAt: Timestamp;
      fallback: "bill" | "withhold";
      reasonCodes: string[];
      decidedAt: Timestamp;
      policyVersion: PolicyVersion;
    };

export type UsageEvent = {
  billingEventId: BillingEventId;
  conversationId: ConversationId;
  customerId: CustomerId;
  meter: MeterName;
  quantity: number;
  occurredAt: Timestamp;
  idempotencyKey: string;
};

export type LedgerEntry =
  | {
      kind: "charged";
      billingEventId: BillingEventId;
      usageEvent: UsageEvent;
      at: Timestamp;
    }
  | {
      kind: "reversed";
      reverses: BillingEventId;
      creditNoteId: string;
      reason:
        | "customer_reopen"
        | "review_override"
        | "failed_action"
        | "policy_correction";
      at: Timestamp;
    };

export type Receipt = {
  billingEventId: BillingEventId;
  provider: "stripe" | "metronome";
  providerEventId: string | null;
  status: "accepted" | "duplicate" | "rejected";
  at: Timestamp;
  detail: string | null;
};

export type OutcomeRecord = {
  schemaVersion: "1";
  facts: ConversationFacts;
  evidence: EvidenceSnapshot;
  evaluation: SemanticVerdict | null;
  decision: BillingDecision | null;
  ledger: LedgerEntry[];
  receipts: Receipt[];
};
