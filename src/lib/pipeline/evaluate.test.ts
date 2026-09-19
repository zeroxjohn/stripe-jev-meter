import { beforeEach, describe, expect, it } from "vitest";
import { resetBillingStore } from "@/lib/billing/store";
import { FIXTURE_PACK } from "@/lib/fixtures/pack";
import { quoteContractDollars } from "@/lib/policy/contract-prices";
import { evaluateConversation } from "./evaluate";

beforeEach(async () => {
  await resetBillingStore();
});

describe("evaluateConversation fixtures", () => {
  it.each(FIXTURE_PACK)(
    "$id matches baseline, semantic, and quote",
    async (fixture) => {
      const result = await evaluateConversation({
        conversationId: `conv_${fixture.scenarioId}_case`,
        messages: fixture.messages,
        terminal: fixture.terminal,
        scenarioId: fixture.scenarioId,
      });

      expect(result.baseline.kind).toBe(fixture.expected.baseline.kind);
      if (fixture.expected.baseline.grade) {
        expect(result.baseline.kind === "bill" ? result.baseline.grade : null).toBe(
          fixture.expected.baseline.grade,
        );
      }
      if (fixture.expected.baseline.reason) {
        expect(
          result.baseline.kind === "withhold" ? result.baseline.reason : null,
        ).toBe(fixture.expected.baseline.reason);
      }

      expect(result.decision.kind).toBe(fixture.expected.semantic.kind);
      if (fixture.expected.semantic.grade) {
        expect(result.decision.kind === "bill" ? result.decision.grade : null).toBe(
          fixture.expected.semantic.grade,
        );
      }
      if (fixture.expected.semantic.reason) {
        expect(
          result.decision.kind === "withhold" ? result.decision.reason : null,
        ).toBe(fixture.expected.semantic.reason);
      }

      expect(result.quoteUsd).toBe(fixture.expected.quoteUsd);
      expect(quoteContractDollars(result.decision)).toBe(fixture.expected.quoteUsd);
      expect(result.evaluation && "price" in result.evaluation).toBe(false);
      expect(result.evaluation && "quoteUsd" in result.evaluation).toBe(false);
    },
  );
});

describe("ledger behavior", () => {
  it("does not charge a second time for the same approved fixture", async () => {
    const input = {
      conversationId: "conv_confirmed-resolution_dup",
      scenarioId: "confirmed-resolution",
      terminal: "confirmed" as const,
      messages: FIXTURE_PACK[0].messages,
    };
    const first = await evaluateConversation(input);
    const second = await evaluateConversation(input);
    const charged = second.ledger.filter((entry) => entry.kind === "charged");
    expect(charged).toHaveLength(1);
    expect(first.decision.kind).toBe("bill");
    expect(second.receipts.some((receipt) => receipt.status === "duplicate")).toBe(
      true,
    );
  });

  it("appends a reversal linked to the original billing event id", async () => {
    const conversationId = "conv_quiet-resolution_reopen";
    const first = await evaluateConversation({
      conversationId,
      scenarioId: "quiet-resolution",
      terminal: "left",
      messages: [
        { role: "customer", text: "What is the return window?" },
        {
          role: "agent",
          text: "You have 30 days from delivery. Start a return from Orders.",
        },
      ],
    });
    expect(first.decision.kind).toBe("bill");
    const billedId =
      first.decision.kind === "bill" ? first.decision.billingEventId : null;
    expect(billedId).toEqual(expect.any(String));

    const second = await evaluateConversation({
      conversationId,
      scenarioId: "quiet-resolution",
      terminal: "reopen",
      messages: first.evidence
        ? [
            { role: "customer", text: "What is the return window?" },
            {
              role: "agent",
              text: "You have 30 days from delivery. Start a return from Orders.",
            },
            { role: "customer", text: "That was wrong. I still need help." },
          ]
        : [],
    });

    const reversed = second.ledger.find((entry) => entry.kind === "reversed");
    expect(reversed).toMatchObject({
      kind: "reversed",
      reverses: billedId,
      reason: "customer_reopen",
    });
    expect(second.reversed).toMatchObject({
      billingEventId: billedId,
      reason: "customer_reopen",
    });
    expect(second.quoteUsd).toBe(0);
  });
});
