---
name: thoven-designer
description: Design, critique, or polish a Thoven surface; draw, mock or edit frames in Paper; compare its rendered implementation with a Paper or approved design reference; find existing components and system decisions; or check implementation compliance.
---

# Thoven Designer

Judge a surface on the rendered page, never on its class list or its token match. `toHaveClass` passes while the colours fight, and the eye sees edges the box model does not.

## Authority

1. A Paper frame, for the surface it shows: build its values, never the nearest token or role (Thoven law, "Design parity").
2. Token modules and their tests (`lib/*-tokens.ts`), then `DESIGN.md` and `design/*.md`. Where a doc and a token module disagree, the doc is the bug.
3. A ruling made this session that no file carries yet: apply it, then hand it to `workspace` `capture`.

## Scope

- The named surface is the scope. Where a Paper frame sets a slot, build the slot at the frame's values and change the shared component to do it. Where no frame sets it, fit the component into it; resizing a shell, grid or neighbouring card no frame shows needs Andres (`feature-ledger` rule 16).
- Before a variant of a shipped surface, a ticket on one, a system audit, or a proposed token or shared component: open the live route and the global component, read the shipped code and list what already shipped. State what stays and what changes, and propose only the gap. Variants drawn from memory contradicted the real route.
- A screen that has never existed is designed in Paper first, with one polish round before any lab or code. A multi-screen flow then moves to one main lab, which replaces Paper (law, "Design parity"). While designing, "build" means Paper unless the turn names code.
- A variant rethinks the screen from first principles: what it must say, what the person must do, which parts need a box, which words are excess, where the main button sits. Removing a container and keeping the layout is not a variant. "Variants" means Paper frames unless the ask names a lab or HTML. Andres, 2026-11-19: "I want you to see the screen from first principles".

## Open the reference before you act

| Task | Open |
| --- | --- |
| A popup, dialog, notice, confirmation, or a footer's buttons | [dialogs](references/dialogs.md) |
| An icon or text beside text; a header, row, list or section card; spacing, wrapping | [layout](references/layout.md) |
| Any surface you built or changed, before you say it is done | [check](references/check.md) |
| A build set beside its Paper frame | [visual parity](references/visual-parity.md) |
| Drawing, editing or importing a Paper frame | [paper](references/paper.md) |
| A value, a lock, an existing component, an audit of a file | [implementation](references/implementation.md) |
| The classifier is undecided, or the work belongs to another skill | [sources](references/sources.md) |

Open every row the task touches, not the first. A built or changed surface always opens `check`.

## Design and critique

1. Inspect the rendered surface in context: each state, at 390 and at the frame's width, with the longest real copy. If it cannot be inspected, say what is missing and qualify the finding.
2. State what the person should notice first, understand next, and be able to do. Compare that with the rendered composition (weight, grouping, density, alignment, affordances) and the type in it (measure, wrapping, weight against its space).
3. Write each finding as: what is visible, what in the composition causes it, how it affects the task, the concrete change and its tradeoff. Keep observation apart from inferred feeling.
4. Make the scoped change and keep what works. Then run [check](references/check.md) on the result.

Sources before drawing: atmosphere in `DESIGN.md` "Brand atmosphere" and `BRANDING.md`, layout and copy judgement in `DESIGN.md` "Calm screens", component treatments in `docs/design-system.html`, type in `design/typography.md`. When no component can express the relationship, name the gap and propose the composition through its purpose, visual role and states, after checking what exists ([implementation](references/implementation.md)). A choice with no settled source is provisional, never a lock. Changes to enforced standards, new hues or type roles, and scope outside the named surface need Andres. A value a frame shows is already decided.

## Report

- Lead with the overall judgment and what it means for the person's task. Name what stays, then the few changes that matter most.
- Close with what was inspected, what changed or is proposed, what is provisional, and a `Not checked:` line for each known gap in [check](references/check.md) that applies.
- A lookup gives the direct answer, the owning source and its lock tier. Compliance gives each deviation with `file:line`, its governing source and its consequence, apart from visual judgment.
- Parity includes the reference and the dispositions from [visual parity](references/visual-parity.md).

**Done when** the report ends with one line per reference you opened, in this shape:

`Used: references/<file>.md § <heading>: "<one sentence copied verbatim from that section>"`

`<heading>` is the exact text of a markdown heading in that file. A copied sentence proves you read the section. A reference opened and not quoted counts as not read.
