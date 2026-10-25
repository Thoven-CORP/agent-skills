# Learnings — verify

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

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
