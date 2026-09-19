# Open questions

- **Mode:** explanation
- **Owns:** Unresolved product, contract, calibration, privacy, and review-economics questions
- **Update when:** A question is answered, replaced, or newly discovered
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Evaluation](evaluation.md), [Actors and incentives](../concepts/actors-and-incentives.md)

| ID | Question | Why it matters | How to settle it |
| --- | --- | --- | --- |
| Q1 | What dollar-weighted disagreement rate on a real corpus justifies building beyond the docs? | Avoids building on a non-problem | Run the evaluation plan; honor the 2% falsification floor |
| Q2 | Should partial resolutions be billable in the first contract, or withheld? | Changes meters and buyer expectations | Pick one contract for the PoC and A/B later |
| Q3 | How long is the silence window before assumed resolution in the baseline? | Controls baseline disagreement | Mirror Fin-like 24h first, then sensitivity-test |
| Q4 | What confidence thresholds survive held-out calibration? | Auto-bill safety | Fit on labeled data; freeze before final report |
| Q5 | Can pattern-level review stay cheaper than avoided false bills? | Review path economics | Measure in evaluation report |
| Q6 | How much transcript must buyers see to trust a charge? | Privacy vs auditability | Prototype evidence excerpts with legal review later |
| Q7 | Should human-corrected AI answers always withhold, or allow a human-assist meter? | Product packaging | Keep withhold for PoC; reopen as a pricing experiment |
| Q8 | When is Metronome required instead of Stripe Billing meters? | Provider choice | Stay on Stripe meters until volume or contract features demand Metronome |
| Q11 | How do we satisfy the Stripe Projects hackathon requirement without losing the docs-first repo? | Contest compliance vs product clarity | Init-in-place remains the method. The CLI is installed. Init itself is blocked until a live-mode Stripe account exists (C039, C040). Do not fake `.projects/`. |
| Q12 | Can we install the Stripe CLI on this machine for Projects init? | M0.5 needs an authenticated Stripe session | Yes. CLI is `npm install -g @stripe/cli` plus the projects plugin. Test-mode meters work on the sandbox. Projects init still needs live-mode credentials. |
| Q13 | Must a PoC operator complete Stripe live / business activation to demo semantic billing? | Avoids forcing KYC for a test-mode meter | No. Live activation is only for Stripe Projects provider billing. The demo, recorded Jev, policy, and test-mode meters do not need it. |
| Q9 | How should multi-issue conversations be split for billing? | Prevents under/over counting | One conversation one decision for PoC; revisit after corpus review |
| Q10 | What jurisdiction and retention rules apply to redacted transcripts? | Compliance | Keep PoC fixtures synthetic or fully synthetic-redacted until counsel reviews |

Answered questions move into the owning reference or plan doc. Do not leave resolved answers only here.
