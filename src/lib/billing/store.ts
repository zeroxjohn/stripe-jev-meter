import type { LedgerEntry, Receipt } from "@/lib/domain";
import type { UsageBillingProvider } from "./provider";

export type BillingStore = {
  ledger: LedgerEntry[];
  receipts: Receipt[];
  provider: UsageBillingProvider | null;
};

const globalStore = globalThis as typeof globalThis & {
  __jevBillingStore?: BillingStore;
};

export function getBillingStore(): BillingStore {
  if (!globalStore.__jevBillingStore) {
    globalStore.__jevBillingStore = { ledger: [], receipts: [], provider: null };
  }
  return globalStore.__jevBillingStore;
}

export function resetBillingStore() {
  globalStore.__jevBillingStore = { ledger: [], receipts: [], provider: null };
}
