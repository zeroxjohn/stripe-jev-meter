import Stripe from "stripe";
import { nowTimestamp, type BillingEventId, type Receipt, type UsageEvent } from "@/lib/domain";
import { StripeCliBillingProvider } from "./cli-provider";
import { MemoryBillingProvider } from "./memory-provider";
import type { UsageBillingProvider } from "./provider";

export function createBillingProvider(): UsageBillingProvider {
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return new MemoryBillingProvider();
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (key && !key.startsWith("rkcs_")) return new StripeBillingProvider(key);
  if (process.env.STRIPE_BILLING_BACKEND === "cli") {
    return new StripeCliBillingProvider();
  }
  return new MemoryBillingProvider();
}

const METER_SPECS = [
  { eventName: "support_resolution_full", displayName: "Support resolution full" },
  { eventName: "support_resolution_partial", displayName: "Support resolution partial" },
] as const;

export class StripeBillingProvider implements UsageBillingProvider {
  private readonly stripe: Stripe;
  private readonly seen = new Set<string>();
  private metersReady: Promise<void> | null = null;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  private async ensureMeters(): Promise<void> {
    if (!this.metersReady) {
      this.metersReady = this.createMissingMeters();
    }
    await this.metersReady;
  }

  private async createMissingMeters(): Promise<void> {
    const existing = await this.stripe.billing.meters.list({ limit: 100 });
    const names = new Set(existing.data.map((meter) => meter.event_name));
    for (const spec of METER_SPECS) {
      if (names.has(spec.eventName)) continue;
      await this.stripe.billing.meters.create({
        display_name: spec.displayName,
        event_name: spec.eventName,
        default_aggregation: { formula: "sum" },
      });
    }
  }

  async emit(event: UsageEvent): Promise<Receipt> {
    await this.ensureMeters();
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
      detail: `meter_event:${created.identifier ?? event.billingEventId}`,
    };
  }

  async reverse(input: {
    reverses: BillingEventId;
    reason: string;
    meter?: string;
  }): Promise<Receipt> {
    if (!input.meter) {
      return {
        billingEventId: input.reverses,
        provider: "stripe",
        providerEventId: `rev_${input.reverses}`,
        status: "accepted",
        at: nowTimestamp(),
        detail: input.reason,
      };
    }
    const adjustment = await this.stripe.billing.meterEventAdjustments.create({
      type: "cancel",
      event_name: input.meter,
      cancel: { identifier: input.reverses },
    });
    return {
      billingEventId: input.reverses,
      provider: "stripe",
      providerEventId: adjustment.cancel?.identifier ?? `rev_${input.reverses}`,
      status: "accepted",
      at: nowTimestamp(),
      detail: `${input.reason}:meter_event_adjustment`,
    };
  }
}
