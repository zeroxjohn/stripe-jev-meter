import { LiveJevEvaluator } from "./live-jev";
import { RecordedFakeEvaluator } from "./recorded-fake";
import { EvaluatorUnavailable, type SemanticEvaluator } from "./types";

export { EvaluatorUnavailable, RecordedFakeEvaluator, LiveJevEvaluator };
export type { SemanticEvaluator };

export function createEvaluator(): SemanticEvaluator {
  const key = process.env.TYPESAFE_API_KEY;
  if (key) return new LiveJevEvaluator(key);
  return new RecordedFakeEvaluator();
}
