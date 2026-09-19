import { asRubricVersion, nowTimestamp } from "@/lib/domain";
import { parseSemanticVerdict } from "./parse-verdict";
import { EvaluatorUnavailable, type SemanticEvaluator } from "./types";

const TIMEOUT_MS = 2_000;

export class LiveJevEvaluator implements SemanticEvaluator {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = process.env.TYPESAFE_API_URL ??
      "https://api.typesafe.ai",
  ) {}

  async evaluate(input: Parameters<SemanticEvaluator["evaluate"]>[0]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/v1/evaluate`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "jev-1.13.0",
          rubricVersion: input.rubricVersion,
          state: {
            transcript: [],
            facts: {
              explicitConfirmation: input.facts.explicitConfirmation,
              humanReplied: input.facts.humanReplied,
              customerRequestedHuman: input.facts.customerRequestedHuman,
              actionReceipts: input.facts.actionReceipts,
            },
            snapshotId: input.snapshot.snapshotId,
            policy_excerpt: "Refunds require a succeeded refund receipt.",
          },
          questions: [
            { key: "issue_addressed", type: "noul" },
            {
              key: "outcome",
              type: "choice",
              choices: [
                "resolved",
                "partially_resolved",
                "unresolved",
                "not_an_answer",
              ],
            },
            {
              key: "human_role",
              type: "choice",
              choices: ["absent", "added_detail", "corrected_agent"],
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new EvaluatorUnavailable(`Jev HTTP ${response.status}`);
      }
      const raw = await response.json();
      return parseSemanticVerdict({
        ...raw,
        conversationId: input.facts.conversationId,
        snapshotId: input.snapshot.snapshotId,
        rubricVersion: raw.rubricVersion ?? asRubricVersion(input.rubricVersion),
        evaluatedAt: raw.evaluatedAt ?? nowTimestamp(),
      });
    } catch (error) {
      if (error instanceof EvaluatorUnavailable) throw error;
      throw new EvaluatorUnavailable(
        error instanceof Error ? error.message : "Jev unavailable",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
