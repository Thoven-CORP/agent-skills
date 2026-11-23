---
name: workspace-sweep
description: >-
  Board cleanup for Linear: lines up every open ticket with its pull requests in
  both repos, its branches, worktrees and Project documents, and ends in one
  table of proposed writes applied on Andres's yes. Use when he asks to
  reconcile the board, for one Project or every open Project, or to clear
  stale branches and worktrees.
---

# Workspace sweep

A sweep is a reader until Andres says yes. It gathers, joins and proposes, then applies the rows he approves, one at a time, and reads them back. `$workspace` owns one Project's lifecycle writes; the sweep finds where Linear, GitHub and git disagree. Every proposal follows Thoven law's **Own what you find** (`~/thoven/agent-skills/enforcement/rules/thoven-law.md`): a found problem is fixed in the round or becomes a sub-issue of its ticket, and a standalone ticket stands only on his yes.

## Steps

1. **Scope.** One Project, by name or slugId, or every open Project. A bare "sweep the board" covers every open Project. Done when the scope is a list of Project names, or `--all-open`.
2. **Collect** into the session scratchpad:
   ```bash
   S=~/.agents/skills/workspace-sweep/scripts
   node $S/collect.js linear --project '<Project name>' > issues.json   # or --all-open
   node $S/collect.js evidence > evidence.json
   ```
   `collect.js linear` reads with the Linear key `../workspace/tools/set-status.js` uses: every state, archived Done and Canceled included, with labels, parent, comments and the Project's documents. A Linear MCP `list_issues` response saved as-is works too (`../workspace/references/map-input.md`) when it carries closed tickets, labels and parent. `evidence` reads every PR in both repos, origin's branches, the worktrees of `~/thoven/frontend` and `~/thoven/backend` (the primary checkout itself skipped), and the commits naming `THV-` on `main` and each `<slug>/integration` branch of frontend, backend and agent-skills. A failed source exits non-zero; fix it and re-run, because a sweep that is blind somewhere reads clean there. Done when both commands exit 0.
3. **Join.** `node $S/sweep.js --issues issues.json --evidence evidence.json` prints one table, or `nothing to propose` with what it lined up, then each Project's Spec, Architecture and Log with its last update. An input with no tickets exits 2 ("no tickets"): resolve the Project again.
4. **Read each row** before you propose it. The table is mechanical; the write is your call from the ticket, its parent and its PRs:
   - Follow-up or Tech debt with no yes: fold into its parent as a sub-issue, fix it now, or close it with one evidence line. The script names a parent when the ticket has one or its description names an open ticket.
   - Merged or Done with nothing merged: find where it shipped and write that evidence line, or reopen it to Todo.
   - Open ticket whose PR merged: a PR that carried only part of the ticket keeps it open, and the next PR says `Part of THV-n`.
   - A row that closes a ticket checks that the ruling it carried is in the Spec and the Log (`$workspace`, Ruling); a missing ruling joins the table.

   Done when every row has one concrete write and its evidence.
5. **Show one table** to Andres: Ticket · Status · Finding · Evidence · Proposed write. Nothing is written until he says yes, and he may strike rows. Done when he has answered, and each row is approved or struck.
6. **Apply** the approved rows serially:
   - Status: `node ~/.agents/skills/workspace/tools/set-status.js "<state>" THV-n`, which prints the state it read back.
   - Fold: Linear MCP `save_issue` with `parentId`, and `removeLabels` for the label. Close: `save_comment` with the evidence line, then set-status. Before a parent closes, list its children (`../workspace/references/WORKFLOW.md`, Gotchas).
   - Branch: `thoven-branch-prune --remote --delete` for a merged one; otherwise `git push origin --delete <branch>`, keeping the sha the table printed so it can be restored.
   - Worktree: `thoven-worktree remove <path>`. It refuses tracked edits and running processes; report a refusal as the row's result.

   Done when every approved row has its read-back result or its refusal.
7. **Read back.** Re-run steps 2 and 3. Done when the new table holds only the rows he struck, and the reply gives the row count before and after.

## Findings

| Finding | Flagged when | Proposed write |
|---|---|---|
| In Review with no open PR | no open PR names it, and it is not a docs ticket | `In Progress`, or open its PR |
| Merged or Done with nothing merged | no merged PR mentions it or its parent, no commit on `main` or an integration branch names it or its parent, and it is not a docs ticket | one evidence line naming where it shipped, or `Todo` |
| Open ticket whose PR merged | a closing PR merged and none is open | `Done` when it merged into `main`, else `Merged` |
| Branch for a closed ticket | origin has a `thv-n` branch for a Done or Canceled ticket | prune or delete the branch |
| Worktree for a closed ticket | a worktree's branch or folder names a closed ticket | `thoven-worktree remove` |
| Follow-up or Tech debt with no yes | an open ticket has the label and no dated word of his | fold into the parent, fix now, or close |

## What counts as evidence

- **Closing link:** the id in the PR's head branch, its title, or right after a closing word in its body (`Closes THV-1, THV-2`). `Part of THV-n` in the body makes the link partial even when the branch names the id, as WORKFLOW.md's multi-PR rule intends.
- **Docs ticket:** its `Writes to:` names no repo, or it has no `Writes to:` and its title opens with Research, Brainstorm, Design, Spec, Plan, Grill, Audit or Check. It moves by hand, so no PR is expected.
- **His yes:** the ticket sits in the `Tech debt` Project, which he accepts tickets into by moving them, or his name with a date or a ruling verb in the ticket or any of its comments: `(Andres, 2026-11-20)`, `Andres, 16 Nov:`, `Andres ruled`. A date after "Andres's session" is agent text, not a yes. Linear records every agent write as Andres (creator on all 82 open Follow-up and Tech debt tickets on 2026-11-23, with no bot actor), so the creator field cannot tell an agent's ticket from his.
- Only `THV-` tickets line up, because Deployment and Lab keep their own rules.
- PRs come from one `gh pr list --state all` per repo, because `gh pr list --search` goes through GitHub search, capped at 30 calls a minute.

Tests: `node --test scripts/sweep.test.js`.
