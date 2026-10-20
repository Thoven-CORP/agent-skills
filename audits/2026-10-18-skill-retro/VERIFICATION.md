# Verification: what we build, what it costs to check, what slips, and the protocol that follows

2026-10-19. First-principles pass over the three skills that carry verification (`verify`, `verify-this`, `andres-mode`), using `/automate-me` (update mode, mined from AUDIT.md sections 3 to 9) and `/maintain-verification-skill` (source wave over the engines, reconcile, triage). No new enforcement scripts. The output is a protocol agents apply inline and the skill text that carries it.

## 1. What we build (Oct 3 to 19, all branches)

| Frontend, 6,282 file touches | | Backend, 3,804 file touches | |
|---|---|---|---|
| components (UI) | 41% | specs | 41% |
| lib (logic, api) | 19% | app code | 34% |
| design tokens and docs | 8% | migrations, schema | 5% |
| tests | 6% | lib | 3% |
| protos | 5% | tooling, CI | 1% |
| tooling, CI | 4% | | |

Most of the work is a component or a service with its spec. Verification should be shaped for that.

## 2. What checking costs today (measured on this machine, 2026-10-19)

| Check | Scope today | Time | Catches, from the audit |
|---|---|---|---|
| oxlint | whole repo | 8 s | lint drift. Rarely slipped |
| tsc | whole repo | 9 s | types, stale callers of a renamed export. Cheap and already project-wide |
| design scans + token tests (19 files, 289 tests) | **never selected by bin/verify** (they read files with fs, so `vitest related` does not see them); CI only | 9 s | raw colours, icon tiers, focus rings, elevation, ledges, middle dots, type roles. The class of defect you flag most (F6) |
| one component's own test file | | 2.4 s | the behaviour the ticket names |
| `vitest related` on one component | transitive importers: 17 files, 356 tests | 79 s (68 s is import time) | dependants' assertions. Blew the 180 s cap at 291 files (THV-1189) |
| mutation, frontend | reruns the whole related set, red then restored, per production hunk | 2 × 79 s × hunks; 807 s measured; BLOCKED on new files and comment hunks | three deletable clauses on THV-1188. Real, but the costliest row by far |
| `bin/ci fast`, backend | on any change: Brakeman, bundler-audit, OpenAPI diff, manifest, structure.sql, tz-guard | minutes | security and schema drift, none of which appeared in the slipped-defect list |
| mutation, backend | reruns every mapped spec per hunk | 42 min, 50 min measured | same as frontend |

The two cheap repo-wide checks are fast. The time goes to running other people's tests many times over. The checks that match what actually slipped either never run inline (design scans) or do not exist (spec trace, real-route look).

## 3. What slipped, and the smallest check that catches it

| Defect class | Audit evidence | Why today's gate missed it | Smallest check |
|---|---|---|---|
| Design-system miss: raw values, wrong component, 48 px radio, clipped paperclip, circle empty state | F6 8+ slices; THV-1287, 1290 | scans are not "related" tests, so bin/verify never runs them; the builder never opened the page | run the 19 scan and token tests (9 s) on any component diff; look at the real route at 1440 and 390 before DONE |
| Spec or scope miss: overscoped settings onboarding, Student label never landed, Session vs lesson, invented stamps | F5, F8, V6 THV-1232; 13 reports | no step traces the diff to a decision id; briefs paraphrased the parent | one line per behaviour in the diff: "decision Dn, frame Fn". Anything without a line is scope |
| Wrong artifact or layer: frame vs content, proto vs component, mock route vs page | F7 8+; 19 reports | the check ran on what the builder made, not what the user reaches | the proof names the route a user reaches; a /dev or lab route is not a proof |
| Integration: stale callers, lint failure skipping CI type-check, `next build` | V5; THV-1107; 13 reports | slices ran only their own tests; build never ran | tsc project-wide already runs (9 s) and catches renamed exports; `next build` only when `app/**`, `next.config`, or a route file changes |
| Test of the input: className asserts, fixtures no endpoint emits, "cannot fail" tokens, specs asserting nothing | V7; 4 reports | mutation would catch some, at 13 to 50 min, and was waived | the builder's own red-then-green on the named behaviour, and the reviewer reading the assertion, not the suite |
| Parity captured late or blank | E3 | capture was a close step, not a build step | capture the state the moment it renders, from the real route, and look at it |

Lint and type errors are almost absent from the slipped list. The gate is tuned for the defects we do not have.

## 4. The protocol: verify the change you made, when you made it, with the smallest check that can fail it

Three moments. No step runs other people's tests more than once.

**While editing (seconds, every save-sized change)**
1. oxlint and tsc, whole repo (17 s together).
2. The file's own test, red before the change and green after, on the behaviour the ticket names.
3. Component or design value touched: the design scan and token suite (9 s).
4. Backend: rubocop on the changed files, the mapped spec file, the request spec of the controller touched.

**Before DONE (minutes, once per ticket). Check your own homework:**
5. Spec: every behaviour in the diff has a line "decision Dn" quoting the parent. No line, no behaviour.
6. Design: the real route, 1440 and 390, beside the frame. Shared component used where one exists; tokens, not values. Look at it; a difference the user has not confirmed is a defect.
7. Callers: tsc is green project-wide, and the direct importers' test files ran once (not transitive, not per hunk).
8. Mutation, only where it pays: a logic hunk in `lib/` or a service or model, run against its one mapped test file, red then green. Not on components, not on new files, not on comment or type hunks.
9. Build: `next build` only when a route, config or server file changed; `bin/ci fast` only when Gemfile, schema, routes or a controller changed.
10. Show it: the receipt block, the grid, the red and green lines. Then the question, if any.

**Before merge (CI, once per slice)**
11. CI on the integration PR is the full run. bin/verify does not run again on push.

**Reviewing each other** The verifier applies steps 5 to 8 to the diff and reads the assertions. It does not rerun the suite the receipt covers.

Cost for a two-button component change: today 8 + 9 + 79 + mutation (often BLOCKED) ≈ 12 min or a bypass; under the protocol ≈ 30 s plus the look. Backend service change: today 42 min; under the protocol one spec file, red and green, about 2 min.

## 5. What changes in each skill

**verify (SKILL.md, 10 lines → the protocol above).** Owns steps 1 to 4 and 7 to 9. Scope rules by diff type instead of one row set. `related` becomes direct importers once; mutation scoped to logic hunks and one mapped test; design scans selected on any `components/` or token diff. These are selection changes to `bin/verify`'s existing rows, not new tooling.

**verify-this (trim).** Drop the classify step and the six-folder artifact tree. Keep: falsifiable claim, baseline only when the claim is a change, same command both sides, one verdict. Fits in 25 lines.

**andres-mode ("Tests and verification" → "Check your own work").** Carries steps 5, 6 and 10 as how we work: decision id per behaviour, real route at both widths beside the frame, shared components and tokens, red-then-green on the named behaviour, show then ask. The reviewer's first two sections are the same list.

**maintain-verification-skill outcome: changed.** Drift fixed in the same PR: `review.md` and `brief.md` point at the protocol instead of restating capture rules; the cadence sentence appears once; `skills.md` moment "before DONE: /verify-this over every Acceptance line" becomes "before DONE: verify steps 5 to 10".

Drafts: `proposal/verify.SKILL.md`, `proposal/verify-this.SKILL.md`, `proposal/andres-mode.SKILL.md` (Tests section replaced).
