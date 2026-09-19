# Ambiguous outcomes

- **Mode:** explanation
- **Owns:** Why silence, abandonment, partial answers, and silent human corrections are not proof of a billable resolution
- **Update when:** The outcome taxonomy or the industry baseline rule changes
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Outcome grades](../reference/outcome-grades.md), [Case studies](../evidence/case-studies.md)

## The bucket that deterministic facts cannot finish

Support systems can observe many facts without reading meaning:

- The customer clicked "that helped."
- The customer asked for a human.
- A human agent replied.
- The customer returned to the same conversation later.
- An API action succeeded or failed.

Those facts are valuable. They are not enough for every closed conversation.

The hard bucket is a conversation that ends without explicit confirmation, without an explicit human request, and without a reopen inside the window. Deterministic logs cannot tell a real resolution apart from abandonment or a wrong answer that a human silently fixed.

That bucket is the ambiguity this project measures.

## Confirmed resolution

The customer explicitly says the answer helped, or selects an equivalent confirmation control.

This is the strongest positive signal. It still needs policy checks for fraud, abuse, or contradictory later messages, but it is not the main failure mode.

## Assumed resolution

Industry practice, documented for Intercom Fin and restated on Stripe's Fin case study, treats "no further help requested after the last AI answer" as a billable resolution.

That rule is operationally useful. It is also the place where success, polite exit, and frustrated abandonment look identical in the logs.

Intercom's own FAQ makes the billing consequence explicit: if a customer is frustrated with Fin's answer and just leaves, that is still an assumed resolution and is charged.

## What industry rules already navigate

Deterministic Fin-style rules already handle some ambiguity:

- explicit confirmation can count as resolved
- a clarifying question with no reply is abandoned and not billed
- an explicit ask for a human is not billed as a resolution
- a later customer reopen can deduct a prior assumed resolution

Those rules matter. They are not enough for the silent-exit-after-answer bucket.

## Abandonment

The customer stops responding after an incomplete or unhelpful answer. They may open email, leave the site, or ask elsewhere. Silence is not semantic proof of success.

A baseline that bills silence after an answer will treat many abandonments as revenue.

## Partial answer

The agent answered one part of a multi-part request and left the rest open. The conversation may go quiet because the customer is still stuck.

Partial answers should not collapse into full resolution by default.

## Silent human correction

A support employee sees a wrong AI answer and replies with the correct information before the customer requests a human. The customer never returns. The customer never clicks confirmation.

Documented Fin reversal rules watch the customer reopen. They do not automatically watch this human correction path. That is a concrete residual failure mode.

## Failed external action

The agent claims a refund, cancellation, or subscription change happened, but the action failed or never ran. The transcript can still look resolved if the customer leaves.

Deterministic action receipts must override optimistic language in the transcript.

## Reopen

If the customer returns seeking further help on the same issue, prior assumed success should reverse. That rule already exists in Fin's published outcomes documentation.

This project keeps reopen as a deterministic fact and ledger correction, not as a model guess.

## Why static pricing is not the target

Per-resolution prices can be fair and commercially successful. Fin showed that customers preferred paying for outcomes over paying for every attempt.

The problem this project attacks is not the dollar amount on a meter. The problem is that silence after an AI answer is not the same thing as resolution, while assumed-resolution billing still charges for that silence by default.

Semantic grades exist to separate that bucket into contract-defined actions: bill, bill partial, withhold, or review.
