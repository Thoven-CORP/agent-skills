# rules-writer report, 2026-11-12

Worktree: `~/thoven/agent-skills-linear-1112`. No git write command was run. No Linear write.

## Changes

| # | Change | Result |
|---|---|---|
| 1 | Statuses | Applied. WORKFLOW: status table (Triage, Backlog, Todo, In Progress, In Review, Merged, Done, Canceled), "Linear moves a ticket with its pull request", loop sketch, old "A merged PR does not move Linear" replaced, agent guidance (CREATING, DOCUMENTS, BRANCHES), WIP cap line (`In Progress` + `In Review`), auto-close ruling and gotcha. `workspace/SKILL.md` `pr` and `merged` rows. `tools/checks.js`, `session-preflight.js`, `workflow.js` and their tests use `In Review` / the new lane list; new test refuses `Ready` and `Merged`. Also `dispatch-work/SKILL.md` (DONE row, close step 1), `review.md`, `meta/monitor.md`, `map-input.md`, `evals/dispatch-work/evals.json`. |
| 2 | Landing line | Applied. New bullet "Landing line" in `branches-and-prs.md`. Pointers (not copies) from WORKFLOW loop and agent guidance, and from `dispatch-work` close step 1. |
| 3 | Labels | Applied. WORKFLOW section 6: two labels, no `Bug`/`Feature`/`Improvement`. Casing example changed to `follow-up`. |
| 4 | Follow-ups | Applied. Home: WORKFLOW "Follow-ups" table. Law "Scope" sentence changed to the route. `dispatch-work` close step 2 and `review.md` point at it. `workspace/SKILL.md` grouped-issue pitfall replaced. |
| 5 | Priority | Applied. WORKFLOW "Priority". |
| 6 | Milestones | Applied in prose: WORKFLOW tree, "The words", section 3, section 8 ladder row and pane-label wording, `linear-project`. Code not changed (see below). |
| 7 | Updates, front page | Applied in WORKFLOW "Project Update": every landing plus weekly, 150 words, health rule labelled main's reading, "Where we are" 200 words with Built, Next, Blocked, Needs Andres, rewritten in place. `workspace/SKILL.md` table row and `linear-project` point at it. |
| 8 | Standing projects | Applied. WORKFLOW "The words" (Feature, Standing project, no floating tickets) and section 6. `linear-project` points at it. |
| 9 | LEARNINGS | Applied to `workspace`, `dispatch-work`, `linear-project`, `enforcement` (each under 80 words). `skills/dev/meta` has no `LEARNINGS.md`, so no entry. |
| 10 | Release note | `releases/2026-11-12-linear-system.md`, 699 words. |

## Words before and after

| File | Before | After |
|---|---|---|
| `workspace/references/WORKFLOW.md` | 5035 | 5472 |
| `workspace/SKILL.md` | 2057 | 2104 |
| `enforcement/rules/branches-and-prs.md` | 1387 | 1487 |
| `enforcement/rules/thoven-law.md` | 1575 | 1582 |
| `dispatch-work/SKILL.md` | 3175 | 3223 |
| `dispatch-work/references/review.md` | 1145 | 1139 |
| `linear-project/SKILL.md` | 818 | 875 |
| `meta/monitor.md` | 1092 | 1092 |

WORKFLOW grew by 437 despite cuts (the retired "Ledger bind", the duplicate OpenCode gotcha, two PR-method sentences now pointing at `branches-and-prs.md`). Eight rulings needed new rules.

## Tests

- `node --test skills/dev/workspace/tools/checks.test.js`: 7 pass, 0 fail.
- `node --test skills/dev/workspace/tools/*.test.js`: 70 pass, 0 fail (includes session-preflight, workflow, skill-contract).
- Not run: dispatch-work Python tests. I changed no Python, and `test_cli.py` fails to import `testkit` from the directory I ran it in.
- Paths named in the new text exist (`handoff.md`, `map-input.md`, both rule files).
- `rg "\bReady\b"` leaves no Linear-status hit outside `LEARNINGS.md`, releases and `skills/exec`. Remaining hits: `WORKFLOW.md:71` (says `Ready` is now `In Review`), `checks.test.js` (the refusal test), and unrelated uses (`full-stop` "Ready to merge", `start-staging` Vercel deployment state, wireframe, runbook templates, `regen.js` regex).

## Main must decide

1. **Code that reads the old milestone meaning, not changed.** `tools/checks.js` (`sessionGate` blocks with no milestone; test fixture uses "Build"), `tools/session-preflight.js` (message "no lifecycle milestone. Create the stage this work is"; fixtures "Build", "Design"), `references/map-input.md` (example `"projectMilestone": {"name": "Build"}`, "Milestone ... read by the session gate"), `grill-with-docs/SKILL.md` line 25 (claim step names milestone), `meta/monitor.md` line 136 ("its Linear milestone (`PRD + Architecture` · `Design` · `Build` · `Review`)"). Does the gate still require a milestone now that a milestone is a stage?
2. **A ticket with no PR** (document, research): the rulings only move PR work. WORKFLOW says set In Review at its path, Done when exit lines hold, labelled main's reading. Confirm or replace.
3. **"Every landing"** for the update trigger: I left it undefined (an integration branch reaching `main`, or any merge into `main`?).
4. **Vertical issue, two PRs.** WORKFLOW keeps the old sentence that Linear moves it on whichever repo merges first. Not re-checked under the new merge rules.
5. **Auto-close gotcha** still tells agents to restore unbuilt children that closed. It is the safe reading of ruling 2; confirm.
6. **WIP cap** counts `In Progress` + `In Review`; Merged is outside it.
7. **`Speccing`** is not mentioned anywhere (no ruling).
8. **Outside this worktree:** WORKFLOW section 7 is pasted into Linear's agent guidance by hand. The frontend and backend `CLAUDE.md` law blocks need `enforcement/sync.sh` for the "Scope" change. The `thoven-doc-size` hook does not count the 150 and 200 word limits.
9. WORKFLOW still carries other old stage language I did not touch ("fat card", DESIGN_SKELETON), as the previous release noted.
