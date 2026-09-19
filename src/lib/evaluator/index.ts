import { LiveJevEvaluator } from "./live-jev";
import { RecordedFakeEvaluator } from "./recorded-fake";
import { EvaluatorUnavailable, type SemanticEvaluator } from "./types";

export { EvaluatorUnavailable, RecordedFakeEvaluator, LiveJevEvaluator };
export type { SemanticEvaluator };

export function createEvaluator(): SemanticEvaluator {
  const typesafe = process.env.TYPESAFE_API_KEY;
  if (typesafe) return new LiveJevEvaluator(typesafe, "typesafe");
  const openrouter = process.env.OPENROUTER_API_KEY;
  if (openrouter) return new LiveJevEvaluator(openrouter, "openrouter");
  return new RecordedFakeEvaluator();
}
