# Recipes

Pick the reader's job, then keep only the sections needed to do it. A recipe is a reading order, not a quota.

Use [components.md — Page rhythm](components.md#page-rhythm) for heading, lede, visual and caption formatting. Use the same pattern across sections so the reader can scan before reading closely.

## Feature walkthrough

Show what exists and how a person uses it.

1. **Point:** what the feature does, whose experience this is, and where it was observed.
2. **Overview:** one small drawing of the full loop, including other people and external effects.
3. **Try the journey:** readable phone screens in drawn frames beside one continuous mobile recording. A few captions explain the consequential taps, including back or cancel where relevant.
4. **Other roles and effects:** show the teacher, friend, operator or email path only where it adds information; use a swimlane or sequence for the handoffs.
5. **Evidence and limits:** say what was checked, what remains unproved, and link the underlying records. Put a limit beside the relevant demonstration too.

Keep the implementation plan and running status in chat. Technical state-by-state QA records remain linked evidence rather than the main reading experience.

## Explainer

1. The answer as a short lede.
2. One picture of the whole.
3. Focused examples for the parts the reader could misunderstand. Add a diagram increment only when it teaches a new relationship.
4. One concrete case end to end; omit this if the examples already tell that story.
5. Only the caveats that change the conclusion.

## Architecture or flow

1. The question and boundary of the system.
2. A dependency map, ownership map or swimlane.
3. The consequential path through it; use a sequence diagram for ordering.
4. Failure or recovery paths that change the design.
5. Exact contracts in a table only when the reader needs field-by-field lookup; otherwise label the boundaries directly.

## Decision

1. The decision and the recommended option.
2. A visual example of each viable option using the same case and scale.
3. The tradeoffs that distinguish them, stated once. Use a table only for comparable factual attributes.
4. The unresolved question, if any; keep unchosen answers blank.

For design choices, prefer real component examples or a toggle that isolates one treatment. Label a prototype as a prototype. A before/after pair earns its place when the change itself is the decision.

## Data story or dashboard

1. The question, population, period and source.
2. The main chart with a claim heading and direct labels.
3. Supporting views only where they explain a cause candidate, distribution or segment hidden by the main chart.
4. Interpretation, uncertainty and source detail.

Read [data-visualisation.md](data-visualisation.md) before choosing charts. An explainer with no measured data needs a process diagram rather than a decorative dashboard.

## Workbook

Use `<html data-workbook="<key>">`: short instructions, questions grouped by the decision they support, blank answers, then Copy as Markdown. Research facts belong beside the relevant question. Preserve workbook answers when updating its surrounding explanation.
