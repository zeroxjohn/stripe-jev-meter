# Case studies

- **Mode:** explanation
- **Owns:** What each real-world example proves and does not prove for this project
- **Update when:** New primary evidence changes the reading of a vendor or Stripe case
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Claims:** [Claims ledger](claims.md)

This page explains the evidence. It does not redefine types or pricing contracts. Claim IDs point to [claims.md](claims.md).

## What the market already proved

Outcome-based AI support pricing is real and growing. Stripe already meters those outcomes when the application sends usage events. The open problem is not inventing a price unit. The open problem is deciding, with auditability, whether an ambiguous conversation deserved that unit.

## Intercom Fin and Stripe Billing

**Claims:** C005, C006, C007, C009, C010, C012, C013.

Stripe's Fin case study documents the complete chain this project cares about:

1. Online businesses use Fin for customer support.
2. Fin charges about $0.99 per resolution.
3. A resolution is charged when the customer confirms, **or** when they do not ask for more help after the last AI answer.
4. Intercom configures a meter in Stripe Billing.
5. Intercom sends successful-resolution events through the Stripe API.
6. Stripe aggregates those events into the customer's bill.
7. Fin processes more than one million resolutions per week.

Intercom's own outcomes help article shows that the industry already uses deterministic rules for ambiguity:

- A customer can confirm that Fin helped.
- Silence after an answer can become an assumed resolution and is billed.
- A clarifying question with no reply is abandoned and not billed.
- If the customer later returns seeking more help, Intercom deducts that resolution and does not charge it.
- Intercom's FAQ states that a frustrated customer who just leaves after Fin answers is still charged as an assumed resolution.

That means two claims are both true:

1. "Current billing ignores ambiguity entirely" is too strong.
2. "Silence means resolved" is also too strong as a semantic claim, even though Fin-style billing often treats silence after an answer as billable.

### What Fin still leaves open

**Claims:** C011, C012, C035, C036.

The silent-exit-after-answer bucket remains underspecified. Deterministic rules cannot tell success from abandonment there, and the default is to bill. Intercom community reports also describe humans stepping in to correct Fin answers before the customer clicks "Talk to Human." Those cases can still count as assumed resolutions and get billed, because the documented reversal watches the customer return, not the support team intervening.

Intercom leaders also told Stripe they expect AI verification of resolutions as a future pricing shift. That statement is the strongest public invitation for a project like this one.

**Proves:** Outcome events already flow into Stripe. Deterministic assumed-resolution rules exist and explicitly bill some silent exits. Customer-reopen reversal exists. Unilateral classification of ambiguous exits still creates dispute risk.

**Does not prove:** That every Fin charge is unfair, or that semantic grading will beat Fin's current rules on every corpus.

## Chatbase as a counterexample

**Claims:** C022, C023, C024.

Chatbase serves online businesses with AI agents, but its public pricing is subscription plans plus message credits, not per resolution. Its documented Stripe integration lets a business connect its own Stripe account so the Chatbase agent can answer that business's billing questions. That is the opposite direction from Chatbase billing the business through Stripe.

Whether Chatbase itself processes its subscription charges with Stripe remains `unknown`.

**Proves:** Not every AI support vendor uses outcome billing. Stripe can appear in a support product without being the invoice path for that product.

**Does not prove:** That Chatbase would never adopt outcome pricing, or that Chatbase is a Stripe Billing customer for its own plans.

## Zendesk, Gorgias, Decagon, and Sierra

**Claims:** C014 through C021.

These vendors publish or market resolution-oriented pricing:

- Zendesk publishes automated-resolution overage prices on its pricing page.
- Gorgias explains resolved-interaction pricing for ecommerce support.
- Decagon markets per-conversation or per-resolution options.
- Sierra is repeatedly described as per-resolution / outcome-oriented.

Their published pricing models are useful market evidence. Their payment processors are mostly `unknown` in this ledger. Do not claim they bill through Stripe unless a primary source appears.

**Proves:** Outcome units are spreading across the category.

**Does not prove:** A shared processor, shared definition of "resolved," or shared reversal policy.

## Adjacent Stripe usage cases

**Claims:** C025, C026, C027.

These are not support-resolution products, but they show how AI vendors already use Stripe Billing for machine-readable consumption:

- Retell AI meters call minutes and related dimensions.
- Chipp.ai meters LLM tokens.
- Browserbase meters browser session hours.

**Proves:** Stripe Billing already handles multi-dimensional AI usage when the application can emit objective events.

**Does not prove:** That those objective meters solve semantic outcome disputes in support.

## Stripe and Metronome

**Claims:** C001 through C004, C033.

Stripe acquired Metronome to own sophisticated usage-based monetization: high-volume events, multidimensional rating, credits, contracts, and analytics. Metronome and Stripe operate on the events applications supply. They do not independently read a support transcript and decide whether a resolution happened.

**Proves:** The billing substrate can price and invoice a well-formed usage event at scale.

**Does not prove:** That the billing substrate can invent a trustworthy semantic outcome.

## TypeSafe Jev

**Claims:** C028 through C032.

Jev is TypeSafe's System One model for structured decisions over text or JSON. It returns Choice, Score, and Noul answers with probabilities. Choice and Score include confidence. Noul returns a bare probability. TypeSafe's use-case map claims real-time speeds. Independent calibration against labeled support transcripts was not found.

**Proves:** There is a practical evaluator for atomic semantic questions over conversation state.

**Does not prove:** That default confidence thresholds are calibrated for billing decisions. This project must fit thresholds on its own labeled set.

## Reading these cases together

| Example | Role in the argument |
| --- | --- |
| Fin + Stripe | Exact target architecture already in production |
| Fin outcomes help | Assumed resolution bills silent exits; some other ambiguity is already handled |
| Fin outcomes FAQ | Frustrated silent leave after an answer is still charged |
| Fin community thread | Silent human correction residual failure mode |
| Chatbase | Counterexample and Stripe-direction warning |
| Zendesk / Gorgias / Decagon / Sierra | Outcome pricing is a category pattern |
| Retell / Chipp / Browserbase | Stripe already meters objective AI usage |
| Metronome | Event rating and invoice scale are solved |
| Jev | Candidate semantic evaluator with typed outputs |

The product thesis after these cases is narrow:

> Silence after an AI answer does not necessarily mean the issue was resolved. Fin-style billing often charges for that silence anyway. Stripe can already bill the resulting resolution event. The missing layer is an auditable, confidence-gated way to decide which silent-exit conversations deserve that event.
