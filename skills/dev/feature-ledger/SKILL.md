---
name: feature-ledger
description: >-
  Project-level feature authority for large-feature scaffolding, cross-layer decisions, semantic
  contradictions, and reconciliation before a PRD, implementation plan, or handoff. Use when a
  feature's PRD, design, architecture, API/database contract, code, mounts, or proof may disagree.
---

# Feature Ledger

`$feature-ledger` consumes the same pure Project snapshot as `$workspace`, then performs semantic
reconciliation. It does not invoke workspace or mutate shared state implicitly.

## Recipe

1. Read the shared [Project snapshot protocol](../workspace/references/PROJECT_SNAPSHOT.md) and
   [`references/RECONCILIATION.md`](references/RECONCILIATION.md).
2. Choose the branch from the user's request:
   - `open`: scaffold one Linear Project folder.
   - bare or `reconcile`: read and reconcile the current Project.
   - `apply`: apply a previously shown write set only after explicit approval.
3. Produce the shared snapshot with the same command and inputs used by `$workspace`:

   ```bash
   node ~/.agents/skills/feature-ledger/tools/reconcile.js \
     --project '<Linear Project name>' \
     --project-dir '<projects/<project>>' \
     --json
   ```
4. Personally read the snapshot fingerprint and every mechanical blocker or unknown before doing
   semantic work.
5. Reconcile PRD, design, architecture, API/database, implementation, production mounts, proof,
   and related-session decisions. A file that exists but has no production mount is not built.
6. Return every contradiction and one exact proposed write set grouped by repository and path.
   Include Project-state and Linear changes in one Project-scoped apply operation.
7. On approved `apply`, serialize shared writes, stage exact paths, commit each coherent repository
   change set separately, then re-run the snapshot. Never push or reinstall globally without showing
   those operations and receiving approval.

## `open`

Create this shape inside the Linear Project folder:

```text
projects/<project>/
  CONTINUE_HERE.md
  STATE.md
  PRD.md
  decisions/
    architecture.md
    api.md
    database.md
  DESIGN_<PROJECT>.md
  drawings/
  plans/
```

Use `templates/`. Do not rewrite audience-level compatibility state during tooling migration.

## Completion

Every relevant surface is accounted for, every contradiction is surfaced, and an exact proposed
write set exists. Reconciliation can complete without application; application has its own approval
gate and must end on a fresh snapshot fingerprint.
