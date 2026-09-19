import type { BillingEventId, Receipt, UsageEvent } from "@/lib/domain";

export interface UsageBillingProvider {
  emit(event: UsageEvent): Promise<Receipt>;
  reverse(input: {
    reverses: BillingEventId;
    reason: string;
  }): Promise<Receipt>;
}
