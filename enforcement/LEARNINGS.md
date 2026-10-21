# Learnings — enforcement

Running log of what went wrong in real use and what changed. **Read before editing rules/thoven-law.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-11 — A catch-up PR of main merges with --merge

> reflect · 2026-10-11 · memory:feedback_name_merge_direction · correction · applied · seen 1

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
