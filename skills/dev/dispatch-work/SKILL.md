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

## Pitfalls

- Dispatch multi-file feature builds only. Make a small visual correction from Andres outside a live dispatch yourself, exactly as worded, and measure its computed style and geometry before you report. (LEARNINGS 2026-10-01)
- Compare the ticket's flow wording with the board frames it names before you dispatch. The frame wins on what it shows, so fix the ruling and the ticket in Linear to match it first. (LEARNINGS 2026-10-09)
- Scope every size or gate rule in a brief to the code the pane writes, and exempt generated artifacts, manifests, routes.rb and files already over the limit. (LEARNINGS 2026-10-09)
- Keep `{{MAIN_PANE}}` in the brief and check the reply address `scripts/send.sh` prints against `echo $HERDR_PANE_ID`. A pane id carried over from a summary goes stale. (LEARNINGS 2026-10-10)
- Settle a proto sizing or layout edge case during a build by the rule Andres already set, write it into RULINGS and tell him in one line. Ask him only a product call no rule covers. (LEARNINGS 2026-09-27)
- Give a minor fix, fix round or review pass a clean existing tree, and check `df -h /` and `memory_pressure` before you start heavy panes. (LEARNINGS 2026-10-11)
- List the ticket's Linear comments right before `gh pr merge`. A ruling newer than the last commit holds the merge until the diff applies it. (LEARNINGS 2026-10-03)

## Roles

| Main (this session) | Pane (the executor) |
| -- | -- |
| Picks the agent, writes and sends the brief | Reads the ticket in full and builds it as written |
| Owns Linear: every status move and comment | Commits by exact path on the branch it was given |
| Keeps a watcher armed on every live pane | Reaches for skills at their moments |
| Answers questions, rules on blockers, escalates product calls to Andres | Sends one status line to main with `herdr agent prompt` |
| Verifies in a fresh pane, then closes | Waits for main's reply or a fix round |

The pane never writes to Linear, never pushes, and never decides a product question. Main never
edits the pane's code. Fixes go back to a pane.

**Linear and the cockpit.** Main moves status with `~/.agents/skills/workspace/tools/set-status.js`, cockpit open or not. The
cockpit's ↻ for `started`, `pr` and `merged` clears on its next Linear read, within 5 minutes. A
`report` ↻ and a pane-gone row wait for Andres: his ↻ or `u` is his approval to post the report
comment, and it clears the row. Main leaves both to him and does not run `/workspace update`.

## Layout

- **Space** is the Linear Project. **Tab** is one issue: `<Kind> · <issue title> (THV-x)`. Tickets of
  one Project can share a worktree, and each keeps its own tab and labels. Kind names
  the ticket's work. Pick it by the rule in WORKFLOW.md §8. Main's own tab is `Meta · <Project>`.
  `scripts/label.sh` writes every label and accepts only the kinds `label.sh --kinds` prints. The
  cockpit mod and the herdr sidebar sort work by that word.
- **Panes** in that tab are the sub-tickets of that issue. Run them in parallel only when their
  `Paths` share no file, and that holds for panes in a shared tree too. Otherwise run them one after
  another in the same tab.
- The **verifier** gets its own pane in the same tab at step 5 and closes after it reports.
- Main stays in its own pane. `$HERDR_PANE_ID` is main's address for every return message.
- The space-to-Project mapping and pane naming live in `~/.agents/skills/workspace/references/WORKFLOW.md` §8.
- `herdr --skill` and `herdr <group>` (no subcommand) are the syntax authority. Parse ids from the
  JSON a command returns.

## Steps

### 1. Check the ticket is ready, then pick the agent

A ticket is ready when every `Blocked by` issue has merged into `main`, and no
pane already holds it. Check both: the blockers in Linear and `git log origin/main`, and
`herdr agent list` plus the ticket's status for a live dispatch. A blocked ticket goes back to
Andres with the blocker named. A ticket already in a pane gets a handover or a watcher, never a
second pane on the same tree.

Then read [references/agents.md](references/agents.md). The ticket's complexity picks the tier,
and `scripts/agents.py` says what that tier runs today. Several small same-shape tickets go to one pane as
one dispatch.

**Done when:** the blockers are merged and no pane holds the ticket, and you can state the CLI, the
model, the tier, and one line on why this tier.

### 2. Compose the brief

Copy [references/brief.md](references/brief.md) to `$TMPDIR/dispatch/<THV-x>.md` and fill it.
Point at the ticket. Carry only what the ticket cannot know: rulings from earlier tickets, the base
SHA, main's resolution of anything ambiguous. Find earlier rulings with one mem0 search
(`search_memories`, query: the ticket id, its title and the Project). A recalled ruling the ticket
lacks goes onto the Linear ticket first, then into RULINGS. Pick the ACCESS lines for this ticket from
[references/skills.md](references/skills.md). When the ticket's own process hands the slice Linear
moves, the Roles table still holds: write in RULINGS that main makes them.

**Done when:** every field is filled and DONE WHEN names the seams and the red-first proof. A field
you cannot fill means the ticket is not ready. Fix the ticket in Linear, then come back.

### 3. Launch and send

1. Run each repo's
   `~/thoven/agent-skills/enforcement/bin/thoven-worktree create <fe|be> <area> <n> --project <P> --kind <K>`.
   The Project's integration tree is the unit, so tickets of one Project share a tree and a
   read-only kind gets none. The decision table lives in the script's usage text and in
   `enforcement/rules/thoven-law.md`. Read the exit code:
   - Exit 3: no tree for this kind. Read the Project's tree or `git show`, or write at the issue's `Writes to:` path.
   - Exit 4: the Project's tree exists, and the last stdout line is its path. Work there on the integration branch and end commits with the ticket id. Add `--new "<reason>"` only for overlap or risky long work.
   - Success: the last stdout line is the path.

   Record the base SHA there (`git -C <path> rev-parse HEAD`). Review diffs start there.
2. Open the issue's tab in main's own space:
   `herdr tab create --workspace "${HERDR_PANE_ID%%:*}" --cwd <path> --no-focus`. The pane id is
   `.result.root_pane.pane_id` in the JSON it returns. A sub-issue pane splits into the issue's
   existing tab instead. Never use `herdr worktree open`: it opens the worktree as a new space, so
   the pane lands outside the Project (THV-1007). Label the pane with
   `scripts/label.sh <pane> <Kind> "<title>" THV-x --tab` (drop `--tab` for a sub-issue pane in an
   existing tab). On the first dispatch in a space, also label main:
   `scripts/label.sh $HERDR_PANE_ID Meta "<Project>" --tab`. A pane already in the wrong space
   moves with `herdr pane move <pane> --new-tab --workspace <main's space>`. herdr never creates the
   worktree: its own create (the new-worktree key or `herdr worktree create`) branches from the
   checkout's local HEAD, and herdr 0.9.1 has no setting for a default base.
3. Start the agent with the line `scripts/agents.py launch-line <tier>` prints. Wait for `idle` before prompting. A ticket
   that spans both repos gets one pane: open it in the frontend worktree and add the backend
   worktree with `--add-dir <path>` (Claude, Codex; Devin's dangerous mode already reaches it).
4. `scripts/send.sh <pane> $TMPDIR/dispatch/<THV-x>.md`. It fills main's pane id and sends from a
   file, so backticks and `$(...)` in the brief reach the pane as text. It refuses a pane that is
   not `idle` or `done` and prints its screen, so an update prompt or trust dialog never swallows
   the brief. Clear the dialog, then send again.
5. Move the ticket to **In Progress** with
   `node ~/.agents/skills/workspace/tools/set-status.js "In Progress" THV-x`. It prints the state it
   read back in one line. A status-only `save_issue` through the Linear MCP echoes the whole issue.

**Done when:** `herdr agent get <pane>` shows `working` in main's space, and the ticket reads
In Progress.

### 4. Watch

Arm `scripts/watch.sh <pane> [<pane>...]` with the Monitor tool, or as a background command. It
exits on the first thing main must look at, and prints why. The watcher is the only poll: a
`sleep` loop in main's shell costs a turn per tick and the harness refuses long ones. Keep doing main's own work meanwhile. Every exit wakes main.
Every wake ends with one plain-English line to Andres saying what happened and what main did,
then the watcher re-armed on every pane still live.

A status line from the pane arrives as a message in main's own pane:

| Status | Main does |
| -- | -- |
| `DONE THV-x` with its `THOVEN_VERIFY` block | Move the ticket to **Ready**. Go to step 5. |
| `DONE THV-x` without the block | Not done. Reply `Paste the bin/verify block for this diff.` The ticket stays In Progress. |
| `DONE_WITH_CONCERNS THV-x` | Read the concerns. Correctness or scope concerns get a fix round first. Observations go to step 5. |
| `NEEDS_CONTEXT THV-x` | Answer with `scripts/send.sh`. Re-arm. |
| `BLOCKED THV-x` | Context gap: answer and re-send. Too hard: fresh pane one tier up. Too big: split the ticket. Product call: ask Andres, word for word. |

**A fix round or a binding correction goes as a file.** Write it to `$TMPDIR/dispatch/<THV-x>-fix-<n>.md`
and send it with `scripts/send.sh`. On a pane that is still working, `herdr agent send-keys <pane> esc`
first. Never type a follow-up into a busy pane: a queued message waits for the whole turn and can land
after DONE. Hold the verifier until the pane has answered the file. The files are the record Andres
reads.

A watcher exit with no status line means the pane went **stale**. Investigate before anything
else. Read `herdr agent read <pane> --source recent-unwrapped --lines 80` and name the cause:

| Cause on screen | Main does |
| -- | -- |
| Approval or question dialog (`blocked`) | Answer it when it is inside the brief's scope. Otherwise ask Andres. |
| Provider, rate-limit or network error | Wait two minutes and send `continue`. Still failing: restart the agent in the same pane with the brief and its last commit. |
| Turn ended without a status line | Send: `Reply with your status line now: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT or BLOCKED.` |
| Shell prompt, agent gone (`GONE`) | Restart the agent in the same pane. Send the brief plus `Resume from <last commit>.` |
| `working` with a frozen screen (`FROZEN`) | Read further back. A long test run or `waiting for verification lock` is fine: re-arm. A hung tool: `herdr agent send-keys <pane> esc`, then ask for status. |

**Done when:** every pane has sent a status line that main has handled, or its stale cause is
reported to Andres. Main ends a turn only while a watcher is armed on every live pane.

### 5. Verify

Follow [references/review.md](references/review.md): main's pass, then the review. A feature slice
gets a verifier in its own fresh pane, on the model [references/agents.md](references/agents.md)
names, against the base SHA. Cleanup and hardening get a review subagent of main with the same brief.
Both apply andres-mode "Check your own work" to the diff and read the assertions; neither reruns
what the receipt covers.

**Done when:** every Acceptance line has a verdict with evidence, and every item in the review's
"working if" list is checked.

### 6. Close

After the verifier passes, show Andres the evidence table and, on a UI ticket, the parity images. On his confirmation:

1. Move the ticket to **Done** with one comment: the evidence table, the `THOVEN_VERIFY` block and
   the merged SHA. Done means merged and a user can reach it. On a UI ticket, upload the parity
   images to the issue and place them on the board beside their frames.
2. Minor findings are fixed on the branch before Done, or dropped with the reason in that comment.
   They never become tickets. Each `Noticed` line of the report, a problem outside the ticket's
   code, goes as one line into an existing grouped Linear issue, or a new issue only when none fits.
3. `herdr pane close` every pane this dispatch opened. Close the tab when it is empty.
4. After Andres has looked at the evidence, delete `$TMPDIR/dispatch/<THV-x>.md`,
   `~/.thoven-artifacts/THV-<id>/evidence/` and any file the dispatch wrote outside the repo.

**Done when:** `herdr pane list` no longer shows the dispatch's panes, its brief file is gone, and
the ticket reads Done.
