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

Base map verified 2026-08-16 against `~/thoven/frontend`; async ownership re-verified 2026-09-22
against `~/thoven/frontend-teacher-2.0`. Read the binding source **first**; reach for the deep
reference only for intent and rationale.

| Question | Binding source (Tier 0) | Deep reference |
|---|---|---|
| Colour, palette, status hues | `tools/build-palette.mjs` (`PALETTE`) generates the `GENERATED:palette` region of `app/globals.css`; `__tests__/palette.test.ts` | `design/color.md` |
| Type ramp, fonts, weights | `app/globals.css` type roles; `__tests__/type-roles.test.ts`; `lib/cn-type-roles.test.ts` | `design/typography.md` |
| Existing content-title roles and `text-supporting` colour (muted is state-specific) | `app/globals.css` semantic colour aliases and existing type roles; `components/teacher/private-lessons/LessonsOverview.sheet.browser.test.tsx` computed browser paint | `design/typography.md` and `design/color.md` |
| Buttons, ledges, variants | `thovenButtonTokens` in `lib/live-lesson-tokens.ts:53`; `components/ui/thoven-button.tsx`; `__tests__/design-system-doc.test.ts` | `design/buttons.md` |
| Icons, the two tiers, K2 | `lib/icon-tokens.ts`; `__tests__/icon-tier-scan.test.ts`, `__tests__/icon-tokens.test.ts`, `__tests__/openmoji-icon-map.test.ts` | `docs/design/icons.md` |
| Motion, springs, reduced motion | `lib/motion-config.ts` | `docs/design/motion.md` |
| Async loading, unavailable, degraded, action, field-error, and empty states | `lib/loading-tokens.ts`; `components/ui/shimmer-text.tsx`; `components/shared/RowSkeleton.tsx`; `components/ui/thoven-button.tsx`; the owning feature component listed below | `docs/design/async-states.md` |
| Layout, viewport, spacing | *(no token module)* | `docs/design/layout.md` |
| What a thing is **called** | *(no token module)* | frontend `design/lexicon/LEXICON.md` - LIVING, not frozen |
| Does a component exist? | `components/ui/` (primitives only) | [Does it already exist](#does-it-already-exist) |

**Anything not in this table:** find its binding layer before answering.

```bash
ls lib/*-tokens.ts && ls lib/*.test.ts __tests__/*.test.ts
```

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
5. **If nothing binds it, say so.** An unlocked value is a decision that needs Andres and a
   decision log, not a confident answer. Do not invent the ruling.
6. **A ruling made this session is not in a file yet.** Check what this session already ruled,
   then hand it to `workspace` `capture`.

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
| Type ramp, font choice, spacing | `better-typography` |
| Colour, contrast, palette | `better-colors` |
| Layout | `better-layout` |
| Accessibility | `better-accessibility` |
| Interface patterns | `better-interface` |
| Copy a person reads: UX copy, a page, an email | `thoven-branding`, which runs `better-writing` with `BRANDING.md` |
| Art: stickers, stamps, instruments, icons, marks, hand-drawn outlines, frames, photos, Thovie | `thoven-art`, which reads `design/art/INDEX.md` |
| Component polish | `better-ui` |
| Choosing a library instead of hand-rolling | `pick-ui-library` |
| **Building a new surface end to end** | **`building-components`** |
| Building a prototype | `prototype` |
| Motion: naming / finding / building / checking | `animation-vocabulary` · `find-animation-opportunities` · `improve-animations` · `review-animations` |
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
| Ignoring a ruling made minutes ago because it is in no file | It binds now. Answer with it, then hand it to `workspace` `capture` |
| Writing a token test for a value still in Design | The proto holds it until Build |
| Leaving his browser at a viewport you set | Restore it. He reviews through that window |
| Reviewing at a viewport you chose | His. The shell was fitted to it |
