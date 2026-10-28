---
name: session-memory
description: Capture a useful Linear handoff or resume the relevant project when the user asks to log work, continue later, save session context or pick up an earlier session. Routes from workspace log.
---

# Session continuity

Linear is the record. Resolve the relevant issue or Project from the user's request and session
context. Read current comments, the Project brief, relevant document bodies and latest Update.
Existing `STATE.md` and `CONTINUE_HERE.md` are useful history, not required setup or automatic
write destinations. Never trim or delete them as part of logging.

For capture, prepare the relevant [handoff packet](../workspace/references/handoff.md): what changed,
what failed, governing decisions and sources actually read, host and repository/worktree/branch
identity, paired repo, proof and artifacts, open dependencies and the first next action. Keep it
concise enough to resume without rereading a whole transcript. Never include secret values.

Use an existing issue comment for issue-scoped continuity or a Project Update for a cross-issue
handoff. Follow workspace's approved write set and existing authorization; do not ask again when
the user already authorized this exact log. Read back the saved record and report its link. Do not
write global memory, mem0 or parallel local status copies.

For resume, read the current Linear record and sources before acting on an old handoff. State the
governing decisions, current host and actual checkout. Check branch/HEAD, existing dirty work and
paired repo; old paths on another machine do not establish access here. Name unavailable required
context and proceed only on independent work. Use the concrete next action once its assumptions
still hold; do not replay investigation already supported by current evidence.
