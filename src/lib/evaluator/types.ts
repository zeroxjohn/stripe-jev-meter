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
  }): Promise<SemanticVerdict>;
}
