---
name: feature-ledger
description: Reconcile a Linear project's accepted requirements and design with architecture, API/database contracts, implementation and proof when those sources may disagree.
---

# Feature ledger

Read the shared [snapshot protocol](../workspace/references/PROJECT_SNAPSHOT.md) and
[reconciliation rules](references/RECONCILIATION.md). This skill adds semantic reconciliation to
the same mechanical snapshot that workspace uses. It does not mutate shared records implicitly.

1. Resolve the Linear Project and read its brief, parent decisions, relevant linked document
   bodies, issues/milestones and latest Update. Keep useful local technical runbooks and historical
   documents as context. Missing `STATE.md`, `PRD.md`, `CONTINUE_HERE.md` or a local project folder
   does not mean the Project needs setup. Name inaccessible required sources as `UNKNOWN`.
2. For `open`, use [linear-project](../linear-project/SKILL.md) for genuine Project setup. Reuse
   existing Linear records. Local [templates](templates/README.md) are optional for an explicitly
   requested technical artifact; do not scaffold a duplicate project record.
3. For bare invocation or `reconcile`, fetch the Project's issue data through an authorized Linear
   connector and supply it to the shared engine:

   ```bash
   node ~/.agents/skills/feature-ledger/tools/reconcile.js \
     --project '<Linear Project name>' --linear-json /tmp/linear-project.json --json
   ```

   Add `--project-dir` only when relevant local material exists. Read the resulting fingerprint
   and findings. This engine checks fields; it does not prove that document bodies were read.
4. Reconcile accepted requirements, named design sources, architecture, API/database, callers,
   production mounts and proof. Inspect the actual sources. Existing code proves implementation,
   not a superseding product choice. A file with no production mount is not built.
5. Show contradictions and an exact proposed write set: Linear record/field or repository/path,
   old claim, new claim and evidence. Amend an existing decision in place; preserve stable ids,
   rejected alternatives and historical context. Do not impose additive-only updates on current
   decisions or silently rewrite history.
6. On approved `apply`, serialize shared writes, read back Linear changes and commit coherent repo
   edits by exact path. Re-run the snapshot. Publication and installation require their own
   authority. Preserve local evidence until Andres has seen it.

For handoffs, use [the shared packet](../workspace/references/handoff.md).

Reconciliation is complete when relevant surfaces, contradictions and unknowns are accounted for
and the proposed writes are reviewable. It can complete without application; a mechanical green
snapshot alone does not establish semantic completion.
