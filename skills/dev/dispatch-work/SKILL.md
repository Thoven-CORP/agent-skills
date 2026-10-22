---
name: dispatch-work
description: >-
  Dispatch a Linear ticket to a coding agent in a Rex or herdr pane and bring it back verified. Use
  when handing a ticket or slice to a pane, choosing which agent, model or CLI runs it, writing a
  dispatch brief, answering a pane's question or alert, or verifying and closing a pane's work.
---

# Dispatch work

Main hands one Linear ticket to a fresh builder pane, keeps working while it builds, then verifies
the result and closes the pane. Builders talk to main by **peer message** (Claude's SendMessage to
main's session name). Every report, question, answer, correction and alert is also an **entry** on
the Project's **board**. A launchd job watches every dispatched pane and posts an alert entry only
when something is wrong. Main never polls.

**Source:** `~/thoven/agent-skills/skills/dev/dispatch-work/`. Home copies are installs.
`scripts/dispatch` runs every pane action and detects Rex or herdr from the pane it runs in. Its
usage text is the syntax authority. First time on a machine: `scripts/dispatch fleet install`.

## Pitfalls

- Dispatch multi-file feature builds only. Make a small visual correction from Andres outside a live dispatch yourself, exactly as worded, and measure its computed style and geometry before you report. (LEARNINGS 2026-10-01)
- Compare the ticket's flow wording with the board frames it names before you dispatch. The frame wins on what it shows, so fix the ruling and the ticket in Linear to match it first. (LEARNINGS 2026-10-09)
- Scope every size or gate rule in a brief to the code the pane writes, and exempt generated artifacts, manifests, routes.rb and files already over the limit. (LEARNINGS 2026-10-09)
- Let `dispatch spawn` fill `{{MAIN_SESSION}}` from the live session. A name carried over from a summary goes stale. (LEARNINGS 2026-10-10)
- Settle a proto sizing or layout edge case during a build by the rule Andres already set, write it into the brief's DECIDED IN CHAT as "Andres ruled" and tell him in one line. Ask him only a product call no rule covers. (LEARNINGS 2026-09-27)
- Give a minor fix, fix round or review pass a clean existing tree, and check `df -h /` and `memory_pressure` before you start heavy panes. (LEARNINGS 2026-10-11)
- List the ticket's Linear comments right before `gh pr merge`. A ruling newer than the last commit holds the merge until the diff applies it. (LEARNINGS 2026-10-03)
- On a UI or copy ticket, show Andres the before and after at the builder's first DONE, so his notes ride fix round 1 and the verifier runs once on the final diff. (LEARNINGS 2026-10-22)
- After every `gh pr merge`, read back `gh pr view <n> --json state,mergeCommit`: a nonzero exit means unknown (`--delete-branch` fails after a good merge when a worktree holds the branch), and a PR already clean merges without `--auto`. (LEARNINGS 2026-10-22)

## Roles

| Main (this session) | Pane (the builder) |
| -- | -- |
| Picks the agent, snapshots the ticket, writes the brief, spawns the pane | Reads its brief and snapshot, builds the ticket as written |
| Owns Linear: every status move and comment | Commits by exact path on the branch it was given |
| Answers questions from Linear and its own context; product calls go to Andres | Asks main by peer message when the spec does not decide, and keeps building the unaffected parts |
| Sends corrections and fix rounds | Posts one REPORT entry and messages main its status line |
| Verifies in a fresh pane, then closes | Waits for main's answer or a fix round |

The pane never writes to Linear, never pushes, and never decides a product question. Main never
edits the pane's code. Fixes go back to a pane. A Codex pane cannot peer-message: it posts entries
only, and the watcher tells main when it settles.

Main moves status with `node ~/.agents/skills/workspace/tools/set-status.js "<State>" THV-x`, which
prints the state it read back. Every merge or Done report ends with the pending Linear writes (status
moves, the Project Update) as a one-line go, so Linear never goes stale without Andres knowing.

## Layout

- **Rex:** one session per Linear Project. Main lives in window 1, `Meta · <Project>`. Each issue
  gets its own window, `<Kind> · <issue title> (THV-x)`. Sub-issues are splits in that window.
- **herdr:** one space per Project. Main's tab is `Meta · <Project>`, each issue is a tab with the
  same label, and sub-issues are panes in that tab.
- Kind names the ticket's work. Pick it by the rule in WORKFLOW.md §8. `dispatch label --kinds`
  prints the accepted words: Meta, Plan, Design, Build, Review, Research, Audit, Fix, Verify.
- Panes of one issue run in parallel only when their `Paths` share no file, in a shared tree too.
  Otherwise run them one after another in the same window.
- Nothing `dispatch` opens takes focus. The verifier gets its own pane beside the builder at step 5.
- The board lives at `~/.local/state/thoven/dispatch/<project>/`: `briefs/`, `snapshots/`,
  `board/` (one file per entry) and the rendered `board.md`. `<project>` is the Project's slug.

## Steps

### 1. Check the ticket is ready, then pick the agent

A ticket is ready when every `Blocked by` issue has merged into `main`, and no pane already holds
it. Check both: the blockers in Linear and `git log origin/main`, and `dispatch board <project>
--ticket THV-x` plus the ticket's status for a live dispatch. A blocked ticket goes back to Andres
with the blocker named. A ticket already in a pane gets a handover, never a second pane on the same
tree.

Then read [references/agents.md](references/agents.md). The ticket's complexity picks the tier,
and `scripts/agents.py` says what that tier runs today. Several small same-shape tickets go to one
pane as one dispatch.

Before dispatching onto an integration branch, compare its `lefthook.yml` and `bin/verify` with
`origin/main`. When they differ, offer Andres a catch-up merge of `main` (merge commit) as a go first:
an old branch's pre-push hook runs checks `main` dropped, and panes end up pushing with `--no-verify`.

**Done when:** the blockers are merged and no pane holds the ticket, and you can state the CLI, the
model, the tier, and one line on why this tier.

### 2. Snapshot, then compose the brief

1. `scripts/dispatch snapshot <project> THV-x` saves the ticket, its comments and the parent's
   decisions. The pane reads this file, never Linear: Linear is unreachable from many panes.
2. Copy [references/brief.md](references/brief.md) to the board's `briefs/THV-x.md` and fill it.
   Carry what the ticket cannot know. Find earlier rulings with one mem0 search (`search_memories`,
   query: the ticket id, its title and the Project). A ruling the ticket lacks goes onto the Linear
   parent first, then re-run the snapshot. A ruling that lives only in this conversation goes in
   DECIDED IN CHAT with its label.
3. Put every binding rule you hold into RULES now. A rule sent after dispatch arrives as an addendum
   the pane may read after it reports.

Pick the ACCESS lines for this ticket from [references/skills.md](references/skills.md). When the
ticket's own process hands the slice Linear moves, write in RULES that main makes them.

**Done when:** every field is filled, every chat ruling carries its label, and DONE WHEN names the
seams and the red-first proof. A field you cannot fill means the ticket is not ready. Fix the ticket
in Linear, then come back.

### 3. Spawn

1. Run each repo's
   `~/thoven/agent-skills/enforcement/bin/thoven-worktree create <fe|be> <area> <n> --project <P> --kind <K>`.
   The Project's integration tree is the unit, so tickets of one Project share a tree and a
   read-only kind gets none. The decision table lives in the script's usage text and in
   `enforcement/rules/thoven-law.md`. Read the exit code:
   - Exit 3: no tree for this kind. Read the Project's tree or `git show`, or write at the issue's `Writes to:` path.
   - Exit 4: the Project's tree exists, and the last stdout line is its path. Work there on the integration branch and end commits with the ticket id. Add `--new "<reason>"` only for overlap or risky long work.
   - Success: the last stdout line is the path.

   Record the base SHA there (`git -C <path> rev-parse HEAD`). Review diffs start there. Never let
   herdr or Rex create the worktree.
2. `scripts/dispatch spawn <project> THV-x --kind <K> --title "<title>" --cwd <path> --tier <n> --base <sha>`.
   It refuses a brief with an unfilled field, fills main's session name, opens the labelled window
   or tab, and starts the agent on its brief. A ticket that spans both repos gets one pane: spawn in
   the frontend tree and add `--add-dir <backend tree>`. A sub-issue adds `--split-of <pane>`. Add
   `--cli codex` only when Andres named Codex.
3. On the first dispatch in this Project, label main's own pane (`$REX_BLOCK` in Rex, `$HERDR_PANE_ID` in herdr): `scripts/dispatch label <pane> Meta "<Project>" --tab`.
4. Move the ticket to **In Progress** with `set-status.js`.

**Done when:** `scripts/dispatch status <pane>` shows WORKING and the ticket reads In Progress.

### 4. Watch

Arm `scripts/dispatch watch <project>` once per session, with the Monitor tool. It prints a line only
when an ALERT entry lands. Peer messages from panes arrive on their own. Those are main's only
wake-ups: no polling loop, no sleep. Keep doing main's own work meanwhile, and end every wake with
one plain-English line to Andres saying what happened and what main did.

A peer message from a pane carries a status line and its entry path:

| Status | Main does |
| -- | -- |
| `DONE THV-x` with its `THOVEN_VERIFY` block | Move the ticket to **Ready**. Go to step 5. |
| `DONE THV-x` without the block | Not done. Reply `Paste the bin/verify block for this diff.` The ticket stays In Progress. |
| `DONE_WITH_CONCERNS THV-x` | Read the concerns. Correctness or scope concerns get a fix round first. Observations go to step 5. |
| `NEEDS_CONTEXT THV-x` | Answer from Linear and this conversation, by peer message plus an ANSWER entry. A product call goes to Andres word for word; relay his answer and add it to the Linear parent. |
| `BLOCKED THV-x` | Context gap: answer it. Too hard: fresh pane one tier up. Too big: split the ticket. Product call: ask Andres. |
| `HANDOFF THV-x` | The pane hit its budget. Spawn a fresh pane on the same brief plus the HANDOFF entry. |

An alert line names the pane and the cause:

| Alert | Main does |
| -- | -- |
| `BLOCKED` (2 min or more) | Read `dispatch read <pane>`. Answer a dialog inside the brief's scope; otherwise ask Andres. |
| `FROZEN` | Read further back. A long test run or `waiting for verification lock` is fine. A hung tool: `dispatch interrupt <pane>`, then ask for status. |
| `GONE` | The agent exited. Spawn a fresh pane on the same brief plus `Resume from <last commit>.` |
| `LIMIT` | Tell Andres the reset time in one line. After it, check `git -C <tree> status` for a half-done merge or rebase, then message the pane `continue`. |
| `SETTLED_NO_REPORT` | Message the pane: `Post your REPORT entry and message me your status line.` The alert lists the tree's uncommitted files; a dirty tree beside a report is the verifier's concern, not an alert, because shared trees carry other sessions' edits. |
| `LIVE_WORK` | A background job still runs under the pane. It re-checks on its own; act only if it repeats. |
| `SETTLED` (Codex) | Read the pane's REPORT entry with `dispatch board <project> --ticket THV-x`, then handle it as the status table says. |

**Corrections and fix rounds go as a peer message plus a CORRECTION entry** (`dispatch post ...
--kind correction`). A message reaches a busy pane between its tool calls, so it never waits for the
turn to end. Use `dispatch interrupt` only to stop work going the wrong way. A Codex pane gets its
fix round with `dispatch send <pane> <file>` once it is idle. Hold the verifier until the pane has
answered the last correction. The entries are the record Andres reads.

**Done when:** every pane has reported and main has handled it, or its alert is reported to Andres.

### 5. Verify

Follow [references/review.md](references/review.md): main's pass, then the review. A feature slice
gets a verifier in its own fresh pane, on the model [references/agents.md](references/agents.md)
names, against the base SHA. The verifier sees the snapshot, the builder's REPORT entry and the diff,
nothing else. Cleanup and hardening get a review subagent of main with the same inputs.

**Done when:** every Acceptance line has a verdict with evidence, and every item in the review's
"working if" list is checked.

### 6. Close

After the verifier passes, show Andres the evidence table and, on a UI ticket, the parity images. On his confirmation:

1. Move the ticket to **Done** with one comment: the evidence table, the `THOVEN_VERIFY` block and
   the merged SHA. Done means the job is finished and merged into its target, the Project's
   integration branch or `main`. The comment and the report say where it lives: "Done on
   `<branch>`, reaches staging when the branch lands", or "Done on `main`, on staging". On a UI ticket, upload the parity
   images to the issue and place them on the board beside their frames.
2. Minor findings are fixed on the branch before Done, or dropped with the reason in that comment.
   They never become tickets. Each `Noticed` line of the report, a problem outside the ticket's
   code, goes as one line into an existing grouped Linear issue, or a new issue only when none fits.
3. `scripts/dispatch close <pane>` for every pane this dispatch opened. Remove the ticket's own tree
   with `thoven-worktree remove` (it drops the tree's databases), never a live integration tree, and
   delete the ticket's merged branches locally and on origin.
4. After Andres has looked at the evidence, `scripts/dispatch clean <project> --ticket THV-x` and
   delete `~/.thoven-artifacts/THV-<id>/evidence/`. When the Project closes, `dispatch clean <project>`.

**Done when:** `dispatch board <project> --ticket THV-x` prints nothing, `git worktree list` no
longer shows the ticket's own tree, its merged branches are gone locally and on origin, and the
ticket reads Done with the comment saying where the work lives.
