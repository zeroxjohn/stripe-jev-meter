# Claims ledger

- **Mode:** reference
- **Owns:** Every external claim used by this project, with status and primary source
- **Update when:** Any doc repeats, adds, weakens, or upgrades an external claim
- **Back to:** [Master plan](../MASTER_PLAN.md)

Statuses:

- `verified`: primary source confirms the claim
- `vendor_claim`: the vendor states it on their own site; treat as self-reported
- `inference`: reasonable reading of sources, not directly stated
- `unknown`: researched, no authoritative confirmation found

Retrieval date for all rows below: 2026-09-19.

| ID | Claim | Status | Primary URL | Relevance |
| --- | --- | --- | --- | --- |
| C001 | Stripe completed the Metronome acquisition and positions Metronome as usage-based billing infrastructure for complex models | verified | https://stripe.com/newsroom/news/stripe-completes-metronome-acquisition | Explains why Stripe owns high-volume usage metering |
| C002 | Patrick Collison framed usage-based models as a defining industry shift and said Metronome already powers ambitious AI companies including OpenAI, Anthropic, and NVIDIA | verified | https://stripe.com/newsroom/news/stripe-completes-metronome-acquisition | Acquisition rationale |
| C003 | Metronome meters and rates usage events supplied by applications; Stripe collects payment | verified | https://docs.stripe.com/billing/how-metronome-works-with-stripe | Trust boundary: billing systems trust the event |
| C004 | Metronome supports multidimensional metering, credits, contracts, and hybrid pricing | vendor_claim | https://stripe.com/billing/usage-based-billing | What the meter layer already covers |
| C005 | Intercom Fin uses Stripe Billing with a meter and sends successful-resolution usage events by API | verified | https://stripe.com/customers/fin-ai | Exact proof that outcome events flow into Stripe |
| C006 | Fin launched at $0.99 per resolution / outcome; Stripe states charges apply when the customer confirms or when they do not ask for more help after the last AI answer | verified | https://stripe.com/customers/fin-ai | Real outcome price point and silent-exit billing rule |
| C007 | Fin processes more than one million resolutions per week | verified | https://stripe.com/customers/fin-ai | Scale of the outcome-billing market |
| C008 | fin.ai later states two million weekly resolutions | vendor_claim | https://fin.ai/ | Scale update; self-reported |
| C009 | A Fin resolution can be customer-confirmed or assumed after the customer leaves without asking for more help | verified | https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes | Deterministic industry rule for assumed resolution |
| C010 | If a Fin conversation was resolved and the customer later returns seeking further assistance, that resolution is deducted and not charged | verified | https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes | Existing reversal keyed on customer reopen |
| C011 | Intercom customers report being billed for assumed resolutions when humans intervene to correct Fin answers before the customer requests a human | vendor_claim | https://community.intercom.com/ask-the-intercom-team-about-fin-54/fin-s-flawed-assumed-resolved-pricing-design-8929 | Evidence that customer-reopen reversal misses human correction |
| C012 | Intercom leaders expect AI verification of resolutions as a future shift in agent pricing | verified | https://stripe.com/customers/intercom-pricing | Directly validates this project's next-step claim |
| C013 | Intercom migrated billing onto Stripe Billing to support new products and pricing models including Fin | verified | https://stripe.com/customers/intercom-migration | Stripe is the billing substrate for Fin |
| C036 | Intercom FAQ: if a customer is frustrated with Fin's answer and just leaves, that is an assumed resolution and is charged | verified | https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes | Primary proof that silent frustrated exit is billed |
| C014 | Zendesk publishes automated-resolution pricing around $1.50 committed and $2.00 pay-as-you-go on Suite plans | verified | https://www.zendesk.com/pricing/ | Competing outcome unit |
| C015 | Zendesk's payment processor for automated-resolution charges is not publicly documented in the sources reviewed here | unknown | https://www.zendesk.com/pricing/ | Do not claim Zendesk uses Stripe |
| C016 | Gorgias prices AI Agent around resolved interactions for ecommerce merchants | vendor_claim | https://www.gorgias.com/blog/ai-agent-pricing | Ecommerce outcome pricing pattern |
| C017 | Gorgias's payment processor is not publicly confirmed in the sources reviewed here | unknown | https://www.gorgias.com/blog/ai-agent-pricing | Processor unknown |
| C018 | Decagon offers per-conversation or per-resolution pricing | vendor_claim | https://decagon.ai/blog/ai-customer-service | Enterprise outcome pricing options |
| C019 | Decagon's payment processor is not publicly confirmed here | unknown | https://decagon.ai/blog/ai-customer-service | Processor unknown |
| C020 | Sierra markets per-resolution / outcome-oriented pricing | vendor_claim | https://decagon.ai/blog/ai-customer-service | Competing outcome model; secondary source |
| C021 | Sierra's payment processor is not publicly confirmed here | unknown | https://decagon.ai/blog/ai-customer-service | Processor unknown |
| C022 | Chatbase prices itself as subscription plans with included message credits | verified | https://www.chatbase.co/blog/fin-ai-alternatives | Counterexample to outcome billing |
| C023 | Chatbase's Stripe integration connects a business's Stripe account so the Chatbase agent can answer that business's billing questions | verified | https://www.chatbase.co/docs/user-guides/integrations/stripe | Opposite direction from billing Chatbase itself |
| C024 | Whether Chatbase uses Stripe to bill Chatbase customers is not confirmed by the sources reviewed here | unknown | https://www.chatbase.co/pricing | Do not claim Chatbase invoices via Stripe |
| C025 | Retell AI uses Stripe Billing for multidimensional usage including call minutes, LLM model, voice engine, and telephony | verified | https://stripe.com/customers/retell-ai | Adjacent AI usage metering on Stripe |
| C026 | Chipp.ai uses Stripe Billing to meter LLM tokens | verified | https://stripe.com/customers/chipp | Adjacent token metering on Stripe |
| C027 | Browserbase uses Stripe Billing for browser session hours with overages | verified | https://stripe.com/customers/browserbase | Adjacent machine-readable usage on Stripe |
| C028 | TypeSafe Jev evaluates text or JSON with Choice, Score, and Noul questions and returns typed answers with probabilities | verified | https://docs.typesafe.ai/introduction | Semantic evaluator capability |
| C029 | Choice and Score answers include confidence; Noul returns a probability (`noul`) without a Choice/Score-style confidence field | verified | https://docs.typesafe.ai/confidence | Type constraint for the evaluator adapter |
| C030 | Jev accepts text only and can take string, JSON object, or array state | verified | https://docs.typesafe.ai/concepts/state | Evidence packaging constraints |
| C031 | TypeSafe positions System One / Jev for fast structured decisions with claimed real-time speeds around 150ms in its use-case map | vendor_claim | https://docs.typesafe.ai/concepts/use-case-map | Latency claim is vendor-stated |
| C032 | Independent published calibration of Jev confidence against labeled ground truth was not found in the sources reviewed here | unknown | https://docs.typesafe.ai/confidence | Project must calibrate thresholds itself |
| C033 | Stripe Billing meters aggregate usage events that the application supplies | verified | https://stripe.com/customers/fin-ai | Billing systems do not invent semantic outcomes |
| C034 | Static per-resolution pricing is universally broken | inference | https://stripe.com/customers/fin-ai | Rejected by this project; see corrected thesis in master plan |
| C035 | The residual problem is the silent-exit-after-answer bucket: silence is not semantic proof of resolution, yet assumed-resolution rules still bill it by default | inference | https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes | Core thesis after evidence review; supported by C006, C009, C036 |
| C037 | Stripe Projects is a CLI that scaffolds or provisions full-stack apps and third-party services (hosting, database, auth, and more) with Stripe-linked credentials | verified | https://docs.stripe.com/projects | Hackathon stack requirement surface |
| C038 | Stripe Projects can initialize in an existing directory and add catalog services without requiring every app to be created from a template rebuild | verified | https://docs.stripe.com/projects | Prefer init-in-place over discarding this docs repo |

## Rules for this ledger

1. Cite a claim by ID when another doc depends on it.
2. Prefer primary Stripe, Intercom, TypeSafe, or vendor docs over secondary roundups.
3. Keep Chatbase and processor-unknown rows honest. Do not paper over gaps.
4. If a URL dies, mark the row `unknown` until a replacement primary source is found.
