import { spawn } from "node:child_process";
import { nowTimestamp, type BillingEventId, type Receipt, type UsageEvent } from "@/lib/domain";
import type { UsageBillingProvider } from "./provider";

function runStripe(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("stripe", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `stripe exited ${code}`));
    });
  });
}

export class StripeCliBillingProvider implements UsageBillingProvider {
  private readonly seen = new Set<string>();

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
    const timestamp = String(Math.floor(Date.parse(event.occurredAt) / 1000));
    await runStripe([
      "billing",
      "meter_events",
      "create",
      "--event-name",
      event.meter,
      "--identifier",
      event.idempotencyKey,
      "--timestamp",
      timestamp,
      `-d`,
      `payload[stripe_customer_id]=${event.customerId}`,
      `-d`,
      `payload[value]=${event.quantity}`,
    ]);
    this.seen.add(event.billingEventId);
    return {
      billingEventId: event.billingEventId,
      provider: "stripe",
      providerEventId: event.idempotencyKey,
      status: "accepted",
      at: nowTimestamp(),
      detail: `meter_event:${event.idempotencyKey}`,
    };
  }

  async reverse(input: {
    reverses: BillingEventId;
    reason: string;
    meter?: string;
  }): Promise<Receipt> {
    if (input.meter) {
      await runStripe([
        "billing",
        "meter_event_adjustments",
        "create",
        "--type",
        "cancel",
        "--event-name",
        input.meter,
        "-d",
        `cancel[identifier]=${input.reverses}`,
      ]);
    }
    return {
      billingEventId: input.reverses,
      provider: "stripe",
      providerEventId: `rev_${input.reverses}`,
      status: "accepted",
      at: nowTimestamp(),
      detail: `${input.reason}:meter_event_adjustment`,
    };
  }
}
