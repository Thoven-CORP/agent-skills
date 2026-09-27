---
name: dispatch-work
description: >-
  Dispatch a Linear ticket to a coding agent in a herdr pane and bring it back verified. Use when
  handing a ticket or slice to a pane, choosing which agent, model or CLI runs it, writing a
  dispatch brief, watching or rescuing a pane that went quiet, or verifying and closing a pane's work.
---

# Dispatch work

Main hands one Linear ticket to an executor agent in a herdr pane, keeps working while the pane
builds, then verifies the result and closes the pane. Two workflows run side by side. Each side
owns its half, and the brief tells the pane which half is main's.

**Source:** `~/thoven/agent-skills/skills/dev/dispatch-work/`. Home copies are installs.

## Roles

| Main (this session) | Pane (the executor) |
| -- | -- |
| Picks the agent, writes and sends the brief | Reads the ticket in full and builds it as written |
| Owns Linear: every status move and comment | Commits by exact path on the branch it was given |
| Keeps a watcher armed on every live pane | Reaches for skills at their moments |
| Answers questions, rules on blockers, escalates product calls to Andres | Sends one status line to main with `herdr agent prompt` |
| Verifies with a different model family, then closes | Waits for main's reply or a fix round |

The pane never writes to Linear, never pushes, and never decides a product question. Main never
edits the pane's code. Fixes go back to a pane.

## Layout

- **Space** is the Linear Project. **Tab** is one issue: `Build · <issue title> (THV-x)`.
- **Panes** in that tab are the sub-tickets of that issue. Run them in parallel only when their
  `Paths` share no file. Otherwise run them one after another in the same tab.
- The **verifier** gets its own pane in the same tab at step 5 and closes after it reports.
- Main stays in its own pane. `$HERDR_PANE_ID` is main's address for every return message.
- The space-to-Project mapping and pane naming live in `~/.agents/skills/workspace/references/WORKFLOW.md` §8.
- `herdr --skill` and `herdr <group>` (no subcommand) are the syntax authority. Parse ids from the
  JSON a command returns.

## Steps

### 1. Check the ticket is ready, then pick the agent

A ticket is ready when every `Blocked by` issue has merged into the branch it builds on, and no
pane already holds it. Check both: the blockers in Linear and `git log origin/<base>`, and
`herdr agent list` plus the ticket's status for a live dispatch. A blocked ticket goes back to
Andres with the blocker named. A ticket already in a pane gets a handover or a watcher, never a
second pane on the same tree.

Then read [references/agents.md](references/agents.md). The harness main runs in picks the model
family. The ticket's complexity picks the tier. Several small same-shape tickets go to one pane as
one dispatch.

**Done when:** the blockers are merged and no pane holds the ticket, and you can state the CLI, the
model, the tier, and one line on why this tier.

### 2. Compose the brief

Copy [references/brief.md](references/brief.md) to `$TMPDIR/dispatch/<THV-x>.md` and fill it.
Point at the ticket. Carry only what the ticket cannot know: rulings from earlier tickets, the base
SHA, main's resolution of anything ambiguous. Pick the ACCESS lines for this ticket from
[references/skills.md](references/skills.md). When the ticket's own process hands the slice Linear
moves, the Roles table still holds: write in RULINGS that main makes them.

**Done when:** every field is filled and DONE WHEN names the seams and the red-first proof. A field
you cannot fill means the ticket is not ready. Fix the ticket in Linear, then come back.

### 3. Launch and send

1. Record the base SHA of each repo the ticket touches (`git rev-parse HEAD`). Review diffs start
   there.
2. Create the issue's tab, or split a pane into it. Rename the pane `Build · <title> (THV-x)`.
3. Start the agent with its bypass flag from `agents.md`. Wait for `idle` before prompting.
4. `scripts/send.sh <pane> $TMPDIR/dispatch/<THV-x>.md`. It fills main's pane id and sends from a
   file, so backticks and `$(...)` in the brief reach the pane as text.
5. Move the ticket to **In Progress** and read it back.

**Done when:** `herdr agent get <pane>` shows `working` and the ticket reads In Progress.

### 4. Watch

Arm `scripts/watch.sh <pane> [<pane>...]` as a background command. It exits on the first thing
main must look at, and prints why. Keep doing main's own work meanwhile. Every exit wakes main.
Every wake ends with one plain-English line to Andres saying what happened and what main did,
then the watcher re-armed on every pane still live.

A status line from the pane arrives as a message in main's own pane:

| Status | Main does |
| -- | -- |
| `DONE THV-x` | Move the ticket to **Ready**. Go to step 5. |
| `DONE_WITH_CONCERNS THV-x` | Read the concerns. Correctness or scope concerns get a fix round first. Observations go to step 5. |
| `NEEDS_CONTEXT THV-x` | Answer with `send.sh`. Re-arm. |
| `BLOCKED THV-x` | Context gap: answer and re-send. Too hard: fresh pane one tier up. Too big: split the ticket. Product call: ask Andres, word for word. |

A watcher exit with no status line means the pane went **stale**. Investigate before anything
else. Read `herdr agent read <pane> --source recent-unwrapped --lines 80` and name the cause:

| Cause on screen | Main does |
| -- | -- |
| Approval or question dialog (`blocked`) | Answer it when it is inside the brief's scope. Otherwise ask Andres. |
| Provider, rate-limit or network error | Wait two minutes and send `continue`. Still failing: restart the agent in the same pane with the brief and its last commit. |
| Turn ended without a status line | Send: `Reply with your status line now: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT or BLOCKED.` |
| Shell prompt, agent gone (`GONE`) | Restart the agent in the same pane. Send the brief plus `Resume from <last commit>.` |
| `working` with a frozen screen (`FROZEN`) | Read further back. A long test run is fine: re-arm. A hung tool: `herdr agent send-keys <pane> esc`, then ask for status. |

**Done when:** every pane has sent a status line that main has handled, or its stale cause is
reported to Andres. Main ends a turn only while a watcher is armed on every live pane.

### 5. Verify

Follow [references/review.md](references/review.md). The verifier runs on a different model family
from the builder, in its own pane, against the base SHA.

**Done when:** every Acceptance line has a verdict with evidence, and every item in the review's
"working if" list is checked.

### 6. Close

After the verifier passes, show Andres the evidence table. On his confirmation:

1. Move the ticket to **Done** with one comment: the evidence table and the commit SHAs.
2. File each minor finding as a follow-up ticket, linked to this one.
3. `herdr pane close` every pane this dispatch opened. Close the tab when it is empty.
4. Delete `$TMPDIR/dispatch/<THV-x>.md` and any file the dispatch wrote outside the repo.

**Done when:** `herdr pane list` no longer shows the dispatch's panes, its brief file is gone, and
the ticket reads Done.
