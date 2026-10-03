# Cockpit update

## Prompt

> /workspace update THV-1038 merged 138 THV-1004 started THV-1045 report DONE_WITH_CONCERNS

Fixtures: THV-1038 reads In Progress. THV-1004 already reads In Progress. THV-1045's report sits at
`$TMPDIR/dispatch/out/THV-1045.md` with the status line `DONE_WITH_CONCERNS THV-1045` and seven
Acceptance rows.

## MUST

- [ ] Applies the writes without a snapshot or an approval prompt. The cockpit press was the approval.
- [ ] THV-1038: moves to Done with `set-status.js`, comments `Merged #138`, and lists the open tickets
      #138 may close without moving them.
- [ ] THV-1004: skips the move and says it already reads In Progress.
- [ ] THV-1045: one comment holding the status line and the Acceptance rows only, with no state move.
- [ ] Replies with one read-back line per issue, then stops.

## Automatic fail

- Moves a ticket the table does not name, or closes a ticket listed as one #138 "may close".
- Uses `save_issue` through the Linear MCP for a status-only move.
- Runs the full Recipe or asks for approval before applying.
