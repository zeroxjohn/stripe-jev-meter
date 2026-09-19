import { describe, expect, it } from "vitest";
import { asBillingEventId, asConversationId, asCustomerId, asMeterName, asTimestamp } from "@/lib/domain";
import { ledgerForConversation } from "./scope";
import type { LedgerEntry } from "@/lib/domain";

const at = asTimestamp("2026-09-19T16:00:00.000Z");

function charged(conversationId: string, billingEventId: string): LedgerEntry {
  return {
    kind: "charged",
    billingEventId: asBillingEventId(billingEventId),
    usageEvent: {
      billingEventId: asBillingEventId(billingEventId),
      conversationId: asConversationId(conversationId),
      customerId: asCustomerId("cus_acme_demo"),
      meter: asMeterName("support_resolution_full"),
      quantity: 1,
      occurredAt: at,
      idempotencyKey: billingEventId,
    },
    at,
  };
}

describe("ledgerForConversation", () => {
  it("keeps charges and matching reversals for one conversation", () => {
    const entries: LedgerEntry[] = [
      charged("conv_a", "evt_a"),
      charged("conv_b", "evt_b"),
      {
        kind: "reversed",
        reverses: asBillingEventId("evt_a"),
        creditNoteId: "cn_a",
        reason: "customer_reopen",
        at,
      },
    ];
    expect(ledgerForConversation(entries, asConversationId("conv_a"))).toHaveLength(2);
    expect(ledgerForConversation(entries, asConversationId("conv_b"))).toHaveLength(1);
  });
});
