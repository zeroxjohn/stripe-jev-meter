import Stripe from "stripe";
import { nowTimestamp, type BillingEventId, type Receipt, type UsageEvent } from "@/lib/domain";
import { MemoryBillingProvider } from "./memory-provider";
import type { UsageBillingProvider } from "./provider";

export function createBillingProvider(): UsageBillingProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return new MemoryBillingProvider();
  return new StripeBillingProvider(key);
}

export class StripeBillingProvider implements UsageBillingProvider {
  private readonly stripe: Stripe;
  private readonly seen = new Set<string>();

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async emit(event: UsageEvent): Promise<Receipt> {
    if (this.seen.has(event.billingEventId)) {
      return {
        billingEventId: event.billingEventId,
        provider: "stripe",
        providerEventId: event.billingEventId,
        status: "duplicate",
        at: nowTimestamp(),
        detail: "local idempotency",
      };
    }
    const created = await this.stripe.billing.meterEvents.create(
      {
        event_name: event.meter,
        payload: {
          stripe_customer_id: event.customerId,
          value: String(event.quantity),
        },
        identifier: event.idempotencyKey,
        timestamp: Math.floor(Date.parse(event.occurredAt) / 1000),
      },
      { idempotencyKey: event.idempotencyKey },
    );
    this.seen.add(event.billingEventId);
    return {
      billingEventId: event.billingEventId,
      provider: "stripe",
      providerEventId: created.identifier ?? event.billingEventId,
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
