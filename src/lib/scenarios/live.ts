import type { ChatTurn, TerminalAction } from "@/lib/pipeline/facts";

export type ScenarioId =
  | "abandon-weak"
  | "partial-answer"
  | "silent-correction"
  | "quiet-resolution"
  | "confirmed-resolution"
  | "failed-refund";

export type LiveScenario = {
  id: ScenarioId;
  title: string;
  blurb: string;
  imagine: string;
  seed: ChatTurn;
  firstReply: string;
  followUp: string;
  terminals: TerminalAction[];
};

export const LIVE_SCENARIOS: readonly LiveScenario[] = [
  {
    id: "abandon-weak",
    title: "Weak answer, then silence",
    blurb: "They bill assumed $0.99. We withhold.",
    imagine:
      "Imagine you asked two things about an order, and the agent only said they were looking into it.",
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
    blurb: "They bill assumed $0.99. We bill $0.40.",
    imagine:
      "Imagine you asked for tracking and a refund, and the agent only answered tracking.",
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
    blurb: "They bill assumed $0.99. We withhold.",
    imagine:
      "Imagine the agent gave you a wrong fix, and you solved it yourself without coming back.",
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
    id: "quiet-resolution",
    title: "Quiet real resolution",
    blurb: "Both bill $0.99. Silence after a real answer.",
    imagine:
      "Imagine the agent actually answered, and you left without saying thanks.",
    seed: {
      role: "customer",
      text: "What is the return window?",
    },
    firstReply: "You have 30 days from delivery. Start a return from Orders.",
    followUp: "The 30-day window starts the day the carrier marks it delivered.",
    terminals: ["left"],
  },
  {
    id: "confirmed-resolution",
    title: "Confirmed resolution",
    blurb: "Both bill $0.99.",
    imagine: "Imagine the agent answered and you confirmed it worked.",
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
    blurb: "They would bill. Action receipts withhold.",
    imagine:
      "Imagine the agent said the refund went through, but the receipt shows it failed.",
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
