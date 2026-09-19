export type ChatRole = "customer" | "agent";

export type ChatMessage = {
  role: ChatRole;
  text: string;
};

export type TerminalAction =
  | "left"
  | "confirmed"
  | "self_fixed"
  | "requested_human"
  | "reopen";

export type { ScenarioId } from "@/lib/scenarios/live";

export type StackStatus = {
  billingAdapter: "memory" | "stripe";
  stripeKeyKind: "missing" | "claimable" | "secret";
  evaluatorAdapter: "recorded" | "jev";
  ledgerAdapter: "memory" | "file" | "postgres";
  projects: "missing" | "initialized";
  blockers: string[];
};

export type DecisionKind = "bill" | "withhold" | "review";

export type BillingDecisionView = {
  kind: DecisionKind;
  grade?: "full" | "partial";
  meter?: string;
  reason?: string;
  reasonCodes: string[];
  policyVersion: string;
  billingEventId?: string;
};

export type EvaluateResponse = {
  facts: {
    conversationId: string;
    customerId: string;
    agentAnswered: boolean;
    humanReplied: boolean;
    customerRequestedHuman: boolean;
    explicitConfirmation: boolean;
    reopenedAfter: string | null;
    lastAgentMessageAt: string;
    actionReceipts: Array<{
      action: string;
      status: string;
      at: string;
    }>;
  };
  evidence: {
    snapshotId: string;
    contentHash: string;
    capturedAt: string;
    redactedTranscriptRef: string;
  };
  evaluation: {
    evaluationId: string;
    model: string;
    rubricVersion: string;
    issueAddressed: { noul: number };
    outcome: {
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    };
    humanRole: {
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    };
  } | null;
  baseline: BillingDecisionView;
  decision: BillingDecisionView;
  quoteUsd: number;
  baselineQuoteUsd?: number;
  reversed?: { billingEventId: string; reason: string } | null;
  ledger: Array<Record<string, unknown>>;
  receipts: Array<{
    billingEventId: string;
    provider: string;
    status: string;
    detail: string | null;
  }>;
};
