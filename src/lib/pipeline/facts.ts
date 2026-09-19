import {
  asConversationId,
  asCustomerId,
  asTimestamp,
  nowTimestamp,
  subtractDuration,
  type ActionReceipt,
  type BillingPolicy,
  type ConversationFacts,
  type Timestamp,
} from "@/lib/domain";

export type ChatTurn = {
  role: "customer" | "agent";
  text: string;
};

export type TerminalAction =
  | "left"
  | "confirmed"
  | "self_fixed"
  | "requested_human"
  | "reopen";

export function deriveFacts(input: {
  conversationId: string;
  customerId?: string;
  messages: ChatTurn[];
  terminal: TerminalAction;
  policy: BillingPolicy;
  now?: Timestamp;
  scenarioId?: string;
}): ConversationFacts {
  const now = input.now ?? nowTimestamp();
  const lastAgent = [...input.messages].reverse().find((turn) => turn.role === "agent");
  const silentExit =
    input.terminal === "left" ||
    input.terminal === "self_fixed" ||
    input.terminal === "reopen";
  const lastAgentMessageAt = silentExit
    ? subtractDuration(now, input.policy.silenceWindow)
    : asTimestamp(lastAgent ? now : now);

  return {
    conversationId: asConversationId(input.conversationId),
    customerId: asCustomerId(
      input.customerId ?? process.env.STRIPE_CUSTOMER_ID ?? "cus_acme_demo",
    ),
    agentAnswered: input.messages.some((turn) => turn.role === "agent"),
    humanReplied: input.terminal === "self_fixed",
    customerRequestedHuman: input.terminal === "requested_human",
    explicitConfirmation: input.terminal === "confirmed",
    reopenedAfter: input.terminal === "reopen" ? input.policy.silenceWindow : null,
    lastAgentMessageAt,
    actionReceipts: receiptsFor(input.scenarioId, now),
  };
}

function receiptsFor(scenarioId: string | undefined, now: Timestamp): ActionReceipt[] {
  if (scenarioId !== "failed-refund") return [];
  return [{ action: "refund", status: "failed", at: now }];
}
