"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LIVE_SCENARIOS } from "@/lib/scenarios/live";
import { ProjectPitchModal } from "./project-pitch-modal";
import type {
  ChatMessage,
  EvaluateResponse,
  ScenarioId,
  TerminalAction,
} from "./poc-types";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 };

const OUTCOME_KEYS = [
  "resolved",
  "partially_resolved",
  "unresolved",
  "not_an_answer",
] as const;

const HUMAN_KEYS = ["absent", "added_detail", "corrected_agent"] as const;

const TERMINAL_COPY: Record<
  TerminalAction,
  { label: string; hint: string }
> = {
  left: {
    label: "Leave silent",
    hint: "Customer closes the chat after the last AI answer.",
  },
  confirmed: {
    label: "That worked",
    hint: "Customer confirms the issue is resolved.",
  },
  self_fixed: {
    label: "I already fixed it",
    hint: "Customer corrects the wrong answer offline, no reopen.",
  },
  requested_human: {
    label: "Ask a human",
    hint: "Customer requests a person before resolution.",
  },
  reopen: {
    label: "Reopen later",
    hint: "Customer comes back after an assumed charge.",
  },
};

function newConversationId(scenarioId: ScenarioId) {
  return `conv_${scenarioId}_${Math.random().toString(36).slice(2, 10)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function decisionTone(kind: string) {
  if (kind === "bill") return "var(--bill)";
  if (kind === "review") return "var(--review)";
  return "var(--withhold)";
}

function decisionLabel(kind: string, grade?: string) {
  if (kind === "bill" && grade === "partial") return "Bill partial";
  if (kind === "bill") return "Bill full";
  if (kind === "review") return "Review";
  return "Withhold";
}

function quoteFor(decision: EvaluateResponse["baseline"] | undefined) {
  if (!decision) return 0;
  if (decision.kind !== "bill") return 0;
  return decision.grade === "partial" ? 0.4 : 0.99;
}

function jevModelLabel(model?: string) {
  if (!model) return "No verdict";
  if (model.includes("recorded")) return "Recorded Jev";
  return model;
}

export function PocDemo() {
  const reduceMotion = useReducedMotion();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("abandon-weak");
  const [conversationId, setConversationId] = useState(() =>
    newConversationId("abandon-weak"),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pitchOpen, setPitchOpen] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pitchTriggerRef = useRef<HTMLButtonElement>(null);

  const scenario = useMemo(
    () => LIVE_SCENARIOS.find((item) => item.id === scenarioId) ?? LIVE_SCENARIOS[0],
    [scenarioId],
  );

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, reduceMotion]);

  function resetTo(next: ScenarioId) {
    setScenarioId(next);
    setConversationId(newConversationId(next));
    setMessages([]);
    setDraft("");
    setResult(null);
    setError(null);
    setBusy(false);
  }

  async function requestAgentReply(nextMessages: ChatMessage[]) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, messages: nextMessages }),
      });
      if (!response.ok) throw new Error("chat unavailable");
      const payload = (await response.json()) as { text?: string };
      if (payload.text) return payload.text;
    } catch {
      // Scripted fallback keeps the demo walkable if the route is not ready.
    }
    return nextMessages.length <= 1 ? scenario.firstReply : scenario.followUp;
  }

  async function sendCustomer(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    const withCustomer: ChatMessage[] = [
      ...messages,
      { role: "customer", text: trimmed },
    ];
    setMessages(withCustomer);
    setDraft("");
    const reply = await requestAgentReply(withCustomer);
    setMessages([...withCustomer, { role: "agent", text: reply }]);
    setBusy(false);
    inputRef.current?.focus();
  }

  async function startSeed() {
    if (messages.length > 0 || busy) return;
    await sendCustomer(scenario.seed.text);
  }

  async function evaluate(terminal: TerminalAction) {
    if (busy) return;
    let thread = messages;
    if (thread.length === 0) {
      const seeded: ChatMessage[] = [
        scenario.seed,
        { role: "agent", text: scenario.firstReply },
      ];
      setMessages(seeded);
      thread = seeded;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId,
          scenarioId,
          messages: thread,
          terminal,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Evaluate failed (${response.status})`);
      }
      const payload = (await response.json()) as EvaluateResponse;
      setResult(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evaluate failed");
    } finally {
      setBusy(false);
    }
  }

  const billedDecision = result?.reversed
    ? {
        kind: "withhold" as const,
        reason: result.reversed.reason,
        reasonCodes: ["ledger:customer_reopen"],
        policyVersion: result.decision.policyVersion,
      }
    : result?.decision;
  const baselineQuote = result
    ? (result.baselineQuoteUsd ?? quoteFor(result.baseline))
    : 0;
  const oursQuote = result?.reversed ? 0 : result ? result.quoteUsd : 0;
  const disagreement = result ? baselineQuote - oursQuote : 0;
  const terminals = result
    ? [...scenario.terminals, "reopen" as const]
    : scenario.terminals;

  return (
    <>
      <div
        className="flex min-h-dvh flex-col px-[var(--safe-pad)] py-[var(--safe-pad)] md:px-5 md:py-5"
        inert={pitchOpen ? true : undefined}
        aria-hidden={pitchOpen ? true : undefined}
      >
        <h1 className="sr-only">Semantic meter proof of concept</h1>
        <nav
          className="mx-auto mb-3 flex w-full max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-1"
          aria-label="Demo scenarios"
        >
          {LIVE_SCENARIOS.map((item, index) => {
            const active = item.id === scenarioId;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "true" : undefined}
                onPointerDown={() => undefined}
                onClick={() => resetTo(item.id)}
                className={`pressable min-h-11 text-[15px] font-medium ${
                  active
                    ? "text-[var(--ink)] underline decoration-[var(--accent)] decoration-2 underline-offset-4"
                    : "text-[var(--ink-tertiary)] decoration-transparent underline underline-offset-4"
                }`}
              >
                Scenario {index + 1}
              </button>
            );
          })}
          <button
            ref={pitchTriggerRef}
            type="button"
            className="pressable ml-auto min-h-11 rounded-full bg-[var(--fill)] px-4 text-[13px] font-semibold text-[var(--ink-secondary)]"
            onClick={() => setPitchOpen(true)}
          >
            Why this exists
          </button>
        </nav>

        <main className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className="glass flex min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-pane)] shadow-[var(--shadow-pane)]">
          <div className="pane-chrome sticky top-0 z-10 flex items-center justify-between px-5 py-3.5">
            <div>
              <h2
                className="text-[17px] font-semibold"
                style={{ letterSpacing: "-0.015em" }}
              >
                Customer chat
              </h2>
              <p className="text-[12px] text-[var(--ink-tertiary)]">
                You are the shopper. End the thread to evaluate.
              </p>
            </div>
            <button
              type="button"
              className="pressable min-h-11 rounded-full bg-[var(--fill)] px-3 text-[12px] font-semibold text-[var(--ink-secondary)]"
              onClick={() => resetTo(scenarioId)}
            >
              Reset
            </button>
          </div>

          <div
            ref={threadRef}
            className="scroll-edge flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
          >
            {messages.length === 0 ? (
              <div className="m-auto max-w-sm text-center">
                <p className="text-[22px] leading-snug font-medium tracking-[-0.02em] text-[var(--ink)]">
                  {scenario.imagine}
                </p>
                <p className="mt-4 mb-1 text-[12px] font-semibold text-[var(--ink-tertiary)]">
                  Your request
                </p>
                <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                  {scenario.seed.text}
                </p>
                <button
                  type="button"
                  className="pressable mt-4 min-h-11 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white"
                  onClick={startSeed}
                >
                  Send this question
                </button>
              </div>
            ) : (
              messages.map((message, index) => {
                const yours = message.role === "customer";
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${yours ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] flex-col gap-1 ${
                        yours ? "items-end" : "items-start"
                      }`}
                    >
                      <p className="px-1 text-[12px] font-semibold text-[var(--ink-tertiary)]">
                        {yours ? "Your request" : "AI support"}
                      </p>
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={SPRING}
                        className={`px-4 py-2.5 text-[15px] leading-snug ${
                          yours
                            ? "rounded-[var(--radius-bubble)] rounded-br-[var(--radius-bubble-tail)] bg-[var(--accent)] text-white"
                            : "rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble-tail)] bg-[var(--fill)] text-[var(--ink)]"
                        }`}
                      >
                        {message.text}
                      </motion.div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {messages.length > 0 ? (
            <div className="pane-chrome px-4 pb-2 pt-3">
              <p className="mb-2 text-center text-[13px] font-semibold text-[var(--ink)]">
                Choose an outcome
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {terminals.map((action) => {
                  const secondary = action === "reopen";
                  return (
                    <button
                      key={action}
                      type="button"
                      title={TERMINAL_COPY[action].hint}
                      disabled={busy}
                      onClick={() => void evaluate(action)}
                      className={`pressable min-h-11 rounded-full px-4 text-[13px] font-semibold disabled:opacity-40 ${
                        secondary
                          ? "bg-[var(--fill)] text-[var(--ink-secondary)]"
                          : "bg-[var(--accent)] text-white"
                      }`}
                    >
                      {TERMINAL_COPY[action].label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <form
            className="pane-chrome px-4 pb-3 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              void sendCustomer(draft);
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendCustomer(draft);
                  }
                }}
                placeholder="Reply as the customer"
                className="min-h-11 flex-1 resize-none rounded-[var(--radius-input)] bg-[var(--fill)] px-3.5 py-2.5 text-[16px] outline-none"
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="pressable min-h-11 rounded-full bg-[var(--fill-strong)] px-4 text-[13px] font-semibold text-[var(--ink)] disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>
        </section>

        <section className="glass-heavy flex min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-sheet)] shadow-[var(--shadow-pane)]">
          <div className="px-5 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ink-tertiary)] uppercase">
              Jev model
            </p>
            <h2
              className="text-[17px] font-semibold"
              style={{ letterSpacing: "-0.015em" }}
            >
              Jev evaluation
            </h2>
            <p className="text-[12px] text-[var(--ink-tertiary)]">
              {result
                ? `${jevModelLabel(result.evaluation?.model)} · ${result.evaluation?.rubricVersion ?? "no rubric"}`
                : "End the conversation to run Jev."}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <AnimatePresence mode="wait">
              {!result || !billedDecision ? (
                <motion.p
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="text-[15px] leading-relaxed text-[var(--ink-secondary)]"
                >
                  Choose an outcome. Jev grades the thread. Policy sets the
                  charge Stripe is allowed to see.
                </motion.p>
              ) : (
                <motion.div
                  key={result.facts.conversationId}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING}
                  className="flex flex-col gap-5"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--ink-secondary)]">
                      Amount to bill
                    </p>
                    <p
                      className="tabular text-[44px] font-semibold"
                      style={{
                        letterSpacing: "-0.03em",
                        lineHeight: 1.02,
                        color: decisionTone(billedDecision.kind),
                      }}
                    >
                      {money(oursQuote)}
                    </p>
                    <p
                      className="mt-1 text-[15px] font-semibold"
                      style={{ color: decisionTone(billedDecision.kind) }}
                    >
                      {decisionLabel(billedDecision.kind, billedDecision.grade)}
                    </p>
                    {billedDecision.reason ? (
                      <p className="mt-1 text-[13px] text-[var(--ink-tertiary)]">
                        {humanize(billedDecision.reason)}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <QuietStat
                      label="Would have billed"
                      value={money(baselineQuote)}
                      hint={decisionLabel(
                        result.baseline.kind,
                        result.baseline.grade,
                      )}
                    />
                    <QuietStat
                      label="Difference"
                      value={money(disagreement)}
                      hint={
                        disagreement > 0
                          ? "Saved versus that charge"
                          : disagreement < 0
                            ? "Semantic path billed more"
                            : "Both paths agree"
                      }
                    />
                  </div>

                  <JevRead evaluation={result.evaluation} />

                  <details className="text-[13px] text-[var(--ink-secondary)]">
                    <summary className="cursor-pointer font-semibold text-[var(--ink)]">
                      Facts and ledger
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      <FactBlock
                        rows={[
                          ["Agent answered", result.facts.agentAnswered ? "Yes" : "No"],
                          [
                            "Explicit confirmation",
                            result.facts.explicitConfirmation ? "Yes" : "No",
                          ],
                          ["Human replied", result.facts.humanReplied ? "Yes" : "No"],
                          [
                            "Asked for a human",
                            result.facts.customerRequestedHuman ? "Yes" : "No",
                          ],
                          [
                            "Action receipts",
                            result.facts.actionReceipts.length
                              ? result.facts.actionReceipts
                                  .map((receipt) => `${receipt.action}:${receipt.status}`)
                                  .join(", ")
                              : "none",
                          ],
                          [
                            "Policy",
                            result.decision.reasonCodes.join(", ") || "none",
                          ],
                          [
                            "Stripe",
                            result.receipts[0]
                              ? `${result.receipts[0].provider} ${result.receipts[0].status}`
                              : "no usage event",
                          ],
                        ]}
                      />
                    </div>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>
            {error ? (
              <p className="mt-4 text-[13px] font-medium text-[var(--withhold)]">
                {error}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      </div>

      <ProjectPitchModal
        open={pitchOpen}
        onClose={() => {
          setPitchOpen(false);
          window.setTimeout(() => pitchTriggerRef.current?.focus(), 0);
        }}
      />
    </>
  );
}

function QuietStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.05em] text-[var(--ink-tertiary)] uppercase">
        {label}
      </p>
      <p
        className="tabular text-[17px] font-semibold text-[var(--ink-secondary)]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--ink-tertiary)]">{hint}</p>
    </div>
  );
}

function JevRead({
  evaluation,
}: {
  evaluation: EvaluateResponse["evaluation"];
}) {
  if (!evaluation) {
    return (
      <div>
        <h3 className="mb-1 text-[13px] font-semibold text-[var(--ink)]">
          Jev
        </h3>
        <p className="text-[13px] text-[var(--ink-secondary)]">
          Jev did not return a verdict. Policy used conversation facts only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">
          Jev outcome
        </h3>
        <ProbabilityList
          keys={OUTCOME_KEYS}
          probabilities={evaluation.outcome.probabilities}
          chosen={evaluation.outcome.choice}
        />
        <p className="mt-2 text-[12px] text-[var(--ink-tertiary)]">
          Choice confidence {percent(evaluation.outcome.confidence)}
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-[var(--ink)]">
            Issue addressed
          </h3>
          <p className="tabular text-[13px] font-semibold text-[var(--ink-secondary)]">
            {evaluation.issueAddressed.noul.toFixed(2)}
          </p>
        </div>
        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              transform: `scaleX(${Math.min(1, Math.max(0, evaluation.issueAddressed.noul))})`,
            }}
          />
        </div>
        <p className="mt-1 text-[12px] text-[var(--ink-tertiary)]">
          Noul probability. No confidence field.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">
          Human role
        </h3>
        <ProbabilityList
          keys={HUMAN_KEYS}
          probabilities={evaluation.humanRole.probabilities ?? {}}
          chosen={evaluation.humanRole.choice}
        />
      </div>
    </div>
  );
}

function ProbabilityList({
  keys,
  probabilities,
  chosen,
}: {
  keys: readonly string[];
  probabilities: Record<string, number>;
  chosen: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {keys.map((key) => {
        const value = probabilities[key] ?? 0;
        const active = key === chosen;
        return (
          <li key={key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span
                className="text-[13px] capitalize"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-tertiary)",
                }}
              >
                {humanize(key)}
              </span>
              <span className="tabular text-[13px] text-[var(--ink-secondary)]">
                {percent(value)}
              </span>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{
                  transform: `scaleX(${Math.min(1, Math.max(0, value))})`,
                  background: active ? "var(--accent)" : "var(--fill-strong)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FactBlock({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,10rem)_1fr] gap-x-3 gap-y-1.5 text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-[var(--ink-tertiary)]">{label}</dt>
          <dd className="truncate text-[var(--ink-secondary)]" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
