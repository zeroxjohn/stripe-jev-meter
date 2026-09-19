"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const SLIDE_COUNT = 4;
const SWIPE_THRESHOLD_PX = 48;
const SWIPE_VELOCITY = 0.35;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const ENTER = { duration: 0.22, ease: EASE_OUT };
const CARD_MOVE = { duration: 0.18, ease: EASE_IN_OUT };

type ProjectPitchModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProjectPitchModal({ open, onClose }: ProjectPitchModalProps) {
  return (
    <AnimatePresence>
      {open ? <PitchDialog key="project-pitch" onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function PitchDialog({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [navSource, setNavSource] = useState<"gesture" | "keyboard">("gesture");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeRef = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastT: number;
    axis: "x" | "y" | null;
  }>({
    id: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    axis: null,
  });

  const goTo = useCallback(
    (next: number, source: "gesture" | "keyboard" = "gesture") => {
      const bounded = Math.min(SLIDE_COUNT - 1, Math.max(0, next));
      setSlide((current) => {
        if (bounded === current) return current;
        setDirection(bounded > current ? 1 : -1);
        setNavSource(source);
        return bounded;
      });
    },
    [],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(slide + 1, "keyboard");
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(slide - 1, "keyboard");
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, goTo, slide]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const state = swipeRef.current;
    state.id = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.lastX = event.clientX;
    state.lastT = event.timeStamp;
    state.axis = null;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = swipeRef.current;
    if (state.id !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    state.lastX = event.clientX;
    state.lastT = event.timeStamp;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const state = swipeRef.current;
    if (state.id !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const elapsed = Math.max(1, event.timeStamp - (state.lastT || event.timeStamp));
    const velocity = Math.abs(event.clientX - state.lastX) / elapsed;
    const committed =
      state.axis === "x" &&
      (Math.abs(dx) >= SWIPE_THRESHOLD_PX || velocity > SWIPE_VELOCITY);
    if (committed) {
      goTo(dx < 0 ? slide + 1 : slide - 1, "gesture");
    }
    state.id = null;
    state.axis = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const skipTravel = Boolean(reduceMotion) || navSource === "keyboard";

  return (
    <motion.div
      className="pitch-backdrop fixed inset-0 z-[200] grid overflow-y-auto p-3 sm:p-6"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : ENTER}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-pitch-title"
        className="pitch-modal relative m-auto flex w-full max-w-[760px] flex-col overflow-hidden rounded-[28px]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={
          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 10 }
        }
        transition={reduceMotion ? { duration: 0 } : ENTER}
      >
        <div className="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ink-tertiary)]">
            <span className="size-2 rounded-full bg-[var(--accent)]" />
            Why this project exists
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close project introduction"
            className="pressable grid size-11 place-items-center rounded-full bg-[var(--fill)] text-[var(--ink-secondary)]"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div
          className="pitch-stage relative min-h-[430px] flex-1 touch-pan-y px-5 pb-3 pt-5 sm:min-h-[420px] sm:px-8 sm:pt-7"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide}
              custom={direction}
              variants={{
                enter: (travel: number) => ({
                  opacity: 0,
                  x: skipTravel ? 0 : travel * 18,
                }),
                center: { opacity: 1, x: 0 },
                exit: (travel: number) => ({
                  opacity: 0,
                  x: skipTravel ? 0 : travel * -18,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : skipTravel
                    ? { duration: 0.12, ease: EASE_OUT }
                    : CARD_MOVE
              }
              className="h-full"
            >
              <PitchSlide index={slide} onClose={onClose} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-6">
          <button
            type="button"
            aria-label="Previous card"
            disabled={slide === 0}
            className="pressable grid size-11 place-items-center rounded-full bg-[var(--fill)] text-[var(--ink)] disabled:opacity-30"
            onClick={() => goTo(slide - 1, "gesture")}
          >
            <ArrowIcon direction="left" />
          </button>

          <div
            className="flex flex-1 items-center justify-center"
            aria-label="Pitch progress"
          >
            {Array.from({ length: SLIDE_COUNT }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show card ${index + 1}`}
                aria-current={index === slide ? "step" : undefined}
                className="grid size-11 place-items-center"
                onClick={() => goTo(index, "gesture")}
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-150 ${
                    index === slide
                      ? "w-6 bg-[var(--ink)]"
                      : "w-1.5 bg-[var(--fill-strong)]"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label={
              slide === SLIDE_COUNT - 1 ? "Close introduction" : "Next card"
            }
            className="pressable grid size-11 place-items-center rounded-full bg-[var(--ink)] text-white"
            onClick={() =>
              slide === SLIDE_COUNT - 1
                ? onClose()
                : goTo(slide + 1, "gesture")
            }
          >
            {slide === SLIDE_COUNT - 1 ? (
              <CheckIcon />
            ) : (
              <ArrowIcon direction="right" />
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PitchSlide({
  index,
  onClose,
}: {
  index: number;
  onClose: () => void;
}) {
  if (index === 0) {
    return (
      <article>
        <h2
          id="project-pitch-title"
          className="mt-4 max-w-[650px] text-[clamp(2.25rem,7vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--ink)]"
        >
          AI support does not end cleanly.
        </h2>
        <p className="mt-6 max-w-[620px] text-[17px] leading-[1.5] text-[var(--ink-secondary)] sm:text-[19px]">
          The same closed chat can mean the bot helped, the customer gave up,
          only part of it got handled, or a human quietly fixed a bad answer.
          The log often cannot tell those apart.
        </p>
      </article>
    );
  }

  if (index === 1) {
    return (
      <article>
        <h2
          id="project-pitch-title"
          className="mt-4 max-w-[650px] text-[clamp(2.1rem,6vw,3.7rem)] font-semibold leading-[1] tracking-[-0.05em] text-[var(--ink)]"
        >
          Industry billing has no place for that.
        </h2>
        <p className="mt-5 max-w-[620px] text-[17px] leading-[1.5] text-[var(--ink-secondary)]">
          The product still sends Stripe a resolution event. Stripe Billing or
          Metronome invoices what it receives. They do not open the chat.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <SourceLink href="https://stripe.com/customers/fin-ai" compact>
            Fin
          </SourceLink>
          <SourceLink
            href="https://stripe.com/customers/intercom-pricing"
            compact
          >
            Intercom
          </SourceLink>
          <SourceLink
            href="https://stripe.com/newsroom/news/stripe-completes-metronome-acquisition"
            compact
          >
            Metronome
          </SourceLink>
          <SourceLink href="https://stripe.com/customers/retell-ai" compact>
            Retell AI
          </SourceLink>
        </div>
      </article>
    );
  }

  if (index === 2) {
    return (
      <article>
        <h2
          id="project-pitch-title"
          className="mt-4 max-w-[650px] text-[clamp(2.1rem,6vw,3.7rem)] font-semibold leading-[1] tracking-[-0.05em] text-[var(--ink)]"
        >
          We decide the charge from that mess.
        </h2>
        <p className="mt-5 max-w-[620px] text-[17px] leading-[1.5] text-[var(--ink-secondary)]">
          We read the chat, decide whether the answer actually helped, and
          only then tell Stripe what to bill. The rest is held or sent to
          review.
        </p>
        <div className="mt-8 grid gap-2 sm:grid-cols-4">
          <FlowNode
            step="1"
            name="ConversationFacts"
            detail="What the logs can prove"
          />
          <FlowNode
            step="2"
            name="SemanticVerdict"
            detail="Did the answer solve the issue?"
          />
          <FlowNode
            step="3"
            name="BillingDecision"
            detail="Bill, withhold, or review"
          />
          <FlowNode
            step="4"
            name="UsageEvent"
            detail="What Stripe can bill"
          />
        </div>
        <div className="mt-5 rounded-[14px] bg-[var(--fill)] px-4 py-3 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
          Jev does not set the price or send the event. If a charge is wrong,
          we add a reversal.
        </div>
      </article>
    );
  }

  return (
    <article>
      <h2
        id="project-pitch-title"
        className="mt-4 max-w-[650px] text-[clamp(2.1rem,6vw,3.7rem)] font-semibold leading-[1] tracking-[-0.05em] text-[var(--ink)]"
      >
        The check has to pay for itself.
      </h2>
      <p className="mt-5 max-w-[620px] text-[17px] leading-[1.5] text-[var(--ink-secondary)]">
        Jev answers a few fixed questions instead of running a general-purpose
        LLM review. We measure whether it cuts false billing and saves more
        than it costs. If the numbers do not work, we stop.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="pressable min-h-11 rounded-full bg-[var(--accent)] px-5 text-[14px] font-semibold text-white"
          onClick={onClose}
        >
          Try the demo
        </button>
        <SourceLink href="https://docs.typesafe.ai/introduction" compact>
          Read the Jev introduction
        </SourceLink>
      </div>
    </article>
  );
}

function FlowNode({
  step,
  name,
  detail,
}: {
  step: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="relative rounded-[14px] bg-[var(--fill)] px-3.5 py-4">
      <p className="tabular text-[11px] font-semibold text-[var(--ink-tertiary)]">
        {step}
      </p>
      <p className="mt-4 text-[15px] font-semibold text-[var(--ink)]">{name}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-tertiary)]">
        {detail}
      </p>
    </div>
  );
}

function SourceLink({
  href,
  children,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${compact ? "" : "mt-4"} inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)] underline decoration-[rgba(0,122,255,0.3)] underline-offset-4`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <path d="m12.5 4.5-5.5 5.5 5.5 5.5" />
      ) : (
        <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}
