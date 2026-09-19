import { elapsedSince, isAtLeast } from "@/lib/domain";
import {
  bill,
  firstMatch,
  hasFailedAction,
  withhold,
  type PolicyInput,
  type PolicyRule,
} from "./rules";

const BASELINE_RULES: readonly PolicyRule[] = [
  {
    id: "explicit_confirmation",
    when: ({ facts }) => facts.explicitConfirmation && !hasFailedAction(facts),
    decide: (input) => bill(input, "full", ["baseline:confirmed"]),
  },
  {
    id: "customer_requested_human",
    when: ({ facts }) => facts.customerRequestedHuman,
    decide: (input) =>
      withhold(input, "customer_requested_human", [
        "baseline:customer_requested_human",
      ]),
  },
  {
    id: "assumed_resolution",
    when: ({ facts, now, policy }) =>
      facts.agentAnswered &&
      isAtLeast(elapsedSince(facts.lastAgentMessageAt, now), policy.silenceWindow),
    decide: (input) => bill(input, "full", ["baseline:assumed_resolution"]),
  },
  {
    id: "unresolved",
    when: () => true,
    decide: (input) => withhold(input, "unresolved", ["baseline:unresolved"]),
  },
];

export function decideBaseline(input: PolicyInput) {
  return firstMatch(BASELINE_RULES, input);
}
