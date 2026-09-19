import { createHash } from "node:crypto";
import { asBillingEventId, type BillingEventId, type ConversationId, type PolicyVersion } from "./ids";

export function deriveBillingEventId(
  conversationId: ConversationId,
  policyVersion: PolicyVersion,
  grade: "full" | "partial",
): BillingEventId {
  const digest = createHash("sha256")
    .update(`${conversationId}:${policyVersion}:${grade}`)
    .digest("hex");
  return asBillingEventId(digest);
}
