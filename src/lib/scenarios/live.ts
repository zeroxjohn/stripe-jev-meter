import type { ChatTurn, TerminalAction } from "@/lib/pipeline/facts";

export type LiveScenario = {
  id: string;
  title: string;
  seed: ChatTurn;
  firstReply: string;
  followUp: string;
  terminals: TerminalAction[];
};

export const LIVE_SCENARIOS: readonly LiveScenario[] = [
  {
    id: "abandon-weak",
    title: "Weak answer, then silence",
    seed: {
      role: "customer",
      text: "Where is order 1842 and can I still change the delivery address?",
    },
    firstReply:
      "Thanks for reaching out! I am looking into this and should have more information soon.",
    followUp: "I do not have additional details on that yet.",
    terminals: ["left"],
  },
  {
    id: "partial-answer",
    title: "One of two questions",
    seed: {
      role: "customer",
      text: "I need the tracking number for order 1842 and a refund on the damaged mug.",
    },
    firstReply:
      "Tracking for 1842 is 1Z999AA10123456784. I do not have a refund decision for the mug yet.",
    followUp: "Still waiting on the refund team for the mug.",
    terminals: ["left"],
  },
  {
    id: "silent-correction",
    title: "Wrong answer, silent fix",
    seed: {
      role: "customer",
      text: "My login is locked after the password reset email bounced.",
    },
    firstReply:
      "Just use the Forgot password link on the login page and you will be back in.",
    followUp: "The reset link is the only path I have for this.",
    terminals: ["self_fixed", "left"],
  },
  {
    id: "confirmed-resolution",
    title: "Confirmed resolution",
    seed: {
      role: "customer",
      text: "When does order 1842 arrive?",
    },
    firstReply:
      "Order 1842 ships tomorrow via UPS. Tracking will email tonight and the window is Tuesday to Wednesday.",
    followUp: "Happy to help with anything else on that shipment.",
    terminals: ["confirmed"],
  },
  {
    id: "failed-refund",
    title: "Failed refund, upbeat text",
    seed: {
      role: "customer",
      text: "Please refund the $48 mug from order 1842. It arrived cracked.",
    },
    firstReply: "Done. I processed a $48 refund to your original payment method.",
    followUp: "The refund is complete on our side.",
    terminals: ["left"],
  },
];

export function nextAgentReply(scenarioId: string, messages: ChatTurn[]): string {
  const scenario =
    LIVE_SCENARIOS.find((item) => item.id === scenarioId) ?? LIVE_SCENARIOS[0];
  const customerTurns = messages.filter((turn) => turn.role === "customer").length;
  return customerTurns <= 1 ? scenario.firstReply : scenario.followUp;
}
