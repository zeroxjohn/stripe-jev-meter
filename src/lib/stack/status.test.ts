import { describe, expect, it } from "vitest";
import {
  classifyBillingAdapter,
  classifyEvaluatorAdapter,
  classifyLedgerAdapter,
  classifyStripeKey,
  readStackStatus,
} from "./status";

describe("stack status", () => {
  it("treats claimable sandbox keys as memory billing", () => {
    expect(classifyStripeKey("rkcs_test_abc")).toBe("claimable");
    expect(classifyBillingAdapter("claimable")).toBe("memory");
    expect(classifyStripeKey("sk_test_abc")).toBe("secret");
    expect(classifyBillingAdapter("secret")).toBe("stripe");
    expect(classifyBillingAdapter("claimable", "cli")).toBe("stripe");
    expect(classifyStripeKey(undefined)).toBe("missing");
  });

  it("uses recorded Jev until a TypeSafe or OpenRouter key exists", () => {
    expect(classifyEvaluatorAdapter(undefined)).toBe("recorded");
    expect(classifyEvaluatorAdapter("ts_test")).toBe("jev");
    expect(classifyEvaluatorAdapter(undefined, "sk-or-v1-test")).toBe("jev");
  });

  it("lists Projects and meter blockers until live activation and a claimed key exist", () => {
    const status = readStackStatus({
      STRIPE_SECRET_KEY: "rkcs_test_abc",
    });
    expect(status.billingAdapter).toBe("memory");
    expect(status.projects).toBe("missing");
    expect(status.ledgerAdapter).toBe("memory");
    expect(status.blockers.some((row) => row.includes("live-mode"))).toBe(true);
  });

  it("classifies a Neon DATABASE_URL as postgres ledger", () => {
    expect(classifyLedgerAdapter({ DATABASE_URL: "postgres://localhost/ledger" })).toBe(
      "postgres",
    );
    expect(classifyLedgerAdapter({})).not.toBe("postgres");
  });

  it("keeps the ledger in memory on Vercel without DATABASE_URL", () => {
    expect(classifyLedgerAdapter({ VERCEL: "1" })).toBe("memory");
    expect(
      classifyLedgerAdapter({
        VERCEL: "1",
        DATABASE_URL: "postgres://localhost/ledger",
      }),
    ).toBe("postgres");
  });
});
