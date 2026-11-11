---
name: test-audit
description: "Invoke whenever writing, changing, reviewing, or sweeping tests in a Thoven repo. Authoring gate for new tests plus audit workflow for low-value, implementation-coupled, or duplicative tests and the test-only production seams they demand."
---

# Test Audit

Adapted from OpenClaw's `test-audit` skill (MIT,
github.com/openclaw/openclaw `.agents/skills/test-audit`). The value bar is
theirs; the commands, examples and scope rules are Thoven's.

Three modes, one value bar. Authoring mode gates every new or changed test at
write time. Audit mode runs focused sweeps of tests that re-assert source,
duplicate stronger proof, couple behavior to implementation, or keep test-only
production seams alive. Later rounds of one audit session append to its open
branch: one PR per repo per audit session. Prefer the canonical existing test,
fixture or helper over a new one, and consolidate rather than add; optimize for
confidence, not deletion count. Campaign mode prunes one
whole area's test surface (every test file a feature or domain owns); before
starting one, read [CAMPAIGN.md](CAMPAIGN.md).

## Pitfalls

- Run a Playwright design gate on the production route of a production build (`pnpm run build`, then `next start`), never `next dev` or a `/dev/*` route alone; keep e2e to what jsdom cannot express, and curl the served stylesheet to assert the class or custom property exists. (LEARNINGS 2026-08-28)
- When two tests in one file fail, fix the earliest first, rerun the file alone, and drain leftover `...Once` queues with `vi.resetAllMocks()`, since `vi.clearAllMocks()` leaves them queued. (LEARNINGS 2026-08-14)

## Authoring gate

Before adding any test, answer four questions; a missing answer means do not
add it yet:

1. What observable behavior, invariant, or independent contract does it protect?
2. What credible regression makes it fail?
3. Why does existing coverage not already catch that failure? Each contract has
   one primary test owner at the strongest boundary; another layer needs its
   own distinct risk, such as a transport or lifecycle failure the owner cannot
   reach. Prefer extending a table-driven case or shared fixture over a
   near-duplicate test; consolidate duplicated setup in the same change.
4. Does it need a production seam (export, flag, wrapper, injection hook) that no
   production caller needs? If yes, move the test to the real boundary instead.

Then check the test against every [junk pattern](#junk-patterns); a match fails
the gate unless the [retention bar](#retention-bar) names the contract it
independently guards. A test that would break under behavior-preserving
refactoring is asserting implementation, not behavior; rewrite it at the
owning boundary before landing it. The quick check from
`principle-test-behavior-not-implementation` applies: if the test would still
pass when every function it imports returned `undefined`, it observes nothing.

Bug regression tests must fail on the pre-fix code for the intended reason and
pass after the owner-boundary repair. A regression test that never demonstrably
failed proves the mock, not the fix. One regression at the owner boundary
covers the bug; do not replay the same scenario at every layer it crosses.

A test that starts a CI script or another child process sets or clears every
environment variable the CI workflow sets that the child reads, so the
workflow's own value cannot leak in and fail the test only in CI.

When no test passes the gate, add none, and report the check you ran instead
(a targeted script, a browser path, a real payload). In the handoff, name each
test you added and the regression it catches; "added N tests" is not a handoff.

## Junk patterns

The shared checklist for both modes: the authoring gate rejects a new test that
matches one, and audits hunt for existing tests that do. Thoven incidents are
in brackets.

- assertion-free coverage probes;
- self-comparisons and identity copiers;
- copied fixtures, inventories, manifests, or export lists;
- exact source, import, or string greps [`readFileSync('page.tsx')` then
  `toContain('robots: …')` in the state page guards];
- `className` or Tailwind class-string assertions in place of the compiled CSS
  or the rendered result [four className tests stayed green while the CSS
  emitted nothing; use the compiled-sheet helper from THV-1014];
- private predicate or call-shape tests duplicated at real boundaries;
- duplicate invocations of the same contract;
- provider-local replays of shared helpers;
- tests whose only purpose is preserving test-only exports, globals, or wrappers;
- dead production code whose only callers are tests;
- expected values produced by the helper or renderer under test;
- mocks that implement the asserted behavior, or one identical mock standing in
  for different APIs [a mocked `fetch` returns `xp_awarded: 25`, the test
  asserts 25; the backend never sent the field];
- a payload key asserted `nil` without asserting the key exists
  [`expect(json["xp_awarded"]).to be_nil` passes when the key is missing];
- fixtures that supply the receipt, admission, or callback ordering the owner
  should produce, or persistence asserted against a store the path never writes
  [a hand-built `files_count: 1` for a field the backend never sent];
- capability tests that restate declared flags instead of exercising the
  delivery or acknowledgement the flag promises;
- negative controls that pass for an unrelated reason, such as a denial from a
  different guard, a rejection the production path never reaches, or a testid
  nothing mounts;
- names or fixtures that promise more than the input exercises, such as a
  "retires the window" test asserting the window was not cleared;
- a guard or scan tested only on hand-written samples, never on the real
  files or output it guards; it stays green while the real files break the
  rule.

## Value bar

Tests justify their maintenance cost by protecting behavior, a credible
regression, or an independently meaningful contract. In an audit, an existing
test that must change for behavior-preserving source reorganization is suspect,
not automatically deletable; the authoring gate still rejects new ones.

Before judging a candidate, read the complete test and production owner, its
entry point, callers, callees, sibling implementations, overlapping tests, CI
routing, and relevant history. Read the root and repo `CLAUDE.md` first. Use
`graphify` for callers across files and grep for string literals. When the test
claims dependency-backed behavior, inspect the dependency source or types
directly.

## Discovery

Keep discovery read-only and report evidence before editing. For broad scope,
run parallel read-only discovery lanes:

- frontend `lib/`, `hooks/`, `contexts/`;
- frontend `components/`, `app/`, `e2e/`;
- backend `spec/`;
- a cross-repo pattern sweep (tests that assert copied text, config, or class
  strings).

Outside campaign mode, prefer a few high-confidence candidates over a large
speculative inventory. Hunt for the [junk patterns](#junk-patterns).

## Retention bar

Where a kept test runs is a separate question from whether it is kept. Each repo's `TESTING.md`, "What CI runs", holds the policy (Andres, 2026-11-11, THV-1751): admin screens, `/dev` and lab routes, design scans and token locks stay out of CI by path, and an admin route keeps only its `*.access.test.tsx` there. Do not delete a good test to get it out of CI; its path decides the lane.

Keep a test when it independently enforces a public API, the FE↔BE contract
(`contract/`, OpenAPI, a feature's `decisions/api.md`), config, migration,
storage, security, auth, money, COPPA and student privacy, a design lock held by
a `lib/*-tokens.ts` module, a default, or an architecture contract. Also keep:

- call ordering when order is observable behavior;
- regressions with a credible failure mode;
- source inspection when it is the cheapest independent guard: it fails when
  the contract changes (the user-facing key, byte, or path) and survives an
  identifier-only refactor [`spec/architecture/owners_spec.rb`];
- a retained test that fails on the baseline: treat it as a possible product
  bug, reproduce it, and repair the owner rather than deleting it.

Static or slow is not a deletion reason. A test that resembles implementation
may still be the independent contract; prove otherwise before removing it.

## Candidate evidence

Record every field below before editing. A missing field means the candidate is
not ready for deletion:

- exact test name and location;
- what failure it can actually detect;
- non-test callers of the covered production or support seam;
- stronger remaining owner-boundary proof, or why no proof is needed;
- relevant history and the reason the test or seam exists;
- production or test-support deletion unlocked;
- risk and the focused validation command.

Show Andres the candidate list before editing anything.

## Edit shape

Choose one coherent owner-boundary batch. Move retained regressions to their
canonical owners. Consolidate repeated package or dependency assertions into
one generic contract. Do not add replacement tests that restate the same
implementation, and do not convert uncertain candidates into cleanup to
increase deletion counts.

**Audits edit tests only.** Production code (`app/`, `components/`, `lib/`,
`hooks/`, `contexts/` outside test files, and backend `app/`) stays unchanged
unless Andres approves it for that batch. List dead production code and
test-only production seams the audit finds as named follow-ups instead
(THV-1008 set this rule: "I wanted tests audited, not actual code audited").

## Validation

Read the checkout's `TESTING.md` before choosing commands: it owns unit, browser, contract,
lint and merge-gate routing. Where adopted, runtime assertions, compiled-style browser proof,
generated response types and raw-ID guards complement this value bar; passing a detector
does not establish the behavior a test claims. Use available commands in that revision;
THV-1131's diff-driven `bin/verify` is separate work until its implementation is present.

Run the tests and checks the change touches, never the full suite when a
targeted run will do. Never edit source or tests while a test run is going in
the same worktree.

1. Run the owner and sibling tests you touched:
   frontend `pnpm exec vitest run <paths>`; backend
   `bundle exec rspec <paths>`.
2. For a removed source grep or copied list, run the script or check that owns
   the real contract (`pnpm run contract-check`, `bin/ci fast`, the scan the
   test duplicated).
3. Frontend: `pnpm run type-check` and `pnpm exec eslint <paths>`. Backend:
   `bundle exec rubocop <paths>`. Then `git diff --check`.
4. Frontend: `pnpm run check:test-collection`, so a deleted file does not leave
   a shard count wrong.
5. Inspect `git diff --numstat`; report production/tooling separately from
   tests and test support.
6. Run `verify` before reporting done.

## Landing and continuation

Commit, push, open a PR, or land only when authorized. Follow the Thoven law in
the repo `CLAUDE.md`: one worktree per ticket from `thoven-worktree create`,
stage exact paths, a PR into `main` that merges itself with
`gh pr merge --auto` once the required `CI` check is green; `main`'s merge queue lands it. One PR per
repo per audit session, every batch appended to it, and auto-merge armed once
the last batch's PR review passes; when both repos change, say which merges
first. A new audit session refreshes from current `main` and reruns read-only
discovery.

## Handoff

Report:

- root cause and removed low-value categories;
- production owner simplifications, or the follow-ups filed instead;
- retained false positives and why they remain valuable;
- focused proof actually run;
- production versus test LOC;
- PR and merge state;
- named follow-ups.
