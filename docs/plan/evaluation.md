# Evaluation

- **Mode:** how-to
- **Owns:** Labeled corpus rules, metrics, calibration posture, and the go or no-go threshold
- **Update when:** Metrics, thresholds, annotation guide, or falsification condition change
- **Back to:** [Master plan](../MASTER_PLAN.md)
- **Related:** [Proof of concept](poc.md), [Outcome grades](../reference/outcome-grades.md)

## Question under test

Does semantic grading of the ambiguous silence bucket create a material, measurable billing difference against the assumed-resolution baseline on a labeled set, with an acceptable false-billing rate?

## Labeled corpus

Target size for the first serious run: 30 to 50 hand-labeled conversations for the PoC, then 200+ before any production claim.

Each row needs:

- redacted transcript
- deterministic facts
- human gold label from the grade set
- whether the baseline would bill
- notes for disagreement adjudication

Annotate with a written guide. Two reviewers should label an overlapping sample so agreement can be reported.

## Metrics

Primary:

| Metric | Definition |
| --- | --- |
| False-billing rate | Semantic auto-bill decisions that gold labels mark withhold or partial-only when full was billed |
| False-withhold rate | Semantic withholds that gold labels mark billable |
| Dollar-weighted disagreement | Absolute dollar difference between baseline bills and semantic bills on the labeled set, using contract prices |
| Ambiguous-bucket lift | Share of ambiguous-silence conversations where semantic decision differs from baseline |

Secondary:

| Metric | Definition |
| --- | --- |
| Review rate | Share sent to review |
| Review precision | Reviews that change the fallback outcome |
| Latency | End-to-end decision time excluding human review |
| Evaluator cost | Jev spend per conversation |
| Reviewer agreement | Agreement on gold labels |

The critical metric is false-billing rate, not generic accuracy.

## Calibration

Because independent published Jev calibration for support billing was not found, fit thresholds on a held-out slice of the labeled corpus.

Record:

- model version
- rubric version
- chosen thresholds
- date fitted
- held-out false-billing rate

Do not promote thresholds that were fitted on the same rows used for the final report.

## Review economics

A human review of one $0.99 charge is usually not viable.

Measure:

```text
avoided_false_bill_dollars
- evaluator_cost
- review_pattern_cost
```

Review UX for later implementation must group recurring reasons with sampled examples, not open one ticket per conversation by default.

## Go or no-go

Predeclare before the evaluation run:

| Result | Decision |
| --- | --- |
| Dollar-weighted disagreement under 2% of baseline billed volume, and false-billing rate not clearly better than baseline | Stop. Publish the negative result. |
| Material disagreement, false-billing rate improved, review cost covered by avoided errors | Continue to the next milestone |
| Material disagreement but false-billing worse than baseline | Do not ship auto-bill. Keep review-only or redesign questions |

The 2% floor is a falsification condition for the thesis, not a vanity metric.

## Reporting

A valid evaluation report includes:

1. corpus size and annotation method
2. baseline vs semantic confusion on the ambiguous bucket
3. false-billing and false-withhold rates
4. dollar-weighted disagreement
5. review rate and estimated review cost
6. model and rubric versions
7. go or no-go decision against the table above
