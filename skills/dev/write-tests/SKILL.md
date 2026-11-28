---
name: write-tests
description: Decides whether a test earns its place, writes it first at an agreed seam, and prunes tests that do not. Use when writing, changing, auditing or deleting tests, or when a refactor touches tests.
---

# Write tests

A test exists to catch a credible regression in a core mechanism or a repeated failure (law, "Tests come from decisions"). Product flows are QA's (`qa-product`), because a flow changes and a unit test that restates it breaks with it. The repo's `TESTING.md` owns layers and commands.

## Pitfalls

- When two tests in one file fail, fix the earliest first, rerun the file alone, and drain leftover `...Once` queues with `vi.resetAllMocks()`, since `vi.clearAllMocks()` leaves them queued. (LEARNINGS 2026-08-14)
- A test that starts a CI script or child process sets or clears every environment variable the CI workflow sets that the child reads, so the workflow's value cannot leak in and fail it only in CI.
- Keep e2e to what jsdom cannot express, and run it on a production build's real route, never `next dev` or a `/dev` route. (LEARNINGS 2026-08-28)

## Pick the mode

| Task | Mode |
|---|---|
| A new or changed behaviour, or a bug fix | Write, below |
| Auditing tests, pruning an area, or a refactor that touches tests | [references/prune.md](references/prune.md) |

Both modes check every test against [references/junk-patterns.md](references/junk-patterns.md).

## Write

### 1. Decide the test earns its place

Answer all four; a missing answer means no test yet:

1. What observable behaviour or contract does it protect: scheduling, money, student privacy and COPPA, sign-in, the FE↔BE contract, or a failure that has happened more than once?
2. What credible regression turns it red?
3. Why does existing coverage miss that regression? Each contract has one owner test at the strongest boundary; extend its table or fixture before adding a near-duplicate.
4. Does it need a production seam (export, flag, injection hook) no production caller needs? Then test at the real boundary instead.

Then check it against every junk pattern.

**Done when:** the four answers are written, or you have decided no test, and named the check you ran instead (a script, a curl, a browser path).

### 2. Agree the seam

The seam is the boundary where the test sees what a user or caller sees: a request spec, a service's public method, a rendered component's DOM. For a bug, it is the seam where the real bug pattern occurs, not a shallower one that cannot replay the chain. No correct seam is itself the finding: report it.

**Done when:** the seam is named in your notes or the brief.

### 3. Red, then green

Write the test first and watch it fail for the intended reason, on the pre-fix code. Then change the code until it passes. A test that would still pass with every imported function returning `undefined` observes nothing; a test that breaks under a behaviour-preserving refactor asserts implementation, so rewrite it at the owning boundary.

**Done when:** you have the red run and the green run of the same command.

### 4. Hand off

Name each test added and the regression it catches ("added N tests" is not a handoff), and each test deleted and the proof that remains. Prove the change with `check-build`.

**Done when:** every added or deleted test is named with what it catches or what proof remains.
