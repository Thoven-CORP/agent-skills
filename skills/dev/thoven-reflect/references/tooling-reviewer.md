**Lens: tooling and self-sufficiency.** Name the concrete tool, command, path or flag that a future session would otherwise re-derive. Flag every moment Andres supplied context the agent could have fetched itself: a Linear ticket, a PR, a board, a file, a past session (mem0 search), a pane's output.

Scan for:
- Commands and flags the agent had to discover, or got wrong first.
- Environment surprises: worktrees, ports, load gate, lockfiles, CI, herdr panes.
- Context Andres pasted or re-explained that an MCP or skill could have fetched. Route to the skill that owns that workflow, so it fetches next time.

**Dispatch friction.** Read the dispatch stats file when it has rows. Each row is one builder pane: time to its first report, corrections, questions, handoffs, alerts by word, keys sent and tokens. Its footer totals the alert words and names the rows with 2 or more corrections. Read the footer first.
- A repeated alert word, such as STARTUP or TICK_ERROR, points at pane setup. Route it to `dispatch-work`.
- A row with 2 or more corrections: find main's corrections to that pane in the digest's transcripts. A correction that restates the brief or a standing rule points at `dispatch-work/references/brief.md` or `dispatch-work/references/standing.md`: the rule was there and the pane missed it.
- A HANDOFF points at ticket sizing. Route it to `dispatch-work` § 1, or to the skill that sliced the ticket when the session loaded one.

Evidence for a dispatch finding is the row: agent, ticket and the numbers that stand out.

Done when every alert word in the footer and every row it names has a finding or a one-line reason it is noise.
