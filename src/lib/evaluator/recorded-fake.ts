import { buildRecordedVerdict } from "./recorded";
import type { SemanticEvaluator } from "./types";

export class RecordedFakeEvaluator implements SemanticEvaluator {
  async evaluate(input: Parameters<SemanticEvaluator["evaluate"]>[0]) {
    return buildRecordedVerdict({
      conversationId: input.facts.conversationId,
      snapshotId: input.snapshot.snapshotId,
      scenarioId: input.scenarioId ?? inferScenario(input.facts.conversationId),
    });
  }
}

export function inferScenario(conversationId: string): string {
  const match = /^conv_([a-z0-9-]+)_/.exec(conversationId);
  return match?.[1] ?? "abandon-weak";
}
