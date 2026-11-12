# Learnings — verify

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-12 — verify is the one home of the cadence

> session · 2026-11-12 · meta-analysis instructions rewrite · broken-rule · applied · seen 2+

**What happened.** The cadence was written in nine files and the parity method in seven, and they disagreed after each edit.
**Why.** Each copy needed its own fix, so some stayed stale.
**What changed.** The builder runs each exit line's proof once plus lint and type-check; callers, the extra case, full verify and CI policy are wider runs; parity is a pointer to the law. Details: `releases/2026-11-12-instructions-rewrite.md`.

## 2026-11-05 — the builder runs parity itself; CI has no Parity check

> reflect · 2026-11-05 · e3582b3d · broken-rule · applied · seen 1

**What happened.** Frontend #575 removed the CI Parity check on Nov 2 ("remove CI parity"). Step 5 still told the builder to push and let the Parity check shoot the states, so in e3582b3d the agent leaned on a gate that no longer ran and never captured the Library row at 390 that its own ticket named.
**Why.** The step delegated the capture to CI, and nothing told the builder when that gate went away.
**What changed.** Step 5: the builder runs `parity-run.mjs` itself before DONE through frontend `TESTING.md`'s Mini parity pilot, for every surface the ticket names, sibling rows included; an unmapped surface gets a 390 capture of the commit before the change; the grid goes in the DONE report. The law's Design parity line says the same. Still open: andres-mode Parity, four dispatch-work references and CLAUDE-root.md:54 cite the old check (other owners this round).

## 2026-10-25 — mutation runs on GitHub; locally only on request

> session · 2026-10-25 · c6bb2950 · correction · applied · seen 1

**What happened.** Andres: "Should we also run mutations just on github", then "or we can have it as a local option… on my invocation." Mutation was the heaviest row of the full verify: 46 local runs in a week, one backend run 23 min.
**Why.** Even once per parent, mutation reruns the tests per changed hunk, which a shared 16 GB Mac cannot absorb.
**What changed.** Standing. Mutation runs in CI on PRs into `main` that change logic, report-only for two weeks and then required (THV-1433 T7; the job is a slice still to build). Locally `--mutation` runs only when Andres asks; the parent's full verify runs without it. verify, andres-mode and review.md say so.

## 2026-10-25 — the full bin/verify runs on request or at the parent, not per ticket

> session · 2026-10-25 · c6bb2950 · correction · applied · seen 1

**What happened.** Hours after "once per ticket" shipped, Andres: "I don't think the full verify should run once per ticket, isn't that excessive… shouldn't the verify maybe full run when I ask for it or the parent calls for it." The week's numbers back him: 415 runs, 1,399+ min on the Mac, while the agents' own test runs were already path-scoped.
**Why.** `bin/verify` was the per-ticket evidence format, so every ticket paid for its build, browser, knip and fixture rows whatever the diff was.
**What changed.** Standing from now. A ticket's evidence is its targeted checks: lint, type-check, touched and direct-importer test files by path, and parity on a UI ticket through `scripts/verify/parity-run.mjs`, each command pasted with its pass line. CI runs on the PR. The full `bin/verify` (with `--mutation` on logic) runs only when Andres asks, or once at the parent, before the integration PR into `main`. verify, andres-mode, dispatch-work (brief, review, standing, the DONE table), the law and root CLAUDE.md all say so.

## 2026-10-25 — bin/verify runs once per ticket; no final run, no verifier rerun

> session · 2026-10-25 · c6bb2950 · correction · applied · seen 1

**What happened.** Andres: "I changed one sidebar component and it literally ran the full test. When it ran some fixes that it found, it ran another full suite end to end and then it ran another one." Read-only mapping found up to three `bin/verify` runs per ticket: the builder's at DONE, a "final" run that review.md asked for after fix rounds, and the verifier's own run on a stale receipt. verify steps 4 and 6 also told agents to run `vitest related`, `next build` and `bin/ci fast` by hand, which step 7 then ran again as rows.
**Why.** brief.md, review.md and verify each named a different number of runs, and every run starts from scratch.
**What changed.** verify: steps 4 and 6 are rows of step 7 and never run by hand as well; the whole suite, e2e and repeat sweeps are CI's; no rerun after a fix round or for the verifier. brief.md: once per ticket, no final run. review.md: cite the builder's block; a fix round proves itself with the tests that cover its files; the verifier never runs `bin/verify`. Still open: the `related` row's fallback runs transitive `vitest related` when no direct test exists, and the CI and push-hook changes.

## 2026-09-23 — Copy and small UI changes take targeted checks

> reflect · 2026-09-23 · memory:feedback_targeted_tests_for_copy_changes · correction · applied · seen 1

**What happened.** While setting THV-755's definition of done, Andres asked for targeted DOM tests, curl checks and a `/thoven-designer` sweep on copy and small UI tickets, never full suites or heavy Vitest sweeps.
**Why.** Full runs cost time and bury the signal in unrelated baseline failures.
**What changed.** Pitfall line: DOM tests on the changed components only, curl for any API-backed claim, a `/thoven-designer` sweep that also names other bad actors on the surface. Type-check and lint on touched files stay, and the once-per-slice `bin/verify` in step 7 still runs. Heavier gates (recordings, thermo) run only when he asks.

## 2026-08-22 — Never leave a resized browser behind

> reflect · 2026-08-22 · memory:feedback_never_leave_a_resized_viewport · correction · applied · seen 2

**What happened.** The Playwright viewport was set to 1280x800 to verify the teacher dashboard and left there. Andres looked at that window, saw the notification panel cut off with a dark band past the forced viewport, and concluded a night of fit work had been reverted. A headless probe over 21 sizes showed the panel 19px above the fold at every one. An hour went to diagnosing a correct layout. He had said the same the day before.
**Why.** A visible browser is his screen as much as the agent's. A measurement viewport left in place reads as the product.
**What changed.** Pitfall line: measure headless from a script (run from the repo root so @playwright/test resolves); if a visible browser is needed, restore the viewport before replying and say so.

## 2026-08-08 — A browser-specific fix is proven in that browser

> reflect · 2026-08-08 · memory:feedback_verify_browser_specific_fixes_in_that_browser · skill-gap · applied · seen 1

**What happened.** A commit added a seek hack to the student video recorder "to fix the scrubber on Safari" and cited "real-browser proof" from a fake-camera Chromium suite. Safari was never run. On a long clip Safari's forced seek takes seconds, a play press mid-seek yanks the playhead to 0 and interrupts WebKit's pending `play()`, and Sentry caught the unhandled `AbortError`. Chrome resolves the seek too fast to reproduce it.
**Why.** "Real-browser tested" reads as stronger evidence than it is when the browser under test is not the one the fix targets.
**What changed.** Pitfall line: run the browser the rationale names, or say in the commit which browser the proof came from.
