---
name: dispatch-work
description: >-
  Hand a Linear ticket to a Claude Code builder subagent from main and bring it back reviewed. Use
  when handing a ticket or slice to a builder, writing its brief, answering its question, or
  reviewing, merging and closing its work.
---

# Dispatch work

Main hands one Linear ticket, or one parent with its chain, to a fresh Claude Code subagent (the
Agent tool), keeps working while it builds, reads its REPORT, runs the one review and closes the
ticket. Main owns Linear, pushes and product calls; the builder owns the code on its branch.

## Pitfalls

- Make a small visual correction from Andres yourself, exactly as worded, and measure its computed style before you report. Dispatch multi-file builds only. (LEARNINGS 2026-10-01)
- Compare the ticket's flow wording with the frames it names before you dispatch. The frame wins on what it shows: fix the ticket in Linear first. (LEARNINGS 2026-10-09)
- Write each ruling Andres gave in chat into the spec before dispatch, in his words with its Log entry, and link it from the ticket's Build from. (LEARNINGS 2026-09-27)
- Builders in parallel in one tree each own named files; name one owner for each shared file (`globals.css`, `components/ui/*`, the colour tokens). (LEARNINGS 2026-11-23)
- Right before `gh pr merge`, list the ticket's Linear comments: a ruling newer than the last commit holds the merge until the diff applies it. (LEARNINGS 2026-10-22)

## 1. Ready, then pick the model

A ticket is ready when every `Blocked by` issue has merged into `main` (Linear plus
`git log origin/main`) and no session holds it (its status). A blocked ticket goes back to Andres
with the blocker named.

Pick the subagent's `model` and `effort` from `~/.claude/pstack-models.md`, "Difficulty tiers".

**Done when:** the blockers are merged, nobody holds the ticket, and you can name the model, the
effort and why.

## 2. Ticket, then brief

The ticket is the builder's spec: Outcome, What to build, Build from, Exit criteria and Leave alone,
as the workspace Build ticket template lays them out. Its exit criteria are the eval
([WORKFLOW.md](../workspace/references/WORKFLOW.md), "Exit criteria"): what done is and how it is
measured, never a list of steps.

1. Read the ticket, the spec rules and architecture units it links, and the Project's latest
   Update. A ruling the spec lacks goes in with `workspace` `update THV-n grill`.
2. Fill [references/brief.md](references/brief.md).

**Done when:** every ticket section is filled, each exit criterion says how it is measured, and the
brief has no `<<…>>` slot left. A section you cannot fill means the ticket is not ready.

## 3. Launch

1. Make the tree: `~/thoven/agent-skills/enforcement/bin/thoven-worktree create <fe|be> <area> <n> --project <P> --kind <K>`.
   Exit 4 prints the Project's existing tree as the last line: work there. Record the base SHA.
2. Launch one Agent call: `subagent_type: "general-purpose"`, the model and effort from step 1,
   the filled brief as its prompt. A ticket across both repos is one builder whose brief names
   both trees.
3. `workspace` `update THV-x started`.

**Done when:** the Agent call is running and the ticket reads In Progress.

## 4. Answer

The builder's final message is its REPORT ([brief.md](references/brief.md)).

| Status | Main does |
|---|---|
| `DONE`, each exit criterion measured | Step 5 |
| `DONE` with a criterion unmeasured | Send it back: "Measure every exit criterion." |
| `DONE_WITH_CONCERNS` | As `DONE`; the concerns join the review's findings |
| `NEEDS_CONTEXT` | Answer from Linear and this session; a product call goes to Andres word for word, and his answer goes into the spec |
| `BLOCKED` | Context gap: answer it. Too hard: a fresh builder one model tier up. Too big: split the ticket |

A correction is an edit to the ticket line in Linear, then one message to a running builder:
`THV-x updated: <section>. Re-read the ticket.`

**Done when:** every builder has reported and each report is handled.

## 5. Review

Push, open the PR (`workspace` `update THV-x pr <n>`), then follow
[references/review.md](references/review.md): main's checks, one `review-change`, one fix round.
Watch CI and the merge queue with `/babysit-pr`.

**Done when:** every exit criterion has a verdict with its measurement at the head SHA, and every
finding is handled as review.md says.

## 6. Close

1. Arm auto-merge once the review passes; after the merge, `workspace` `update THV-x merged <n>`.
   Comment where the work lives: "Merged on `<branch>`, reaches `main` when the branch lands", or
   "Done on `main`, on staging".
2. Every sub-issue opened for a finding is Done before this ticket closes.
3. Remove the ticket's own tree with `thoven-worktree remove`, never a live integration tree.

**Done when:** the ticket reads Merged or Done with that comment, and `git worktree list` no longer
shows its own tree.
