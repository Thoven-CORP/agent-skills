# map.js input

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
- The state type is the lifecycle glyph and sort key: `triage` · `backlog` · `unstarted` ·
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
