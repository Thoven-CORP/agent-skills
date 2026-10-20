# The proposal: four strategies to improve and maintain andres-mode and verify

2026-10-19. Combines AUDIT.md (what happened), VERIFICATION.md (what checking costs and catches, measured) and the maintain-verification-skill pass (text versus engines). Outcome of that pass: **changed**. Plain language; the skill drafts in `proposal/` carry the exact wording.

## What is happening today, in one paragraph

When an agent finishes a change it runs one big checker, `bin/verify`. That checker runs the same set of checks whatever the change was. Two of them are cheap (lint 8 s, types 9 s). The rest run other people's tests: every test that imports the changed file, and then the same set again twice per edited block of code to see if the tests notice the block being removed. On a small UI change that is 12 minutes; on a backend service it is 42 minutes; on a branch with many files it hits a timeout and is skipped. Meanwhile the 19 design checks that would have caught most of what you complained about (raw colours, wrong icons, missing focus rings) never run during the work, because the checker does not know they relate to a component. And nothing checks the change against the spec or looks at the real page. So agents wait on a slow gate that misses the defects we actually have.

## Strategy 1. Match the check to the change

The check should be the smallest thing that can prove the change wrong. Touch a component: run its own test, the design scans, and look at the page. Touch a service: run its spec. Touch a route or config: run the build. Touch nothing with logic: no mutation test. `bin/verify` already has every one of these checks as a row; the change is which rows it picks and how far they reach (direct importers once, not everything transitively, not per block).

What you get: a two-button change checks in about 30 seconds instead of 12 minutes. A backend method in about 2 minutes instead of 42. Nothing waits on the machine lock for an hour, so nobody bypasses the gate.

## Strategy 2. Make the design and spec checks part of building, not part of closing

Today parity screenshots and spec checks are a close step, done once at the end, often on a mock route. In the new andres-mode they are the builder's homework before saying DONE: one line per behaviour naming the decision it implements, the real page at 1440 and 390 beside the frame, shared components and tokens, the design scan suite green, and the proof shown in chat before any question. The reviewer runs the same six lines over the diff instead of rerunning the suite.

What you get: the defects you catch by eye (wrong component, raw value, feature nobody asked for, lesson vs session) get caught by the agent that made them, while the page is still open. Reviews get shorter because they read a diff against a list, not rerun tests.

## Strategy 3. One short rule set, in one place, that main actually loads

andres-mode is the file that says how we work, and today main cannot load it (it is typed-only), its verify sentence disagrees with the law and the review template, and it has no spec or design step. The rewrite makes it loadable at session start, replaces "Tests and verification" with "Check your own work", states the cadence once (targeted checks while editing, one bin/verify per slice before DONE, CI on the integration PR, nothing on push), and the other files point at it instead of restating it. verify shrinks to the protocol; verify-this shrinks to claim, smallest surface, baseline only when the claim is a change, one verdict.

What you get: every agent reads the same short list. No more three versions of the verify rule, no more briefs that re-paste capture instructions.

## Strategy 4. Maintain it by measuring, once a sprint

The skill rots when the app or the tests change. Keep it honest with a 20-minute pass each sprint, the maintain-verification-skill loop: time each check on this machine, list which defect classes slipped since the last pass (from review findings and your corrections), and move checks between the "while editing" and "before DONE" tiers accordingly. A check that takes under 10 seconds moves into editing; a check that caught nothing in two sprints moves out of the gate and into CI only. Write the numbers into VERIFICATION.md section 2 so the next pass has a baseline.

What you get: the gate keeps shrinking toward the defects we have. Nobody has to argue about whether mutation is worth it; the numbers say.

## What this does to your dev system

- Faster loop: agents verify in seconds while they work instead of in one slow block at the end. Fewer machine-lock queues, less CPU, fewer `--no-verify` pushes.
- Better checks where it matters: design scans and the real page on every UI change; spec line per behaviour; mutation only where a logic bug could hide.
- Smarter skills: check selection follows the diff, so the agent does not have to decide, and the decision is the same in every pane.
- Less text: andres-mode is the one place the rules live; verify and verify-this are short; brief.md and review.md point rather than restate.
- Nothing new to run or install. No hooks, no new scripts, no new reporting. The changes are skill text plus row-selection logic inside the existing `bin/verify` in each repo.
- Risks: mutation covers less, so a logic hunk in a component is no longer mutation-tested; the design scans become a hard requirement on component diffs, so a scan with a pre-existing failure blocks until fixed (one such failure exists in `LibraryView.test.tsx` today on main).

## Order of work

1. andres-mode rewrite and LEARNINGS/README cleanup (half a day, agent-skills PR, merges directly).
2. verify and verify-this rewrite, brief.md and review.md repointed (half a day, same PR).
3. `bin/verify` row selection in both repos: design scans on component diffs, direct importers once, mutation scoped, build conditional (one day, one small PR per repo, held).
4. First maintenance pass two weeks later.
