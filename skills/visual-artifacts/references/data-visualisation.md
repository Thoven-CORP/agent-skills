# Data visualisation

Use a chart when the reader needs to see a pattern in quantities. Use a process diagram for how something works. Keep exact record lookup in a table.

## Choose the question first

- **Which is larger?** Sorted horizontal bars or a dot plot. Example: measured processing cost by Thoven service, in dollars for the same month.
- **How did it change?** A line over time; small multiples when series overlap. Example: weekly intro-call bookings over a stated period, with missing weeks marked.
- **How varied is it?** A histogram, box plot or cumulative distribution. Example: measured page response times, including sample size and percentile definitions; an average alone hides slow requests.
- **What makes up the total?** Stacked bars for a small set of parts; use 100% bars only for share. Example: support requests by category and month, with counts available beside percentages.
- **Do two measures move together?** A scatter plot with each point's unit defined. Example: lesson count and measured support contacts per family; describe association without claiming causation.
- **How did matched cases change?** A slope or dumbbell plot for the same items at two observations. Name both dates and match criteria; use only when the comparison answers the question.
- **Where do people leave a journey?** A funnel only for measured, ordered steps from the same defined cohort and window. Show the denominator and conversion definition at each step. A proposed referral loop has no measured conversion funnel yet.
- **Where do quantities move?** A Sankey only when measured inputs and outputs reconcile. Otherwise use a labelled flow or swimlane without quantitative widths.
- **When do events occur?** A timeline or swimlane for schedule and ownership. Mark planned dates as planned; they are not observed performance.

These are format choices, not a requirement to add charts or a claim that Andres requested each chart type.

## Establish the data

Before drawing, record source/query, retrieval time, measurement period, population, units, aggregation and denominator. Distinguish measured values, estimates and scenario assumptions in the figure and caption. Show missing data as missing, separate from zero; name exclusions and uncertainty that affect interpretation. Protect personal data in shared artifacts.

Every plotted value must trace to the source data or a stated calculation. Use actual supplied data for examples. When data is absent, show the intended schema or a qualitative diagram and state what measurement is missing.

## Make the pattern readable

- Lead with one concise finding supported by the data. Put scope and dates below it, the dominant chart next, and source detail after it. Keep the finding in plain words; avoid a generic “Dashboard” title.
- Label axes, units and important values directly. Show more exact detail on demand when useful; essential meaning stays visible without hover.
- Start length-encoded bars at zero. Keep scales consistent across comparable panels; make any restricted axis clear. Prefer separate aligned panels to dual axes.
- Use Thoven semantic colours consistently, plus labels, line styles or shapes so colour carries no unique meaning. Avoid 3D, decorative gradients and hand-drawn metric geometry.
- Use a restrained base treatment, then emphasise the series or mark that carries the finding. Preserve established colour meanings across views.
- Let the figure carry the page: put values and annotations near their marks. Add a stat tile only when it answers a separate question. Round to useful precision; retain exact values in accessible detail.
- Keep comparisons aligned. Use shared-scale small multiples when overlapping series or crowded categories hide the pattern; preserve meaningful order such as time or journey stages.
- At narrow widths, stack panels, wrap labels and reduce secondary tick density. Keep text readable at normal zoom, including long labels and both axis edges. Scale the composition rather than reducing everything to tiny type.
- Provide a short text interpretation and a compact real-data table or source download when exact lookup matters. Keep the chart readable without hover.

## Interaction and rendering

Add filters, ranges or scenario controls only when they help answer a real question. Show the active population and units after filtering; reset has a visible effect. A modelled scenario labels its assumptions and stays distinct from observations.

When a chart changes, retain category and series identity so the comparison is easy to follow. Use restrained transitions only when they clarify the change, with reduced-motion support. Keep supplied controls keyboard-accessible and offer touch access to any details that also appear on hover.

Prefer precise, self-contained SVG for small static charts. Use a plotting library when scale, accessibility or interaction earns it; use its current official documentation and a suitable self-contained export. The bundled Pele renderer serves Mermaid diagrams; it is not a universal chart pipeline. Keep rough.js for explanatory structure, outside quantitative axes and marks.

## Finish lightly

Sanity-check values, units and denominators against the supplied data while composing. Fix obvious unreadable labels or broken controls you notice. This internal chart does not need a separate audit, browser capture or three-pass verification routine; investigate further only when a concrete problem appears or Andres asks.
