# Design-system lookup and implementation compliance

Use for a specific system lookup, component audit, or implementation check. Visual design and critique begin in [SKILL.md](../SKILL.md).

## Pitfalls

- Use the assigned colour step as is, without converting, re-measuring or comparing it to stock Tailwind; a suspected palette inconsistency goes to its own ticket. (LEARNINGS 2026-08-17)
- In implementation take layout, copy, flow and every value from the Paper frame (`get_jsx`, `get_computed_styles`) at each width, desktop and phone. Use a token where it equals the frame's value and the frame's value where none does. Take each loading, empty, error and pressed state the frame does not draw from `docs/design/async-states.md` and the shipped primitives (a save or send action copies the Send notes button, see Standing checks). With no Paper frame, take values from tokens and ask before adding a ramp role or hue. Keep every value visible to the scans; a scan that refuses a Paper value gets one allowlist entry naming the Paper node and the reason. (LEARNINGS 2026-10-09, 2026-10-22; root LEARNINGS 2026-11-08)
- When a Paper frame and a token module or shipped component disagree, the frame is the build target: build its value and change the component; a difference left is a Discrepancies row (`andres-mode`, Parity). When a decision and a proto or shipped component disagree with no frame to settle it, name the tier first; an enforced standard (the typefaces, anything with a token module and test) is a code defect, an emergent primitive means amend the decision, and Andres rules either way. (LEARNINGS 2026-08-28)
- Give the ledge only to list rows that need action; every other row is flat, and each row shows the verb or the state pill, not both. A row's open action is a neutral 3D button, and the row highlight alone marks what is currently showing. (LEARNINGS 2026-08-11, 2026-10-22)
- Render every stateful icon as a duo glyph through `components/ui/icon.tsx` with a hue, sitting straight on its row or panel with no tile behind it, and count two paths in the rendered SVG before calling the UI done. (LEARNINGS 2026-09-30, 2026-10-22)
- Where no Paper frame sets them, check every vertical gap, line height, wrap, truncation and punctuation mark against THV-1389, and every popup footer and overflow edge against THV-1353, before calling a surface done; metadata goes in labelled rows or separate lines, with no middle dots joining facts. (LEARNINGS 2026-09-25, 2026-10-22)
- Check every motion finding against `design/buttons.md` and `lib/press-tokens.ts` before relaying it, say who decided what, and give each verifier brief's MOTION section the same read. (LEARNINGS 2026-10-09)
- Write one-screen acceptance as "fits without scrolling at every desktop viewport" and shrink the content until it does; phones may scroll the page. (LEARNINGS 2026-09-28)
- When adding to a version Andres liked, give the new element one of that version's existing text styles and its spacing, at a peer's weight rather than a hero's. (LEARNINGS 2026-10-10)
- Show an option the user cannot take as unselectable, like other unavailable options; a race the UI cannot prevent reads as an ordinary "just taken" and the options reload. (LEARNINGS 2026-10-14)

## Classify, then open one file

Before reading the design system, run:

```bash
classify ~/.agents/skills/thoven-designer/evals/classifier.json
```

stdin is the question. Done when a JSON record is in context.

If `status` is `answered`, follow each binding answer. Do not open `DESIGN.md` or
`docs/design/*.md` first.

- `source` is binding → open the file `source` names (table below). That file is the answer.
- `fork` = `design_here` and binding → return to [Design and critique](../SKILL.md#design-and-critique).
- `fork` = `route_to_skill` and binding → read [Route out](sources.md#route-out) and invoke that skill.
- `fork` = `needs_andres` and binding → stop and ask. Do not invent a lock.

If `fork` is `answer_here` and `source` is not binding, read [sources.md](sources.md) for the source only.

If `status` is `undecided` or no answer binds, read [sources.md](sources.md)
and decide from those tables.

| `source` | Open |
|---|---|
| `colour_palette` | `tools/build-palette.mjs` and `__tests__/palette.test.ts` |
| `type_ramp` | `app/globals.css` type roles; `__tests__/type-roles.test.ts` and `lib/cn-type-roles.test.ts`; role selection in `design/typography.md` |
| `buttons` | `lib/live-lesson-tokens.ts` (`thovenButtonTokens`) and `components/ui/thoven-button.tsx` |
| `icons` | `lib/icon-tokens.ts` |
| `motion` | `lib/motion-config.ts` |
| `layout` | `design/layout.md`; vertical rhythm and type rules: [Rulings held in Linear](#rulings-held-in-linear) |
| `lexicon` | frontend `design/lexicon/LEXICON.md` |
| `components_ui` | `components/ui/` then [Does it already exist](sources.md#does-it-already-exist) |
| `stack_md` | frontend `design/STACK.md` rule 7 |
| `design_md` | `DESIGN.md` |

**A ruling made this session is not in a file yet.** Check what this session already ruled
before answering from files, then hand it to `workspace` `capture`.

## Text and neutral colour decisions

For a content title or supporting text, read `design/typography.md` and its named CSS/test owners.
A title's semantic heading level does not choose its display face. Use the existing content-title
role and its family; do not introduce a new type framework or a one-off size. Pair supporting
labels and values with `text-supporting` and an existing size role. Check the compiled result
through `cn()` before changing a shared role. Essential names, dates, and instructions use readable
supporting text; muted and disabled treatments require a state-specific reason.

For neutral colours, follow `tools/build-palette.mjs`, `app/globals.css`, and `design/color.md`.
Check contrast independently of hue. Neutral ledges and focus paint must follow their shared tokens.
The named stage solid requires an approved consumer; adding it does not authorize replacing overlays.
Keep page backgrounds separate from header styling. A bounded adoption lists its consumers and checks
other affected pages without turning into a platform-wide migration.

## Rulings held in Linear

These rulings are settled but not yet in a token module or doc. Until the file in the last column
carries them, the Linear issue is the source: open it and point at it, never restate it.

| Concern | Source now | Lands in |
|---|---|---|
| Vertical rhythm and type rules: the rhythm rule for every gap and line height; wrapping, tracking, measure, punctuation, truncation | Linear THV-1389 | `design/layout.md` "Vertical rhythm" section and the type tests |
| Popup footers and overflow edges: footer placement, phone layout, button height, the lone-button and two-3D-button cases, overflow fades instead of hairlines | Linear THV-1353 | `lib/dialog-tokens.ts` and `hooks/useScrollFadeMask.ts` |

When checking implementation compliance before a surface is done, measure every vertical gap and line height against
THV-1389's rhythm rule, and every text block against its wrapping, tracking, measure, punctuation
and truncation rules. Done when each gap is on the rhythm or listed as a finding with `file:line`.

Every spacing or size value reaches code through `rem()` in `lib/density-tokens.ts`, so the 90%
desktop scale (THV-1333) applies. A raw px vertical value is a defect.

When the named file gains the ruling, repoint the row's source at that file and delete the row.

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
- The 44px tap minimum comes from the transparent hit-area pseudo-element in `design/buttons.md` (Hit target row). Never enlarge a component's visible size to meet it.
- Every component covers loading, empty, error and disabled before it is called done.
- An action that saves or sends runs ThovenButton's full state machine: `loading` with `loadingLabel`, `success` with `successLabel`, and its error as a `role="alert"` footer line. Copy `components/teacher/private-lessons/session/SendNotesButton.tsx` with `components/teacher/private-lessons/session/useSendNotes.ts`, `components/teacher/private-lessons/session/sendErrorCopy.ts` and the send footer in `components/teacher/private-lessons/session/SessionBody.tsx` (on the private-lessons-rework integration branch until it merges to `main`). A hand-drawn spinner, chip or error style is a defect.
- Icons sit straight on their row or panel; a duo glyph needs no tile behind it. A row's open action is a neutral 3D button (`variant="neutral"`), never "Open ›" text with a chevron, and the row highlight alone marks what is currently showing.
- Values found by feel go through `dialkit` and land as a token module with a test at **Build**, not during Design. While a surface is still being designed the value lives in the proto.
