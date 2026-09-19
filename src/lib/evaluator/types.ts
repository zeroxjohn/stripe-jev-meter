import type {
  ConversationFacts,
  EvidenceSnapshot,
  RubricVersion,
  SemanticVerdict,
} from "@/lib/domain";

export class EvaluatorUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluatorUnavailable";
  }
}

export interface SemanticEvaluator {
  evaluate(input: {
    snapshot: EvidenceSnapshot;
    facts: ConversationFacts;
    rubricVersion: RubricVersion;
    scenarioId?: string;
    transcript?: Array<{ role: "customer" | "agent"; text: string }>;
  }): Promise<SemanticVerdict>;
}
