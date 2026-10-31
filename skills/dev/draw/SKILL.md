---
name: draw
description: Draw or revise diagrams, wireframes and boards in the TUI Offline terminal canvas. Use the draw CLI or its board-scoped MCP server to inspect scenes, edit shapes, render Mermaid and preview results.
---

# Draw in TUI Offline

Use one explicit board path throughout the task. The CLI and open editor share
saved state and undo history through the board owner.

## 1. Read the relevant shapes

Run `draw --help` for command syntax and `draw tools` for exact operation schemas.
Choose stable IDs for new shapes. For an existing board, narrow the read first:

```sh
draw read board.json --text 'Review' --kinds rect
draw read board.json --ids intake,review
```

Reads return `revision`, `shapes` and `next`. Continue by passing the complete
`next` object to `--cursor 'JSON'`. Restart pagination if the revision changes.
Compact reads omit large payloads. Use `--detail` for source or points and check
`truncated_fields`. Use `draw show BOARD` when a full scene export is required.

Complete this step with the target IDs, their current revision, and enough
untruncated data to choose the edit.

## 2. Create or edit

For individually editable nodes, use native shapes and attached connectors:

```sh
draw box board.json intake 'Intake' --at 3,5 --size 20,6
draw box board.json review 'Review' --at 33,5 --size 20,6
draw connect board.json intake-review intake review --label 'next'
draw text board.json title 'Process' --at 3,2
```

Coordinates are terminal cells at 100% zoom. Leave label padding and consistent
gaps. Connectors created by `connect` follow moved nodes. Existing arrows opt in
when recreated with `connect` using their existing ID.

For existing shapes, submit partial changes with the revision from the read:

```sh
printf '%s' '{"expected_revision":3,"operations":[{"op":"patch","id":"review","changes":{"text":"Review together"}},{"op":"move","ids":["review"],"dx":4,"dy":0}]}' | draw apply board.json
```

`patch` preserves omitted fields. Null clears group or bindings; other patch
fields reject null. `move`, `resize`, `align`, `distribute` and `connect` express
geometric intent. Discover their exact fields through `draw tools`. Every batch
succeeds atomically and each changed batch creates one undo unit.

`upsert`, `box` and `text` replace complete shapes, resetting omitted optional
fields. Use them for creation or deliberate replacement with complete data.
A compact or truncated read is insufficient for a preserving replacement.

On a stale revision, reread and reconsider the edit. On a draft conflict, wait
for the human to commit or cancel, then reread. After an ambiguous failure,
inspect the saved result before retrying a relative move. Use CLI or MCP while
the editor is open; direct file edits require it closed. Undo history lasts for
the board owner's lifetime, including across requests to an open editor.

For automatic layout, send Mermaid source to the embedded Pele renderer:

```sh
printf 'graph LR; A-->B' | draw mermaid board.json -
```

Pele renders Mermaid syntax. The result is one editable source object; native
shapes support rearranging individual nodes.

Complete this step when the command confirms the saved revision and the requested
IDs and fields match a fresh read.

## 3. Inspect and repair

```sh
draw check board.json
draw preview board.json --output /tmp/board-preview-1.png --width 1024 --height 640
```

Open the PNG with the host image tool. Repair cramped labels and unintended
overlaps, then capture and inspect again after layout changes. Each output path
must be new. On a capture limit error, narrow `--region L,T,R,B`. Layout checks
are advisory; inspect `lint_incomplete` and the image together.

Complete the task when the requested content is saved and its layout has been
visually inspected. Report the board path, changes, and any unresolved warnings.
If image inspection is unavailable, report that verification limit explicitly.
Exported appearance and physical terminal interaction are separate evidence.

## Open the canvas or use MCP

Use `draw open BOARD` to open beside the agent in Rex, or `draw BOARD` for the
current terminal. Run `draw mcp-config BOARD` for an absolute-path stdio config
and install it through the host's MCP setup. This command prints configuration;
it leaves host settings unchanged.

MCP uses `canvas_read`, `canvas_apply`, `canvas_preview`, `canvas_check`,
`canvas_mermaid`, `canvas_undo` and `canvas_redo` with the same workflow.
`canvas_preview` supplies a PNG image block plus revision and diagnostics.
