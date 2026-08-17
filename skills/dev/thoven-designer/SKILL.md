---
name: thoven-designer
description: Use when a question is about what Thoven's design system already says - which colour, type size, icon, radius, spacing or motion value is correct, whether a component already exists, whether a value is locked, or whether shipped code drifts from the system. Also use before hand-rolling any component, and before quoting any design value in a spec, plan or review.
---

# Thoven Designer

**This skill states no design values. It is the index to the files that do.**

Any number in here would become a sixth contradicting document. The frontend already survived
that: five design docs in a citation cycle, **21 contradictions**, all five teaching the
*rejected* button hover. So this file carries **pointers and procedures only** - never a value.

Two consequences, and both are load-bearing:

- **`DESIGN.md` governs. This skill does not.** It is the map to `DESIGN.md`, not a rival to it.
- **When a doc and a token module disagree, the doc is the bug.** Not the other way round.

## When to use

- "What colour should X be?" · "What's our type scale?" · "Which icon set?"
- "Does a component for this already exist?"
- "Is this value locked? Can I change it?"
- "Does this shipped code violate the system?"
- Before hand-rolling anything, and before quoting a design value in a spec or review.

**Not for:** building a new surface end to end (`building-thoven-ui`) · polishing something
already built (`better-ui`, `impeccable`) · a single narrow concern where a specialist exists
(see [Route out](#route-out)).

## Where the system lives

Four tiers. **One binds.** Established 2026-07-28, phase 3 of the 2.0 design track.

```
Tier 0   lib/*-tokens.ts + tests        the ONLY binding layer
         tools/build-palette.mjs        generates the palette
Tier 1   DESIGN.md                      the hub - decisions and why
Tier 2   docs/design/*.md               deep reference per part
Tier 3   docs/design-system.html        rendered view, compiled from app/globals.css
```

Everything below Tier 0 is derived.

## The map

Verified 2026-08-16 against `~/thoven/frontend`. Read the binding source **first**; reach for the
deep reference only for intent and rationale.

| Question | Binding source (Tier 0) | Deep reference |
|---|---|---|
| Colour, palette, status hues | `tools/build-palette.mjs` (`PALETTE`) generates the `GENERATED:palette` region of `app/globals.css`; `__tests__/palette.test.ts` | `docs/design/color.md` |
| Type ramp, fonts, weights | `app/globals.css` `@theme` `--text-*`; `__tests__/theme-tokens.test.ts` | `docs/design/typography.md` |
| Buttons, ledges, variants | `thovenButtonTokens` in `lib/live-lesson-tokens.ts:53`; `components/ui/thoven-button.tsx`; `__tests__/design-system-doc.test.ts` | `docs/design/buttons.md` |
| Icons, the two tiers, K2 | `lib/icon-tokens.ts`; `__tests__/icon-tier-scan.test.ts`, `__tests__/icon-tokens.test.ts`, `__tests__/openmoji-icon-map.test.ts` | `docs/design/icons.md` |
| Motion, springs, reduced motion | `lib/motion-config.ts` | `docs/design/motion.md` |
| Layout, viewport, spacing | *(no token module)* | `docs/design/layout.md` |
| What a thing is **called** | *(no token module)* | `design-system/lexicon/LEXICON.md` in `thoven2.0` - LIVING, not frozen |
| Does a component exist? | `components/ui/` (primitives only) | [Does it already exist](#does-it-already-exist) |

**Anything not in this table:** find its binding layer before answering.

```bash
ls lib/*-tokens.ts && ls lib/*.test.ts __tests__/*.test.ts
```

## Answering a design-system question

1. **Read the binding source first.** A Tier 2 doc alone is never a sufficient answer - it is
   derived, and this repo has a demonstrated history of prose the code ignores at scale.
2. **Check both lock tiers** (below) before saying anything can change.
3. **Say which tier the answer came from.** "Tier 0, enforced by `__tests__/palette.test.ts`" and
   "Tier 2 prose, no test" are different levels of confidence and the asker needs to know which.
4. **If Tier 0 and Tier 2 disagree, the doc is the bug** - report it as a defect, don't silently
   pick one.
5. **If nothing binds it, say so.** An unlocked value is a decision that needs Andres and a
   decision log, not a confident answer. Do not invent the ruling.

## Locks

| Tier | Where it lives | Binding? |
|---|---|---|
| **Enforced** | A token module plus a unit test | **Yes.** Drift fails the suite |
| **Declared** | `DESIGN.md`, `docs/design/`, or a sprint decision log | Advisory. A human has to notice |

`lib/entry-morph-tokens.ts` is the reference shape: values, a comment naming them LOCKED, and a
test pinning them.

**Declared locks are not discoverable by grep.** Enforced ones are - token modules turn up in a
file listing. Declared ones do not, so *check `DESIGN.md` explicitly even when a grep came back
empty.* The 2026-06-12 system lock (amber-500, the button families, sky/emerald/rose) lives only
in prose, as do all sprint locks.

**Converting declared to enforced is a contribution.** Any declared lock a sprint touches should
leave as a token module with a test.

## Does it already exist?

In order, and stop at the first hit:

1. **`components/ui/`** - primitives only. If a feature component is living there it is drift; move
   it out when you touch it.
2. **The known-drift problem.** Count both sides before concluding nothing exists - the real
   shared component usually exists and is outnumbered by hand-rolled copies. As of 2026-08-04:
   7 real `Dialog`/`ResponsiveDialog` against **95** hand-rolled `fixed inset-0` modals, with
   *zero* overlap; 7 real Tabs against 19 hand-rolled. Grepping for the pattern finds the copies;
   grepping for the import finds the real one. **Do both.**
3. **The library tables before hand-rolling** - Magic UI, React Bits, Aceternity, Kokonut, Fancy,
   Canvas UI, Rare UI, Interior. Full table with caveats in
   `design-workflow-outline/design-system-guide.md`. The first seven give you a *look* that then
   needs a token pass; **Interior** ([interior.dev](https://www.interior.dev/), MIT, dep is the
   `motion` we already run) gives you a headless `useX()` hook that touches no class names - reach
   for it when what is missing is the interaction's *state machine* (abandonment paths, reserved
   space for async states, keyboard, reduced-motion) rather than its appearance. Fenced by
   `design-system/STACK.md` **rule 7** - gap-filler only; wherever base-ui has the primitive,
   base-ui wins and Interior is read for technique, never copied in.

**Before any of the four, ask `STACK.md`'s question: could a user name it?** Point-and-name it -
"the Thoven button", "the XP thing" - and you **build** it, because it is the product. Cannot name
it, would only notice when it is *wrong* (skeleton timing, abort paths, focus return) and you
**take** it - building that is not craft, it is tax. Brand-meaningful *and* a hard state machine is
the middle case: machine from the library, face from us. The full rule, including why "we are
inventing this" always means build, is in `STACK.md`.
4. **The lexicon** - if you cannot find it, you may be searching the wrong noun.

Deleted components stay deleted for a reason: `components/ui/StatusPill.tsx` was removed
2026-07-29 with zero call sites. Check `DESIGN.md`'s divergence rows before resurrecting a name.

## Auditing a component against the system

The most common use of this skill. Given a file:

1. **Read the file first.** Never audit from memory.
2. **For each concern actually present** - colour, type, icon, radius, motion, layout - look up its
   binding source from [the map](#the-map). Not the derived doc.
3. **Classify every finding, and keep the tiers apart:**
   - **Hard violation** - contradicts an *enforced* lock (token module + test). The suite should
     already be red. If it is green, the test has a gap - report that too.
   - **Drift** - contradicts a *declared* lock (`DESIGN.md`, `docs/design/`). Real, but nothing
     catches it automatically.
   - **Unruled** - the system does not settle it. **This is not a violation.** Name it as needing
     a decision rather than scoring it.
4. **Run the silent-failure checks below.** They do not surface from reading class names.
5. **Give `file:line` for every finding, and the source that makes it one.** A finding without a
   citation is an opinion.

## Silent failures - check these, do not assume

Each of these renders wrong while source review passes. **Verify the computed value, not the
class list.** `toHaveClass` passes while the colours fight; `getComputedStyle` does not.

**A hue that is not a generated ramp paints stock Tailwind.** The ramps are generated and
*override* the framework's, so a hue outside `PALETTE` silently falls through to a different
colour system instead of erroring. Check the hue is in `PALETTE` in `tools/build-palette.mjs`
before using it:

```bash
grep -c "^\s*--color-<hue>-" app/globals.css   # 0 means it is not ours
```

**~~A novel Tailwind arbitrary value generates no CSS.~~ RETRACTED 2026-08-17 — both halves are
false on Tailwind v4.1.9, and this entry caused the bug it warned about.** Measured against the
compiled stylesheet: a never-before-used `pl-[37px]` emits `padding-left:37px`; a comma-separated
`transition-[width,rotate,filter]` emits its full `transition-property`; a comma-separated
`shadow-[…]` emits all its layers. The `transition-[a,b,c]` counter-example this file used is
*itself* in the repo's compiled CSS, generated from a comment that asserts it cannot be.

**What actually happened is the entry below.** On a running dev server all three probes showed
**no CSS**. After a restart, all three were there and the sheet had grown 577 bytes. Whoever wrote
this rule added a novel class, read a **stale** sheet, and generalised. It then propagated into a
Tier 0 token module header (`frontend/lib/elevation-tokens.ts`) and its reference doc, both
retracted at `5d833855`.

**So: never conclude "no CSS" without restarting first.** That check is one command and it is the
difference between a real silent failure and a rule that manufactures three more.

Comma-separated arbitrary values *do* have one real hazard, but it is not emission: Tailwind
rewrites every colour slot to `var(--tw-shadow-color, …)`, so a single `shadow-<colour>` utility
repaints **every layer at once**. Anything dialled still belongs in an inline style or a token
module — for single-source-of-truth reasons, not compilation ones.

**A deleted colour token makes `bg-x` a silent no-op**, not an error. Pair any deletion with a
repo-wide scan that has a floor on the file count - a glob matching nothing passes vacuously.

**A long-running dev server serves stale CSS.** `touch` does not fix it; only a restart does.
Compare the stylesheet's byte length across edits.

**`document.styleSheets` gives false negatives.** Fetch the stylesheet href and search the text,
in its escaped form.

## Standing checks

Invariants. Anything violating one is drift, whether or not a test catches it.

- **`components/ui/` holds primitives only.**
- **Raw `<button>` only inside `components/ui/`.** Everywhere else uses the shared component.
- **No raw colours.** `bg-blue-600`, hand-rolled shadows and hex literals route through tokens.
- **Focus rings are `:focus-visible` only** - never on mouse click.
- **Every component covers loading, empty, error and disabled** before it is called done.
- **Values found by feel go through `dialkit`** and land as a token module with a test.

## Route out

Route to the narrow skill, not the broad one.

| Doing | Use |
|---|---|
| Type ramp, font choice, spacing | `better-typography` |
| Colour, contrast, palette | `better-colors` |
| Layout | `better-layout` |
| Accessibility | `better-accessibility` |
| Interface patterns | `better-interface` |
| UX copy | `better-writing` |
| Component polish | `better-ui` |
| Choosing a library instead of hand-rolling | `pick-ui-library` |
| **Building a new surface end to end** | **`building-thoven-ui`** |
| Building a prototype | `prototype` |
| Motion: naming / finding / building / checking | `animation-vocabulary` · `find-animation-opportunities` · `improve-animations` · `review-animations` |
| Structuring a whole design sprint | `design-workflow-outline` |
| Critiquing a **whole surface** | `impeccable` - surface level only, never a single concern |

## Common mistakes

| Mistake | Fix |
|---|---|
| Answering from `docs/design/*.md` alone | That tier is derived. Read the token module first |
| Quoting a value from memory because it is "well known" | The rejected button hover shipped for months that way |
| Treating a grep miss as "nothing exists" | Declared locks are not greppable. Open `DESIGN.md` |
| "No component exists" after grepping the pattern | Grep the *import* too - the real one is outnumbered |
| Asserting a `className` in a test | Assert the compiled CSS / computed style |
| Ruling on an unlocked value yourself | That is Andres's call plus a decision log |
| Restating a value into a spec | Point at the source. Restatement is how the 21 contradictions happened |
