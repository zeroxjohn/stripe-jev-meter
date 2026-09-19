import {
  deriveBillingEventId,
  hours,
  type BillingDecision,
  type BillingPolicy,
  type ConversationFacts,
  type SemanticVerdict,
  type Timestamp,
} from "@/lib/domain";

export type PolicyInput = {
  facts: ConversationFacts;
  verdict: SemanticVerdict | null;
  now: Timestamp;
  policy: BillingPolicy;
};

export type PolicyRule = {
  id: string;
  when: (input: PolicyInput) => boolean;
  decide: (input: PolicyInput) => BillingDecision;
};

export function firstMatch(
  rules: readonly PolicyRule[],
  input: PolicyInput,
): BillingDecision {
  const hit = rules.find((rule) => rule.when(input));
  if (!hit) {
    throw new Error("policy table must be total");
  }
  return hit.decide(input);
}

export function hasFailedAction(facts: ConversationFacts): boolean {
  return facts.actionReceipts.some((receipt) => receipt.status === "failed");
}

export function bill(
  input: PolicyInput,
  grade: "full" | "partial",
  reasonCodes: string[],
): BillingDecision {
  return {
    kind: "bill",
    grade,
    meter: input.policy.gradeMeters[grade],
    billingEventId: deriveBillingEventId(
      input.facts.conversationId,
      input.policy.policyVersion,
      grade,
    ),
    reasonCodes,
    decidedAt: input.now,
    policyVersion: input.policy.policyVersion,
  };
}

export function withhold(
  input: PolicyInput,
  reason: Extract<BillingDecision, { kind: "withhold" }>["reason"],
  reasonCodes: string[],
): BillingDecision {
  return {
    kind: "withhold",
    reason,
    reasonCodes,
    decidedAt: input.now,
    policyVersion: input.policy.policyVersion,
  };
}

export function review(
  input: PolicyInput,
  reason: Extract<BillingDecision, { kind: "review" }>["reason"],
  reasonCodes: string[],
): BillingDecision {
  return {
    kind: "review",
    reason,
    expiresAt: hoursFrom(input.now, 24),
    fallback: "withhold",
    reasonCodes,
    decidedAt: input.now,
    policyVersion: input.policy.policyVersion,
  };
}

function hoursFrom(now: Timestamp, count: number): Timestamp {
  const later = new Date(Date.parse(now) + hours(count).ms);
  return later.toISOString() as Timestamp;
}
