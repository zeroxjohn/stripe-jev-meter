import type { LedgerEntry, Receipt } from "@/lib/domain";
import { loadPersistedBilling, savePersistedBilling } from "./persist";
import type { UsageBillingProvider } from "./provider";

export type BillingStore = {
  ledger: LedgerEntry[];
  receipts: Receipt[];
  provider: UsageBillingProvider | null;
  providerKey: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __jevBillingStore?: BillingStore;
  __jevBillingStoreLoad?: Promise<BillingStore>;
};

function emptyStore(): BillingStore {
  return {
    ledger: [],
    receipts: [],
    provider: null,
    providerKey: null,
  };
}

async function createStore(): Promise<BillingStore> {
  const persisted = await loadPersistedBilling();
  return {
    ledger: persisted.ledger,
    receipts: persisted.receipts,
    provider: null,
    providerKey: null,
  };
}

export async function getBillingStore(): Promise<BillingStore> {
  if (globalStore.__jevBillingStore) return globalStore.__jevBillingStore;
  if (!globalStore.__jevBillingStoreLoad) {
    globalStore.__jevBillingStoreLoad = createStore().then((store) => {
      globalStore.__jevBillingStore = store;
      return store;
    });
  }
  return globalStore.__jevBillingStoreLoad;
}

export async function persistBillingStore() {
  const store = await getBillingStore();
  await savePersistedBilling({ ledger: store.ledger, receipts: store.receipts });
}

export async function resetBillingStore() {
  globalStore.__jevBillingStore = emptyStore();
  globalStore.__jevBillingStoreLoad = Promise.resolve(globalStore.__jevBillingStore);
  await savePersistedBilling({ ledger: [], receipts: [] });
}
