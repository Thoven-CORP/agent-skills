---
name: dispatch-work
description: >-
  Dispatch a Linear ticket to a coding agent in a pane or subagent and bring it back verified. Use
  when handing a ticket or slice to a builder, choosing which agent, model or CLI runs it, writing a
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
usage text is the syntax authority. First time on a machine, for full pane dispatch only (not
remote checks or plain Rex/SSH coding): `scripts/dispatch fleet install`. Every pane action also
lands in an events log that `clean` keeps, and `scripts/dispatch stats` reads it per pane: reports,
corrections, alerts and tokens.

## Pitfalls

- Dispatch a Linear parent, or a chain of dependent tickets, as one pane with one branch and one PR per repo; append its tickets and fix rounds there instead of opening a PR per ticket, layer or fix. (LEARNINGS 2026-10-26)
- Dispatch multi-file feature builds only. Make a small visual correction from Andres outside a live dispatch yourself, exactly as worded, and measure its computed style and geometry before you report. (LEARNINGS 2026-10-01)
- Compare the ticket's flow wording with the board frames it names before you dispatch. The frame wins on what it shows, so fix the ruling and the ticket in Linear to match it first. (LEARNINGS 2026-10-09)
- Scope every size or gate rule in a brief to the code the pane writes, and exempt generated artifacts, manifests, routes.rb and files already over the limit. (LEARNINGS 2026-10-09)
- Let `dispatch spawn` fill `{{MAIN_SESSION}}` from the live session. A name carried over from a summary goes stale. (LEARNINGS 2026-10-10)
- Settle a proto sizing or layout edge case during a build by the rule Andres already set, write it into the brief's DECIDED IN CHAT as "Andres ruled" and tell him in one line. Ask him only a product call no rule covers. (LEARNINGS 2026-09-27)
- Give a minor fix, fix round or review pass a clean existing tree. Run at most two heavy builders across every main session on this Mac and stagger the rest. Before each spawn, count them from the live process list and re-read `df -h /`, `memory_pressure` and load; when Andres's answer settles one of two risks you raised together, the standing rule still binds the other. (LEARNINGS 2026-10-25)
- List the ticket's Linear comments right before `gh pr merge`. A ruling newer than the last commit holds the merge until the diff applies it. (LEARNINGS 2026-10-03)
- On a UI or copy ticket, put the changed behaviour on the work-session page at the builder's first DONE, so Andres's notes ride the one fix round and review runs once on the final diff. Retain required before/after evidence in the technical report; the finished-feature walkthrough shows current behaviour unless the comparison is needed for his decision. (LEARNINGS 2026-10-22)
- Run parity only on surfaces with a board frame. A copy or rename edit to an undesigned or legacy screen gets a before/after line, never a parity shot, and a "Where" list comes from the board frames, never a word grep. (LEARNINGS 2026-10-24)
- After every `gh pr merge`, read back `gh pr view <n> --json state,mergeCommit`: a nonzero exit means unknown (`--delete-branch` fails after a good merge when a worktree holds the branch), and a PR already clean merges without `--auto`. (LEARNINGS 2026-10-22)

## Roles

| Main (this session) | Pane (the builder) |
| -- | -- |
| Picks the agent, snapshots the ticket, writes the brief, spawns the pane | Reads its brief and snapshot, builds the ticket as written |
| Owns Linear: every status move and comment | Commits by exact path on the branch it was given |
| Answers questions from Linear and its own context; product calls go to Andres | Asks main by peer message when the spec does not decide, and keeps building the unaffected parts |
| Sends corrections and fix rounds | Posts one REPORT entry and messages main its status line |
| Verifies in a fresh pane, then closes | Waits for main's answer; after DONE it takes no new work |

Linear writes, pushes and product calls stay with main. Code stays with the panes, except an easy
fix main makes on the spot.

Main moves status with `node ~/.agents/skills/workspace/tools/set-status.js "<State>" THV-x`, which
prints the state it read back. Each dispatch event applies its row in the workspace fixed-writes
table in that turn. The reply is the read-back line.

## Layout

- **Rex:** one session per Linear Project. Main lives in window 1, `Meta · <Project>`. Each
  dispatched pane, verifier and sub-issue panes included, floats minimized in that window, labelled
  `<Kind> · <issue title> (THV-x)`: `dispatch spawn` opens it, moves it into a floating layer and
  minimizes it with Rex's own layer state, so main's layout never changes. `--tab` opens its own
  window instead, only when Andres asks.
- **herdr:** one space per Project. Main's tab is `Meta · <Project>`, and each dispatched pane is a
  split beside main with the same label. `--tab` opens its own tab instead.
- Kind names the ticket's work. Pick it by the rule in
  [WORKFLOW.md §8](../workspace/references/WORKFLOW.md). `dispatch label --kinds` prints the
  accepted words.
- Panes of one issue run in parallel only when their `Paths` share no file, in a shared tree too.
  Otherwise run them one after another in the same window.
- The verifier gets its own pane beside the builder at step 5.
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
and `scripts/agents.py` says what that tier runs today. A Linear parent, or a chain of tickets that
build on each other, goes to one pane as one dispatch: one agent in both repos (`--add-dir`), one
branch and one PR per repo, each ticket committed there and every fix appended. Give that pane a
checkpoint at each child ticket: it posts a REPORT for the child before it starts the next, so a
planned handoff lands between tickets. Several small same-shape tickets go the same way.

Before dispatching onto an integration branch, compare its `lefthook.yml` and `bin/verify` with
`origin/main`. When they differ, run `/modernize` on the branch for its verdict only.
MODERNIZE: make the catch-up merge of `main` (a merge commit; a shared integration branch is never
rebased) and note it on the work-session page. REWORK or CLOSE is a finding for Andres.

**Done when:** the blockers are merged and no pane holds the ticket, and you can state the CLI, the
model, the tier, and one line on why this tier.

### 2. Snapshot, then compose the brief

1. `scripts/dispatch snapshot <project> THV-x` saves the ticket, its comments and the parent's
   decisions. Read the Project brief, relevant linked document bodies and latest Update as well.
   The command's ticket snapshot does not fetch all those sources. Include their governing content
   and retrieval provenance using [handoff.md](../workspace/references/handoff.md). A URL alone
   is insufficient. When the receiver has Linear access, re-read there; otherwise carry the actual
   relevant content and disclose missing or stale context.
2. Copy [references/brief.md](references/brief.md) to the board's `briefs/THV-x.md` and fill it.
   Before DESIGN names a control or a design value, run thoven-designer and name the shared primitive with one live call site.
   Carry what the ticket cannot know. Find earlier rulings with one mem0 search (`search_memories`,
   query: the ticket id, its title and the Project). Write a ruling the ticket lacks with
   `update THV-n grill`, then re-run the snapshot. A confirmed product brief uses `update THV-n brief`.
   DECIDED IN CHAT cites the decision id.
3. Record execution mode and host, absolute worktree, branch/base HEAD and paired repository.
   A remote coding tree must be outside every Mutagen test mirror. Preserve existing PR routing.
4. Put every binding rule you hold into RULES now. A rule sent after dispatch arrives as an addendum
   the pane may read after it reports.

Pick the ACCESS lines for this ticket from [references/skills.md](references/skills.md). When the
ticket's own process hands the slice Linear moves, write in RULES that main makes them.

**Done when:** every field is filled, every chat ruling cites a decision id read back from Linear, and STOP WHEN names the
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
   It fills the `{{…}}` fields and `THV-<id>`, and refuses a brief with a `{{…}}` or `<<…>>` slot
   left, or one that reads `{{SNAPSHOT}}` before the snapshot exists. When the agent fails to start,
   the pane stays registered, so STARTUP or GONE reports it. A ticket that spans both repos gets one pane: spawn in the frontend tree and add `--add-dir <backend tree>`. The pane opens
   floating and minimized. A sub-issue adds `--split-of <pane>` to open beside its parent's pane.
   Add `--tab` only when Andres asks for a separate window. Add `--cli codex` only when Andres named Codex.
3. On the first dispatch in this Project, label main's own pane (`$REX_BLOCK` in Rex, `$HERDR_PANE_ID` in herdr): `scripts/dispatch label <pane> Meta "<Project>" --tab`.
4. Move the ticket to **In Progress** with `set-status.js`.

**Subagent builder.** When Andres asks for a subagent instead of a pane, skip `dispatch spawn` and
label nothing. Make the tree as in item 1, fill `{{…}}` by hand, and launch an Agent
whose prompt is the filled brief, verbatim from its first skill line. In Claude Code use
`general-purpose` with the Skill tool available. In Codex use a builder with file-read access and
write `$poteto-mode` on the opening line. FIRST TURN explicitly loads poteto-mode for each harness;
the opening line alone does not invoke a skill inside a subagent prompt. This builder owns the
playbook. Its implementation delegates use the roles poteto-mode specifies.
Replace pane communication with the REPORT block as its final message. It asks main through the
host's available subagent channel and continues independent work; a product call still goes to main.
Preserve the rest of the brief, including FIRST TURN. Move the ticket to In Progress.

**Done when:** `scripts/dispatch status <pane>` shows WORKING and the ticket reads In Progress. For a
subagent builder: its transcript shows poteto-mode loaded, its first message prints the native
playbook's steps, and the ticket reads In Progress.

### 4. Watch

Arm `scripts/dispatch watch <project>` once per session, with the Monitor tool. It prints one line
per new ALERT entry, and per REPORT, QUESTION or HANDOFF entry from a Codex pane. Its cursor
(`<project>/watch.cursor`) replays what landed while no watch ran, so a re-armed watch misses
nothing. Peer messages from panes arrive on their own. Wait on those two wake-ups only, doing
main's own work meanwhile. A wake that changed something updates the work-session page
(andres-mode, Replies) and ends with one line to Andres pointing at it.

A peer message from a pane carries a status line and its entry path:

| Status | Main does |
| -- | -- |
| `DONE THV-x` with its test lines | Move the ticket to **Ready**. Go to step 5. |
| `DONE THV-x` without test lines | Not done. Reply `Paste each command you ran and its pass line.` The ticket stays In Progress. |
| `DONE_WITH_CONCERNS THV-x` | As `DONE`; its concerns join the review findings (review.md, "Handling findings"). |
| `NEEDS_CONTEXT THV-x` | Answer from Linear and this conversation, by peer message plus an ANSWER entry. A product call goes to Andres word for word; relay his answer and add it to the Linear parent. |
| `BLOCKED THV-x` | Context gap: answer it. Too hard: fresh pane one tier up. Too big: split the ticket. Product call: ask Andres. |
| `HANDOFF THV-x` | The pane reached its HANDOFF point. Spawn a fresh pane on the same brief plus the HANDOFF entry and the takeover line below. |

An alert line names the pane and the cause:

| Alert | Main does |
| -- | -- |
| `STARTUP` | No status 90s after launch. Read `dispatch read <pane>` and answer the trust, update or login dialog with `dispatch key <pane> <key>` (`enter`, `down`, `1`, ...). The opening prompt rides in the launch line and starts once the dialog closes. |
| `BLOCKED` (2 min or more) | Read `dispatch read <pane>`. Answer a dialog inside the brief's scope with `dispatch key <pane> <key>`; otherwise ask Andres. |
| `FROZEN` | Read further back. A long test run or `waiting for verification lock` is fine. A hung tool: `dispatch interrupt <pane>`, then ask for status. |
| `GONE` | The agent exited. Spawn a fresh pane on the same brief plus the takeover line below. |
| `LIMIT` | Tell Andres the reset time in one line. After it, check `git -C <tree> status` for a half-done merge or rebase, then message the pane `continue`. When main's own limit resets, run `dispatch status` on every pane, re-arm `dispatch watch`, and `git status --short` in each tree. Re-apply only a path that status shows this pane changed. Re-dispatch a frozen pane. |
| `SETTLED_NO_REPORT` | The pane ended a turn with no REPORT, QUESTION or HANDOFF entry of its own. Message it: `Post your REPORT entry and message me your status line.` The uncommitted files it lists may be other sessions' edits in a shared tree. `still running: …` means a background job kept it from reporting for 10 minutes: ask the pane whether it still needs that job, and to stop a server it forgot. |
| `TICK_ERROR` | The watcher failed to read this pane for 4 ticks in a row (about 2 minutes) and names the last error. Run `dispatch status <pane>`. Several panes timing out together (`rex call timed out`) means the machine is overloaded: check load and memory, then prune or hold panes before anything else. A single pane's Rex or herdr error is the backend's to fix; tell Andres in one line. While the status read itself fails, no other alert fires for that pane. |
| `SETTLED` (Codex) | Read the pane's REPORT entry with `dispatch board <project> --ticket THV-x`, then handle it as the status table says. |

When a UI fix round reports, read the parity grid in its REPORT, then push the pane's commits.

**Corrections to a working pane go as a peer message plus a CORRECTION entry** (`dispatch post ...
--kind correction`); a message reaches a busy pane between its tool calls. Use `dispatch interrupt`
only to stop work going the wrong way. A Codex pane gets its correction with `dispatch send <pane>
<file>` once it is idle. Hold the verifier until the pane has answered the last correction. The
fix round goes to a fresh pane (`references/brief.md`, "Fix-round brief").

**Takeover.** A replacement pane gets the same brief with its opening line changed to
`/poteto-mode session-pickup THV-x "<title>"`, plus this line: `Pick up on <branch> from <last
commit>. The earlier pane's handoff is <entry path>. Its commits and report are claims: re-prove them
before you build on them. Finish is this brief's DONE, commits only.` Never name another skill such
as `/takeover` in a brief: the pane loads it instead of poteto-mode.

**Done when:** every pane has reported and main has handled it, or its alert is reported to Andres.

### 5. Verify

After main pushes and opens the ticket PR, arm one watcher for it with the Monitor tool
(`timeout_ms: 3600000`): `~/.agents/skills/babysit-pr/scripts/pr-wait <n> --until green`. Run
nothing else that polls the PR. Exit 1 on a red check is a finding (review.md, "Handling findings").
On a PR into `main`, BEHIND needs nothing: the merge queue tests it on top of current `main`. Rebase
only when it is DIRTY. On an integration branch, BEHIND or a base commit touching the PR's files
means main brings it up to date first. Re-arm after every push. Auto-merge is armed once the PR
review passes (review.md, "Every PR"); on a PR into `main`, green means queued: arm
`~/thoven/agent-skills/enforcement/bin/pr-queue-wait <owner/repo> <n>`, which exits 0 on the merge and 1 when the merge queue rejects the PR.

Follow [references/review.md](references/review.md): main's pass, then a verifier pane for a
feature slice or a review subagent for cleanup and hardening.

**Done when:** every Acceptance line has a verdict with evidence, and every item in the review's
"working if" list is checked.

### 6. Close

After the verifier passes and the PR merges on green, put the outcome on the canonical work-session page, with the current walkthrough and links to its evidence table and complete parity grid on a UI ticket, as review.md describes. Then, with no go to wait for:

1. Move the ticket to **Done** with one comment: the page's human-readable part for this ticket
   and the merged SHA. Done means merged into its target, the Project's integration branch or
   `main`, and the comment says where it lives: "Done on `<branch>`, reaches staging when the
   branch lands", or "Done on `main`, on staging". On a UI ticket, upload the parity images to the
   issue and place them on the board beside their frames.
2. Each minor or structural finding, and each `Noticed` line of the report (a problem outside the
   ticket's code), goes as one line into the follow-up ticket: an existing grouped Linear issue, or
   a new issue only when none fits.
3. `scripts/dispatch close <pane>` for every pane this dispatch opened. Remove the ticket's own tree
   with `thoven-worktree remove`, never a live integration tree. It drops the tree's databases and
   deletes every local branch whose PR merged; GitHub deletes the branch on origin at merge.
4. Once Linear and the page carry the evidence, ensure the page embeds its media or owns durable copies of every referenced capture. Then `scripts/dispatch clean <project> --ticket THV-x` and
   delete `~/.thoven-artifacts/THV-<id>/evidence/`. When the Project closes, `dispatch clean <project>`.

**Done when:** `dispatch board <project> --ticket THV-x` prints nothing, `git worktree list` no
longer shows the ticket's own tree, its merged branches are gone locally and on origin, and the
ticket reads Done with the comment saying where the work lives.
