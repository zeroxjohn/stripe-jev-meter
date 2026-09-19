import { asEvaluationId, nowTimestamp } from "@/lib/domain";
import { parseProviderAnswers } from "./parse-verdict";
import { EvaluatorUnavailable, type SemanticEvaluator } from "./types";

const TIMEOUT_MS = 8_000;
const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone";
const OPENROUTER_URL = "https://openrouter.ai/api/alpha/decisions";

const QUESTIONS = {
  issue_addressed: {
    type: "noul",
    instructions:
      "Did the agent address the customer's request in this conversation?",
    criteria: {
      true: "The agent answered the request with usable information or completed the needed action.",
      false:
        "The request is unanswered, refused without a path, or the customer left before a real answer.",
    },
  },
  outcome: {
    type: "choice",
    instructions: "What is the outcome of this support conversation?",
    criteria: {
      resolved: "The customer's request is fully handled.",
      partially_resolved: "Some help was given but the request is incomplete.",
      unresolved: "The request was not handled.",
      not_an_answer: "The agent reply is not a real answer to the request.",
    },
  },
  human_role: {
    type: "choice",
    instructions: "What role did a human agent play?",
    criteria: {
      absent: "No human agent contributed.",
      added_detail: "A human added detail without correcting the AI.",
      corrected_agent: "A human corrected the AI answer.",
    },
  },
} as const;

export type JevTransport = "typesafe" | "openrouter";

export class LiveJevEvaluator implements SemanticEvaluator {
  constructor(
    private readonly apiKey: string,
    private readonly transport: JevTransport = "openrouter",
  ) {}

  async evaluate(input: Parameters<SemanticEvaluator["evaluate"]>[0]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const body = {
      model:
        this.transport === "openrouter" ? "typesafe/jev-1.13" : "jev-1.13.0",
      state: {
        transcript: input.transcript ?? [],
        facts: {
          explicitConfirmation: input.facts.explicitConfirmation,
          humanReplied: input.facts.humanReplied,
          customerRequestedHuman: input.facts.customerRequestedHuman,
          actionReceipts: input.facts.actionReceipts,
        },
        snapshotId: input.snapshot.snapshotId,
        policy_excerpt: "Refunds require a succeeded refund receipt.",
      },
      questions: QUESTIONS,
    };

    try {
      const response = await fetch(
        this.transport === "openrouter" ? OPENROUTER_URL : TYPESAFE_URL,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            "content-type": "application/json",
            ...(this.transport === "openrouter"
              ? {
                  "HTTP-Referer": "https://localhost:3000",
                  "X-OpenRouter-Title": "stripe-jev-meter",
                }
              : {}),
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new EvaluatorUnavailable(`Jev HTTP ${response.status}`);
      }
      const raw = await response.json();
      return parseProviderAnswers({
        raw,
        conversationId: input.facts.conversationId,
        snapshotId: input.snapshot.snapshotId,
        rubricVersion: input.rubricVersion,
        evaluationId:
          typeof raw === "object" &&
          raw !== null &&
          "id" in raw &&
          typeof raw.id === "string"
            ? asEvaluationId(raw.id)
            : asEvaluationId(`eval_${input.snapshot.snapshotId}`),
        evaluatedAt: nowTimestamp(),
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
