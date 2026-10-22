# Recipes

Each recipe is an order of sections built from the components. Drop any section the content doesn't need.

## Explainer

How something works.

1. Title block: the point in one line, plus meta pills (topic, date, source).
2. The picture: a diagram of the whole, kept small.
3. Build-up: one section per part. Each section redraws the diagram with that part added and gives three or four bullets on what it does.
4. Walkthrough: a numbered steps list following one real case end to end.
5. Gotchas: callouts for what surprises people.

## Architecture or flow

The modules or the path through them.

1. Title block.
2. Map: a flowchart of the modules and their boundaries.
3. Flow: a sequence diagram for each path that matters.
4. Responsibilities: a `.grid3` of cards, one per module, saying what it owns and what it must not do.
5. Contracts: a comparison table of what crosses each boundary (payload, owner, failure).
6. Open questions: decision callouts.

## Decision

Options side by side.

1. Title block: the question as the h1.
2. Context: lede plus one diagram of where the decision sits.
3. Options: an option card grid, each card with how it works, cost, risk and who it suits.
4. Comparison: a table across the same rows for every option.
5. Recommendation: a decision callout that names the option and the one tradeoff it accepts.

## Workbook or dashboard

A workbook asks. A dashboard shows numbers.

- **Workbook:** `<html data-workbook="<key>">`. Title block, a short how-to-use panel, then one section per round of question cards, ending with a Copy as Markdown button. Research facts can sit as status chips under a question. Answers are never pre-filled.
- **Dashboard:** title block, a row of stat tiles, then charts. Each chart takes its form from the dataviz skill and its series colours from the diagram tokens. Every number names its source and date.
