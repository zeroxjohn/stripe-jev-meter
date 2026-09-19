import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { persistEnabled } from "@/lib/stack/status";
import type { LedgerEntry, Receipt } from "@/lib/domain";

export type PersistedBilling = {
  ledger: LedgerEntry[];
  receipts: Receipt[];
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS billing_persist (
  id integer PRIMARY KEY CHECK (id = 1),
  ledger jsonb NOT NULL DEFAULT '[]',
  receipts jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO billing_persist (id) VALUES (1) ON CONFLICT DO NOTHING;
`;

export function ledgerFilePath(): string {
  return process.env.LEDGER_FILE ?? join(process.cwd(), ".data", "ledger.json");
}

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

function emptyState(): PersistedBilling {
  return { ledger: [], receipts: [] };
}

function normalize(parsed: PersistedBilling): PersistedBilling {
  return {
    ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
  };
}

function loadFile(): PersistedBilling {
  try {
    return normalize(JSON.parse(readFileSync(ledgerFilePath(), "utf8")) as PersistedBilling);
  } catch {
    return emptyState();
  }
}

function saveFile(state: PersistedBilling): void {
  const file = ledgerFilePath();
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(state, null, 2));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EROFS") {
      return;
    }
    throw error;
  }
}

async function withPool<T>(fn: (pool: import("pg").Pool) => Promise<T>): Promise<T> {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is required for postgres persist");
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

async function loadPostgres(): Promise<PersistedBilling> {
  return withPool(async (pool) => {
    await pool.query(SCHEMA);
    const result = await pool.query<{ ledger: LedgerEntry[]; receipts: Receipt[] }>(
      "SELECT ledger, receipts FROM billing_persist WHERE id = 1",
    );
    const row = result.rows[0];
    return row ? normalize(row) : emptyState();
  });
}

async function savePostgres(state: PersistedBilling): Promise<void> {
  await withPool(async (pool) => {
    await pool.query(SCHEMA);
    await pool.query(
      `INSERT INTO billing_persist (id, ledger, receipts, updated_at)
       VALUES (1, $1::jsonb, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET
         ledger = EXCLUDED.ledger,
         receipts = EXCLUDED.receipts,
         updated_at = now()`,
      [JSON.stringify(state.ledger), JSON.stringify(state.receipts)],
    );
  });
}

export async function loadPersistedBilling(): Promise<PersistedBilling> {
  if (!persistEnabled()) return emptyState();
  if (databaseUrl()) return loadPostgres();
  return loadFile();
}

export async function savePersistedBilling(state: PersistedBilling): Promise<void> {
  if (!persistEnabled()) return;
  if (databaseUrl()) {
    await savePostgres(state);
    return;
  }
  saveFile(state);
}
