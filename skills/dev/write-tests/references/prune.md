# Prune tests

For an audit, a pruning pass over one area (one feature or domain across both repos), or a refactor that touches tests. A refactor deletes more tests than it adds (law, "Subtract before you add"). Optimise for confidence, not deletion count: consolidate into the canonical owner test rather than adding.

## Retention bar

Keep a test that alone enforces a public API, the FE↔BE contract (`contract/`, OpenAPI, a feature's `decisions/api.md`), config, a migration, storage, security, auth, money, COPPA and student privacy, a design lock held by a `lib/*-tokens.ts` module, a default, or an architecture contract. Also keep call ordering when order is observable, regressions with a credible failure mode, and a source inspection when it is the cheapest independent guard [`spec/architecture/owners_spec.rb`]. Static or slow is not a deletion reason. Where a kept test runs is `TESTING.md`, "What CI runs": its path decides the lane, so never delete a good test to get it out of CI.

A kept test that fails on the baseline is a possible product bug: reproduce it and repair the owner.

## 1. Baseline

At a pinned `main` SHA, record the area's test and support line counts and each test file's pass or fail. Keep baseline failures in their own list.

**Done when:** every in-scope test file has a recorded result.

## 2. Ledger

Read every test in full with its production owner, callers, overlapping tests, CI routing and history (`graphify` for callers, `rg` for literals). For a large area, split it into lanes along production owner boundaries and give each lane its own read-only agent. Mark each declaration (an `it.each` is one unless its rows differ):

- `R` retain, naming the contract and the bug it catches;
- `F` retain the contract, repair the assertion (a vacuous negative);
- `C` consolidate, naming the owner that absorbs it;
- `D` delete, naming the proof that remains or why no contract exists.

Judge by assertions, not names. Each `D` names its test, what it can detect, the stronger proof left, and the production or test-only seam its deletion unlocks.

**Done when:** every declaration has a mark and an evidence line, and Andres has seen the candidate list.

## 3. Layer plan

From the ledger, find the redundant layer: suites that replay one contract through a mock around a stronger real-boundary suite. Name the keeper per contract; prefer the real boundary with a fake network over a mocked collaborator.

**Done when:** each lane names its retired files, its keeper per contract, and the assertions to carry into keepers.

## 4. Cutover

Edit lane by lane, serialising shared harness changes through one owner. Delete in the same batch the dead production code whose only callers are tests and the test-only seams the batch unlocks (Andres, 2026-11-23). Any other production change waits for his yes (THV-1008: "I wanted tests audited, not actual code audited"). Register moved suites in CI routing, and run `pnpm run check:test-collection` after deleting a frontend file.

**Done when:** every lane plan is applied and its keepers pass.

## 5. Preservation check

For each contract whose tests moved, make one deliberate mutation of its production owner, confirm the keeper goes red, and restore the source byte for byte. Look for new assertions that cannot fail.

**Done when:** every moved contract has a caught mutation.

## 6. Hand off

Report: baseline and final test and support line counts with production counted apart; retired layers and keepers; dead code deleted; retained false positives and why; product defects found (a baseline failure that survives into a keeper is a bug, fixed at its owner with a control run); and the proof run. One PR per repo per audit, every batch appended to it.
