# Design system guide

What a sprint gives back to the design system, and what it must not touch.

Read when filling `DESIGN_SYSTEM_CONTRIB.md`, and before any level that picks a component, a
colour, a type size, or a motion value.

## Goals

Thoven 2.0 **is** the design system's rebuild. It happens through the sprints, not beside them —
there is no separate consolidation project.

- The weak areas are **component design, motion, and colour**. Go heavy there; the rest is
  already adequate.
- A design decision is only real once it is an **enforced lock** (below). Prose does not survive.
- Prototypes are built on real tokens so they get **promoted**, never rebuilt.
- Every sprint pays rent: its findings land in the system before the sprint is done.
- Surfaces 2.0 never touches get swept after 2.0, not during.

## How to design

Five rules. They exist because the LessonSpace sprint locked its decisions, built prototypes,
and the implementation still came out wrong.

1. **Prototype inside the repo, importing real tokens.** Never a standalone HTML file on the
   Tailwind CDN — hardcoded values get copied into the build instead of the system.
2. **Promote the prototype into the component.** Never rebuild from a screenshot.
3. **Verify after build**: the built thing beside the prototype.
4. **A mismatch is a design-system defect, not a build bug.** It goes in the update log.
5. **Every component covers loading, empty, error, and disabled** before it is called done.

## Locks

A lock is a design value that must not be changed without sign-off. Two tiers, and the
difference is whether anything can enforce it.

| | Where it lives | Binding? |
|---|---|---|
| **Enforced lock** | A token module plus a unit test | **Yes.** Drift fails the suite |
| **Declared lock** | `DESIGN.md` + `docs/design/`, or a sprint's decision log | Advisory only. A human has to notice |

`lib/entry-morph-tokens.ts` is the reference shape for an enforced lock — the values, a comment
naming them LOCKED, and a test that pins them so the component and the test can never drift.

**Before changing anything, check both tiers.** Enforced locks are discoverable by grepping for
token modules. Declared locks are not discoverable — the 2026-06-12 system lock
(amber-500, the button families, sky/emerald/rose) lives only in prose, and sprint locks live only
in that sprint's decision log.

### Where the system lives (frontend)

Four tiers, one of which binds. Established 2026-07-28, phase 3 of the 2.0 design track.

```
Tier 0   lib/*-tokens.ts + tests    the ONLY binding layer
Tier 1   DESIGN.md                  the hub — decisions and why
Tier 2   docs/design/*.md           deep reference per part
Tier 3   docs/design-system.html    rendered view; compiled from app/globals.css,
                                    button section generated from thovenButtonTokens
```

Everything below Tier 0 is derived. **When a doc and a token module disagree, the doc is the bug.**

*Why the tiers exist:* the frontend previously had five design docs — `DESIGN.md`,
`docs/design-system.html`, `.claude/docs/DESIGN_SYSTEM.md`, `docs/DESIGN_SYSTEM_FULL_REFERENCE.md`,
and a 7-line stub — in a **citation cycle**. The HTML claimed the others were "generated from this
page"; the `.claude` doc called the HTML the visual source of truth; FULL_REFERENCE called the
`.claude` doc "Tier 1 canonical". Following the chain returned you to the start, so no document was
ever responsible for being right, and an audit found **21 contradictions** between them. All five
taught the *rejected* button hover.

**Two enforcement mechanisms, and the difference matters:**

- **Structural** — the rendered doc compiles its stylesheet from the app's own `globals.css`, so a
  colour, radius, or font cannot differ from production. Nothing to assert; it either renders or it
  doesn't.
- **Asserted** — a test computes its expectations from the token module and reads the doc
  (`__tests__/design-system-doc.test.ts`). Needed wherever the doc contains values the stylesheet
  can't supply.

Prefer structural. Reach for a test only for what structure can't cover.

**A generated doc region beats a checked one.** The button section is produced by
`tools/build-design-system.mjs`, which bundles the token module with esbuild and imports it, and
parses the component's literal class tables from source. No value is retyped, so the doc cannot
disagree — as opposed to being *checked* for disagreeing. Rebuild with `npm run docs:design`.

### Palettes (added 2026-07-28, phase 4b)

**Read `better-colors/palette-generation.md` before generating any scale.** Two hours were spent
hand-rolling a ramp generator while the file specifying the algorithm sat unopened. The
load-bearing line is *"same chroma **percentage**, not absolute chroma"* — clamping absolute chroma
to the gamut ceiling has no principle behind it, it just inherits whatever the source palette chose.

**Three properties make a palette a system rather than a collection.** Run these as a diagnostic on
any inherited palette before trusting it:

- **Every step inside sRGB.** Above the gamut the *browser* resolves the colour, so what ships
  depends on the engine and the display. Thoven inherited 7 of 8 tertiary hues overflowing.
- **One lightness per step, shared across hues.** This is the one that matters most and it is
  invisible until measured. Thoven's eight `-500` steps spanned **0.184** in lightness, which is
  why the same recipe gave different contrast per hue and every one had to be checked by hand.
  Matched, one check covers the set — and *the step number becomes the role*.
- **One hue per ramp** — *with judgement.* A ramp that drifts >10° is usually a defect, but not
  always: a warm ramp legitimately drifts toward yellow at the pale end because a vivid light
  orange does not exist in sRGB while a vivid light yellow does. Measure before "fixing" it.

**Do not treat every hue the same.** A categorical hue needs to be a peer of the others; a
**semantic** hue needs to stay recognisable. Thoven's `red` is deliberately off the lightness grid
— on it, `red-500` becomes salmon and stops reading as an error.

**Generate the palette into the stylesheet, and let it override the framework's ramps.** 99 oklch
values typed by hand drift. Overriding rather than adding new names means existing classes pick up
corrected values with **no migration** — and avoids a second true name for the same paint, which is
the failure mode of a "brand token" nobody consumes.

**Deleting a colour token is not like deleting code.** A removed `--color-x` makes `bg-x` a silent
no-op that paints nothing, not an error. Pair every deletion with a repo-wide scan, and give that
scan a **floor on the file count** — a glob that matches nothing makes every rule pass vacuously.

**A colour phase declares the palette; it does not migrate call sites.** Watch for this: "fix the
colour system" reads as licence to sweep, and a plan can drift into a codemod without anyone
deciding to. Screens convert during the feature work that touches them. Corollary: when weighing a
change, **count the consumers first** — a deeper button ledge was strictly better on every measure
and still wrong to ship, because 210 files hand-rolled the old value against 14 using the
component.

**Converting declared → enforced is part of the contribution.** Any declared lock a sprint
touches should leave as a token module with a test. That is how the system gets teeth instead
of just getting longer.

### Type scales (added 2026-07-29, phase 5)

**px is not comparable across two typefaces — compare x-height.** This is the type equivalent of
the lightness-grid finding above, and it hides the same way. Thoven pairs Fredoka with Montserrat;
measured with canvas `TextMetrics`, Fredoka's x-height is **95%** of Montserrat's and its set width
**88%**. So a 20px Fredoka section heading and an 18px Montserrat card title are nearly the same
visual size, and the card title wins because it is heavier and wider. A parent heading was being
out-shouted by its own children while the spec looked fine.

```js
const c = document.createElement('canvas').getContext('2d')
c.font = '700 100px Fredoka'
c.measureText('x').actualBoundingBoxAscent   // x-height per 100px of em
```

**Build the ladder in x-height, then check the STEP between adjacent roles.** ~1.2× reads as a
level; under ~1.10× the smaller role is not visibly smaller. **The cross-face steps are where this
goes wrong silently**, because that is the only place px stops being comparable — flag them.

**Let the test recompute the ladder rather than restate the numbers.** A test asserting
`fontSize === 16` passes the moment someone changes it to 18 and updates the test. One that derives
each step and fails below a floor, naming the offending pair, does not.

**Weight belongs in the token, not a base-layer rule.** Tailwind v4 supports
`--text-*--font-weight`, `--line-height` and `--letter-spacing`, and the utility layer outranks
`@layer base`. Put everything the token *can* carry in the token; leave the base layer only what it
must — the typeface, which has no token namespace.

**Look for an abandoned vocabulary before inventing names.** Thoven's `@layer base` already held
four classes declaring a family and weight and no size, at zero usages. Since `--text-{name}`
generates `.text-{name}`, declaring the token *finished* the class someone started and the family
came along free. A parallel `.heading-*` set could never have worked — no token generates it.

**Two faces can BE the hierarchy.** One for structure, one for content. That split does work size
and weight then don't have to, which matters when the gaps are only 2–4px. Corollary: making one
more thing use the "special" face removes the signal rather than adding emphasis.

**A ceiling is a migration tool; give it zero slack.** When a rule would land red on existing code,
cap the count instead of banning the pattern — but measure the cap against *the scanner's own
output*, not a raw grep. A cap set 3 too high let a deliberately-added violation pass, which is the
one thing a cap exists to prevent. **Mutation-test every lock by breaking it.**

**Verify a token against a compile that has a source.** A stylesheet compiled from the theme file
alone contains only what its own `@apply` calls pull in, so a token utility can never appear there
however correct the token is. Compile against a real content file and include a **control class**
you know should appear — if the control is missing, the harness is broken, not the token.

**Measure the brief before believing it.** "Our text is too big" was checkable and false: 76.8% of
size tokens were already the two smallest, and Tailwind's `text-xl` and `text-lg` share an
identical 28px line box, so the obvious fix across 123 headings would have saved zero pixels. The
cost was padding and layout instead. **Then say so in a paragraph and move on** — an aside that
turns out to be wrong is not a licence to expand the phase around it.

### The Design Lock Protocol

Written on the LessonSpace branch 2026-07-18, landed on `main` 2026-07-27. The condensed
version lives in `frontend/CLAUDE.md`; this is the full text.

**The proto is the contract.** When a design session locks a design, the interactive proto
under `wireframe/<sprint>/*.html` IS the contract — transitions **and end states** — not any
prose restatement of it.

- Every issue derived from a locked design carries a
  `**Design source (build against THIS):** <repo path>` line. Implementation **and test**
  authors must open and *drive* the proto before writing anything.
- Before freezing tests, or declaring any doc a "spec surface": diff the ticket criteria
  against the parent issue + PRD + the named proto. On any wording conflict the **proto wins**,
  and the conflict is flagged to Andres before building.
- Never let a spec header restate the design "in its own words" as the product contract — cite
  the proto path. Frozen tests amplify whatever they encode; a frozen wrong contract makes every
  later gate defend the wrong thing harder.
- Design-session exit ritual: the locked params + proto path get written into the issue **at
  lock time**, in Andres's selected values — never reconstructed later from memory.

**Wireframe versioning (mandatory).** Every `wireframe/<sprint>/` carries a `VERSIONS.md`
manifest: proto → version → status (LOCKED/MIXED/SUPERSEDED/ARCHIVE) → date → owning ticket. A
redesign is NOT locked until it produces a NEW `-vN.html` proto **and** a manifest row flips the
old one. A redesign that lives only in a transcript is a DRAFT — nothing downstream can read it.
Superseded protos get a visible status banner injected at the top so opening a stale file is
self-evident. Check the manifest before building against ANY proto.

**Cross-ticket open questions ESCALATE — agents never self-resolve them.** When a builder hits a
dependency it is fenced out of and raises an OPEN QUESTION, an orchestrator or judge agent must
NOT resolve it as "defer to a visual pass / non-blocking." That decision is Andres's. Every
deferred "human visual pass" becomes a tracked ticket immediately or it evaporates — which is
exactly how the Bow filing slot was lost twice.

*Why this exists (2026-07-18, Lessonspace Batch 2):* a ticket turned ISSUE-15's "never a page
navigation" into "never a **blank** page navigation" — one inserted word. Specs were authored
from the ticket, frozen, adversary-checked for internal quality only, built green, and shipped a
wrong build through every gate. Postmortem:
`docs/Teach_Mode/Lessonspace/EXECUTION_CHECKLIST.md` §02 change-control block.

**What it cost when the lock was only declared.** The LessonSpace sprint locked its button
motion in a proto (`spec-thoven-button.html`, hover ledge `4→5` + 1px lift) and `main` shipped
the explicitly *rejected* candidate (`4→2`, pre-compressing) for months — because the lock lived
in an HTML file nobody's test read. Fixed in phase 2 of the 2.0 design track by deriving the
component's classes from `thovenButtonTokens` and computing every test expectation from the same
module.

## Which skill

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
| Any question about what the system already says - a value, a lock, whether a component exists, whether shipped code drifts. Also checking one component against `components/ui/` + the library tables + the lexicon | `thoven-designer` |
| Building a new surface end to end - new page, section, component, redesign | `building-thoven-ui` |
| Building a prototype | `prototype` |
| Naming a motion | `animation-vocabulary` |
| Finding where motion belongs | `find-animation-opportunities` |
| Building or fixing a motion | `improve-animations` |
| Checking a motion | `review-animations` |
| Critiquing a **whole surface** | `impeccable` — surface level only, never a single concern |

`impeccable` claims typography, colour, motion, and IA all at once. Routing a single concern
there gets a generalist answer where a specialist skill exists.

## Reach for these before hand-rolling

| Library | Good at |
|---|---|
| **Magic UI** | Product-UI motion and micro-interactions. Animated Beam, Meteors, Particles |
| **React Bits** | Interactive backgrounds, cursor, text physics. FuzzyText, PixelTrail, GridMotion |
| **Aceternity UI** | Hero sections and landing-page eye-candy. Background Beams, 3D Card, Lamp |
| **Kokonut UI** | Dashboard detail, input bars, button micro-interactions |
| **Fancy Components** | Typography physics, liquid hover, distorted canvas |
| **Canvas UI** | HTML-in-Canvas WebGL — glass refraction, liquid hover, particle reveals |
| **Rare UI** | Single rare one-offs, not a base kit. Scroll Progress, Duration Picker, Family Drawer, Proximity/Bounce Sidebar, Folder. `npx shadcn add swamimalode07/rare-ui/{name}` — verified 2026-08-07: **no LICENSE file in the repo** despite the "open-source" claim; treat as read-for-technique until that lands |

Rare UI's `scroll-progress` and `folder-component` are downloaded and staged for reading at
[`design-system/vendor-refs/rare-ui/`](../../../thoven/thoven2.0/design-system/vendor-refs/rare-ui/README.md)
in the docs repo — deliberately not in `components/ui/`, because of the licence gap above.
Neither needs a dependency the frontend doesn't already have (`motion/react` + `cn`).
`scroll-progress` is the token-cleanest of the twelve; `folder-component` carries 17 raw hexes
and needs a full colour pass before it could graduate.

Anything canvas or WebGL, from any of them, ships with: off-screen pausing, a low-power
fallback, and a `prefers-reduced-motion` path. No exceptions.
Rare UI's canvas pieces (`fluid-orb`, `gravity-letters`) handle `prefers-reduced-motion` but
have **no `IntersectionObserver` pausing and no low-power fallback** — that's ours to add on
import, not something the copy-paste gives us.

Bind imported components to Thoven tokens (`--primary`, `--radius`, theme modes) at import
time, not later. Convert their icons to the house set in the same pass.

## Motion references

Three kinds, reached at different moments.

**Deciding what a motion should be** — [joshpuckett.me/melt-effect](https://joshpuckett.me/melt-effect)
and work like it. Read at L5, while the motion is still open. Its use is *"we would never have
thought of that,"* not copy-paste. **Named want:** the melt effect is worth landing somewhere
it earns its place — a peak moment, not decoration.

**Picking the values** — [transitions.dev](https://transitions.dev/) for easing and duration.
Whatever comes out becomes an enforced lock, not a number pasted into a component.

**Building it** — [svg.guide](https://www.svg.guide/) for SVG micro-interactions: how, not what.

Reference does not override the stack rules below. A technique found here still ships through
`framer-motion`, still carries a `useReducedMotion()` fallback.

## Verifying in the browser — four traps that all look like design bugs

Added 2026-08-08 from the student session-notebook sprint, where **five separate failures** wore the
same disguise: the class is in the markup, source review passes, and the browser renders something
else. Every one of these cost real time, and three of them recurred *after* being written down.

**1 · A novel Tailwind arbitrary value generates NO CSS.** `shadow-[0_4px_0_0_var(--color-sky-300)]`,
`h-[560px]`, `min-h-[280px]`, `scale-[0.99]` — if the exact string appears nowhere else in the repo,
the class lands in the HTML and no rule is emitted. `transition-property` in particular then falls
back to its initial value `all`, which is the `transition-all` most button grammars forbid.

- **Comma-separated arbitrary values never work**: `transition-[a,b,c]` emits nothing. Use a named
  `@utility` (this repo has `transition-press` and `transition-hue` for exactly this).
- **Anything novel or dialled goes in an inline style**, or in a token module applied as `style` —
  the JIT cannot drop those.
- `grep -rl` the class first. If it is the only occurrence, assume it will not generate.

**2 · A long-running dev server serves a stale CSS build.** New `@theme` variables and new utility
classes simply never appear. **`touch` does not fix it; only a restart does** — and once, only
`rm -rf .next/cache` plus a restart did. The tell: fetch the stylesheet and compare its **byte
length** across edits. If it is identical after you added classes, nothing rebuilt, and you are
debugging a design that was never compiled.

**3 · `document.styleSheets` gives false negatives.** Iterating `cssRules` can silently miss or
throw on stylesheets, so "the rule does not exist" may be wrong. **Fetch the stylesheet href and
search the text** — and search the ESCAPED form (`scale-\[0\.98\]`), because that is how the
selector is actually written.

**4 · A hidden browser pane suspends `requestAnimationFrame`.** `visibilityState: "hidden"` means
tweens freeze mid-flight, smooth-scroll never animates, and a programmatic `scrollTop` fires no
scroll event at all. Screenshots then show half-faded text that looks like broken CSS. **Probe
`document.visibilityState` before believing a frozen frame**, and judge motion from settled DOM
reads rather than images.

**The habit that catches all four:** verify the COMPUTED value, not the class list. `toHaveClass`
passes while the colours fight; `getComputedStyle` does not.

### Layout: `h-full` in a stretch grid does not derive a height

A CSS grid row is as tall as its **tallest item**. So "this panel's height is derived from the
column beside it" is not expressed by `items-stretch` + `h-full` — the moment the panel's own
content overruns, the panel grows the row and the other column does not follow.

`absolute inset-0` is the obvious fix and is also wrong: pinning top **and** bottom over-constrains
the box, and the browser resolves a negative `bottom` and lets content win again. What holds is
absolute + `top-0` + an explicit `h-full`, resolving against a grid item the stretch has already
sized. Then the panel contributes nothing to the row and its internal scroll takes the overflow.

## Standing checks

Every sprint, every level that touches a component.

**Motion stack** — verified 2026-07-27 against `~/thoven/frontend`:

| library | reality | when |
|---|---|---|
| `framer-motion` | **254 files** | the default for everything |
| `gsap` | **3 files** — `HomepageConductorMotion.tsx`, `TurnkeySection.tsx`, `TailoredSection.tsx` | scroll-*scrubbed* and pinned sequences only. Deliberate, with `gsap.matchMedia()` |
| `lottie-react` | **0 files** — installed, unused | the peak-moment slot is empty |

The frontend's own `motion` skill owns this decision and routes accordingly; follow it rather
than this table when they disagree. Every animation carries a `useReducedMotion()` fallback —
via `getTransition()` from `lib/motion-config.ts` for Framer, `gsap.matchMedia()` for GSAP.

**Values found by feel go through `dialkit`** — the repo's dev-only tuning panel. Dial the real
component, Copy, and land the result as a token module with a test. A number guessed in a
standalone CDN prototype gets copied into the build as a number instead of as the system.

**Icons** — settled in phase 6 (2026-07-29). The house set is **Jelly** (FontAwesome Pro+ kit
`@awesome.me/kit-cf7b1d7fec`) through `<Icon>` for chrome (≤24px, `file:line`-licensed exceptions)
and **OpenMoji** through `<Emoji>` for structure (≥32px) — the tier is decided by JOB, not size.
K2: hue marks state, never decoration (duo 700/100 active, flat gray-400 rest, flat `currentColor`
on filled, flat `-600` semantic). `lucide-react` and `@phosphor-icons/react` are uninstalled;
`__tests__/icon-tier-scan.test.ts` enforces all of it. Deep reference: `docs/design/icons.md`.

**`components/ui/` holds primitives only.** Feature components living there today:
`delivery-scheduler` · `flip-card` · `flip-card-credentials` · `floating-panel` ·
`morphing-square` · `success-pill` · `swipeable-card-fan`. Move one out when you touch it.

**Raw `<button>` only inside `components/ui/`.** Everywhere else uses the shared component, or
it is a one-off accessibility review.

**No raw colours.** `bg-blue-600`, hand-rolled shadows, and hex literals all route through
tokens instead.

**Focus rings are `:focus-visible` only** — keyboard and assistive tech, never on mouse click.

**Known drift, convert on contact** — `BundleList.tsx` · `join-class-modal.tsx` ·
`parent-greeting-card.tsx`. **Refreshed 2026-08-04, same disease at real scale:** 7 files use the
real shared `Dialog`/`ResponsiveDialog` against **95** hand-rolled `fixed inset-0` modals, zero
overlap between the two lists. Tabs: 7 real vs **19** hand-rolled `activeTab`-state switchers, 4
overlap. Same shape as the pre-phase-2 button count (14 real vs ~276 hand-rolled). Don't sweep
these — convert whichever ones W2–W5 are already touching, same rule as everything else in this
list.
