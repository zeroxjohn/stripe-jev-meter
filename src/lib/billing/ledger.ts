import {
  nowTimestamp,
  type BillingEventId,
  type LedgerEntry,
  type Receipt,
  type UsageEvent,
} from "@/lib/domain";
import type { UsageBillingProvider } from "./provider";
import { getBillingStore } from "./store";

export class AppendOnlyLedger {
  constructor(private readonly provider: UsageBillingProvider) {}

  async charge(event: UsageEvent): Promise<{ receipt: Receipt; entries: LedgerEntry[] }> {
    const store = getBillingStore();
    const already = store.ledger.some(
      (entry) => entry.kind === "charged" && entry.billingEventId === event.billingEventId,
    );
    const receipt = await this.provider.emit(event);
    store.receipts.push(receipt);
    if (!already && receipt.status === "accepted") {
      store.ledger.push({
        kind: "charged",
        billingEventId: event.billingEventId,
        usageEvent: event,
        at: nowTimestamp(),
      });
    }
    return { receipt, entries: store.ledger };
  }

  async reverse(input: {
    reverses: BillingEventId;
    reason: Extract<LedgerEntry, { kind: "reversed" }>["reason"];
  }) {
    const store = getBillingStore();
    const receipt = await this.provider.reverse(input);
    store.receipts.push(receipt);
    store.ledger.push({
      kind: "reversed",
      reverses: input.reverses,
      creditNoteId: receipt.providerEventId ?? `cn_${input.reverses}`,
      reason: input.reason,
      at: nowTimestamp(),
    });
    return { receipt, entries: store.ledger };
  }
}
