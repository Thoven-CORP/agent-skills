---
name: thoven-designer
description: Use when a question is about what Thoven's design system already says - which colour, type size, icon, radius, spacing or motion value is correct, whether a component already exists, whether a value is locked, or whether shipped code drifts from the system. Also use before hand-rolling any component, and before quoting any design value in a spec, plan or review.
---

# Thoven Designer

**This skill states no design values. It is the index to the files that do.**

Any number in here would become a sixth contradicting document. The frontend already survived
that: five design docs in a citation cycle, **21 contradictions**, all five teaching the
*rejected* button hover. So this file carries **pointers and procedures only** - never a value.

- **`DESIGN.md` governs. This skill does not.**
- **When a doc and a token module disagree, the doc is the bug.**

The surface you were named is the only one in scope. Fitting a component into its slot is the work.
Resizing the shell, the grid, or the neighbouring cards is a new decision that needs Andres.
`feature-ledger` **rule 16**.

## Classify, then open one file

Before reading the design system, run:

```bash
classify ~/thoven/agent-skills/evals/schemas/thoven-designer.json
```

stdin is the question. Done when a JSON record is in context.

If `status` is `answered`, follow each binding answer. Do not open `DESIGN.md` or
`docs/design/*.md` first.

- `source` is binding → open the file `source` names (table below). That file is the answer.
- `fork` = `route_to_skill` and binding → read [Route out](references/sources.md#route-out) and invoke that skill.
- `fork` = `needs_andres` and binding → stop and ask. Do not invent a lock.

If `fork` is `answer_here` and `source` is not binding, read [references/sources.md](references/sources.md) for the source only.

If `status` is `undecided` or no answer binds, read [references/sources.md](references/sources.md)
and decide from those tables.

| `source` | Open |
|---|---|
| `feature_d_rows` | the Feature's `DESIGN_<PROJECT>.md` `D#` rows and `decisions/` |
| `colour_palette` | `tools/build-palette.mjs` and `__tests__/palette.test.ts` |
| `type_ramp` | `app/globals.css` `@theme` `--text-*` and `__tests__/theme-tokens.test.ts` |
| `buttons` | `lib/live-lesson-tokens.ts` (`thovenButtonTokens`) and `components/ui/thoven-button.tsx` |
| `icons` | `lib/icon-tokens.ts` |
| `motion` | `lib/motion-config.ts` |
| `layout` | `docs/design/layout.md` |
| `lexicon` | `design-system/lexicon/LEXICON.md` in `thoven2.0` |
| `components_ui` | `components/ui/` then [Does it already exist](references/sources.md#does-it-already-exist) |
| `stack_md` | `design-system/STACK.md` rule 7 |
| `design_md` | `DESIGN.md` |

`feature_d_rows` outranks every other source when the question is about a surface inside a Feature.
A `D#` may not mint a hue outside `PALETTE`. Report that row. Do not obey it.

**A ruling made this session is not in the ledger yet.** Check what this session already ruled
before answering from files, then hand it to `workspace` `capture`.

After the file is open: say which lock tier the answer came from (token module plus test = enforced;
`DESIGN.md` prose = declared). If the token module and a doc disagree, the doc is the bug.

## After `components_ui` binds

Ask `STACK.md` rule 7. Could a user name it? Point-and-name it and **build**. Cannot name it, would
only notice when it is wrong, and **take**. Brand-meaningful and a hard state machine: machine from
the library, face from us.

## Auditing a component

Given a file:

1. Read the file first.
2. For each concern actually present, open the binding source from the classify table above. Not the derived doc.
3. Classify every finding. Hard violation (enforced lock). Drift (declared lock). Unruled (needs a decision, not a score).
4. Run [Silent failures](#silent-failures).
5. Give `file:line` and the source that makes it a finding.

## Silent failures

Verify the computed value, not the class list. `toHaveClass` passes while the colours fight.

**A hue that is not a generated ramp paints stock Tailwind.** Check it is in `PALETTE` in
`tools/build-palette.mjs` before using it.

```bash
grep -c "^\s*--color-<hue>-" app/globals.css
```

Zero means it is not ours.

**Never conclude "no CSS" without restarting first.** A long-running dev server serves a stale
sheet. `touch` does not fix it. Compare the stylesheet's byte length across edits.
`document.styleSheets` gives false negatives. Fetch the href and search the escaped text.

A deleted colour token makes `bg-x` a silent no-op. Pair any deletion with a repo-wide scan that
has a floor on the file count.

Comma-separated arbitrary values emit CSS. Tailwind rewrites every colour slot in a multi-layer
`shadow-[…]` to `var(--tw-shadow-color, …)`, so one `shadow-<colour>` utility repaints every layer.

## Reviewing in a browser

The browser is Andres's, not a scratch surface.

- Review at his viewport. Ask the size, or use the one the Feature's ledger records.
- If you resize, zoom, or navigate, restore it before handing control back.
- Name the route and the viewport when you hand over a URL.
- Never hand over a route a `DESIGN_<PROJECT>.md` row has retired (`feature-ledger` rule 15).
- Check the surface while the window changes size.

## Standing checks

- `components/ui/` holds primitives only.
- Raw `<button>` only inside `components/ui/`.
- No raw colours. `bg-blue-600`, hand-rolled shadows and hex literals route through tokens.
- Focus rings are `:focus-visible` only.
- Every component covers loading, empty, error and disabled before it is called done.
- Values found by feel go through `dialkit` and land as a token module with a test at **Build**, not during Design. While a surface is still being designed the value lives in the proto and the `D#` row.
