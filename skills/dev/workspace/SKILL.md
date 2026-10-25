---
name: workspace
description: >-
  Project orientation and Linear lifecycle for Thoven. Use when the user asks where work stands,
  what is next, to capture or close work, to log a session, or to reconcile the current Project's
  board state. Produces one deterministic Project snapshot before proposing lifecycle writes.
---

# Workspace

`$workspace` is a pure reader until the user approves a disclosed write set. Andres's go in chat on a
dispatch update is that approval for its fixed writes (see Update after a dispatch). It owns Project
orientation, Linear lifecycle, capture, close, the derived Map, and the Project log. It does not
perform semantic feature reconciliation.

## Pitfalls

- When Andres describes a problem while building a backlog, file it with what is known and the candidates named as candidates; investigate or grill only when he asks. (LEARNINGS 2026-09-03)
- Add a finding to an existing grouped issue as a checklist line, keep a cleanup Project near 20 grouped issues by merging, and close a done or stale ticket with one evidence line instead of moving it. (LEARNINGS 2026-09-29)
- After every merge or promote, check the Project's open tickets against the merged diff by id and file path, and put each one it fixed into the write set with its SHA in the same turn; say where each verifier follow-up lives. (LEARNINGS 2026-09-29)
- Close a research ticket once its findings are build tickets, and cancel the tickets the research made stale. (LEARNINGS 2026-10-03)
- When an issue has no `Writes to:` line, write the spec into its Linear description below Andres's text with `Writes to: this ticket`, through `save_issue` patch ops, then check its embeds survived. (LEARNINGS 2026-10-03)

## Project setup and live context

For a new Project or a proposed change to its brief, approach or sources, use `$linear-project`.
Read the live [Project setup standard](https://linear.app/thoven/document/project-setup-standard-62e01c7c4f53)
for those choices; it supersedes older setup assumptions in `references/WORKFLOW.md`.

Before ongoing work, retrieve the current Project brief, relevant linked authoritative sources,
native milestones and issues, and latest Project Update. Read the sources themselves; a snapshot
of issues alone does not establish their content. Surface unavailable context explicitly. Maintain
current Project purpose, scope and approach in the brief, field values and work status natively,
and meaningful progress, risks and handoffs in Project Updates within the approved write set.
When posting an Update, supply its health indicator. If the connected tool requires the lead
to post the first Update, use a known resolved lead or report the gap; do not invent an owner.
Local receipts retain their distinct evidence role; `$feature-ledger` keeps artifact and semantic
reconciliation ownership.

## Recipe

1. Read [`references/PROJECT_SNAPSHOT.md`](references/PROJECT_SNAPSHOT.md). Its source order,
   evidence states, and ownership rules are binding.
2. Resolve the current Linear Project from the named issue, session context, or cwd. If those
   disagree, report `CONTRADICTED`; do not guess. A snapshot finding `Project folder could not be
   resolved`, or a missing template, means the Project was never set up: run `$linear-project`
   before any grill or design work, and never report it as expected.
3. Fetch the Project's issues yourself, through the **Linear MCP connector**, then feed them to
   `map.js`. `map.js` never reaches for a Linear API key on its own.

   - Discover the available authorized Linear connector and verify it with a read. Use its
     `list_issues` and, when needed, `list_projects` tools; prefixes vary by client. A working
     read establishes the connector to use, rather than a historical tool-name allowlist.
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
   opt-in path that reads with `LINEAR_API_KEY` or `~/.linear-api-key`. The key works (checked
   2026-10-03), and `tools/set-status.js` uses it. `--feature` and `--family` remain supported
   for the legacy tree views.

   **The `--linear-json` shape.** One object with `issues` and optional `projects`. The
   `mcp__claude_ai_Linear__list_issues` response drops in unchanged — save its `issues` array as-is.
   The raw GraphQL envelope (`{"data": {"issues": {"nodes": [...]}}}`) is also accepted. Ask the
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
   - Status-only moves go through `node tools/set-status.js "<state name>" THV-1 [THV-2 ...]`,
     which prints one line per issue. The Linear MCP `save_issue` echoes the full issue body.
4. Account for every `BLOCKED`, `CONTRADICTED`, and `UNKNOWN` finding. Linear data that was never
   supplied is `ADVISORY linear-input` — fetch it through the MCP connector and re-run. A Linear
   fetch that was attempted and failed is `UNKNOWN`. Neither is ever inferred from local prose.
5. For `orient` or bare invocation, print the snapshot unchanged: Project and fingerprint, ticket
   ledger including Done and Canceled history, mechanical findings, completion claim, and next
   issue or skill invocation. Then run one mem0 search (`search_memories`, query: the Project name
   and the next issue id). Print what comes back under **Recalled**, after the snapshot. It is
   recall, not record: it never changes the fingerprint or a finding.
6. For capture, close, or log, show one exact Project-scoped write set. Apply only after approval,
   serially. Re-run the snapshot and report its new fingerprint and the before/after open-issue
   count per Project.

## Update after a dispatch

`update THV-n <event> [THV-m <event> ...]` names the Linear writes a dispatch event needs. Main ends a
merge or Done report with them as a one-line go (dispatch-work, Roles). Andres's go in chat approves
exactly the writes in this table, so skip the snapshot and the approval step. Anything the table
does not name goes through the Recipe.

| Event | Write |
|---|---|
| `started` | `node tools/set-status.js "In Progress" THV-n` |
| `pr <number>` | `set-status.js "Ready" THV-n`, then one comment: `PR #<number> opened` |
| `report <STATUS>` | One comment: the report's status line and its Acceptance rows, nothing else. Take them from the newest REPORT entry that `~/.agents/skills/dispatch-work/scripts/dispatch board <project> --ticket THV-n` prints |
| `merged <number>` | `set-status.js "Done" THV-n`, then one comment: `Merged #<number>`. List the open tickets the merge may close; moving them needs the Recipe |

Each write is idempotent: when the issue already sits at or past the target state, skip the move and
say so. Reply with one line per issue, the state `set-status.js` read back, and stop.

## Completion

The main session has read the snapshot fingerprint and can account for every mechanical blocker
and unknown. A write operation is complete only when the approved writes are applied and the
post-write snapshot has been read. A dispatch update is complete when every issue in it has its
read-back line.

## Compatibility

Audience-level `STATE.md` and `CONTINUE_HERE.md` are read-only compatibility inputs until that
Linear Project is migrated. Never bulk-split them. Current Project state belongs inside
`projects/<project>/`.
