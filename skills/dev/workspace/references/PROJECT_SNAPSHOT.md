# Project snapshot protocol

This is the disclosed protocol shared by `$workspace` and `$feature-ledger`. A snapshot is a plain
value. It is created per invocation; there is no sync command, daemon, cache, or cross-skill write.

## Source tiers and precedence

1. **Executed evidence:** git objects, working-tree state, production imports and mounts, test or QA
   receipts tied to the current fingerprint, and live Linear fields.
2. **Binding authority:** locked token modules and tests, current components for their own surface,
   current accepted design artifacts, explicit human rulings, and Project decision rows.
3. **Planning records:** PRD, plans, Project `STATE.md`, `CONTINUE_HERE.md`, issue descriptions, and
   related-session receipts.
4. **Compatibility and advisory context:** audience-level state, old handoffs, prose estimates, and
   historical artifacts.

Higher tiers win. A disagreement is `CONTRADICTED`, not silently reconciled. A newer explicit human
ruling can supersede older binding authority; record the supersession.

## Stable evidence states

- `VERIFIED`: directly supported by current evidence.
- `UNKNOWN`: required evidence was unavailable.
- `STALE`: once-valid evidence no longer matches the commit or working-tree fingerprint.
- `CONTRADICTED`: two in-scope sources make incompatible claims.
- `BLOCKED`: a required gate failed or safe progress cannot continue.
- `ADVISORY`: useful context that does not bind the result.

Do not invent additional states.

## Mechanical and semantic boundary

Mechanical checks parse and compare: Linear fields, Project paths, git state, exact path overlap,
artifact existence, production mounts, proof fingerprints, table pointers, and log idempotence.
They may classify evidence but may not decide what a product or design sentence means.

Semantic reconciliation belongs to `$feature-ledger`: whether the PRD, design, architecture, API,
database, implementation, mounts, proof, and related-session rulings express one coherent feature.
Semantic findings are proposed for human review; no script self-resolves them.

## Freshness

Every snapshot includes HEAD, branch, repository root, staged, unstaged, untracked, upstream,
unpushed count, and a working-tree fingerprint. Proof receipts name the commit and working-tree
fingerprint they verified. A change to either makes the receipt `STALE`.

## Work units, commits, and delegation

The human owns the issue. Agents receive bounded work units with exact path sets. Before work,
record starting HEAD and existing staged, unstaged, and untracked paths.

- Disjoint work units on one issue may proceed and commit independently.
- Same-file work is `BLOCKED` until it is serialized through a named integration session.
- A coherent, green work unit is committed by exact path even when unrelated files are dirty.
- Incomplete or red work remains uncommitted only with an evidence receipt naming its paths and
  blocker.
- Shared Project-state and Linear mutations are one approved, Project-scoped, serial operation.
- The main session personally reads the snapshot, semantic forks, receipts, and proposed writes.

A subagent receipt contains provenance, commit or timestamp, claim, evidence, conflicts, and
unknowns. Subagents inspect bounded evidence; they do not synthesize or mutate shared state.

## Completion

`$workspace` completes when the main session has the snapshot fingerprint and accounts for every
mechanical blocker and unknown.

`$feature-ledger` completes when every relevant surface is accounted for, every contradiction is
surfaced, and one exact proposed write set exists. Applying that set is a separate approved serial
operation followed by a fresh snapshot.
