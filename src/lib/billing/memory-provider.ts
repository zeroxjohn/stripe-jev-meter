import {
  nowTimestamp,
  type BillingEventId,
  type Receipt,
  type UsageEvent,
} from "@/lib/domain";
import type { UsageBillingProvider } from "./provider";

export class MemoryBillingProvider implements UsageBillingProvider {
  private readonly accepted = new Set<string>();

  async emit(event: UsageEvent): Promise<Receipt> {
    if (this.accepted.has(event.billingEventId)) {
      return {
        billingEventId: event.billingEventId,
        provider: "stripe",
        providerEventId: event.billingEventId,
        status: "duplicate",
        at: nowTimestamp(),
        detail: "idempotent replay",
      };
    }
    this.accepted.add(event.billingEventId);
    return {
      billingEventId: event.billingEventId,
      provider: "stripe",
      providerEventId: event.billingEventId,
      status: "accepted",
      at: nowTimestamp(),
      detail: null,
    };
  }

  async reverse(input: {
    reverses: BillingEventId;
    reason: string;
  }): Promise<Receipt> {
    return {
      billingEventId: input.reverses,
      provider: "stripe",
      providerEventId: `rev_${input.reverses}`,
      status: "accepted",
      at: nowTimestamp(),
      detail: input.reason,
    };
  }
}
