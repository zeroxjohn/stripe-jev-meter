import type { BillingDecision } from "@/lib/domain";

export const FULL_RESOLUTION_USD = 0.99;
export const PARTIAL_RESOLUTION_USD = 0.4;

export function quoteContractDollars(decision: BillingDecision): number {
  if (decision.kind !== "bill") return 0;
  return decision.grade === "partial" ? PARTIAL_RESOLUTION_USD : FULL_RESOLUTION_USD;
}
