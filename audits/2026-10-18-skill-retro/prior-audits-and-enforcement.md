# Prior audits and enforcement chain: facts only

Collected 2026-10-18. Repo root `~/thoven/agent-skills` (abbrev. AS). No fixes proposed.
Full PR table: `/tmp/retro-audit/findings/pr-table.csv` (330 rows). Script: `/tmp/retro-audit/analyze_prs.py`.

## 1. The three skills: size, history, learnings

| Skill | File | Lines | Per-skill LEARNINGS.md |
|---|---|---|---|
| dispatch-work | `AS/skills/dev/dispatch-work/SKILL.md` + `references/{agents,brief,review,skills}.md` + `scripts/{agents.py,label.sh,send.sh,watch.sh}` | 167 | none |
| andres-mode | `AS/skills/andres-mode/SKILL.md` (frontmatter line 4: `disable-model-invocation: true`) | 71 | none |
| verify | `AS/skills/dev/verify/SKILL.md` | 10 | none |

Root `AS/LEARNINGS.md` (469 lines, last touched 2026-09-30, last dated entry 2026-08-29) has no entry about dispatch-work or verify. It says twice "Do not create `andres-mode`" (lines 107, 355, 372). `andres-mode` was added 2026-10-10 (commit db06545).

Last commits touching each (date, hash, subject):

dispatch-work (10)
- 2026-10-11 735847d dispatch-work and law: once per diff, three fix rounds, exit-code next steps
- 2026-10-11 b21be94 dispatch-work, linear-project and law: one tree per Project, narrower verifier
- 2026-10-10 5fa002e parity: a frame binds what shows, not sizing behaviour (#63)
- 2026-10-10 d1d7fb7 process: build and review law, Linear and board as records (#61)
- 2026-10-10 2bcc1db dispatch-work: briefs and the verifier carry spec and design parity (#60)
- 2026-10-04 e83f4a7 Cockpit Work tab: click-first action box, review key starts the verifier, merge on both tabs (#46)
- 2026-10-04 35ce523 dispatch-work: open the issue's tab in main's space, not a new one (#45)
- 2026-10-03 9543bf9 Cockpit: two-word playbook briefs are read, send.sh claims main (THV-1103) (#39)
- 2026-10-03 14e1416 dispatch-work and workspace: one home for the kind list, cockpit approval exception (THV-1054) (#20)
- 2026-10-03 4ff88e8 Five global tiers: Astra, Opus 5.5, Sol 6.1, Droid auto, Luna (#27)

andres-mode (4, all of its history)
- 2026-10-11 735847d dispatch-work and law: once per diff, three fix rounds, exit-code next steps
- 2026-10-11 843fc9a Add thoven-load-gate: one admission gate for heavy jobs across panes
- 2026-10-10 5fa002e parity: a frame binds what shows, not sizing behaviour (#63)
- 2026-10-10 db06545 andres-mode: Linear and board records, spec and visual parity, hardening keeps design, targeted tests (#62)

verify (5, all of its history)
- 2026-10-07 d715994 Enforce fresh repo-local verification evidence
- 2026-10-06 ef79787 docs(skills): route verification through adopted testing gates (#53)
- 2026-09-30 800371c docs: skills give the 2.0 frontend's commands in pnpm (THV-973)
- 2026-08-19 9a1a886 feat(skills): retire brainstorm, generic investigate, and the /dev conductor
- 2026-08-14 3277765 feat: add nested verify skill

Also present: `AS/evals/dispatch-work/evals.json` (2,808 bytes, last commit 2026-10-03 4ece860). Not read in depth.

## 2. Findings in the four prior reports that touch dispatch, verification, evidence or Andres's prompting

Reports converted to text at `/tmp/retro-audit/*.txt`. Status key: ADDRESSED = visible in current text or code; PARTLY; OPEN. Line numbers are in the file named.

### retro-2026-09-17-agent-workflow.html

| # | Finding | Status | Where / quote |
|---|---|---|---|
| R1 | Andres hand-writes verification protocols (prescriptive 2.1:1 by words over reactive) | PARTLY | `dispatch-work/references/brief.md:53-56` carries an evidence rule, `:44-52` a machine rule, `thoven-law.md:65` "Run `bin/verify` once per diff". Baseline rule "suite is red on main, judge by failing-file diff" and "never pass --exclude": zero matches in dispatch-work, andres-mode, verify, thoven-law, frontend CLAUDE.md, TESTING.md |
| R2 | Same facts retyped with decay (5 phrasings in 5 sessions) | PARTLY | stash/worktree rule now in the law block (`thoven-law.md:8-18`) and in frontend CLAUDE.md. `--exclude` and red-on-main: not written anywhere in skill or law text |
| R3 | Claude never loaded the shared-worktree rule | ADDRESSED | law block is in `~/thoven/frontend/CLAUDE.md` "Shared worktrees" |
| R4 | Mermaid does not render, re-litigated 4 times | ADDRESSED | `~/thoven/CLAUDE.md` "Environment fact: Mermaid diagrams do not render" |
| R5 | Four tickets marked Done with zero code; nothing reads ticket status | OPEN | `dispatch-work/SKILL.md:159` moves to Done "on his confirmation" with "evidence table and the commit SHAs". No step checks the code merged. `SKILL.md:166` done-when is "the ticket reads Done" |
| R6 | BUILT reported before reviewers returned | ADDRESSED | `SKILL.md:128` DONE moves ticket to **Ready**, `review.md:68-69` "The ticket stays **Ready** throughout" |
| R7 | "Environment ready" retracted across handoff, no expiry | OPEN | no text |
| R8 | Feature state lost between sessions | OPEN here | belongs to workspace skill; not in the three skills |
| R9 | Scope silently halved, one repo of two | ADDRESSED | `verify/SKILL.md:8` "In every changed repository, run `bin/verify`"; `dispatch-work/SKILL.md:103-104` one pane for both repos |
| R10 | `verify` emitted a prose PASS block the model types | PARTLY | `verify/SKILL.md:8-10` now needs the `THOVEN_VERIFY_BEGIN` block from `bin/verify`, which a script writes. But the check that refuses a claim without it is gone (section 3, item 7) |
| R11 | Playwright leaves no files; evidence tier 5-8 | PARTLY | 09-18 eval says THV-592 passed. Frontend `bin/verify` rows contain no Playwright run (`scripts/verify/diff-registry.mjs:2-14`) |
| R12 | Andres is the message bus (17.1% of turns) | ADDRESSED in design | `brief.md:75-81` REPORT via `herdr agent prompt {{MAIN_PANE}}`; `send.sh`; `watch.sh` |
| R13 | 401 polling turns | ADDRESSED | `SKILL.md:118-120` "The watcher is the only poll: a `sleep` loop in main's shell costs a turn per tick" |
| R14 | Auto-mode Bash-instead-of-Read/Edit | OPEN | not in skill text; the harness text in this session still says to use Bash |
| R15 | `/blast-radius` has `disable-model-invocation`, never fires | PARTLY | `skills.md:37-39` "tell the pane to read `~/.claude/skills/<name>/SKILL.md`". `/blast-radius` is not in the `skills.md:15-33` moments table and not in `brief.md` ACCESS |
| R16 | Skill-name hedging, retired skills reintroduced | ADDRESSED | `skills.md:41` "Name a skill only after checking it exists" |
| R17 | Split poteto-mode into a short `andres-mode` under 5 KB incl. subagent budget 120k/150k, 5 items max | PARTLY | `andres-mode` exists, 71 lines, but carries `disable-model-invocation: true` (line 4). Budget is "stop near 250k tokens" (`brief.md:59`); no "5 items" rule |
| R18 | Declare done-predicate once: `verify.plan.json`, baseline, `never[]` flags, receipt with `delta`, `tool_use_id`, `self_graded`, derived verdict | OPEN as designed | Actual receipt is the diff-selected registry and has none of those fields (section 3) |
| R19 | 119 AskUserQuestion calls, 66 in one session, asked mid-build | ADDRESSED in text | `brief.md:60-62` "Stop only for: an irreversible or destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a guess"; `andres-mode:71` |
| R20 | 183 of 221 subagents generic | PARTLY | `brief.md:34` "tier-5 subagents for wide reads". Typed agents `verifier`, `ui-builder`, `explorer`, `poteto-agent` exist |

### eval-2026-09-17-work-quality.html

| # | Finding | Status | Where / quote |
|---|---|---|---|
| E1 | Verification loop is Andres's eyes; 4 of 6 UI tickets with zero browser verification | ADDRESSED in text | `brief.md:66-69` "capture every state the ticket touches with agent-browser at 1440 and 390 ... plus a short video"; `review.md:26-27`; `thoven-law.md:51-58`. Practice: section 4 |
| E2 | graphify, memory, thoven-designer 0 uses | PARTLY | `brief.md:33` Tools line; `skills.md:17` "first edit ... `/thoven-designer`". Memory search: not in the brief |
| E3 | Zero performance checks | OPEN | `andres-mode:44` "Audit with numbers" applies to hardening only |
| E4 | 0.22 lines deleted per line added; no "what is now dead" step | OPEN | bin/verify `stale-refs` row fires only on deleted files or removed exports (`diff.mjs:57`) |
| E5 | Review after BUILT | ADDRESSED | `review.md:3-13`, `SKILL.md:147-153` |
| E6 | "Done" meant written, not mounted | OPEN | no "call site" or "mounted" text in dispatch-work (grep: none) |
| E7 | Built as something other than designed | ADDRESSED in text | `review.md:42-48` SPEC PARITY and DESIGN PARITY sections |
| E8 | Green everywhere, broken on screen (compiled CSS) | PARTLY | registry row `browser-related` ("computed style fails in Chromium") runs only when a `.browser.test.` file is touched (`diff.mjs:91`) |
| E9 | Motion/feel unmeasured | OPEN | `brief.md:24` "motion where the frame shows it"; video only |
| E10 | Browser peeks leave no artifact | ADDRESSED in text | `brief.md:53-56` one evidence folder per ticket |

### eval-2026-09-18-enforcement-build.html

| # | Finding | Status | Where / quote |
|---|---|---|---|
| B1 | Stop hook exits 2 on done-claim with no fresh artifact (THV-593) passed | OPEN, since removed | hook retired 2026-10-07 (fe0f63b, THV-1153): "It demanded a fresh bin/verify receipt for every edited repo at every Stop ... ran far too many checks, fired on every reply" |
| B2 | Auto-mode "use Bash not Edit/Write" disables hooks keyed on Edit/Write | OPEN | listed under the report's own "Not done" |
| B3 | "Not done": user-level hook wiring, poteto-agent.md errors, backend rspec JSON | UNKNOWN | not re-checked. The backend mutation row now uses the rspec JSON formatter (`lib/thoven/verify.rb` mutations) |

### report-2026-09-19-classifier-router.html

| # | Finding | Status | Where / quote |
|---|---|---|---|
| C1 | A mandate written inside a skill is obeyed 1 of 6 times; 3 of 8 runs never open the skill. "If something must always happen, it cannot live in a skill. Put it in a hook." | OPEN, structural | dispatch-work and verify are skills. `andres-mode` is `disable-model-invocation`. The verifier brief names six skills to run by text (`review.md:46-51`) |
| C2 | The shipped `thoven-require-evidence` Stop hook with classifier | REMOVED | retired 2026-10-07; `AS/enforcement/README.md:29` still reads "The Stop hook validates evidence" while `:65` says it was retired |
| C3 | No "after" measurement yet from `scripts/dev-evaluation-audit.sh` | OPEN | no result found |
| C4 | Jev API key appears in two transcripts, needs rotating | UNKNOWN | not checked |

## 3. What `bin/verify` does (three implementations, one contract)

Entry points
- AS: `AS/bin/verify` (Python, flock) then `AS/enforcement/bin/verify-engine.py` (232 lines). Checks only agent-skills tooling paths.
- Frontend: `frontend/bin/verify` (Node, 13 lines) then `scripts/verify/diff-lock.py` (81) then `scripts/verify/diff.mjs` (284) with row registry `diff-registry.mjs`.
- Backend: `backend/bin/verify` (Ruby, 22) then `lib/thoven/verify.rb` (459).

1. **Base and scope.** Default base is `origin/main` (`--base <ref>` or `THOVEN_VERIFY_BASE`, AS only). Changed paths are the union of committed diff vs merge-base, uncommitted diff and untracked files (`diff.mjs:47`, `verify.rb:69-70`, `verify-engine.py:62-68`). On an integration branch the diff against `origin/main` is the whole branch, not the slice, unless `--base` is passed.
2. **Frontend rows** (`diff.mjs:50-60`, `diff-registry.mjs`): always `oxlint`, `typecheck`, `related` (vitest related on dependants of changed files, found by a TypeScript import scan, `diff.mjs:63-86`). Conditional: `browser-related` (a `.browser.test.` file is touched), `route-list` (a `app/**/page.*` touched), `contract` plus three fixture rows (`types/` or `lib/*-api.*`; these BLOCK without `THOVEN_BACKEND_PATH`, `diff.mjs:254`), `shellcheck`, `stale-refs` (deleted file or removed export), `bootstrap-owner`, `mutation` (production file and a test file both changed). No Playwright, no parity, no design check.
3. **Backend rows** (`verify.rb:17-25`): `fast-ci` (`bin/ci fast`) on any change, `ruby-files` (rubocop), `focused-specs`, `migration`, `shellcheck`, `stale-refs`, `mutation`. A changed production file with no mapped spec raises BLOCKED "unmapped production file ... provide --test-path" (`verify.rb:99`). It also refuses unless `TEST_DATABASE_URL` is a local `neondb_test_*` database (`verify.rb:199-216`).
4. **Mutation row.** Reverses each production hunk in a snapshot, expects the specs to fail on an assertion, then restores and expects green (`diff.mjs:168-201`, `verify.rb:288-340`). Per-command timeout 180 s in both repos (`diff.mjs:148`, `verify.rb:26`).
5. **Receipt.** Both repos print `THOVEN_VERIFY_BEGIN`, one line of JSON, `THOVEN_VERIFY_END` on every run. Exit 0 PASS, 1 FAIL (2 BLOCKED in backend/AS). JSON keys (frontend): `version, repo, head, base, mergeBase, fingerprint, invocation, bootstrapPaths, status, rows[{id,command,status,seconds}], seconds`. Backend adds `bootstrapTooling` and `invocation.testPaths`. Receipt contains no test counts, no baseline, no delta, no tool_use_id.
6. **Where written.** `git rev-parse --git-path thoven-verify.json` (in a linked worktree this is under `.git/worktrees/<name>/`). Written atomically **only when status is PASS**. The file is deleted at the start of every run (`diff.mjs:224`, `verify.rb:198`, `verify-engine.py:171`), so a failed or blocked run leaves no receipt.
7. **"Fresh receipt for the same fingerprint."** `bin/verify --check-evidence` reads the receipt from stdin and accepts only if all hold: it equals the stored file; `status` PASS; repo, `head`, `base`, `mergeBase` equal current values; `fingerprint` equals a recomputed SHA-256 over the committed diff, working-tree diff, index diff and the bytes and mode of every changed file (plus engine files, lockfiles and configs in the frontend, `diff.mjs:87-118`); the row ids and commands equal what the current diff would select; every row PASS (`diff.mjs:240`, `verify.rb:167-172`). Consequences: any edit or a new commit after the run makes it stale (head changes); in a worktree shared by several tickets or sessions, another session's edit to any changed file changes the fingerprint (shared-tree law: `thoven-law.md:22-31`).
8. **Who calls `--check-evidence`.** No hook does. The Stop hook that did (`thoven-require-evidence`) was retired 2026-10-07. Remaining mentions: both repos' TESTING.md, tests, and the verifier brief text (`review.md:38-41`), which tells the verifier to read the file by hand.
9. **When it runs.** Frontend and backend lefthook `pre-push` run `bin/verify` first (`frontend/lefthook.yml:1-5`; backend `lefthook.yml` `pre-push: verify`). Pane briefs tell panes to commit only and never push (`brief.md:43`), so pre-push runs when main pushes. `brief.md:48-49` also tells panes to commit with `--no-verify`.
10. **Lock.** All three take flock on `/tmp/thoven-verify-<uid>.lock` (one verify at a time across both repos). Backend also takes slot 1 of the load gate (`backend/bin/verify:15`, `--slots 1 --name backend-verify`); frontend and AS do not. `~/thoven/CLAUDE.md` says "`bin/verify` already runs under one shared slot".
11. **Known friction recorded in Linear.** THV-1298 (state Triage): mutation row blocks comment-only hunks and crashes on new app files; pre-push verify takes "7 to 20 minutes under load" and the push dies with SIGPIPE after the hook passes (SSH idle timeout). THV-1314 (Done 2026-10-16): mutation row blocked every branch that adds a module.

### thoven-load-gate (`AS/enforcement/bin/thoven-load-gate`, 159 lines)
- Waits until memory free >= 20% and 1-minute load <= 12 and a slot is free (default 2 slots). Polls every 5 s (`THOVEN_GATE_POLL`), logs every 30 s.
- Default wait 1500 s (`THOVEN_GATE_WAIT`). **On timeout it runs nothing, logs "gave up after Ns, nothing was run" and exits 75** (`:141-144`). Command's own exit code otherwise; 2 for bad usage.
- Fail-open: if the memory or load probe returns nothing, it admits (`:72`). `THOVEN_GATE_DISABLE=1` runs the command at once. `--check-only` takes no slot.
- Stale slots (owner pid dead) are reclaimed (`:92-96`).
- Brief tells panes: "Exit 75 means the wait ran out: rerun once, then send NEEDS_CONTEXT" (`brief.md:47-48`).

### thoven-law.md on verify cadence (`AS/enforcement/rules/thoven-law.md`)
- Line 64-67: slice runs touched test files one per run plus lint on them; CI runs the full suite on the integration PR; "Run `bin/verify` once per diff, before the push, and cite its receipt for 'done', for the verifier and for the PR."
- Line 74-77: builder's DONE is a claim; fresh verifier pane for feature slices; Sonnet subagent of main for cleanup and hardening.
- Conflict in text: `andres-mode/SKILL.md:53` "Run `bin/verify` once per diff, before the push, and cite its receipt. Integration-branch slices rely on targeted specs and CI." Law and `review.md:13` do not carve out integration-branch slices.

### config/agents.toml
- Tiers: 1 codex gpt-6-astra, 2 claude opus-5-5, 3 codex gpt-6.1-sol, 4 droid auto, 5 codex gpt-6-luna (`agents.toml:11-16`). Last commit 2026-10-03 (4ff88e8).
- `andres-mode:59` "Codex panes run only when the user asks". `SKILL.md:61-62` "The ticket's complexity picks the tier". `agents.md:24-26` maps tiers 3 and 4 to ordinary multi-file and small tickets. Tiers 1, 3, 4, 5 resolve to Codex or droid.
- Verifier: tier 2 (Claude Opus 5.5), `agents.md:34`.

## 4. Evidence protocol in practice: PRs since 2026-10-01

Repos: `Thoven-CORP/frontend-remote` and `Thoven-CORP/backend-remote` (the names in the brief do not exist). `gh pr list --search created:>=2026-10-01`, 358 PRs, minus 28 Dependabot = 330.
Definitions: receipt = body contains `THOVEN_VERIFY_BEGIN`; receipt JSON = contains `"fingerprint"` or `"mergeBase"`; images = markdown or HTML image, or an upload URL; parity word = body mentions parity, 1440 or 390 (text only, not proof of images); evidence lines = non-blank body lines containing pass, green, a check mark, `bin/verify`, vitest, rspec, type-check, rubocop, oxlint, playwright, "red" or "exit 0".

| Slice | PRs | Receipt block | Receipt JSON | Images | Parity word | Linear URL | THV id in body | Body with 3+ evidence lines |
|---|---|---|---|---|---|---|---|---|
| All | 330 | 5 | 3 | 1 | 47 | 11 | 271 | 73 |
| Frontend | 194 | 3 | 2 | 1 | 45 | 9 | 163 | 55 |
| Backend | 136 | 2 | 1 | 0 | 2 | 2 | 108 | 18 |
| Base = main (both) | 168 | 5 | 3 | 1 | 19 | 11 | 148 | 46 |
| Base = private-lessons integration (both) | 123 | 0 | 0 | 0 | 23 | 0 | 85 | 20 |
| Base = live-lesson-portal workstream (both) | 37 | 0 | 0 | 0 | 5 | 0 | 36 | 7 |

By week of creation

| Week of | PRs | Receipt block | Images | Linear URL |
|---|---|---|---|---|
| 09-28 (from 10-01) | 90 | 0 | 1 | 0 |
| 10-05 | 148 | 0 | 0 | 10 |
| 10-12 | 89 | 3 | 0 | 1 |
| 10-19 (to 10-19) | 3 | 2 | 0 | 0 |

- The five PRs with a receipt block: backend #276 (10-17) and #277 (10-19), frontend #303 (10-16), #304 (10-17), #305 (10-19). First appearance is 2026-10-16, nine days after the receipt format shipped (2026-10-07) and five days after the 10-11 law edit.
- The only PR with an image: frontend #136 (2026-10-03, one image). Backend image hits were all Dependabot badges and were removed.
- Median body length is 9 non-blank lines. No body is empty.
- Evidence-line counts per PR are in the CSV column `evidence_lines`. Receipt PRs carry 1, 4, 2, 5 and 7 such lines.
- Of the 330: 316 merged, 10 closed unmerged, 4 open.
- Parity images are meant for the Linear issue, not the PR body (`thoven-law.md:52-53`), so PR bodies are not the intended home for them. Section 5 checks Linear.

## 5. Linear: 15 closed THV issues

Linear MCP was available. Sample: first 15 issues with state Done and completion on or after 2026-10-01, newest-updated first, from `list_issues`. Two issues listed with 09-14 completion dates (THV-471, THV-474) were skipped. Every comment on every issue is authored as "Andres Martinez", so agent and human comments cannot be told apart.

| Issue | Closed | Closing-style comment | Table | Commit SHAs | Parity images uploaded | Notes |
|---|---|---|---|---|---|---|
| THV-1187 Reserved lesson time | 10-16 | yes, 13 comments | yes (several) | yes (29 in one comment) | yes (13 and 26 attachments) | UI parity comment of 10-11 itself has no images; the later ones do |
| THV-1314 verify mutation row | 10-16 | yes | no | 1 (merge SHA) | n/a | CI run, local counts |
| THV-1315 backend workstream CI | 10-16 | yes | no | 4 | n/a | CI run id and SHAs |
| THV-1285 iPad/phone live lesson | 10-15 | yes, 6 comments | no | many | yes (61 attachments) | strongest parity evidence in sample |
| THV-1294 Sentry noise | 10-12 | none | no | no | n/a | zero comments |
| THV-1299 signed-out errors | 10-14 | none | no | no | n/a | zero comments |
| THV-1268 CI red on main | 10-15 | yes | no | 1 | n/a | cites PR #232 |
| THV-1281 fix red shards | 10-11 | none | no | no | n/a | zero comments |
| THV-1304 promote.sh snapshot | 10-15 | none | no | no | n/a | zero comments |
| THV-1302 approval email copy | 10-15 | none | no | no | n/a | zero comments |
| THV-1295 lesson reminders | 10-14 | yes | no | yes, plus receipt cited ("bin/verify PASS at a8be8e5e7, fingerprint 9772a6ce, all 8 rows") | n/a | only issue in sample quoting a receipt |
| THV-1292 Review, Status History | 10-14 | yes | no | PR numbers and 2 merge SHAs | no | parity evidence cited as local path `~/.thoven-artifacts/THV-1292/evidence/parity/`, 0 attachments |
| THV-1291 Materials in Sessions | 10-14 | yes | no | PR numbers and CI run ids, no SHAs | no | no parity mention |
| THV-1290 Practice tab | 10-13 | yes | no | yes | no | parity shots cited as local path `~/.thoven-artifacts/pl-add-materials-tray/`, 0 attachments |
| THV-1163 PL4 Materials | 10-14 | yes | no | 1 PR SHA | no | no parity mention |

Counts of 15: closing-style comment 10, none 5. Comment with a markdown table 1. Commit SHAs 10. Uploaded parity images 2. Receipt cited 1. UI tickets citing only local-path parity evidence: 2 (THV-1292, THV-1290). Local evidence folders are deleted at close (`SKILL.md:163-164`, `andres-mode:13`), so those two paths probably no longer resolve; not checked on disk.

## 6. dispatch-work scripts versus SKILL.md

`watch.sh` (70 lines)
- Exits on: `GONE` (status agent_not_found or gone), `BLOCKED`, `SETTLED` (idle or done AND screen changed since arming), `FROZEN` (working/unknown, screen unchanged 10 min, `FREEZE_MIN`), `HEARTBEAT` (9 min since arming, `BEAT_MIN`, exits 0). Polls every 60 s. Uses macOS `md5` (`watch.sh:28`).
- SKILL.md describes exits as "the first thing main must look at" (`:118-119`) and tabulates only the stale causes Blocked, provider error, turn ended, GONE, FROZEN (`:136-142`). SETTLED and HEARTBEAT have no row.
- `SKILL.md:133` "A watcher exit with no status line means the pane went **stale**." A HEARTBEAT exit (every 9 minutes by design) or a SETTLED exit that arrives before the pane's message are not stale, yet fit that sentence. The script's own header says HEARTBEAT means "post a status line, then re-arm". `SKILL.md:121-122` says every wake ends with a plain-English line to Andres.
- A pane already idle when armed and unchanged afterwards never produces SETTLED (armed hash equals current).
- A pane that herdr reports `idle`/`done` while a background shell still runs would report SETTLED (memory note `project_herdr_idle_with_background_shells`); script does not check.

`send.sh` (40 lines)
- Refuses: wrong arg count (exit 2); `HERDR_PANE_ID` unset (bash `:?` abort); empty or missing brief (2); any `{{...}}` left after filling `{{MAIN_PANE}}` (2); any text matching `<[a-z][^<>]*>` (2); pane status not idle or done (3, prints the screen). Then `herdr agent prompt --wait --until working --until blocked --timeout 60000`.
- SKILL.md `:105-108` documents only the pane-status refusal. The two placeholder refusals and the exit codes are not mentioned.
- The `<[a-z]...>` test also refuses any lowercase angle-bracket text carried into the brief (for example a TypeScript generic or an HTML tag quoted from the ticket). The one template field it does **not** catch: the DESIGN line, which begins `<"no UI", ...>` (tested against `brief.md` template: 17 lines with angle fields, 16 caught). An unfilled DESIGN would be sent.
- If the pane never reaches working or blocked within 60 s, behaviour depends on herdr's exit code; `set -e` is on, so the "sent N bytes" line prints only on success.

`label.sh` (36 lines)
- Accepts Kind in `Meta Plan Design Build Review Research Audit Fix`; 3 or 4 positional args; ticket must match `^THV-[0-9]+$`; non-empty title; optional `--tab`; `--kinds` lists them.
- `thoven-worktree --kind` accepts `build, fix, review, audit, research, verify, design, plan` (`thoven-worktree:431`) and the law table names "Review, Audit, Research, Verify" (`thoven-law.md:27`). `label.sh` has no `Verify` and `thoven-worktree` has no `Meta`. `SKILL.md:45` gives the verifier its own pane but names no Kind for its label.
- `SKILL.md:37-40` says kind is picked by WORKFLOW.md section 8 and `label.sh --kinds`. Consistent for the script's own list.

`agents.py` (283 lines): read for reference only; not audited.

Other text-versus-behaviour mismatches found while reading
- `SKILL.md:149-150` and `agents.md:34`: verifier on tier 2. `agents.toml:13` tier 2 is Claude Opus 5.5. Matches. But tiers 1, 3, 4, 5 are Codex or droid while `andres-mode:59` says Codex only when asked.
- `review.md:38-41` tells the verifier to read the receipt for the head SHA and "re-run nothing it covers", with no instruction for a missing receipt. Main's pass step 4 (`review.md:13`) runs `bin/verify` but the section header says the verifier starts after "Working if" checks; the order between main's `bin/verify` run and the verifier start is not stated.
- `brief.md:36-38` DONE WHEN for the builder lists type-check, touched tests and lint. It does not name `bin/verify`. `brief.md:48-49` allows `--no-verify` commits.
- `README.md:29` in `AS/enforcement` still describes the Stop hook as active; `:65` says retired.
- Root `AS/LEARNINGS.md:107` says not to create `andres-mode`; it exists since 2026-10-10.
