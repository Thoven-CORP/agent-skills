# Designer sources (fallback)

Read this file only when `classify` on `evals/schemas/thoven-designer.json` returns `undecided` or a non-binding answer. Binding answers already name the one file to open.

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
| Which of the system's values applies to **this** surface | the Feature's `DESIGN_<PROJECT>.md` `D#` rows and `decisions/` | [The feature's own decisions](#the-features-own-decisions-bind-on-its-own-surfaces) |
| Does a component exist? | `components/ui/` (primitives only) | [Does it already exist](#does-it-already-exist) |

**Anything not in this table:** find its binding layer before answering.

```bash
ls lib/*-tokens.ts && ls lib/*.test.ts __tests__/*.test.ts
```

## The feature's own decisions bind on its own surfaces

**The tiers say how strongly a value binds. They do not say *where*.** A Feature's ledger — its
`DESIGN_<PROJECT>.md` `D#` rows and its `decisions/` files — resolves which of the system's values
applies to which surface, and on that Feature's surfaces it is **binding**. This skill's map is
repo-wide; a question about a surface inside a Feature is not answered until the Feature's ledger has
been read.

**The ledger assigns. The system supplies. Neither substitutes for the other:**

- A `D#` may rule *"every schedule-oriented surface on this dashboard uses the rose hue"* or *"the
  library nav group is indigo"*. That is an assignment, it is real, and answering the surface's colour
  question without it is wrong however well you cited `PALETTE`.
- A `D#` may **not** mint a value the system does not have. A hue outside `PALETTE` silently paints
  stock Tailwind whether or not a row asked for it — see [Silent failures](#silent-failures---check-these-do-not-assume).
  A row demanding one is a defect in the row, and it is reported, not obeyed.

**Read it before answering, before designing, and before generating variations.** A fan-out that
produces eight design options without reading the Feature's `D#` rows produces eight options that all
miss the same assignment, which costs the whole round rather than one option.

⚠ **A ruling made this session is not in the ledger yet.** Anything Andres settled minutes ago —
*"we literally just said library indigo"* — binds immediately and is greppable nowhere. Before
answering from files alone, check what this session has already ruled, and hand it to `workspace`
`capture` so the next session can find it.

## Answering a design-system question

1. **Read the binding source first.** A Tier 2 doc alone is never a sufficient answer - it is
   derived, and this repo has a demonstrated history of prose the code ignores at scale.
2. **Read the Feature's ledger if the question is about a surface inside one.** Its `D#` rows say
   which of the system's values this surface uses. The repo-wide answer is not the surface's answer.
3. **Check both lock tiers** (below) before saying anything can change.
4. **Say which tier the answer came from.** "Tier 0, enforced by `__tests__/palette.test.ts`" and
   "Tier 2 prose, no test" are different levels of confidence and the asker needs to know which.
5. **If Tier 0 and Tier 2 disagree, the doc is the bug** - report it as a defect, don't silently
   pick one.
6. **If nothing binds it, say so.** An unlocked value is a decision that needs Andres and a
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
   Before grepping for component copies or imports at all, `graphify query` the component node —
   missing-import edges surface hand-rolls that grep cannot see.
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
| **Building a new surface end to end** | **`building-components`** |
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
| Answering a surface question from the repo-wide system only | Read the Feature's `D#` rows. The system supplies; the ledger assigns |
| Generating N design variations before reading the Feature's ledger | All N miss the same assignment. One read, or one wasted round |
| Ignoring a ruling made minutes ago because it is in no file | It binds now. Answer with it, then hand it to `workspace` `capture` |
| Writing a token test for a value still in Design | The proto and the `D#` row hold it until Build. Ruled 2026-08-20 |
| Leaving his browser at a viewport you set | Restore it. He reviews through that window |
| Reviewing at a viewport you chose | His. The shell was fitted to it |

