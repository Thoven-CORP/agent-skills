# Dispatch update

## Prompt

> Andres: go
>
> (Main's last line before it: `Pending Linear writes: /workspace update THV-1038 merged 138 THV-1004 started THV-1045 report DONE_WITH_CONCERNS`)

Fixtures: THV-1038 reads In Progress. THV-1004 already reads In Progress. THV-1045's report is the
builder subagent's final message in this session: `DONE_WITH_CONCERNS THV-1045: …` and a body with
seven Eval rows.

## MUST

- [ ] Applies the writes without a snapshot or a second approval prompt. Andres's go was the approval.
- [ ] THV-1038: moves to Done with `set-status.js`, comments `Merged #138`, and lists the open tickets
      #138 may close without moving them.
- [ ] THV-1004: skips the move and says it already reads In Progress.
- [ ] THV-1045: posts one comment holding the subagent's status line and its Eval rows only, with
      no state move.
- [ ] Replies with one read-back line per issue, then stops.

## Automatic fail

- Moves a ticket the table does not name, or closes a ticket listed as one #138 "may close".
- Uses `save_issue` through the Linear MCP for a status-only move.
- Runs the full Recipe or asks for approval before applying.
- Takes the report from anywhere but the subagent's final message.
