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
3. Fetch the Project's issues yourself, through whichever Linear MCP is loaded, then feed them to
   `map.js`. `map.js` never reaches for a Linear API key on its own.

   - Different clients load different connectors. In Claude Code, use the plugin connector:
     `mcp__plugin_linear_linear__list_issues` (and `list_projects` if you need Project rows).
   - Other clients (Cursor, Codex) may only have `mcp__claude_ai_Linear__list_issues` instead.
   - Before declaring either one dead, call a read (`list_issues`) and check the exact tool name
     that actually responds. Do not assume from this doc which connector is loaded.
   - Write the response to a file in the shape below, then:

   ```bash
   node ~/.agents/skills/workspace/tools/map.js \
     --project '<Linear Project name>' \
     --project-dir '<projects/<project>>' \
     --linear-json /tmp/linear-<project>.json
   ```

   `--stdin` takes the same JSON on standard input. With neither, the snapshot still renders — git,
   Project folder, and Project `STATE.md` are all read — and the ticket ledger carries one
   `ADVISORY linear-input` finding telling you to fetch through the MCP. `--linear-api` is an
   opt-in escape hatch that uses `LINEAR_API_KEY` or `~/.linear-api-key`; that key is dead, so do
   not reach for it. `--feature` and `--family` remain supported for the legacy tree views.

   **The `--linear-json` shape.** One object with `issues` and optional `projects`. The loaded
   connector's `list_issues` response drops in unchanged — save its `issues` array as-is. The raw
   GraphQL envelope (`{"data": {"issues": {"nodes": [...]}}}`) is also accepted. Ask the
   connector for these `fields` so nothing the snapshot needs is missing:

   ```
   ["title", "description", "status", "statusType", "project", "projectMilestone", "assignee", "updatedAt"]
   ```

   The canonical record, showing every field the snapshot reads:

   ```json
   {
     "issues": [
       {
         "identifier": "THV-318",
         "title": "Bind homework success to requested identity",
         "description": "Why this exists.\nWrites to: projects/identity-access/decisions/api.md",
         "updatedAt": "2026-08-30T18:04:11.000Z",
         "state": { "type": "started", "name": "In Progress" },
         "project": { "name": "Shared: Identity & Access" },
         "projectMilestone": { "name": "Build" },
         "assignee": { "name": "Andres Martinez" }
       }
     ],
     "projects": [{ "name": "Shared: Identity & Access", "status": { "name": "In Progress" } }]
   }
   ```

   Every field takes three spellings — GraphQL, MCP, or flat — so you never have to remap:

   | Snapshot field | GraphQL node | MCP record | Flat |
   |---|---|---|---|
   | identifier | `identifier` | `id` | `identifier` |
   | state name | `state.name` | `status` | `state` |
   | state type | `state.type` | `statusType` | `stateType` |
   | project | `project.name` | `project` | `project` |
   | milestone | `projectMilestone.name` | `projectMilestone.name` | `milestone` |
   | assignee | `assignee.name` | `assignee` | `assignee` |

   Rules the parser enforces:

   - `project` must equal `--project` (case-insensitive, exact string) or the issue is not in the
     ledger.
   - The state type is the lifecycle glyph and sort key: `triage` · `backlogged` · `unstarted` ·
     `started` · `completed` · `canceled`. Omit it and the issue still lists, sorted last, with a
     `·` glyph.
   - The state *name* is what the session gate reads; it must be the Linear state name
     (`In Progress`, `Ready`, …), not the type.
   - `Writes to: <path>` is parsed out of `description` — first match, own line, verbatim. Linear
     descriptions usually wrap the path in backticks, and the parsed value keeps them; strip before
     using the string as a path.
   - Milestone and assignee are both read by the session gate; missing either is `BLOCKED`.
4. Account for every `BLOCKED`, `CONTRADICTED`, and `UNKNOWN` finding. Linear data that was never
   supplied is `ADVISORY linear-input` — fetch it through the MCP connector and re-run. A Linear
   fetch that was attempted and failed is `UNKNOWN`. Neither is ever inferred from local prose.
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
