---
name: workspace
description: >-
  Project orientation and Linear lifecycle for Thoven. Use when the user asks where work stands,
  what is next, to capture or close work, to log a session, or to reconcile the current Project's
  board state. Produces one deterministic Project snapshot before proposing lifecycle writes.
---

# Workspace

`$workspace` is a pure reader until the user approves a disclosed write set. It owns Project
orientation, Linear lifecycle, capture, close, the derived Map, and the Project log. It does not
perform semantic feature reconciliation.

## Recipe

1. Read [`references/PROJECT_SNAPSHOT.md`](references/PROJECT_SNAPSHOT.md). Its source order,
   evidence states, and ownership rules are binding.
2. Resolve the current Linear Project from the named issue, session context, or cwd. If those
   disagree, report `CONTRADICTED`; do not guess.
3. Produce the shared snapshot:

   ```bash
   node ~/.agents/skills/workspace/tools/map.js \
     --project '<Linear Project name>' \
     --project-dir '<projects/<project>>'
   ```

   `--linear-json <file>` and `--stdin` are deterministic adapters. `--feature` and `--family`
   remain supported for the legacy tree views.
4. Account for every `BLOCKED`, `CONTRADICTED`, and `UNKNOWN` finding. Missing Linear access is
   `UNKNOWN`, never inferred from local prose.
5. For `orient` or bare invocation, print the snapshot unchanged: Project and fingerprint, ticket
   ledger including Done and Canceled history, mechanical findings, completion claim, and next
   issue or skill invocation.
6. For capture, close, or log, show one exact Project-scoped write set. Apply only after approval,
   serially. Re-run the snapshot and report its new fingerprint.

## Completion

The main session has read the snapshot fingerprint and can account for every mechanical blocker
and unknown. A write operation is complete only when the approved writes are applied and the
post-write snapshot has been read.

## Compatibility

Audience-level `STATE.md` and `CONTINUE_HERE.md` are read-only compatibility inputs until that
Linear Project is migrated. Never bulk-split them. Current Project state belongs inside
`projects/<project>/`.
