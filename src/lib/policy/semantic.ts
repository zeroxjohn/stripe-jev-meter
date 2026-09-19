import {
  bill,
  firstMatch,
  hasFailedAction,
  review,
  withhold,
  type PolicyInput,
  type PolicyRule,
} from "./rules";

const SEMANTIC_RULES: readonly PolicyRule[] = [
  {
    id: "failed_action",
    when: ({ facts }) => hasFailedAction(facts),
    decide: (input) =>
      withhold(input, "failed_action", ["override:failed_action"]),
  },
  {
    id: "customer_requested_human",
    when: ({ facts }) => facts.customerRequestedHuman,
    decide: (input) =>
      withhold(input, "customer_requested_human", [
        "override:customer_requested_human",
      ]),
  },
  {
    id: "evaluator_missing",
    when: ({ verdict }) => verdict === null,
    decide: (input) =>
      withhold(input, "low_confidence_fallback", ["evaluator:unavailable"]),
  },
  {
    id: "human_corrected",
    when: ({ verdict, policy }) =>
      verdict !== null &&
      verdict.humanRole.choice === "corrected_agent" &&
      verdict.humanRole.confidence >= policy.reviewConfidenceFloor,
    decide: (input) =>
      withhold(input, "human_corrected", ["override:human_corrected"]),
  },
  {
    id: "explicit_confirmation",
    when: ({ facts }) => facts.explicitConfirmation && !hasFailedAction(facts),
    decide: (input) => bill(input, "full", ["facts:explicit_confirmation"]),
  },
  {
    id: "auto_bill_full",
    when: ({ verdict, policy }) =>
      verdict !== null &&
      verdict.outcome.choice === "resolved" &&
      verdict.outcome.confidence >= policy.autoBillConfidence &&
      verdict.issueAddressed.noul >= 0.9,
    decide: (input) => bill(input, "full", ["gate:auto_bill_full"]),
  },
  {
    id: "auto_bill_partial",
    when: ({ verdict }) =>
      verdict !== null &&
      verdict.outcome.choice === "partially_resolved" &&
      verdict.outcome.confidence >= 0.85,
    decide: (input) => bill(input, "partial", ["gate:auto_bill_partial"]),
  },
  {
    id: "auto_withhold_unresolved",
    when: ({ verdict, policy }) =>
      verdict !== null &&
      (verdict.outcome.choice === "unresolved" ||
        verdict.outcome.choice === "not_an_answer") &&
      verdict.outcome.confidence >= policy.reviewConfidenceFloor,
    decide: (input) =>
      withhold(
        input,
        input.verdict?.outcome.choice === "not_an_answer"
          ? "not_an_answer"
          : "unresolved",
        ["gate:auto_withhold"],
      ),
  },
  {
    id: "review_partial",
    when: ({ verdict }) =>
      verdict !== null && verdict.outcome.choice === "partially_resolved",
    decide: (input) =>
      review(input, "borderline_partial", ["gate:review_partial"]),
  },
  {
    id: "review_silence",
    when: () => true,
    decide: (input) =>
      review(input, "ambiguous_silence", ["gate:review_silence"]),
  },
];

export function decideSemantic(input: PolicyInput) {
  return firstMatch(SEMANTIC_RULES, input);
}
