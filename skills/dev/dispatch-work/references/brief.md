# The brief

Copy the block below to `$TMPDIR/dispatch/<THV-x>.md` and fill every `<…>`. `send.sh` fills
`{{MAIN_PANE}}`. The ticket is the spec, so the brief points at it and adds only what the ticket
cannot know. A brief that restates the ticket drifts from it.

For Codex panes write `$poteto-mode`. For Devin keep the task on the first line.

```text
/poteto-mode <playbook> THV-<id> "<ticket title>"

FITS       <one line: where this ticket sits in its parent issue and what it unblocks>
SPEC       Linear THV-<id>. Read it in full first with the Linear tools. It is the spec, already
           decided upstream: build it as written. When the ticket and the code disagree, or the
           ticket needs a choice it does not make, send NEEDS_CONTEXT.
WHERE      Repo <path>, branch <branch>, base <sha>. <Parallel panes, if any, and their Paths.>
KNOWN      <interfaces, rulings and commits from earlier tickets this one builds on. "none" if none.>
RULINGS    <main's resolution of anything ambiguous in the ticket. "none" if none.>
ACCESS     <the skill lines from skills.md this ticket reaches, each with its moment>
           Tools: graphify for callers and impact, Linear (read), Context7 for vendor docs,
           control-cli and control-ui for a running app, tier-4 subagents for wide reads.
DONE WHEN  <the ticket's Done when, verbatim or by pointer>
           Seams: <where the tests sit>. Proof goes red before your change and green after it.
           Type-check and the touched test files as you go. No full suite, no full lint.

STANDING
- You and main run side by side. Main owns Linear, product calls and your review. You own
  the code on this branch and your commits.
- Commit as you go, by exact path, message ending in THV-<id>. Commit only; publishing is outside this task.
- Machine: run only the tests you touch, one process at a time, no dev servers or watch mode.
  Route big logs and wide reads through a subagent and keep its summary.
- Budget: stop near 250k tokens and send your status with what is done and what is left.
- Decide what you can and write the ruling into your report. Stop only for: an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
- Leave no files behind outside the repo. Evidence goes in your report.
- Browser: drive agent-browser from this pane only, never from a subagent. Close it when you are
  done. Send Escape in-page (dispatchEvent of a keydown), never with agent-browser press Escape,
  which pins the renderer. A renderer near 100% CPU means start a fresh browser; it is not a
  product bug unless a normal browser reproduces it.

REPORT
Send exactly one message to main when you finish or need main, with
~/.local/bin/herdr agent prompt {{MAIN_PANE}} and the message as one quoted argument.
It starts with STATUS THV-<id>, where STATUS is DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT
or BLOCKED. Write it to $TMPDIR/dispatch/out/THV-<id>.md and send
"$(cat $TMPDIR/dispatch/out/THV-<id>.md)" so backticks stay text. Delete the file only after
the send succeeds. If it fails, leave the file: that folder is main's inbox.
Then the ASCII block:
  Acceptance   one row per line: ✓/✗, evidence (file:line, command → result)
  Proof        command, red before, green after
  Commits      SHAs and git diff --stat against base
  Rulings      what you decided and why
  Noticed      out of scope, not fixed
Label every claim measured, inferred or guess. Then print the same block in this pane and end
with a line starting "result:".
```

## Fix-round brief

Send into the builder's pane with `send.sh`:

```text
FIX ROUND <n>/5 THV-<id>. Base for this round: <sha>.
<each open finding, verbatim, with file:line>
Fix these only. Re-run the tests that cover each fix and name them. Report as before.
```
