"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  EvaluateResponse,
  ScenarioId,
  ScenarioScript,
  TerminalAction,
} from "./poc-types";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 };

const SCENARIOS: ScenarioScript[] = [
  {
    id: "abandon-weak",
    title: "Weak answer, then silence",
    blurb: "They bill assumed $0.99. We withhold.",
    seed: {
      role: "customer",
      text: "Where is order 1842 and can I still change the delivery address?",
    },
    agentReply:
      "Thanks for reaching out! I am looking into this and should have more information soon.",
    followUp: "I do not have additional details on that yet.",
    terminals: ["left"],
  },
  {
    id: "partial-answer",
    title: "One of two questions",
    blurb: "They bill assumed $0.99. We bill $0.40.",
    seed: {
      role: "customer",
      text: "I need the tracking number for order 1842 and a refund on the damaged mug.",
    },
    agentReply:
      "Tracking for 1842 is 1Z999AA10123456784. I do not have a refund decision for the mug yet.",
    followUp: "Still waiting on the refund team for the mug.",
    terminals: ["left"],
  },
  {
    id: "silent-correction",
    title: "Wrong answer, silent fix",
    blurb: "They bill assumed $0.99. We withhold.",
    seed: {
      role: "customer",
      text: "My login is locked after the password reset email bounced.",
    },
    agentReply:
      "Just use the Forgot password link on the login page and you will be back in.",
    followUp: "The reset link is the only path I have for this.",
    terminals: ["self_fixed", "left"],
  },
  {
    id: "confirmed-resolution",
    title: "Confirmed resolution",
    blurb: "Both bill $0.99.",
    seed: {
      role: "customer",
      text: "When does order 1842 arrive?",
    },
    agentReply:
      "Order 1842 ships tomorrow via UPS. Tracking will email tonight and the window is Tuesday to Wednesday.",
    followUp: "Happy to help with anything else on that shipment.",
    terminals: ["confirmed"],
  },
  {
    id: "failed-refund",
    title: "Failed refund, upbeat text",
    blurb: "They would bill. Action receipts withhold.",
    seed: {
      role: "customer",
      text: "Please refund the $48 mug from order 1842. It arrived cracked.",
    },
    agentReply: "Done. I processed a $48 refund to your original payment method.",
    followUp: "The refund is complete on our side.",
    terminals: ["left"],
  },
];

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

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function ledgerLine(entry: Record<string, unknown>) {
  if (entry.kind === "charged") {
    return `charged ${String(entry.billingEventId ?? "").slice(0, 12)}`;
  }
  if (entry.kind === "reversed") {
    return `reversed ${String(entry.reverses ?? "").slice(0, 12)} (${String(entry.reason ?? "")})`;
  }
  return String(entry.kind ?? "entry");
}

function quoteFor(decision: EvaluateResponse["baseline"] | undefined) {
  if (!decision) return 0;
  if (decision.kind !== "bill") return 0;
  return decision.grade === "partial" ? 0.4 : 0.99;
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
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scenario = useMemo(
    () => SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [scenarioId, conversationId]);

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
    return nextMessages.length <= 1 ? scenario.agentReply : scenario.followUp;
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
        { role: "agent", text: scenario.agentReply },
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

  const baselineQuote = result
    ? (result.baselineQuoteUsd ?? quoteFor(result.baseline))
    : 0;
  const oursQuote = result ? result.quoteUsd : 0;
  const disagreement = result ? baselineQuote - oursQuote : 0;
  const terminals = result
    ? [...scenario.terminals, "reopen" as const]
    : scenario.terminals;

  return (
    <div className="flex min-h-dvh flex-col px-[var(--safe-pad)] py-[var(--safe-pad)] md:px-5 md:py-5">
      <header className="glass mx-auto mb-3 flex w-full max-w-[1400px] items-center justify-between rounded-2xl px-4 py-3 shadow-[var(--shadow-pane)]">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ink-tertiary)] uppercase">
            Acme Support AI
          </p>
          <h1
            className="text-[1.35rem] font-semibold text-[var(--ink)]"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            Semantic meter
          </h1>
        </div>
        <p className="max-w-sm text-right text-[13px] leading-snug text-[var(--ink-secondary)]">
          Full resolution $0.99. Partial $0.40. Jev grades. Policy decides.
          Stripe only sees approved events.
        </p>
      </header>

      <nav
        className="mx-auto mb-3 flex w-full max-w-[1400px] gap-2 overflow-x-auto pb-1"
        aria-label="Demo scenarios"
      >
        {SCENARIOS.map((item) => {
          const active = item.id === scenarioId;
          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={() => undefined}
              onClick={() => resetTo(item.id)}
              className={`pressable glass shrink-0 rounded-full px-3.5 py-2 text-left text-[13px] ${
                active
                  ? "text-[var(--ink)] shadow-[var(--shadow-pane)]"
                  : "text-[var(--ink-secondary)]"
              }`}
              style={{
                background: active ? "var(--glass-heavy)" : undefined,
                fontWeight: active ? 600 : 500,
              }}
            >
              <span className="block">{item.title}</span>
              <span className="block text-[11px] text-[var(--ink-tertiary)]">
                {item.blurb}
              </span>
            </button>
          );
        })}
      </nav>

      <main className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className="glass flex min-h-[28rem] flex-col overflow-hidden rounded-[28px] shadow-[var(--shadow-pane)]">
          <div className="glass sticky top-0 z-10 flex items-center justify-between px-5 py-3.5">
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
              className="pressable rounded-full bg-[var(--fill)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-secondary)]"
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
                <p className="text-[15px] leading-relaxed text-[var(--ink-secondary)]">
                  {scenario.seed.text}
                </p>
                <button
                  type="button"
                  className="pressable mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white"
                  onClick={startSeed}
                >
                  Send this question
                </button>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "customer" ? "justify-end" : "justify-start"
                  }`}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING}
                    className={`max-w-[85%] rounded-[22px] px-4 py-2.5 text-[15px] leading-snug ${
                      message.role === "customer"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--fill)] text-[var(--ink)]"
                    }`}
                  >
                    {message.text}
                  </motion.div>
                </div>
              ))
            )}
          </div>

          <form
            className="border-t border-[var(--separator)] px-4 py-3"
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
                className="min-h-11 flex-1 resize-none rounded-2xl bg-[var(--fill)] px-3.5 py-2.5 text-[15px] outline-none"
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="pressable rounded-full bg-[var(--accent)] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {terminals.map((action) => (
                <button
                  key={action}
                  type="button"
                  title={TERMINAL_COPY[action].hint}
                  disabled={busy}
                  onClick={() => void evaluate(action)}
                  className="pressable rounded-full bg-[var(--fill-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink)] disabled:opacity-40"
                >
                  {TERMINAL_COPY[action].label}
                </button>
              ))}
            </div>
          </form>
        </section>

        <section className="glass-heavy flex min-h-[28rem] flex-col overflow-hidden rounded-[28px] shadow-[var(--shadow-pane)]">
          <div className="px-5 py-3.5">
            <h2
              className="text-[17px] font-semibold"
              style={{ letterSpacing: "-0.015em" }}
            >
              Evaluation
            </h2>
            <p className="text-[12px] text-[var(--ink-tertiary)]">
              Updates after a terminal state, not on every keystroke.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.p
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[15px] leading-relaxed text-[var(--ink-secondary)]"
                >
                  Play a scenario, then leave silent, confirm, or mark a silent
                  fix. The assumed-resolution baseline and the semantic decision
                  land here together.
                </motion.p>
              ) : (
                <motion.div
                  key={result.evidence.snapshotId}
                  initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.98, filter: "blur(8px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={SPRING}
                  className="flex flex-col gap-4"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <DecisionCard
                      eyebrow="Assumed resolution"
                      decision={result.baseline}
                      amount={baselineQuote}
                    />
                    <DecisionCard
                      eyebrow="Semantic policy"
                      decision={result.decision}
                      amount={oursQuote}
                      emphasize
                    />
                  </div>

                  <div className="rounded-2xl bg-[var(--fill)] px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.05em] text-[var(--ink-tertiary)] uppercase">
                      Disagreement
                    </p>
                    <p
                      className="text-[28px] font-semibold"
                      style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}
                    >
                      {money(disagreement)}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
                      {disagreement > 0
                        ? "Fin-style rules would over-bill this silent exit."
                        : disagreement < 0
                          ? "Semantic path billed more than the baseline. Inspect the grade."
                          : "Both paths agree on the charge."}
                    </p>
                  </div>

                  <FactBlock
                    title="Conversation facts"
                    rows={[
                      ["Agent answered", yesNo(result.facts.agentAnswered)],
                      [
                        "Explicit confirmation",
                        yesNo(result.facts.explicitConfirmation),
                      ],
                      ["Human replied", yesNo(result.facts.humanReplied)],
                      [
                        "Asked for a human",
                        yesNo(result.facts.customerRequestedHuman),
                      ],
                      [
                        "Action receipts",
                        result.facts.actionReceipts.length
                          ? result.facts.actionReceipts
                              .map((receipt) => `${receipt.action}:${receipt.status}`)
                              .join(", ")
                          : "none",
                      ],
                    ]}
                  />

                  <FactBlock
                    title="Evidence snapshot"
                    rows={[
                      ["Hash", result.evidence.contentHash.slice(0, 16)],
                      ["Transcript", result.evidence.redactedTranscriptRef],
                      ["Captured", result.evidence.capturedAt],
                    ]}
                  />

                  <FactBlock
                    title="Semantic verdict"
                    rows={
                      result.evaluation
                        ? [
                            ["Model", result.evaluation.model],
                            ["Rubric", result.evaluation.rubricVersion],
                            ["Outcome", result.evaluation.outcome.choice],
                            [
                              "Outcome confidence",
                              result.evaluation.outcome.confidence.toFixed(2),
                            ],
                            [
                              "Issue addressed (noul)",
                              result.evaluation.issueAddressed.noul.toFixed(2),
                            ],
                            ["Human role", result.evaluation.humanRole.choice],
                          ]
                        : [["Verdict", "none. Evaluator did not invent one."]]
                    }
                  />

                  <FactBlock
                    title="Policy"
                    rows={[
                      ["Version", result.decision.policyVersion],
                      ["Reason codes", result.decision.reasonCodes.join(", ") || "none"],
                      [
                        "Stripe",
                        result.receipts[0]
                          ? `${result.receipts[0].provider} ${result.receipts[0].status}`
                          : "no usage event",
                      ],
                    ]}
                  />

                  {result.ledger.length > 0 ? (
                    <FactBlock
                      title="Ledger"
                      rows={result.ledger.map((entry, index) => [
                        `Row ${index + 1}`,
                        ledgerLine(entry),
                      ])}
                    />
                  ) : null}
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
  );
}

function DecisionCard({
  eyebrow,
  decision,
  amount,
  emphasize = false,
}: {
  eyebrow: string;
  decision: EvaluateResponse["baseline"];
  amount: number;
  emphasize?: boolean;
}) {
  const tone = decisionTone(decision.kind);
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: emphasize ? "var(--fill-strong)" : "var(--fill)",
      }}
    >
      <p className="text-[11px] font-semibold tracking-[0.05em] text-[var(--ink-tertiary)] uppercase">
        {eyebrow}
      </p>
      <p
        className="mt-1 text-[13px] font-semibold"
        style={{ color: tone }}
      >
        {decisionLabel(decision.kind, decision.grade)}
      </p>
      <p
        className="text-[26px] font-semibold"
        style={{ letterSpacing: "-0.03em", lineHeight: 1.1, color: tone }}
      >
        {money(amount)}
      </p>
      {decision.reason ? (
        <p className="mt-1 text-[12px] text-[var(--ink-tertiary)]">
          {decision.reason.replaceAll("_", " ")}
        </p>
      ) : null}
    </div>
  );
}

function FactBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">
        {title}
      </h3>
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
    </div>
  );
}
