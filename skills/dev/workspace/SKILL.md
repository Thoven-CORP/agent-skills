---
name: workspace
description: >-
  Linear lifecycle for a Thoven Project. Use when Andres rules mid-session
  ("make it the accordion", "library indigo", "max 5"), when a grill or spec
  session ends, when he asks to update the docs, the Project description, the
  Project status, or a Project Update, or when he asks where work stands, what
  is next, to capture or close work, to log a session, or to reconcile the
  board. Read the Project snapshot before proposing a lifecycle write.
---

# Workspace

`$workspace` is a pure reader until the user approves a disclosed write set. A dispatch event, a
confirmed grill ruling, or a confirmed product brief approves its row under Fixed writes. It owns Project
orientation, Linear lifecycle, capture, close, and the derived Map. A log entry is a Project Update
or an issue comment. It does not perform semantic feature reconciliation.

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

## Ruling

When Andres rules in the session, or a grill or spec session ends, write that ruling before the next task. The home and the entry shape are [WORKFLOW.md](references/WORKFLOW.md) §5.

1. Amend the governing decision document. One entry per choice. A ruling that supersedes an earlier entry amends that entry.
2. Say the id back in one line.
3. Read the entry back. The id in the reply is the id in the document.

This pass does not wait for capture, close, or log.

Write only what Andres ruled. An agent's proposal becomes a ruling when he answers it as its own question, with its cost or design change stated. A bundle "yes" or "run it" approves the write set as disclosed; it does not rule on a cost the proposal left unstated or on a change to a surface the spec already decided. Ask each of those as its own question before writing or building it.

## Recipe

1. Read [`references/PROJECT_SNAPSHOT.md`](references/PROJECT_SNAPSHOT.md). Its source order,
   evidence states, and ownership rules are binding.
2. Resolve the current Linear Project from the named issue, session context, or cwd. If those
   disagree, report `CONTRADICTED`; do not guess. A local folder, `STATE.md`, `PRD.md`, or
   `CONTINUE_HERE.md` is optional. Resolve the Project and read its governing Linear content even
   when none of those files exists. Use `$linear-project` for genuinely missing or changed Project
   setup, not to manufacture local prerequisites. An inaccessible required Linear source is
   `UNKNOWN`; name that source and continue only work that does not depend on it.
3. Fetch the Project's issues yourself, through the **Linear MCP connector**, then feed them to
   `map.js`. `map.js` never reaches for a Linear API key on its own.

   - Discover the available authorized Linear connector and verify it with a read. Use its
     `list_issues` and, when needed, `list_projects` tools; prefixes vary by client. A working
     read establishes the connector to use, rather than a historical tool-name allowlist.
   - Write the response to a file in the shape below, then:

   ```bash
   node ~/.agents/skills/workspace/tools/map.js \
     --project '<Linear Project name>' \
     --linear-json /tmp/linear-<project>.json
   ```

   `--stdin` takes the same JSON on standard input. Add `--project-dir` only for an existing,
   relevant local archive. With no Linear input, the snapshot renders git and any optional local
   context with `ADVISORY linear-input`; its completion claim is `UNKNOWN`. The snapshot judges
   mechanical fields, not whether you read the brief or linked document bodies. `--linear-api` is an
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
         "description": "Why this exists.\nWrites to: this ticket",
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
   - For `session-preflight.js`, `Writes to: this ticket` resolves to the supplied issue. For a
     Linear issue/document URL, set `writesToAccessible: true` only after reading that record;
     `writesToExists` is reserved for required local paths. A URL alone is not confirmed access.
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
   recall, not record: it never changes the fingerprint or a finding. A recalled ruling with no
   matching decision entry is missing. Step 6 puts it in the write set.
6. For capture, close, or log, mine first, then show one exact Project-scoped write set. List every
   ruling and status change in this session, including a recalled ruling from step 5. Mark each one
   written, amended, missing, or contradicted against the home in WORKFLOW.md §5. Each missing one
   is a write-set entry. A ruling already written by the Ruling section stays marked written. Apply
   only after approval, serially. Re-run the snapshot and report its new fingerprint and the
   before/after open-issue count per Project.

## Fixed writes

`update THV-n <event> [THV-m <event> ...]` is the write. The event approves its row. Apply it in the same turn. The reply is the read-back. A write outside this table goes through the Recipe.

| Event | Write |
|---|---|
| `started` | `node tools/set-status.js "In Progress" THV-n` |
| `pr <number>` | `set-status.js "Ready" THV-n`, then one comment: `PR #<number> opened` |
| `report <STATUS>` | One comment: the report's status line and its Acceptance rows, nothing else. Take them from the newest REPORT entry that `~/.agents/skills/dispatch-work/scripts/dispatch board <project> --ticket THV-n` prints |
| `merged <number>` | `set-status.js "Done" THV-n`, then one comment: `Merged #<number>`. List the open tickets the merge may close; moving them needs the Recipe |
| `grill` | Amend the governing decision document (Ruling, steps 1–3). Comment on THV-n with the decision ids. |
| `brief` | One decision entry per settled choice. A Project Update links those ids. The slot map stays on the design board the entry points at. |

A `started`, `pr`, `report`, or `merged` row that also changes a ruling amends the decision entry and posts a Project Update in the WORKFLOW.md §5 shape. Each surface links the decision id.

When the issue is already at or past the target state, report that state and leave it. Reply with one line per issue, the state `set-status.js` read back, and stop.

## Completion

The main session has read the snapshot fingerprint and can account for every mechanical blocker
and unknown. A write operation is complete only when the approved writes are applied and the
post-write snapshot has been read. A dispatch update is complete when every issue in it has its
read-back line. A content write is complete when a read-back of each written surface shows each
mined ruling in place. End the reply with one line naming the surfaces touched and the surfaces
checked and left unchanged. A new snapshot fingerprint does not prove the text of a document, a
description, a comment, or a Project Update.

## Compatibility

Linear holds current briefs, accepted decisions, status and handoffs. Existing local state,
runbooks, plans and historical documents remain useful linked context; preserve them. Do not
scaffold, bulk-migrate or delete them to orient a session. tldraw and Paper support design and
brainstorming; record accepted decisions in Linear. A design file becomes relevant when the
Linear task names it, not because every machine must have every board.

For a cross-machine handoff, use [handoff.md](references/handoff.md). For a requested check on the
mini from saved MacBook changes, use [remote-check](../remote-check/SKILL.md).

For a reviewed remote-development release, read [remote-install.md](references/remote-install.md)
before publishing or installing the selected skills.
