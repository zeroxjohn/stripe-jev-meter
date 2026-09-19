import type {
  BillingDecision,
  ConversationFacts,
  EvidenceSnapshot,
  LedgerEntry,
  Receipt,
  SemanticVerdict,
} from "@/lib/domain";
import { AppendOnlyLedger } from "@/lib/billing/ledger";
import { createBillingProvider } from "@/lib/billing/stripe-provider";
import { getBillingStore } from "@/lib/billing/store";
import { createEvaluator, EvaluatorUnavailable } from "@/lib/evaluator";
import { RUBRIC_VERSION } from "@/lib/evaluator/recorded";
import { ACME_POLICY } from "@/lib/policy/acme-policy";
import { decideBaseline } from "@/lib/policy/baseline";
import { quoteContractDollars } from "@/lib/policy/contract-prices";
import { decideSemantic } from "@/lib/policy/semantic";
import { deriveFacts, type ChatTurn, type TerminalAction } from "./facts";
import { captureSnapshot } from "./snapshot";

export type EvaluationResult = {
  facts: ConversationFacts;
  evidence: EvidenceSnapshot;
  evaluation: SemanticVerdict | null;
  baseline: BillingDecision;
  decision: BillingDecision;
  quoteUsd: number;
  baselineQuoteUsd: number;
  reversed: { billingEventId: string; reason: string } | null;
  ledger: LedgerEntry[];
  receipts: Receipt[];
};

export async function evaluateConversation(input: {
  conversationId: string;
  messages: ChatTurn[];
  terminal: TerminalAction;
  scenarioId?: string;
  facts?: ConversationFacts;
  now?: ConversationFacts["lastAgentMessageAt"];
}): Promise<EvaluationResult> {
  const policy = ACME_POLICY;
  const facts =
    input.facts ??
    deriveFacts({
      conversationId: input.conversationId,
      messages: input.messages,
      terminal: input.terminal,
      policy,
      now: input.now,
      scenarioId: input.scenarioId,
    });
  const evidence = captureSnapshot({
    conversationId: facts.conversationId,
    messages: input.messages,
    now: input.now,
  });

  let evaluation: SemanticVerdict | null = null;
  try {
    evaluation = await createEvaluator().evaluate({
      snapshot: evidence,
      facts,
      rubricVersion: RUBRIC_VERSION,
      scenarioId: input.scenarioId,
    });
  } catch (error) {
    if (!(error instanceof EvaluatorUnavailable)) throw error;
  }

  const policyInput = { facts, verdict: evaluation, now: evidence.capturedAt, policy };
  const baseline = decideBaseline(policyInput);
  const decision = decideSemantic(policyInput);
  const store = getBillingStore();
  if (!store.provider) store.provider = createBillingProvider();
  const ledger = new AppendOnlyLedger(store.provider);
  let reversed: EvaluationResult["reversed"] = null;

  if (input.terminal === "reopen") {
    const prior = [...store.ledger]
      .reverse()
      .find(
        (entry) =>
          entry.kind === "charged" &&
          entry.usageEvent.conversationId === facts.conversationId,
      );
    if (prior && prior.kind === "charged") {
      await ledger.reverse({
        reverses: prior.billingEventId,
        reason: "customer_reopen",
      });
      reversed = {
        billingEventId: prior.billingEventId,
        reason: "customer_reopen",
      };
    }
  } else if (decision.kind === "bill") {
    await ledger.charge({
      billingEventId: decision.billingEventId,
      conversationId: facts.conversationId,
      customerId: facts.customerId,
      meter: decision.meter,
      quantity: 1,
      occurredAt: evidence.capturedAt,
      idempotencyKey: decision.billingEventId,
    });
  }

  return {
    facts,
    evidence,
    evaluation,
    baseline,
    decision,
    quoteUsd: reversed ? 0 : quoteContractDollars(decision),
    baselineQuoteUsd: quoteContractDollars(baseline),
    reversed,
    ledger: store.ledger,
    receipts: store.receipts,
  };
}
