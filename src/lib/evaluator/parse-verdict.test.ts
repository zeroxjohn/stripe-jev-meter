import { describe, expect, it } from "vitest";
import { parseSemanticVerdict } from "./parse-verdict";

const valid = {
  evaluationId: "eval_1",
  conversationId: "conv_1",
  snapshotId: "snap_1",
  model: "jev-1.13.0",
  rubricVersion: "rubric-poc-1",
  evaluatedAt: "2026-09-19T16:00:00.000Z",
  issueAddressed: { noul: 0.2 },
  outcome: {
    choice: "unresolved",
    confidence: 0.9,
    probabilities: {
      resolved: 0.05,
      partially_resolved: 0.05,
      unresolved: 0.85,
      not_an_answer: 0.05,
    },
  },
  humanRole: {
    choice: "absent",
    confidence: 0.99,
    probabilities: {
      absent: 0.94,
      added_detail: 0.03,
      corrected_agent: 0.03,
    },
  },
};

describe("parseSemanticVerdict", () => {
  it("rejects a payload with no outcome", () => {
    const { outcome: _omit, ...missing } = valid;
    expect(() => parseSemanticVerdict(missing)).toThrow(/outcome/i);
  });

  it("rejects Noul when a confidence field is present", () => {
    expect(() =>
      parseSemanticVerdict({
        ...valid,
        issueAddressed: { noul: 0.4, confidence: 0.9 },
      }),
    ).toThrow(/confidence/i);
  });

  it("parses a complete verdict", () => {
    const verdict = parseSemanticVerdict(valid);
    expect(verdict.issueAddressed).toEqual({ noul: 0.2 });
    expect(verdict.outcome.choice).toBe("unresolved");
    expect("confidence" in verdict.issueAddressed).toBe(false);
  });
});
