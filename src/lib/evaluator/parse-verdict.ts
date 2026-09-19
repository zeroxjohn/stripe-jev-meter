import {
  asConversationId,
  asEvaluationId,
  asRubricVersion,
  asSnapshotId,
  asTimestamp,
  type EvaluationId,
  type Graded,
  type HumanRoleChoice,
  type OutcomeChoice,
  type SemanticVerdict,
  type Timestamp,
} from "@/lib/domain";

const OUTCOMES: readonly OutcomeChoice[] = [
  "resolved",
  "partially_resolved",
  "unresolved",
  "not_an_answer",
];

const HUMAN_ROLES: readonly HumanRoleChoice[] = [
  "absent",
  "added_detail",
  "corrected_agent",
];

export function parseProviderAnswers(input: {
  raw: unknown;
  conversationId: string;
  snapshotId: string;
  rubricVersion: string;
  evaluationId: EvaluationId;
  evaluatedAt: Timestamp;
}): SemanticVerdict {
  if (!isRecord(input.raw)) throw new Error("verdict must be an object");
  const answers = input.raw.answers;
  if (!isRecord(answers)) throw new Error("answers is required");

  const issueAddressed = isRecord(answers.issue_addressed)
    ? { noul: answers.issue_addressed.noul }
    : answers.issue_addressed;

  return parseSemanticVerdict({
    evaluationId: input.evaluationId,
    conversationId: input.conversationId,
    snapshotId: input.snapshotId,
    model:
      typeof input.raw.model === "string" && input.raw.model.length > 0
        ? input.raw.model
        : "unknown",
    rubricVersion: input.rubricVersion,
    evaluatedAt: input.evaluatedAt,
    issueAddressed,
    outcome: answers.outcome,
    humanRole: answers.human_role,
  });
}

export function parseSemanticVerdict(raw: unknown): SemanticVerdict {
  if (!isRecord(raw)) throw new Error("verdict must be an object");

  const issueAddressed = raw.issueAddressed;
  if (!isRecord(issueAddressed) || typeof issueAddressed.noul !== "number") {
    throw new Error("issueAddressed.noul is required");
  }
  if ("confidence" in issueAddressed) {
    throw new Error("Noul answers must not carry a confidence field");
  }

  return {
    evaluationId: asEvaluationId(needString(raw, "evaluationId")),
    conversationId: asConversationId(needString(raw, "conversationId")),
    snapshotId: asSnapshotId(needString(raw, "snapshotId")),
    model: needString(raw, "model"),
    rubricVersion: asRubricVersion(needString(raw, "rubricVersion")),
    evaluatedAt: asTimestamp(needString(raw, "evaluatedAt")),
    issueAddressed: { noul: issueAddressed.noul },
    outcome: parseGraded(raw.outcome, OUTCOMES, "outcome"),
    humanRole: parseGraded(raw.humanRole, HUMAN_ROLES, "humanRole"),
  };
}

function parseGraded<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  label: string,
): Graded<T> {
  if (!isRecord(raw)) throw new Error(`${label} must be an object`);
  if (typeof raw.choice !== "string" || !allowed.includes(raw.choice as T)) {
    throw new Error(`${label}.choice is missing or invalid`);
  }
  if (typeof raw.confidence !== "number") {
    throw new Error(`${label}.confidence is required`);
  }
  if (!isRecord(raw.probabilities)) {
    throw new Error(`${label}.probabilities is required`);
  }
  const probabilities = {} as Record<T, number>;
  for (const key of allowed) {
    const value = raw.probabilities[key];
    if (typeof value !== "number") {
      throw new Error(`${label}.probabilities.${key} is required`);
    }
    probabilities[key] = value;
  }
  return {
    choice: raw.choice as T,
    confidence: raw.confidence,
    probabilities,
  };
}

function needString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
