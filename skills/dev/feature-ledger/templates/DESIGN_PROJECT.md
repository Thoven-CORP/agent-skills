<!-- SCAFFOLD — delete this line when the first real row lands -->
# DESIGN — <feature>

Keyed by **surface**. **Read this before building any surface, and before resolving any decision
about one.**

## Done when

Every surface the Feature touches has a row, and every path in those rows opens. The owning
gate is where the final prototype is going to be.

## Surfaces

One row per surface, not only one per drawing. **What to build from** is a drawing, a proto route
plus screen, or a component and the commit it was canon at. **A surface with no row is a blocker,
not a default: STOP and ask.** The owning gate is the proto path (`app/dev/<feature>/page.tsx`)
or the drawing. A path that opens.

| `D#` | Surface | What to build from | Status | Owning gate | REJECTED, and why |
|---|---|---|---|---|---|
| D1 | | `design/drawings/*.html` · `app/dev/<feature>/page.tsx` screen N · component @ commit | | `app/dev/<feature>/page.tsx` | |

## Rules that span surfaces

Rules, thresholds, axes and data shapes that no single surface owns. Rule 12 applies here hardest:
if opening the prototype answers it, it does not get a row. Every rule states the surfaces it covers,
and its citation must resolve for each of them.

| `D#` | Rule | Surfaces covered | Points at | Status |
|---|---|---|---|---|
| | | | | |

## Status vocabulary

`SUPERSEDED` alone once hid a live lock for six weeks. Use one of:

- **`LOCKED`** — build from it.
- **`AT THE GATE`** — drafted, awaiting a ruling.
- **`SUPERSEDED`** — dead outright. Nothing in it binds.
- **`SUPERSEDED AS A SOURCE · LIVE AS A LOCK`** — build from the successor, but its decisions and
  its REJECTED block still bind. Say in the row *what* still binds.
- **`PARTLY SUPERSEDED`** — say which half died and which half survives.

## Where a design lives at each level

| Level | Path | Format |
|---|---|---|
| L1–L3 | `design/drawings/*.html` | HTML + CSS, runnable |
| L4 | `app/dev/<feature>/page.tsx` | running React, **the app repo** |
| L5 | the shipped components | code |
