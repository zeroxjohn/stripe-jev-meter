import {
  asEvaluationId,
  asRubricVersion,
  nowTimestamp,
  type ConversationId,
  type HumanRoleChoice,
  type OutcomeChoice,
  type SemanticVerdict,
  type SnapshotId,
} from "@/lib/domain";

export type RecordedGrade = {
  outcome: OutcomeChoice;
  outcomeConfidence: number;
  noul: number;
  humanRole: HumanRoleChoice;
  humanConfidence: number;
};

export const RUBRIC_VERSION = asRubricVersion("rubric-poc-1");

const GRADES: Record<string, RecordedGrade> = {
  "confirmed-resolution": {
    outcome: "resolved",
    outcomeConfidence: 0.97,
    noul: 0.96,
    humanRole: "absent",
    humanConfidence: 0.99,
  },
  "quiet-resolution": {
    outcome: "resolved",
    outcomeConfidence: 0.94,
    noul: 0.93,
    humanRole: "absent",
    humanConfidence: 0.98,
  },
  "abandon-weak": {
    outcome: "unresolved",
    outcomeConfidence: 0.92,
    noul: 0.18,
    humanRole: "absent",
    humanConfidence: 0.99,
  },
  "partial-answer": {
    outcome: "partially_resolved",
    outcomeConfidence: 0.91,
    noul: 0.62,
    humanRole: "absent",
    humanConfidence: 0.98,
  },
  "silent-correction": {
    outcome: "unresolved",
    outcomeConfidence: 0.88,
    noul: 0.22,
    humanRole: "corrected_agent",
    humanConfidence: 0.93,
  },
  "failed-refund": {
    outcome: "resolved",
    outcomeConfidence: 0.95,
    noul: 0.91,
    humanRole: "absent",
    humanConfidence: 0.97,
  },
  adversarial: {
    outcome: "unresolved",
    outcomeConfidence: 0.9,
    noul: 0.12,
    humanRole: "absent",
    humanConfidence: 0.98,
  },
};

export function recordedGradeFor(scenarioId: string): RecordedGrade {
  return GRADES[scenarioId] ?? GRADES["abandon-weak"];
}

export function buildRecordedVerdict(input: {
  conversationId: ConversationId;
  snapshotId: SnapshotId;
  scenarioId: string;
  evaluatedAt?: SemanticVerdict["evaluatedAt"];
}): SemanticVerdict {
  const grade = recordedGradeFor(input.scenarioId);
  return {
    evaluationId: asEvaluationId(`eval_${input.snapshotId}`),
    conversationId: input.conversationId,
    snapshotId: input.snapshotId,
    model: "jev-recorded-fake",
    rubricVersion: RUBRIC_VERSION,
    evaluatedAt: input.evaluatedAt ?? nowTimestamp(),
    issueAddressed: { noul: grade.noul },
    outcome: {
      choice: grade.outcome,
      confidence: grade.outcomeConfidence,
      probabilities: probabilities(grade.outcome),
    },
    humanRole: {
      choice: grade.humanRole,
      confidence: grade.humanConfidence,
      probabilities: {
        absent: grade.humanRole === "absent" ? 0.94 : 0.03,
        added_detail: grade.humanRole === "added_detail" ? 0.94 : 0.03,
        corrected_agent: grade.humanRole === "corrected_agent" ? 0.94 : 0.03,
      },
    },
  };
}

function probabilities(choice: OutcomeChoice): Record<OutcomeChoice, number> {
  const keys: OutcomeChoice[] = [
    "resolved",
    "partially_resolved",
    "unresolved",
    "not_an_answer",
  ];
  const rest = (1 - 0.91) / 3;
  return Object.fromEntries(
    keys.map((key) => [key, key === choice ? 0.91 : rest]),
  ) as Record<OutcomeChoice, number>;
}
