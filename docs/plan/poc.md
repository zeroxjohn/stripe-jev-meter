# Proof of concept

- **Mode:** how-to
- **Owns:** The test-mode demonstration path and its acceptance checks
- **Update when:** Fixtures, baseline rules, demo surfaces, or PoC acceptance criteria change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Evaluation](evaluation.md), [Outcome grades](../reference/outcome-grades.md), [Stripe billing](../integration/stripe-billing.md)

## Goal

Show one thing:

> For conversations in the silent-exit-after-answer bucket, a semantic grade plus deterministic policy produces a different, auditable billing decision than the industry assumed-resolution default, and only approved decisions become Stripe test-mode meter events.

## Demo story

Acme Support AI charges buying businesses $0.99 per full resolution and $0.40 per partial resolution.

The live demo is one screen:

| Pane | Role |
| --- | --- |
| Left | Chat. Operator plays the end consumer and sends simple support queries; an AI agent replies in-session. |
| Right | Evaluation dashboard. Updates when the conversation reaches a terminal state (silence window elapsed, explicit confirm, escalate, or scenario end). |

The right pane shows the full adjudication chain, refreshed for that chat:

1. redacted `EvidenceSnapshot` / transcript summary
2. `ConversationFacts`
3. baseline assumed-resolution decision (what Fin-style rules would do)
4. `SemanticVerdict` from Jev or the recorded fake (choices, Noul probabilities, reason codes)
5. `BillingPolicy` version and the rule that fired
6. `BillingDecision`: bill, withhold, or review
7. rough money: contract meter × price (`$0.99` full, `$0.40` partial, or `$0.00` withhold) — never invented by Jev
8. Stripe test-mode `UsageEvent` / `Receipt` or withhold reason

The operator walks **3–4 live scenarios** where the baseline unfairly bills and the semantic path does not (plus one control that both bill). Fixture packs still back automated tests; the chat is the narrative surface.

## Live demo scenarios

These are the walkthroughs for the chat UI. Each starts from an empty or scripted thread and ends when the right pane settles.

| # | Scenario | What the chat looks like | Baseline (Fin-style) | Our path |
| --- | --- | --- | --- | --- |
| 1 | Abandonment after weak answer | Customer asks a concrete question; agent gives a vague or wrong reply; customer goes silent | Bill assumed full ($0.99) | Withhold — silence ≠ resolved |
| 2 | Partial answer | Customer asks two things; agent handles one; customer goes silent | Bill assumed full ($0.99) | Bill partial ($0.40) or withhold per contract |
| 3 | Silent self-correction | Agent gives a wrong answer; customer fixes it offline without saying so or reopening | Bill assumed full ($0.99) | Withhold or review — not an AI resolution |
| 4 | Control: confirmed resolution | Agent answers correctly; customer says thanks / confirms | Bill full ($0.99) | Bill full ($0.99) — proves we do not over-withhold |

Optional fifth for action honesty (can stay fixture-only if chat tooling is thin):

| Scenario | Baseline | Our path |
| --- | --- | --- |
| Failed refund with optimistic agent text | Bill assumed full | Withhold — `actionReceipts` failed wins over transcript claims |

## Fixture pack

Automated tests keep the fuller pack. Live demo scenarios above must appear here too.

| Fixture | Expected baseline | Expected semantic path |
| --- | --- | --- |
| Real confirmed resolution | Bill full | Bill full |
| Quiet real resolution | Bill assumed full | Bill full |
| Abandonment after weak answer | Bill assumed full | Withhold |
| Partial answer | Bill assumed full | Bill partial or withhold per contract |
| Wrong AI answer silently corrected by human | Bill assumed full | Withhold or review |
| Failed refund action with optimistic agent text | Bill assumed full | Withhold |
| Customer reopen after assumed charge | Reverse | Reverse |
| Adversarial instruction in transcript | Depends on facts | Withhold or review; never trust instruction to force a bill |

## Baseline classifier

Reproduce the documented industry rule:

1. If explicit confirmation and no failed required action, bill full.
2. Else if customer requested human, withhold.
3. Else if silence exceeds the window and agent answered, bill assumed full.
4. If later reopen, append reversal.

This baseline exists to measure disagreement, not as the product destination.

## Semantic path

1. Capture `EvidenceSnapshot`.
2. Evaluate with pinned rubric through Jev or recorded fake.
3. Apply `BillingPolicy`.
4. If review, group by reason pattern rather than forcing one human decision per 99¢ row.
5. Emit `UsageEvent` only for approved bill decisions.
6. Append `LedgerEntry` and store `Receipt`.

## Surfaces to build later

Design bar: consult [`.cursor/skills/apple-design/SKILL.md`](../../.cursor/skills/apple-design/SKILL.md) (and the Claude mirror) before any UI work. See [AGENTS.md](../../AGENTS.md).

Minimum demo UI — one composition, two panes:

- **Left:** interactive support chat for the live scenarios (scripted agent replies are enough for PoC)
- **Right:** live evaluation dashboard (facts → baseline → verdict → policy → decision → rough $ → Stripe test receipt or withhold)
- **Secondary:** small ledger strip or panel for emit / reverse history across the session

Trigger evaluation when the chat hits a terminal state, not on every keystroke. Show baseline and semantic side by side so the unfair bill is visible before the corrected decision.

No production helpdesk sync is required for the PoC.

## Acceptance checks

The PoC passes when all of the following are true:

1. Every fixture produces facts, baseline decision, semantic decision, and ledger outcome.
2. Re-running the same approved fixture does not create a second Stripe charge.
3. The abandonment and silent-correction fixtures are not auto-billed as full resolutions by the semantic path.
4. The failed-action fixture withholds even if the transcript claims success.
5. The reopen fixture appends a reversal linked to the original billing event id.
6. No fixture path lets Jev choose a dollar amount.
7. An operator can run live demo scenarios 1–4 in the chat UI and see the right-pane dashboard update after each terminal state, including rough contract dollars and baseline vs semantic disagreement.

## Out of scope for the PoC

- live production Stripe keys
- automatic sync from Intercom, Zendesk, or Gorgias
- training a custom model
- dynamic prices
- reviewing every low-confidence conversation individually as the default UX
