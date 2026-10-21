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

## Pitfalls

- Use the assigned colour step as is, without converting, re-measuring or comparing it to stock Tailwind; a suspected palette inconsistency goes to its own ticket. (LEARNINGS 2026-08-17)
- In a visual pass take layout, copy and flow from the proto, every state from `docs/design/async-states.md` and the shipped primitives, and every value from the nearest token; ask before adding a ramp role or hue, and keep every value visible to the scans. (LEARNINGS 2026-10-09)
- When a decision and a proto or shipped component disagree, name the tier first; an enforced standard (the typefaces, anything with a token module and test) is a code defect, an emergent primitive means amend the decision, and Andres rules either way. (LEARNINGS 2026-08-28)
- Give the ledge only to list rows that need action; every other row is flat, and each row shows the verb or the state pill, not both. (LEARNINGS 2026-08-11)
- Render every stateful icon as a duo glyph through `components/ui/icon.tsx` with a hue, and count two paths in the rendered SVG before calling the UI done. (LEARNINGS 2026-09-30)
- Put metadata in labelled rows or separate lines; join no facts with middle dots in UI, protos or copy. (LEARNINGS 2026-09-25)
- Check every motion finding against `design/buttons.md` and `lib/press-tokens.ts` before relaying it, say who decided what, and give each verifier brief's MOTION section the same read. (LEARNINGS 2026-10-09)
- Write one-screen acceptance as "fits without scrolling at every desktop viewport" and shrink the content until it does; phones may scroll the page. (LEARNINGS 2026-09-28)
- When adding to a version Andres liked, give the new element one of that version's existing text styles and its spacing, at a peer's weight rather than a hero's. (LEARNINGS 2026-10-10)
- Show an option the user cannot take as unselectable, like other unavailable options; a race the UI cannot prevent reads as an ordinary "just taken" and the options reload. (LEARNINGS 2026-10-14)

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
| `colour_palette` | `tools/build-palette.mjs` and `__tests__/palette.test.ts` |
| `type_ramp` | `app/globals.css` `@theme` `--text-*` and `__tests__/theme-tokens.test.ts` |
| `buttons` | `lib/live-lesson-tokens.ts` (`thovenButtonTokens`) and `components/ui/thoven-button.tsx` |
| `icons` | `lib/icon-tokens.ts` |
| `motion` | `lib/motion-config.ts` |
| `layout` | `docs/design/layout.md` |
| `lexicon` | frontend `design/lexicon/LEXICON.md` |
| `components_ui` | `components/ui/` then [Does it already exist](references/sources.md#does-it-already-exist) |
| `stack_md` | frontend `design/STACK.md` rule 7 |
| `design_md` | `DESIGN.md` |

**A ruling made this session is not in a file yet.** Check what this session already ruled
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

**Conclude "no CSS" only after a cold start with `.next` removed.** A long-running dev server
serves a stale sheet. Next's webpack cache keys the Tailwind compile on the content of
`app/globals.css`, so classes in a newly created file stay missing through a restart and a `touch`.
Compare the stylesheet's byte length across edits.
`document.styleSheets` gives false negatives. Fetch the href and search the escaped text.

A deleted colour token makes `bg-x` a silent no-op. Pair any deletion with a repo-wide scan that
has a floor on the file count.

Comma-separated arbitrary values emit CSS. Tailwind rewrites every colour slot in a multi-layer
`shadow-[…]` to `var(--tw-shadow-color, …)`, so one `shadow-<colour>` utility repaints every layer.

## Reviewing in a browser

The browser is Andres's, not a scratch surface.

- Review at his viewport. Ask the size.
- If you resize, zoom, or navigate, restore it before handing control back.
- Name the route and the viewport when you hand over a URL.
- Check the surface while the window changes size.

## Standing checks

- `components/ui/` holds primitives only.
- Raw `<button>` only inside `components/ui/`.
- No raw colours. `bg-blue-600`, hand-rolled shadows and hex literals route through tokens.
- Focus rings are `:focus-visible` only.
- Every component covers loading, empty, error and disabled before it is called done.
- Values found by feel go through `dialkit` and land as a token module with a test at **Build**, not during Design. While a surface is still being designed the value lives in the proto.
