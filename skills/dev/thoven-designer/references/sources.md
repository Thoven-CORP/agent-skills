# Designer sources (fallback)

For lookup and compliance, read this file when `classify` returns `undecided` or a non-binding answer. Binding lookup answers name the source to open. Design and critique stay in [SKILL.md](../SKILL.md#design-and-critique).

## Where the system lives

Four tiers and a generated index. **One tier binds.** Established 2026-07-28, phase 3 of the 2.0
design track; index added 2026-11-12 (THV-1735).

```
Tier 0   lib/*-tokens.ts + tests        the ONLY binding layer
         tools/build-palette.mjs        generates the palette
Index    design/components.md           every components/ui component: status, when to use, options
         design/tokens.md               every token module, what it locks, its test
         design/blocks.md               every composite, who draws loading, empty and error
Tier 1   DESIGN.md                      the hub - decisions and why
Tier 2   design/*.md                    deep reference per part
Tier 3   docs/design-system.html        rendered view, compiled from app/globals.css
```

Everything below Tier 0 is derived. The index is derived by script: `pnpm run design:catalogue`
writes it from the code and `__tests__/design-catalogue.test.ts` fails when it is stale, so it is
the first file to open for "what exists".

## The map

Base map verified 2026-08-16 against `~/thoven/frontend`; async ownership re-verified 2026-09-22
against `~/thoven/frontend-teacher-2.0`. Read the binding source **first**; reach for the deep
reference only for intent and rationale.

| Question | Binding source (Tier 0) | Deep reference |
|---|---|---|
| Colour, palette, status hues | `tools/build-palette.mjs` (`PALETTE`) generates the `GENERATED:palette` region of `app/globals.css`; `__tests__/palette.test.ts` | `design/color.md` |
| Type ramp, fonts, weights | `app/globals.css` type roles; `__tests__/type-roles.test.ts`; `lib/cn-type-roles.test.ts` | `design/typography.md` |
| Existing content-title roles and `text-supporting` colour (muted is state-specific) | `app/globals.css` semantic colour aliases and existing type roles; `components/teacher/private-lessons/LessonsOverview.sheet.browser.test.tsx` computed browser paint | `design/typography.md` and `design/color.md` |
| Buttons, ledges, variants | `thovenButtonTokens` in `lib/live-lesson-tokens.ts:53`; `components/ui/thoven-button.tsx`; `__tests__/design-system-doc.test.ts` | `design/buttons.md` |
| Icons, the two tiers, K2 | `lib/icon-tokens.ts`; `__tests__/icon-tier-scan.test.ts`, `__tests__/icon-tokens.test.ts`, `__tests__/openmoji-icon-map.test.ts` | `design/icons.md` |
| Motion, springs, reduced motion | `lib/motion-config.ts` | `design/motion.md` |
| Async loading, unavailable, degraded, action, field-error, and empty states | `lib/loading-tokens.ts`; `components/ui/shimmer-text.tsx`; `components/shared/RowSkeleton.tsx`; `components/ui/thoven-button.tsx`; the owning feature component listed below | `docs/design/async-states.md` |
| Layout, viewport, spacing | *(no token module)* | `design/layout.md` |
| What a thing is **called** | *(no token module)* | frontend `design/lexicon/LEXICON.md` - LIVING, not frozen |
| Does a component exist? | `design/components.md`: status (`current`, `deprecated` with its replacement, `unused`), when to use it, options, slots | [Does it already exist](#does-it-already-exist) |
| Which composite, and who draws its loading, empty and error | `design/blocks.md`, generated from `design/blocks.registry.json` | [Async-state ownership](#async-state-ownership) |
| Which token module owns a value, and what locks it | `design/tokens.md` | the module's own header comment |

**Anything not in this table:** find its binding layer in `design/tokens.md` before answering.

### Async-state ownership

Loading appearance is shared, but async behavior remains owned by the feature that can explain
and recover from it. Do not introduce one global state union or one component that guesses every
consumer's retry policy.

| State | Use | Authority |
|---|---|---|
| Known collection shape | Reserved row skeletons | `components/shared/RowSkeleton.tsx` backed by `lib/loading-tokens.ts` |
| Unknown Material collection size | Text shimmer | `components/ui/shimmer-text.tsx` backed by `lib/loading-tokens.ts` |
| Held action and success feedback | The canonical button states | `components/ui/thoven-button.tsx` |
| Notification feed unusable | Inline recovery inside the rows region | `components/teacher/NotificationsPanel/NotificationsUnavailableState.tsx` |
| Notification refresh degraded while usable rows remain | One warning toast per failure episode; content stays mounted | `components/teacher/dashboard/TeacherDashboardNotificationsCoordinator.tsx`; `components/teacher/NotificationsPanel/notifications-toast.ts` |
| Disconnected Business Overview before earnings exist | Passive empty state with no Stripe action | `components/teacher/dashboard/BusinessOverviewEmptyState.tsx` |
| Material copy lifecycle | Copying shimmer, wrapped failure reason, code-owned retry eligibility, and visible dismiss | `components/teacher/library/GhostMaterialCard.tsx` |
| Form validation | Field-local message connected to the invalid control; available but not yet adopted by a production Teacher 2.0 form | `components/ui/datefield.tsx`; `components/ui/field.tsx` |
| Teacher payment action failure | Action-local retry without replacing the surrounding request | `components/teacher/payments/TeacherPaymentRequestActions.tsx` |

`app/dev/async-ui-states/page.tsx` is a review surface. It mounts deterministic states from the
real components, but it owns no product behavior and does not count as production adoption.

Retry eligibility is domain behavior, not a visual token. The consumer maps known failure codes to
retryable or permanent outcomes. A global error primitive may own appearance and accessibility,
but it must not invent retry, reload, dismissal, or empty-state semantics.

## Answering a design-system question

1. **Read the binding source first.** A Tier 2 doc alone is never a sufficient answer - it is
   derived, and this repo has a demonstrated history of prose the code ignores at scale.
2. **Check both lock tiers** (below) before saying anything can change.
3. **Say which tier the answer came from.** "Tier 0, enforced by `__tests__/palette.test.ts`" and
   "Tier 2 prose, no test" are different levels of confidence and the asker needs to know which.
4. **If Tier 0 and Tier 2 disagree, the doc is the bug** - report it as a defect, don't silently
   pick one.
5. **If nothing binds it, say so.** An exploratory choice may be proposed as provisional; a binding decision needs Andres and a decision log. Do not invent a lock.
6. **A ruling made this session is not in a file yet.** Check what this session already ruled,
   then hand it to `workspace` `capture`.

## Locks

| Tier | Where it lives | Binding? |
|---|---|---|
| **Enforced** | A token module plus a unit test | **Yes.** Drift fails the suite |
| **Declared** | `DESIGN.md`, `design/`, or a sprint decision log | Advisory. A human has to notice |

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

1. **`design/components.md`**, then `design/blocks.md` for a composite. Build on a `current` row. A
   `deprecated` row names its replacement. An `unused` row has no caller yet: read it before
   building on it. `components/ui/` holds primitives only, and
   `__tests__/invariants/ui-boundary-scan.test.ts` fails when a file there imports feature code.
2. **The known-drift problem.** Count both sides before concluding nothing exists - the real
   shared component usually exists and is outnumbered by hand-rolled copies. As of 2026-08-04:
   7 real `Dialog`/`ResponsiveDialog` against **95** hand-rolled `fixed inset-0` modals, with
   *zero* overlap; 7 real Tabs against 19 hand-rolled. Grepping for the pattern finds the copies;
   grepping for the import finds the real one. **Do both.**
   Before grepping for component copies or imports at all, `graphify query` the component node —
   missing-import edges surface hand-rolls that grep cannot see.
   The hand-built buttons, spinners, chevrons and close buttons, the imports of a deprecated
   component and the off-palette colours are counted per file in
   `__tests__/library-use-scan-baseline.json`; `pnpm run design:audit` prints today's totals. A
   file in that baseline holds a copy to replace, never a pattern to follow.
3. **The library tables before hand-rolling** - Magic UI, React Bits, Aceternity, Kokonut, Fancy,
   Canvas UI, Rare UI, Interior. The first seven give you a *look* that then
   needs a token pass; **Interior** ([interior.dev](https://www.interior.dev/), MIT, dep is the
   `motion` we already run) gives you a headless `useX()` hook that touches no class names - reach
   for it when what is missing is the interaction's *state machine* (abandonment paths, reserved
   space for async states, keyboard, reduced-motion) rather than its appearance. Fenced by
   frontend `design/STACK.md` **rule 7** - gap-filler only; wherever base-ui has the primitive,
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
| Deeper typography craft, when needed | `better-typography` |
| Colour, contrast, palette | `better-colors` |
| Deeper layout craft, when needed | `better-layout` |
| Accessibility | `better-accessibility` |
| Interface patterns | `better-interface` |
| Copy a person reads: UX copy, a page, an email | `thoven-branding`, which runs `better-writing` with `BRANDING.md` |
| Art: stickers, stamps, instruments, icons, marks, hand-drawn outlines, frames, photos, Thovie | `thoven-art`, which reads `design/art/INDEX.md` |
| Component polish | `better-ui` |
| Choosing a library instead of hand-rolling | `pick-ui-library` |
| **Building a new surface end to end** | **`building-components`** |
| Building a prototype | `prototype` |
| Motion: naming / finding / building / checking | `animation-vocabulary` · `find-animation-opportunities` · `improve-animations` · `review-animations` |
| Whole-surface design and critique | [Thoven Designer](../SKILL.md#design-and-critique); use specialist skills to support a concern |

## Common mistakes

| Mistake | Fix |
|---|---|
| Answering from `design/*.md` alone | That tier is derived. Read the token module first |
| Listing `components/ui/` to see what exists | Open `design/components.md`: the folder shows files, the index shows status and replacement |
| Quoting a value from memory because it is "well known" | The rejected button hover shipped for months that way |
| Treating a grep miss as "nothing exists" | Declared locks are not greppable. Open `DESIGN.md` |
| "No component exists" after grepping the pattern | Grep the *import* too - the real one is outnumbered |
| Asserting a `className` in a test | Assert the compiled CSS / computed style |
| Presenting an unlocked value as a ruling | Mark an exploratory choice provisional; a binding decision needs Andres and a decision log |
| Restating a value into a spec | Point at the source. Restatement is how the 21 contradictions happened |
| Ignoring a ruling made minutes ago because it is in no file | It binds now. Answer with it, then hand it to `workspace` `capture` |
| Writing a token test for a value still in Design | The proto holds it until Build |
| Leaving his browser at a viewport you set | Restore it. He reviews through that window |
| Reviewing at a viewport you chose | His. The shell was fitted to it |
