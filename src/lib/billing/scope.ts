import type { ConversationId, LedgerEntry, Receipt } from "@/lib/domain";

export function ledgerForConversation(
  entries: LedgerEntry[],
  conversationId: ConversationId,
): LedgerEntry[] {
  const billed = new Set(
    entries.flatMap((entry) =>
      entry.kind === "charged" &&
      entry.usageEvent.conversationId === conversationId
        ? [entry.billingEventId]
        : [],
    ),
  );
  return entries.filter((entry) => {
    if (entry.kind === "charged") {
      return entry.usageEvent.conversationId === conversationId;
    }
    return billed.has(entry.reverses);
  });
}

export function receiptsForLedger(
  receipts: Receipt[],
  entries: LedgerEntry[],
  conversationId: ConversationId,
): Receipt[] {
  const ids = new Set(
    ledgerForConversation(entries, conversationId).flatMap((entry) =>
      entry.kind === "charged" ? [entry.billingEventId] : [entry.reverses],
    ),
  );
  return receipts.filter((receipt) => ids.has(receipt.billingEventId));
}
