# Learnings — enforcement

Running log of what went wrong in real use and what changed. **Read before editing rules/thoven-law.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-09 — agent-skills takes no PRs

> session · 2026-11-09 · 96e39a9f · correction · applied · seen 1

**What happened.** Andres: "agent skills should not have PRs that repo is internal idk why we would want PR our CI for skills". Eight agent-skills PRs (#164–#171) had opened in the days before, though the repo has no CI and the README already said "Do not open a PR".
**Why.** The law, which every session loads, described agent-skills PRs as routine ("an agent-skills PR is not held. It merges in the same pass"; the docs-only table row "like an agent-skills PR"), and the README was read only by sessions that opened it.
**What changed.** The law bullet now says agent-skills takes no PRs: commit the exact paths in a detached worktree at `origin/main` and push to `main`, then reinstall and sync. The two lines that treated its PRs as normal are gone. The README step and `thoven-email-system`'s "after its PR merges" match.

## 2026-11-08 — Undo rights need a file changed after the session started

**What happened.** The pre-#153 tracker left 43 of 60 session edit logs polluted: 451,533 lines, of which 11,687 named files changed after their session began. `thoven-guard-bash` granted `git restore`, `checkout --` and `stash push --` on any logged path, so a session could undo another pane's dirty file.
**Why.** The guard trusted the log's membership alone.
**What changed.** A logged path counts only when its file changed after the session's start marker (ten minutes' grace) or no longer exists. The logs were purged by the same rule; the pre-purge copies are in `/tmp/claude-thoven-edited-pre-purge-2026-11-08.tgz`.

---

## 2026-11-08 — The stop-time uncommitted check is retired

**What happened.** After the track-edits fix, Andres asked whether `thoven-uncommitted` was useful at all. Its record: 151 "keep" entries across 65 sessions, every one another pane's or builder's work in progress; four sessions were each asked about 4,000–16,000 files, 16,001 of one session's 16,048 older than the session itself.
**Why.** It inferred ownership from "a file changed while this session ran", which every peer pane's write satisfies in a shared tree. It protected nothing destructive; the guard's refusal of whole-tree stash, reset and clean does that.
**What changed.** The hook, its test and its stop entries are gone from all five harnesses; `install/common.py` `RETIRED_HOOKS` strips installed copies, and OpenCode's plugin is tracker-only (`thoven-track-edits.js`). The edit log stays for the guard's path-scoped undo.

---

## 2026-11-08 — A hook that runs on every call costs the same however old the session is

> reflect · 2026-11-08 · ef2a1ea6 · slow-hook · applied · seen 1

**What happened.** The laptop swapped 14 GB at load 25. After every shell call `thoven-track-edits` listed each named checkout's changed files and ran one `grep` per path against a session edit log of 24–27k lines. A substring test also counted `~/thoven/frontend-<tree>` as naming `~/thoven/frontend`, which held 14,770 untracked scratch files, and as naming the `~/thoven` root, a repo with 32,781 untracked files. Each call hit its 10 s hook timeout and was killed with the log half-written. `thoven-uncommitted` ran a git call per logged path (74 s on 2,000 lines), so the Stop gate was killed too and let those sessions stop unchecked.
**Why.** Per-path subprocess loops against state that only grows, and path matching by substring. Tests used a handful of paths, and nothing tested at the size or timeout the hooks really run at.
**What changed.** Both hooks do one batched pass: one `git status -z` per checkout, then one awk or Python set join. A checkout is named only by a whole path, and a path inside a nested checkout names that checkout, not its parent. Rules for any hook: it runs under macOS bash 3.2 (no associative arrays; a here-doc inside `<( )` is misread); never start a subprocess per item of a list that grows; `awk 'NR == FNR'` treats an empty first file's partner as seen, so use `FILENAME == ARGV[1]`; ship a test at tens of thousands of entries that must finish inside the hook's configured timeout (`THOVEN_CLAUDE_STATE` isolates state). Logs written before this change still carry wrongly charged paths, and `thoven-guard-bash` grants path-scoped undo from them. That is filed, not fixed here.

## 2026-10-22 — CI gates only PRs into main; backend-first needs backward compatibility; docs merge in the pass

> reflect · 2026-10-22 · 39a12a43 · 889d1f76 · d9f3ef92 · a010cb0c · 01a151d4 · broken-rule · applied · seen 4

**What happened.** #75's merge table said a ticket into an integration branch merges `--auto --squash`, "gated by the required CI check", but `ci.yml` in both repos runs only on PRs into `main` and `release/1.0`. Main hand-dispatched CI about 140 times and pushed about 60 throwaway `ci/*` branches. Backend #278 made `source_timezone` required and merged hours before the frontend that sends it, so staging refused every reschedule for six hours. Docs-only PRs waited for a merge question, and Andres said "just megre it now this is documentation" four times.
**Why.** The table described a gate that does not exist, Review order said backend-first with no compatibility condition, and the table had no docs row.
**What changed.** The law now says CI runs only on PRs into `main`: a ticket into an integration branch merges `--squash` on its verify block and verifier pass, and CI gates the landing. Docs-only PRs merge in the same pass. Backend-first holds only for a backward-compatible change. Andres chose this over turning CI on for integration branches.

## 2026-10-22 — zsh aborts on unmatched globs

> reflect · 2026-10-22 · d631 · c775 · tooling · applied · seen 2

**What happened.** About 24 commands this week died with `(eval):1: no matches found` on unquoted globs such as `grep --include=*.ts` and `ls dir*`; the reflect run that found it hit it too.
**Why.** The harness shell is zsh, where an unmatched glob is an error, not a literal.
**What changed.** `~/thoven/CLAUDE.md` (source `.workspace/CLAUDE-root.md`) Environment fact: quote glob arguments or use `rg -g`.

## 2026-10-22 — The merge method follows the PR's role; landed integration branches retire

> reflect · 2026-10-22 · 39a12a43 · 889d1f76 · ec30f47b · 93f7415c · broken-rule · applied · seen 3

**What happened.** On 10-15 Andres approved a plan that said "Ask Scheduling and the Portal to merge into main with a plain merge, not a squash." That ruling lived only in THV-1305's description, so the sessions that merged #256 (282 commits) and #318 (403 commits) squashed them. Later Private Lessons catch-ups traced conflicts to a 470-file commit with no THV id. On 10-19 he said the landed integration branch "should also likely be finally removed", and on 10-22 he asked "do we have a default between squash merging and normal merging".
**Why.** The law named one method for every PR into `main`, and said nothing about an integration branch's end of life. A ruling written only in a ticket never reaches the session that merges.
**What changed.** thoven-law.md "Branches and PRs": a table of merge method by PR role (ticket squashes; catch-up and integration landing use `--merge`), every merge go names source, target and method, and a landed integration branch retires (registry row and tree removed, follow-ups on `origin/main`). WORKFLOW.md "merge it" line mirrors it. A wrapper script was rejected: the registry lists a ticket branch as integration and misses Private Lessons, so it would pick the wrong method both ways.

## 2026-10-11 — A catch-up PR of main merges with --merge

> reflect · 2026-10-11 · memory:feedback_name_merge_direction · 889d1f76 · 93f7415c · correction · applied · seen 3

**What happened.** A command merged main into a branch cut from the Private Lessons integration branch to pick up fixes for red shards. Andres stopped it ("are you merging this feature into main? I never said I want that") and approved the catch-up once the direction was explained.
**Why.** A squash-merged catch-up loses the ancestry, so main no longer shows as merged into the integration branch.
**What changed.** thoven-law.md "Branches and PRs", held-PR bullet: a catch-up PR of `main` into an integration branch merges with `--merge`. Naming the direction and asking first is already andres-mode.

## 2026-10-09 — Fix owned debt on the branch; one grouped line for the rest

> reflect · 2026-10-09 · memory:feedback_fix_now_no_debt_tickets · correction · applied · seen 2

**What happened.** A triage audit listed items the scheduling session had noticed and left alone. Andres said "if you can handle them now and improve the architecture in the same session, or just triage or debug them instead of creating additional linear tickets and additional tech debt". PL0 then filed THV-1219..1230 for structural cleanup and he objected again.
**Why.** The law's Scope said "Neighbouring problems go into a new Linear issue", which contradicted fix-now and the later narrowing (fix-now covers the feature's own code; outside problems take one line in triage).
**What changed.** thoven-law.md "Scope" and `~/thoven/CLAUDE.md` "Scope" now say owned debt, bugs and smells are fixed on the branch in the same round, an outside problem gets one line in an existing grouped Linear issue, and a product call goes to Andres as a question (conflict C1).

## 2026-10-03 — agent-skills PRs merge in the same pass, then sync

> reflect · 2026-10-03 · memory:feedback_agent_skills_merge_directly · correction · applied · seen 1

**What happened.** THV-1065 (PR 14) sat held. Andres said "Just do it now and merge agent skills does not need this PR workflow for this." The same day, the THV-1047 full-suite block was found unsynced for days after its merge.
**Why.** The held-PR rule was written for product repos, and merging an `enforcement/` change does not update the harness copies.
**What changed.** thoven-law.md "Branches and PRs", held-PR bullet: an agent-skills PR is not held, merges in the same pass, then `enforcement/sync.sh --apply` runs until `sync.sh` reports every harness copy matches.

## 2026-10-01 — Show one real record before scoping a data defect

> reflect · 2026-10-01 · memory:feedback_evidence_before_ticket · correction · applied · seen 1

**What happened.** THV-991 C7 ("markdown in bios"). One critique line became a frontend stripper, a backend Done-when clause and then THV-1012. Andres asked "are you sure that's not just a seeding error?" Seeds were clean and the only markdown bio was our own test string. THV-1012 was canceled within the hour.
**Why.** A claim repeated through a critique, a ledger and a fixture read as evidence.
**What changed.** `~/thoven/CLAUDE.md` "Scope": before scoping a ticket or fix for a data defect, name one real record (environment, id) that shows it.

## 2026-09-27 — Unpack probes under tmp/<name>/ and delete by exact path

> reflect · 2026-09-27 · memory:feedback_no_glob_rm_worktree · broken-rule · applied · seen 1

**What happened.** THV-860 fix round 2. A `mkdir -p /tmp/x && cd /tmp/x && rm -rf * && unzip …` was denied because its target expanded to the shared worktree root.
**Why.** When the `cd` fails or the shell resets cwd, the glob runs at the worktree root, where other sessions hold work.
**What changed.** thoven-law.md "Shared worktrees": unpack probes under `tmp/<name>/` and delete them by exact path.

## 2026-09-20 — Skill content lives in the agent-skills source repo

> reflect · 2026-09-20 · memory:feedback_skill_content_lives_in_source_repo · skill-gap · applied · seen 2

**What happened.** WORKFLOW.md was moved into the installed workspace skill folder and never committed to agent-skills. The 2026-09-20 reinstall wiped it and left the `.workspace` symlinks dangling. The same loss happened on 2026-09-03 (agent-skills 7731fd5). Andres: "it should not get lost… it should be in its own [skill]."
**Why.** Installed copies are regenerated from the source repo on every reinstall.
**What changed.** `~/thoven/CLAUDE.md` "Skills" opens with: edit and commit skill files in `~/thoven/agent-skills/skills/`, then install.

## 2026-08-28 — Hold heavy runs when Andres says hold

> reflect · 2026-08-28 · memory:feedback_hold_heavy_tests_until_told · correction · applied · seen 1

**What happened.** Mid THV-250 closeout Andres said "Can you hold the vitest suit and playwright till after I have a call soon and my computer will crash", then "dont run the full suite pause heavy CPU and Memory bound tests untill I say".
**Why.** A full vitest run, a `next build` and Playwright together compete with a live call and have crashed the machine.
**What changed.** `~/thoven/CLAUDE.md` "Parallel load": when Andres says hold, stop the heavy jobs already running and run only targeted single-file tests, type-check and lint until he says go.

## 2026-08-06 — A pathspec commit undoes git rm --cached

> reflect · 2026-08-06 · memory:feedback_git_commit_pathspec_not_index_faithful · tooling · applied · seen 1

**What happened.** Removing a committed file that held production PII, `git rm --cached <file>` was followed by `git commit -F - -- .gitignore <file>`. The commit reported success and touched only `.gitignore`. The file was still on disk, so the pathspec re-added it. `git show --stat HEAD` showing one file was the tell.
**Why.** `git commit -- <paths>` commits the working-tree state of those paths, not the index.
**What changed.** thoven-law.md "Shared worktrees": to untrack or delete a file, `git rm --cached`, check the staged list, commit with no pathspec and confirm with `git ls-files --error-unmatch`.
