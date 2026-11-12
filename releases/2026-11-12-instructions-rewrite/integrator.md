# Integrator: check against the proposal, and the cross-file loose ends (2026-11-12)

Result: ISSUES. Every test passes, and the staged law blocks match the working copy's law. I closed 25 loose ends and fixed 13 mismatches. 19 items below need a call from Andres or main.

Working copy: `~/thoven/agent-skills-instructions-1112`. I ran no git write, no Linear write and spawned no subagent. I edited only the working copy, `staged/` and this report.

## (a) Loose ends closed, by file

**1. "Branches and PRs" citations now point at `enforcement/rules/branches-and-prs.md` (8 fixes)**
- `skills/dev/workspace/references/WORKFLOW.md`: three fixes. §4 "Branching across both repos" (the naming), and §7 BRANCHES, both bullets.
- `skills/dev/dispatch-work/references/review.md`: "Every PR".
- `skills/andres-mode/SKILL.md`: the Delegation merge line.
- `skills/dev/publish/SKILL.md:62`.
- `skills/dev/publish/references/staging.md:17`: "the thoven-law.md method".
- `skills/dev/dispatch-work/SKILL.md` step 3.1: "decision table lives in … thoven-law.md".
- Left as they are: LEARNINGS history entries (they are dated records). The staged files had no citations.

**2. Pointers that now resolve (checked; the only fixes needed are listed elsewhere in this report)**
- `verify` and andres-mode point at WORKFLOW "### Exit criteria". It exists (§4).
- The law's "Targeted tests" points at `~/.agents/skills/verify/SKILL.md` and `TESTING.md`.
- The law's "Design parity" keeps its opening paragraph and the eight bullets, byte-identical to andres-mode's Nov 8 text. Its citations of the "REPORT's Discrepancies table (brief.md, REPORT, Parity)" resolve: `brief.md` REPORT still has a `Parity` row naming the Discrepancies table.
- andres-mode no longer points at `brief.md`. The paragraph that did was cut, which is correct.
- `review.md` "Handling findings" holds the one copy of the fix-round rule. `agents.md` and andres-mode point at it.
- workspace "Writing to Linear" and its "### How to write a Project document" exist. Both the law and WORKFLOW:11 cite them.
- `standing.md` names four law paragraphs: Targeted tests, Local database, Scope and Design parity. All four exist.
- Frontend `TESTING.md` has "Mini parity pilot" (:418) and "What CI runs" (:73).

**3. Items from the workers' "Needs from another file" lists (11 fixes)**
- `workspace/references/PROJECT_SNAPSHOT.md`: both C10 lines (:17, :25).
- `meta/SKILL.md:22`: "existing decision row" becomes "existing Spec or Architecture section". The tab-digest line now reads "reconciles with the Project's Spec".
- `state-brief/SKILL.md:12`: "a flow the parent has no machine for" becomes "the Architecture document has no machine for". w-spec had already done :94.
- `dispatch-work/references/skills.md`: the `/state-brief` row's "the Linear parent holds no machine" becomes "the Project's Architecture document holds no machine".
- WORKFLOW (w-spec's list):
  - §5 Plans takes spec-chain C4's sentence.
  - §7 "/writing-plans still exists for a session plan" is deleted.
  - §6 `/to-spec` is dropped from the `needs-triage` line.
  - The milestone-table row (:153) no longer exists, because C9 deleted the ladder.
- `enforcement/LEARNINGS.md`: b-code's drafted entry (size counter, builder profile), placed on top.
- `dispatch-work/LEARNINGS.md`: the snapshot line. I folded it into the existing 2026-11-12 entry and rewrote that entry to 60 words.
- `staged/CLAUDE-root.md:54`: "Grill: `/grill-with-docs` → `/architect`". "Session plan" becomes the C4 wording, "Plan your own session's steps on one ticket: `/writing-plans` (scratch file)".
- Already applied by their owners, checked:
  - `handoff.md` no longer has "carry their governing content".
  - b-code applied `linear.py`, `test_procs.py` and the `compose.py` docstring and FIRST line.
  - `development-environment.json` no longer lists `technical-spec-generator`.

**4. One name per thing (6 fixes)**
- workspace `SKILL.md` Fixed writes `report`: "its Acceptance rows" becomes "its Exit criteria rows". `evals/04-dispatch-update.md` changes the same way, twice.
- `meta/monitor.md:137`: "ticket `Done when:`" becomes "ticket `Exit criteria`".
- `verify/SKILL.md` step 6: "the done line" becomes "the report", twice.
- `workspace/evals/02-capture-close.md`: "The log is a Project Update" becomes "Where work stopped is Activity: a Project Update". The auto-fail line changes the same way.
- `dispatch-work/SKILL.md` corrections paragraph: "which is the log" becomes "which is the board's record of it".
- Checked:
  - The ticket sections read `Writes to:`, Outcome, What to build, Build from, Exit criteria and Leave alone in WORKFLOW "The ticket", `brief.md`, dispatch step 2 and the Linear Build template.
  - The Log entry has a Chat line in workspace Ruling step 2 and in eval 05.
  - "Done when" remains only as skill-step completion markers and in publish.

## (b) Per lever

| Lever | Verdict | Mismatches, and what I did |
|---|---|---|
| Linear templates | Matches (l-linear read back every write) | None in files. Duplicate team copies are under (c) |
| Workspace | Matches, after fixes | WORKFLOW Artifacts "Plan: The task breakdown. Produces Issues." contradicted spec-chain C4. It now reads "The builder's scratch file for its own session. Never a Project document." §5 "reconciliation across PRD, …" now says the Spec and Architecture. Proto row "`feature-ledger` rule 15" pointed at a rule with no home; it now points at `feature-ledger` `references/RECONCILIATION.md`. "a `DESIGN_<PROJECT>.md` owning gate" was cut (that template is deleted) |
| andres-mode | Matches | Four Pitfalls, Hard rules as each rule's only home, one parity pointer. `/verify-this` is kept for main, under (c) |
| Dispatch | Matches, after one fix | `review.md` Main's pass step 2 restated the law's required-field rule. It now points at the law. No check-in, no HANDOFF, no 150-action rule anywhere (grepped). Change 9 not applied (optional) |
| Verify and review | Matches, after one fix | `verify` restated the law's scan-allowlist sentence in its own wording, a second home. It now points at the law's Design parity, "The design system is reference, not hard code". Direct importers' tests sit only under "Wider runs". No proof is rerun by default (review step 1, verify step 8) |
| Spec chain | Matches, after fixes | The `to-tickets` patch tuple said "THV Build issue template". The Build template is workspace-scoped, so it now says "Build issue template". Patch probe on temp copies: 4 patched, 0 stale, and a second run changes nothing. Staged frontend "A plan carries a coverage table" contradicted C4 (no project plan) and repeated the law's "built means mounted". Frontend and backend now say payload fields live in the Architecture's "Data and contract", filled from the serializer (spec-chain C9's intent). Staged frontend skill line "Spec and slices: `/to-spec`, `/to-tickets`" now reads "Slices: `/to-tickets`", and its docs table drops `to-spec` |
| Law and CLAUDE.md | Matches, after fixes | `staged/AGENTS-root.md` "Decisions: `decisions/*.md` in the repo" contradicted "Records and sources". It now names the Spec and Architecture documents. `staged/CLAUDE-root.md` "feature-ledger reconciles … PRD" now names the Spec and Architecture. `staged/frontend-CLAUDE.md` was one sentence behind live `main` (the THV-1631 Oxlint sentence in the library-use row) and is now synced |
| Builder start-up load | Matches (not launched) | None |

Grill contradictions searched for, none left: a check-in per commit, a 150-action hand-over, a second party rerunning a proof by default, a builder editing exit lines, "outcomes, not proofs", a per-ticket review inside one dispatch, and direct importers' tests as a builder check. Frontmatter: all 12 changed `SKILL.md` files have `name` and `description`. No live file names a deleted file. The one exception is the README renames row for the retired `technical-spec-generator`, which is intended.

## (c) Needs Andres or main

1. The law's moved parity bullet "Spec parity by decision id" still says "every acceptance line … a parent decision id". Ruling 9 forbids rewording it, and it now contradicts exit lines and spec rules. Does Andres want it reworded to "every exit line and behaviour traces to its spec rule"?
2. w-law kept the Design parity opening paragraph ("Apply visual parity when the task intentionally uses a named design source…"), which ruling 9's bullets did not include. Keep it or drop it.
3. Every new LEARNINGS entry points at `releases/2026-11-12-instructions-rewrite.md`, which does not exist. Main writes it before the commit.
4. Grill §5 said one probe of `save_document` and `save_issue` must come before the size counter enters a skill. The hook is built and registered, and workspace says "The size counter reports each page's count after a save", but the probe has not run.
5. The builder profile has never launched. `config/agents.toml` and `enforcement/config/builder-settings.json` must land in one commit, because a missing `--settings` path was not tested.
6. Linear: THV and DEP each show two copies of Work item, Bug and Brainstorm, one workspace and one team. Removing one copy needs an archive and a change to THV's default template.
7. WORKFLOW §7 agent guidance changed. It must be re-pasted into Linear → Settings → Agents.
8. The dispatch pitfall that w-dispatch cut has no home now: a copy or rename edit to an undesigned screen gets a before/after line, not a parity shot. The law's parity text does not say it.
9. andres-mode keeps `/verify-this` for main's test-and-fix runs, but verify-review C7 says no call site names it. It runs in main only, so it does not break the grill, but Andres should choose.
10. "Try one case the ticket did not name" now sits under verify's "Wider runs", not the builder's checks. That fits the grill. Main confirms.
11. andres-mode says "Codex only when the user asks for it by name", which conflicts with the standing Codex fix-round rule (w-andres-verify).
12. The working copy's own `AGENTS.md:13` cites `thoven-law.md` for "this repo takes no PRs". That rule is now in `branches-and-prs.md`. My limits forbid editing `AGENTS.md`.
13. The law's "Records and sources" says "a decision lives in its row", and the workspace says "one decision, one line". The approved text drifts by one word. A rewording means re-rendering both staged law blocks.
14. WORKFLOW §1 "Unit shape by phase" and §6 "WIP cap" still say "PRD and Design fat cards", and §8 keeps the DESIGN_SKELETON ladder. These are old stage names; w-workspace left them.
15. `thoven-designer/SKILL.md:10` cites "`feature-ledger` rule 16". No such rule exists, and the root Feature Folders section that named rules 13 to 16 is gone. This was already dangling and was not edited.
16. "Main and Andres edit exit lines" has four homes with different wording: the law, WORKFLOW "Exit criteria", `standing.md` and `brief.md`. The meaning is the same. Main can leave them, or make `standing.md` point at the law.
17. WORKFLOW §7 BRANCHES restates the merge-method table from `branches-and-prs.md`. It is pasted guidance, and the copy existed before today.
18. `scripts/check-publish-checklist.py` reports "checklist drifted" (for example "Stop: CI never started"). It reports the same before and after these edits, so this is old drift.
19. Re-diff `staged/*CLAUDE*.md` against the live checkouts right before the product PRs. Frontend `main` moved once after staging.

## (d) For the product-repo pull requests

- Frontend `.claude/docs/SKILL_AND_AGENT_ROUTING.md:25`
  - now: `Feature pipeline → `/grill-with-docs`, then `/architect`, then `/to-spec`.`
  - becomes: `Feature pipeline → `/grill-with-docs`, then `/architect`.`
- Same file, `:26`
  - now: `- **"write a plan"** — for a feature → `/writing-plans`. Structures first: `/architect`.`
  - becomes: `- **"write a plan"** — your own session's steps on one ticket → `/writing-plans` (scratch file). Structures first: `/architect`.`
- Same file, `:29`
  - now: `Contradictions between PRD, design, API and code → `/feature-ledger`.`
  - becomes: `Contradictions between the Spec, Architecture, design and code → `/feature-ledger`.`
- Frontend `TESTING.md` "## Done" (:134-140) becomes (verify-review C6):

  ```
  ## Done

  The builder's checks are each exit line's proof, run once, plus `pnpm run type-check` and ESLint on the files you touched; the commands are in `~/.agents/skills/verify/SKILL.md`. Nothing runs on push. A push to a PR into `main` runs the `push` profile (lint, types and contracts, no tests) and the merge queue runs the `pr` profile before it lands; a PR into an integration branch runs no CI. The ship gate for a feature is in `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md`.
  ```
- `/to-spec` left the chain, so these lines change:
  - Frontend `docs/agents/issue-tracker.md:5` and `:145`: "`/to-spec` and `/to-tickets`" becomes "`/to-tickets`".
  - Same file, `:63`: the `/to-spec` row is deleted.
  - Frontend `docs/agents/triage-labels.md:19-20`: "`/to-spec` and `/to-tickets`" becomes "`/to-tickets`".
  - Backend `docs/agents/issue-tracker.md:10`: "`/to-spec` writes a spec issue, `/to-tickets` cuts build issues. Both create Linear" becomes "`/to-tickets` cuts build issues from the Architecture's Units table. It creates Linear". The rest of the sentence stays.
- The staged `frontend-CLAUDE.md`, `backend-CLAUDE.md`, `CLAUDE-root.md`, `AGENTS-root.md` and `global-CLAUDE.md` replace their live files. Each repo's `AGENTS.md` is a symlink to its `CLAUDE.md`.

## (e) Tests, run once by path, in the foreground

| Command | Result |
|---|---|
| `cd skills/dev/workspace/tools && node --test skill-contract.test.js` | `ℹ pass 4` `ℹ fail 0` |
| `cd skills/dev/dispatch-work/scripts/dispatch_lib && python3 -m pytest test_cli.py -k template -q -p no:cacheprovider` | `1 passed, 37 deselected in 0.04s` (rerun after my `review.md` edit) |
| `cd skills/dev/dispatch-work/scripts && python3 dispatch_lib/test_procs.py` | `Ran 7 tests … OK` |
| `cd skills/dev/dispatch-work/scripts && python3 dispatch_lib/test_cli.py` | `Ran 38 tests in 0.228s OK` (rerun after my edits) |
| `cd herdr/plugins/thoven-workflow/dispatch && python3 test_compose.py` | `Ran 6 tests in 0.025s OK` |
| `cd enforcement/install && python3 -I test_doc_size.py` | `Ran 12 tests in 1.635s OK` |
| `cd enforcement/install && python3 -I test_claude.py` | `test_claude: all passed` |
| `cd enforcement/install && python3 -I test_track_edits_pre.py` | `Ran 5 tests in 0.460s OK` |
| `cd enforcement/install && python3 -I test_skill_blocks.py` | `ok` |
| `python3 -I enforcement/install/law.py <tmp>/fe <tmp>/be` (report mode; temp copies of the staged frontend and backend files) | exit 0, no DRIFT line. Run twice, the second time after my staged edits. Temp copies deleted |

Extra checks, not on the list:
- `apply_patches()` from `reapply-skill-patches.py` on temp copies of the installed `architect` and `to-tickets`: 4 patched, 0 stale, then 0 changed on a second run.
- `ast.parse` on the hook passes.
- `development-environment.json` parses.
- `check-publish-checklist.py` gives the same output on HEAD's publish skill and on the working copy's.

## (f) Final `git status --short`

```
 M README.md
 M config/agents.toml
 M enforcement/LEARNINGS.md
 M enforcement/config/skills-invocable.txt
 M enforcement/hooks/reapply-skill-patches.py
 M enforcement/hooks/thoven-andres-mode
 M enforcement/hooks/thoven-ticket-recall
 M enforcement/install/claude.py
 M enforcement/install/test_claude.py
 M enforcement/rules/thoven-law.md
 M herdr/plugins/thoven-workflow/dispatch/compose.py
 M scripts/mine-transcripts.sh
 M skills/andres-mode/LEARNINGS.md
 M skills/andres-mode/SKILL.md
 M skills/dev/cco-audit/SKILL.md
 M skills/dev/dispatch-work/LEARNINGS.md
 M skills/dev/dispatch-work/SKILL.md
 M skills/dev/dispatch-work/references/brief.md
 M skills/dev/dispatch-work/references/review.md
 M skills/dev/dispatch-work/references/skills.md
 M skills/dev/dispatch-work/references/standing.md
 M skills/dev/dispatch-work/scripts/agents.py
 M skills/dev/dispatch-work/scripts/dispatch_lib/linear.py
 M skills/dev/dispatch-work/scripts/dispatch_lib/test_procs.py
 M skills/dev/feature-ledger/LEARNINGS.md
 M skills/dev/feature-ledger/SKILL.md
 M skills/dev/feature-ledger/evals/02-open-dirty-audience.md
 M skills/dev/feature-ledger/references/RECONCILIATION.md
 D skills/dev/feature-ledger/templates/CONTINUE_HERE.md
 D skills/dev/feature-ledger/templates/DESIGN_PROJECT.md
 D skills/dev/feature-ledger/templates/PRD.md
 D skills/dev/feature-ledger/templates/README.md
 D skills/dev/feature-ledger/templates/STATE.md
 D skills/dev/feature-ledger/templates/api.md
 D skills/dev/feature-ledger/templates/architecture.md
 D skills/dev/feature-ledger/templates/database.md
 M skills/dev/grill-with-docs/LEARNINGS.md
 M skills/dev/grill-with-docs/SKILL.md
 M skills/dev/linear-project/SKILL.md
 M skills/dev/meta/SKILL.md
 M skills/dev/meta/monitor.md
 M skills/dev/orchestrate/references/backend.md
 M skills/dev/orchestrate/references/frontend.md
 M skills/dev/prompt-generator/references/frontend.md
 M skills/dev/publish/SKILL.md
 M skills/dev/publish/references/staging.md
 M skills/dev/state-brief/SKILL.md
 D skills/dev/technical-spec-generator/SKILL.md
 M skills/dev/testing-runbook-generator/skill.md
 M skills/dev/verify/LEARNINGS.md
 M skills/dev/verify/SKILL.md
 M skills/dev/workspace/LEARNINGS.md
 M skills/dev/workspace/SKILL.md
 M skills/dev/workspace/evals/02-capture-close.md
 M skills/dev/workspace/evals/04-dispatch-update.md
 M skills/dev/workspace/evals/05-ruling.md
 M skills/dev/workspace/references/PROJECT_SNAPSHOT.md
 M skills/dev/workspace/references/WORKFLOW.md
 M skills/dev/workspace/references/development-environment.json
 M skills/dev/workspace/references/handoff.md
 M skills/dev/workspace/tools/skill-contract.test.js
?? enforcement/config/builder-settings.json
?? enforcement/hooks/thoven-doc-size
?? enforcement/install/test_doc_size.py
?? enforcement/rules/branches-and-prs.md
?? skills/dev/cco-audit/LEARNINGS.md
?? skills/dev/linear-project/LEARNINGS.md
?? skills/dev/orchestrate/LEARNINGS.md
?? skills/dev/prompt-generator/LEARNINGS.md
?? skills/dev/state-brief/LEARNINGS.md
?? skills/dev/testing-runbook-generator/LEARNINGS.md
?? skills/dev/workspace/references/map-input.md
```

I added these files to the workers' set: `meta/SKILL.md`, `meta/monitor.md`, `publish/SKILL.md`, `publish/references/staging.md`, `workspace/evals/04-dispatch-update.md` and `workspace/references/PROJECT_SNAPSHOT.md`. They are one-line repoints, so they get no LEARNINGS entry.

### Words, before (`git show HEAD:<path> | wc -w`) and after (`wc -w <path>`)

| File | Before | After |
|---|---|---|
| `README.md` | 1440 | 1459 |
| `enforcement/LEARNINGS.md` | 2481 | 2639 |
| `enforcement/config/skills-invocable.txt` | 277 | 276 |
| `enforcement/rules/thoven-law.md` | 2041 | 1575 |
| `enforcement/rules/branches-and-prs.md` (new) | 0 | 1387 |
| `skills/andres-mode/SKILL.md` | 4289 | 2745 |
| `skills/andres-mode/LEARNINGS.md` | 9048 | 9146 |
| `skills/dev/cco-audit/SKILL.md` | 2684 | 2685 |
| `skills/dev/cco-audit/LEARNINGS.md` (new) | 0 | 71 |
| `skills/dev/dispatch-work/SKILL.md` | 3448 | 3175 |
| `skills/dev/dispatch-work/LEARNINGS.md` | 7531 | 7619 |
| `skills/dev/dispatch-work/references/brief.md` | 1951 | 753 |
| `skills/dev/dispatch-work/references/review.md` | 1438 | 1066 |
| `skills/dev/dispatch-work/references/skills.md` | 713 | 492 |
| `skills/dev/dispatch-work/references/standing.md` | 884 | 751 |
| `skills/dev/feature-ledger/SKILL.md` | 356 | 361 |
| `skills/dev/feature-ledger/LEARNINGS.md` | 4081 | 4144 |
| `skills/dev/feature-ledger/evals/02-open-dirty-audience.md` | 104 | 109 |
| `skills/dev/feature-ledger/references/RECONCILIATION.md` | 358 | 354 |
| `skills/dev/feature-ledger/templates/` (8 files, deleted) | 1677 | 0 |
| `skills/dev/grill-with-docs/SKILL.md` | 241 | 272 |
| `skills/dev/grill-with-docs/LEARNINGS.md` | 454 | 517 |
| `skills/dev/linear-project/SKILL.md` | 789 | 818 |
| `skills/dev/linear-project/LEARNINGS.md` (new) | 0 | 93 |
| `skills/dev/meta/SKILL.md` | 271 | 272 |
| `skills/dev/meta/monitor.md` | 1092 | 1092 |
| `skills/dev/orchestrate/references/backend.md` | 738 | 749 |
| `skills/dev/orchestrate/references/frontend.md` | 1388 | 1384 |
| `skills/dev/orchestrate/LEARNINGS.md` (new) | 0 | 87 |
| `skills/dev/prompt-generator/references/frontend.md` | 1870 | 1868 |
| `skills/dev/prompt-generator/LEARNINGS.md` (new) | 0 | 81 |
| `skills/dev/publish/SKILL.md` | 979 | 979 |
| `skills/dev/publish/references/staging.md` | 1480 | 1481 |
| `skills/dev/state-brief/SKILL.md` | 1625 | 1634 |
| `skills/dev/state-brief/LEARNINGS.md` (new) | 0 | 93 |
| `skills/dev/technical-spec-generator/SKILL.md` (deleted) | 1280 | 0 |
| `skills/dev/testing-runbook-generator/skill.md` | 977 | 984 |
| `skills/dev/testing-runbook-generator/LEARNINGS.md` (new) | 0 | 76 |
| `skills/dev/verify/SKILL.md` | 1450 | 1195 |
| `skills/dev/verify/LEARNINGS.md` | 1180 | 1273 |
| `skills/dev/workspace/SKILL.md` | 1989 | 1979 |
| `skills/dev/workspace/LEARNINGS.md` | 2449 | 2528 |
| `skills/dev/workspace/evals/02-capture-close.md` | 230 | 231 |
| `skills/dev/workspace/evals/04-dispatch-update.md` | 220 | 222 |
| `skills/dev/workspace/evals/05-ruling.md` | 184 | 237 |
| `skills/dev/workspace/references/PROJECT_SNAPSHOT.md` | 618 | 626 |
| `skills/dev/workspace/references/WORKFLOW.md` | 5485 | 5035 |
| `skills/dev/workspace/references/handoff.md` | 286 | 242 |
| `skills/dev/workspace/references/map-input.md` (new, moved text) | 0 | 565 |

Staged rule files. "Before" is the live file today.

| File | Before | After |
|---|---|---|
| `staged/CLAUDE-root.md` (vs `~/thoven/CLAUDE.md`) | 2577 | 707 |
| `staged/AGENTS-root.md` (vs `~/thoven/AGENTS.md`) | 496 | 523 |
| `staged/global-CLAUDE.md` (vs `~/.claude/CLAUDE.md`) | 113 | 111 |
| `staged/frontend-CLAUDE.md` (vs `~/thoven/frontend/CLAUDE.md`) | 5060 | 3696 |
| `staged/backend-CLAUDE.md` (vs `~/thoven/backend/CLAUDE.md`) | 4785 | 4144 |
