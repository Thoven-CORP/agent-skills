# Skill retro audit: dispatch-work, andres-mode, verify

Data gathering only. No fixes proposed. Written 2026-10-19 from the main sessions of 2026-10-03 to 2026-10-19 across Private Lessons, Scheduling improvements and Live Lesson Portal, plus the tooling and release sessions that ran beside them.

How to read this: section 2 is the numbers. Sections 3 to 8 are the findings, each with the sessions it came from. `sessions/<uuid>.md` holds the per-slice evidence with `L<n>` line numbers into the original jsonl. `prior-audits-and-enforcement.md` holds the code and PR facts. Quotes are verbatim, typos included.

## 1. Corpus and method

**Claude Code main sessions (24 slices, 13 sessions).** Chosen from 180 transcripts in the window by hand: a session counts as main when Andres typed into it. Dispatched panes, verifiers and QA waves were excluded. One session (`84b42c39`) turned out to be a build pane steered by main; it is kept as pane-side evidence only and is not counted in the human-turn totals.

| Area | Sessions |
|---|---|
| Private Lessons | `20f25864` (10-03 to 10-06 design), `39a12a43` (10-07 to 10-15, six slices), `b25b5fe5` intro-call packet (10-09 to 10-10) |
| Scheduling | `889d1f76` (10-08 to 10-19, five slices) |
| Live Lessons | `a010cb0c` (10-08 to 10-09), `d9f3ef92` (10-09 to 10-19, three slices) |
| Tooling, release, other | `09157873` compliance and publish, `5ea4f196` testing frameworks, `11148b8e` cockpit mod, `70ed8bbd` load crisis and load-guard build, `19da0b54` Hex analytics and release, `d0d40add` email diagnosis and release |

**Codex sessions.** 826 rollouts scanned (Oct 1 to 18). 596 had zero user messages (subagents, guardians). 18 were human-driven and mined; the dispatch-heavy ones are `41fac2b8` (Codex as main for Testing Frameworks), `edd99504` (Design System main), `80293430` (Scheduling brainstorm) and `21ad2c3c` (Private Lessons design). Inventory in `codex-inventory.txt`.

**Method.** Transcripts were trimmed to user text, assistant text and compact tool traces, split at 850 KB, and mined by 27 Sonnet agents against `miner-brief.md`, one slice each, same schema. A separate agent read the three skills, their scripts, the enforcement chain, the four prior audit reports, 330 PRs since Oct 1 and 15 Done issues. Counts below are the miners' approximations; a few line numbers are marked approximate in the session files.

**Limits.** Trimming cut AskUserQuestion answers at about 200 characters and dropped some skill-expanded user turns. Every Linear comment is authored as Andres, so agent writes and human writes cannot be told apart. PR evidence-line counts are a keyword heuristic.

## 2. Numbers

### 2.1 Per slice (Claude main sessions)

| Slice | Area | Andres turns | Tickets or panes dispatched | Fix rounds | bin/verify runs | Clean receipt shown to Andres | Corrections | AskUserQuestion calls |
|---|---|---|---|---|---|---|---|---|
| 09157873 p0 | Compliance | 65 | 12 builds | 14 + 5 CI | 0 | 0 | 8 | 2 (+12 prose) |
| 09157873 p1 | Compliance, publish | 50 | 3 panes + 3 subagents | 5 | 14 (4 fail) | 0 | 10 | 12 |
| 5ea4f196 | Testing frameworks | 66 | 5 | 8 | 0 (did not exist) | 0 | 11 | 17 |
| 11148b8e | Cockpit mod | 30 | 0 | 0 | 0 | 0 | 11 | 11 |
| 20f25864 | PL design | 100 | 2 | 4 | 0 | 0 | 14 (+10 interrupts) | 45 |
| 39a12a43 p0 | PL build PL0 | 95 | 5 + 3 arena | 3 | 12 (all BLOCKED) | 0 | 14 | 43 |
| 39a12a43 p1 | PL PL0 wave 2 | 20 | 9 | 19 | 25 to 30 | 0 | 6 | 8 |
| 39a12a43 p2 | PL PL1 Codex wave | 24 | 14 | 11 | 2 | 0 | 12 | 6 |
| 39a12a43 p3 | PL hardening | 36 | 16 | 12 | 8 | 0 | 10 | 9 |
| 39a12a43 p4 | PL PL3/PL4 wave 1 | 28 | 3 builds + 7 | 23 | 0 | 0 | 9 | 18 |
| 39a12a43 p5 | PL follow-ups | 35 (+6 resends) | 12 briefs | 12 | 1 partial | 0 | 7 | 27 |
| b25b5fe5 | Intro-call design | 120 | 0 | 0 | 0 | 0 | 22 | 17 |
| 889d1f76 p0 | Scheduling | 50 | 4 + 4 | 26 (13, 7, 6) | 16 | 0 | 11 | 20 |
| 889d1f76 p1 | Scheduling | 35 | 9 | 12 | 8 | 0 | 9 | 17 |
| 889d1f76 p2 | Scheduling QA gate | 29 | 24 panes | 10 | 9 | 0 | 9 | 19 |
| 889d1f76 p3 | Scheduling merge gate | 35 | 17 panes | 4 + wave | 8 | 0 | 6 | 47 |
| 889d1f76 p4 | Scheduling post-merge | 11 | 5 panes | 7 | 12 | 1 (PR #303) | 1 | 7 |
| a010cb0c | LLP | 55 | 7 | 7 | 14 | 0 | 14 | 15 (+30 prose) |
| d9f3ef92 p0 | LLP | 45 | 10 | 14 | 3 (all BLOCKED) | 0 | 11 | 16 |
| d9f3ef92 p1 | LLP | 64 | 7 | 29 | 20 (6+ FAIL) | 0 (4 FAIL blocks pasted by panes) | 14 | 13 |
| d9f3ef92 p2 | LLP | 35 | 2 + merge pane + subagents | 10 | 6 | 0 | 7 | 15 |
| 70ed8bbd | Load crisis | 30 | 0 | 2 | 0 | 0 | 6 | 22 |
| 19da0b54 | Hex, release | 70 | 0 (3 subagents) | 3 | 0 (waived) | 0 | 10 | 14 |
| d0d40add | Email, release | 42 | 0 (5 subagents) | 7 | 11 | 1 one-line cite | 4 | 3 |
| **Total** | | **≈1,170** | **≈190 pane dispatches** | **≈250** | **≈180** | **2** | **≈236** | **≈430** |

### 2.2 Structural facts (from `prior-audits-and-enforcement.md`)

| Fact | Value |
|---|---|
| PRs since 10-01 (minus Dependabot) | 330 |
| PRs whose body carries a `THOVEN_VERIFY` block | 5, all from 10-16 on |
| Integration-branch PRs with a receipt | 0 of 160 |
| PRs with an image | 1 |
| Done issues sampled | 15: 5 no comment, 1 evidence table, 1 receipt quoted, 2 parity images, 2 cite local evidence paths that are deleted at close |
| Stop hook that demanded a fresh receipt | retired 10-07 (THV-1153); nothing calls `--check-evidence` now; `enforcement/README.md:29` still says it is live |
| bin/verify receipt | written only on PASS, deleted at the start of every run, no counts, no baseline, no delta |
| Load gate on timeout | runs nothing, exit 75 after 1500 s |
| Verify lock | one flock per machine across both repos; backend also takes load-gate slot 1 |
| Text conflicts | `andres-mode:53` exempts integration slices from bin/verify, `thoven-law.md:65` and `review.md:13` do not; `agents.toml` routes tiers 1, 3, 4, 5 to Codex or droid, `andres-mode:59` says Codex only when asked |
| Script vs skill | `watch.sh` HEARTBEAT and SETTLED exits have no row in `SKILL.md`; `send.sh` angle-bracket check is undocumented and misses the DESIGN field; `label.sh` has no Verify kind |

### 2.3 Codex human-driven sessions (highlights)

| Session | What | Corrections | Fix rounds | bin/verify | Questions asked |
|---|---|---|---|---|---|
| 41fac2b8 | Codex main, Testing Frameworks | 8 | 9 | 12 | 1 |
| edd99504 | Design System main | 16 | 7 (+10 unresolved THV-1143 reports) | 6 (1 bypassed) | 12 |
| 80293430 | Scheduling brainstorm | 8 | 2 | 0 | 10 |
| 21ad2c3c | PL design | 9 | 6 cycles | 0 | 11 |

## 3. Verification protocol: what happened

**V1. The receipt does not reach anyone.** Across 24 slices and about 180 bin/verify runs, a clean `THOVEN_VERIFY` block was shown to Andres twice (Scheduling p4, PR #303; email session as a one-line cite). Main paraphrases rows ("every row PASS except mutation") or summarises in a table. Panes paste blocks in their reports, and main does not forward them. PRs carry 5 receipts out of 330. The skill's step 2 ("Include the complete block") was followed by Codex only when a Stop hook demanded it (`41fac2b8` L11220, L11502, L12361, L14219).

**V2. The mutation row blocks every new-file slice, and the block is waived in prose.** Reverting a new file's single hunk deletes the file, importers fail to resolve, the tool counts it as "not killed" (`d9f3ef92` p2 L24856, `84b42c39` L2284, THV-1186, THV-1298, THV-1314). Also blocks comment-only hunks, type-only hunks, refactor-only hunks and CSS comment rewording (`889d1f76` p3, p4). Response each time: "accepted gate gap", "a limit of the tool, not a bug in the code", "no test could ever catch it". Main once waived it alone: "I've also waived `bin/verify`'s mutation check for this slice, since CI is the gate" (`d9f3ef92` p0 L10859), and the pane then wrote "per your waiver". Andres never said it in that slice. Because the row stops at the first survivor, later hunks were never mutation-checked (THV-1285 round 3). Product code was reshaped three times to satisfy the row on THV-1187 (`889d1f76` p4).

**V3. On an integration branch, bin/verify diffs the whole branch against `origin/main`.** It times out ("related" 756 files, 4380 s cap), blocks on unrelated files, and the pre-push hook reruns it on every push. Result: `--no-verify` is the default push. Counts per slice: 24 (`d9f3ef92` p0), 42 mentions (`d9f3ef92` p1), about 25 (`39a12a43` p3), 14 (`a010cb0c`), 3 PRs (`889d1f76` p4). `--base` was discovered and used by hand in a few panes.

**V4. One machine lock, five sessions.** "Twelve `bin/verify` runs from five sessions are queued on the machine-wide lock" (`a010cb0c` L7491). Waits of 47 min to 1 h 17 m; backend mutation alone "about 50 minutes" (`d0d40add` L2805), 41 min (`889d1f76` p3), 807 s (`d9f3ef92` p2). Main's frontend retry loop once treated BLOCKED as lock-busy and starved the backend (`889d1f76` p1). Main reported a run finished that the pane showed still queued 570 s later (`889d1f76` p4 L41400 vs L41449). Main killed another session's backend verify while clearing load (`39a12a43` p4).

**V5. Slice-green does not predict integration-green.** Every wave produced CI-fix PRs after merge: stale callers ("Each slice only ran its own tests, so none of them caught it", `39a12a43` p1 L11128; "The close-out's verify lane ran only the test files it touched, so it missed callers", p4), oxlint and knip on the integration branch (`39a12a43` p5: #294, #296, #297), a date time-bomb identical on main, lint failure that made CI skip type-check and browser tests (`d9f3ef92` p2 L27523, `84b42c39` L8608). Frontend CI on the PL integration branch had never run past the types step until 10-11 (`39a12a43` p3). Repo guard tests named in memory (icon-tier-scan, mail-link-routes, route-list) were not in the briefs' DONE WHEN (`39a12a43` p4, p5).

**V6. Done claims that were later false.** Not exhaustive:

| Claim | What was true | Where |
|---|---|---|
| "THV-1190 is verified (evidence above). Close it?" | main's own bin/verify read BLOCKED (browser-related FAIL, stale-refs FAIL) | `889d1f76` p0 L2674 |
| THV-1215 Ready, shots posted to Linear and board | "I accepted these shots as parity ... without holding them against the frame" | `d9f3ef92` p1 L13705 |
| THV-1232 closed Done | "'no hard-coded Student label' ... never landed before I closed it" | `a010cb0c` L9504 |
| THV-1107 passed builder tests and independent verify | failed CI `next build`; "The builder's tests passed because they never run a real build" | `09157873` p0 |
| THV-1202 Done | parity captured after merge found 4 start-panel gaps | `a010cb0c` |
| THV-1290 merged review-clean | Andres's own screenshots showed clipped paperclip, uneven card heights | `39a12a43` p5 L56517 |
| THV-1287 builder DONE | failing BE spec, "fixed" radio spacing still 48px | `39a12a43` p4 L45170 |
| ScheduleView timeout "a flake" | "I was wrong last time to call the ScheduleView test a flake" | `889d1f76` p2 |
| #115 dogfood spec "flake" | retracted after identical rerun | `19da0b54` |
| "auto-merge on #164 stalled" | merged 76 s after green | `09157873` p0 |
| Ruling 77 merged, bin/verify + CI + pane tests green | review found it dropped overlap warnings | `889d1f76` p4 L40705 |
| Staging run 12/12 green, feature presented as done | Andres's screenshot review found teacher copy in parent calendar and a detached calendar | `889d1f76` p4 L42197 |
| Linear showed THV-1125/1126/1127/1130/1131/1132 Done at takeover | 1127/1130 unverified, 1131/1132 unstarted | `41fac2b8` L102 |

**V7. Test of the input, not the artifact (rule 10 again).** Hand-built fixtures with shapes no endpoint emits (`39a12a43` p4 L42528, `889d1f76` p0 THV-1189); className selector `rounded-[4px]` broke on a radius pass (`889d1f76` p2); a browser caption test "passed even with the clearance turned off, because a single waitFor caught a layout from before everything was measured" (`84b42c39` L2764); `touch.has('content')` "cannot fail"; a "guards rendering" test that passes with or without the fix (`889d1f76` p1); an activation test that passes either way (`39a12a43` p1 L12196); a spec asserting nothing (analytics_accuracy_audit_job_spec:88); cockpit pin tests regenerated from output, 78 of 117 (`11148b8e`); THV-1113 hidden-browser capture that sent nothing (`09157873` p1); walkthrough compared against the builder's own HTML re-render of the board (`39a12a43` p5 L53363); `/dev` mock routes instead of real pages (`d9f3ef92` p0, p1, `a010cb0c`); a component shot without its parent panel (`889d1f76` p3 L35386); a staged "before" screenshot that was not what a parent sees (`889d1f76` p3 L33782).

**V8. Verify cadence rulings contradict each other, in text and in chat.** In text: `andres-mode:53` vs `thoven-law.md:65` vs `review.md:13`; `brief.md` DONE WHEN never names bin/verify and `brief.md:48-49` allows `--no-verify`; `loop-on-ci` says never bypass hooks. In chat, in one session: "raise the backend verify focused-specs 180s cap ... then rerun bin/verify in both repos and paste the last blocks" (`889d1f76` p1 L13295) then five hours later "No bin verify, run CI if needed" (L14707); then in p2 main ran it anyway because the repo rule says so, after the pushes. In `a010cb0c` the cadence changed three times in four hours (L7590, L8307, L9086). "Can we run CI intesead of bin verify" (`d9f3ef92` p2 L25590) was read as a standing licence and reused at L29057 and in the compaction summary. "bypass if the review looks good", said about a CI-cost pane, was reused as a bin/verify bypass on THV-1145 (`edd99504` L10306).

**V9. Stop hook and `[thoven verify]` nudges: mostly false, always a turn.** "reported done 3 times and still: ..." fired on a pane's own `sleep`, a load-gate poll tick, a verify in a background shell, another pane's dev server, a diagnosis pane in a worktree that shows PR #256 (`889d1f76` p2: 4 panes), the builder and verifier sharing a worktree (`39a12a43` p2). Counts: 4 in `d9f3ef92` p1 (3 false), 5 in `39a12a43` p4, 3 in `a010cb0c` (all false), 12 historical in `70ed8bbd` L1111. The "tracked files uncommitted" hook fired 20 times over 2 h 40 m on one `/tmp` scratch file (`09157873` p1), 9 times on a live pane's files (`39a12a43` p1), 7 times at main for builder worktrees (`889d1f76` p0), once with 411 files from another session's archive (`d9f3ef92` p1, `19da0b54`, `d0d40add`). Andres: "Can you tell me what the hook is, though? ... It's firing even in Codex and it's really fucking annoying" (`09157873` p1 L13122); "I thought i had tunred off that commeand" (`39a12a43` p2 L22233); "where is this message coming fr[om]" (`80293430` L901). The require-evidence hook was retired on 10-07 on "full local check afetr everything is an absurd amount of checks" (`09157873` p1 L13172). A guard hook was disabled in Codex entirely at Andres's request (`21ad2c3c` L4567).

**V10. bin/verify fails for reasons that are not the code.** `THOVEN_BACKEND_PATH is required` (3 sessions), unmapped production file with no `--test-path` (4 sessions), `oasdiff` missing, Playwright Chromium missing after another session's reinstall, `timeout: command not found` on macOS, exit 144 with empty output because `| tail` buffered, docs-only diff "No test files found" (CHANGELOG, README, design-only commit), stale-refs failing on every frontend branch because the root was `.`, a dev `.env` value failing a spec, 180 s per-command cap, receipt refused "because source changed while it ran" in a shared tree, `--check-evidence` without stdin printing "Unexpected end of JSON input". THV-1298, THV-1313, THV-1314, THV-1186, THV-1223 were all filed for the gate itself.

**V11. Verifiers catch real defects; builders' own green does not.** Independent verifier or thermo review found: preview mode writing permanent data, a boundary leak, a privacy leak, a paid-lesson gap, an FK crash (THV-1229 rounds 3 to 5), three of four clauses deletable with the suite green (THV-1188), a throttle bypass, StrictMode double pairing, XP leak on scratch create, forced-colors losing checked state, Node 25 on PATH, a wrong Terms sentence, a dropped overlap warning. "Almost every first-pass build had at least one important/critical finding" (`5ea4f196` L5471, mined from 55 earlier chats). Verifiers were also wrong: D8 View/Review (wrong surface, cost 4 turns), THV-1260 BLOCKED on Linear auth, THV-1254 stopped because Rails would not start.

## 4. Evidence procedures: what happened

**E1. "Show me" is asked repeatedly because evidence exists but is not shown.** Seven asks in one slice (`d9f3ef92` p0 L4482 to L8101), three for FE-4 (`39a12a43` p3), three in `edd99504` ("open it again", "open it on my desktop", "Open the fucking screenshots"), "Stop saying the proto I need to actually fucking see what you built" (`d9f3ef92` p1 L13825), "stop giving the reciepts in hidden markedowns, I need for you to $show-me in chat" (`edd99504` L4147), "show me the before/after screenshots ... side by side at 1440 and 390" (`889d1f76` p3 L33694), "open the screenshots so I can see them" (p4 L42057), "shwo me the walthrough cases, states in an html" (`39a12a43` p5). Main had deleted local copies after upload per andres-mode and had to pull them back from Linear (`d9f3ef92` p0 L2184).

**E2. Questions asked before anything is visible.** "Im confused opent eh file im supposed to be seeing", "can you show me all the propsoed" (`d9f3ef92` p2), "Instead of asking me these questions one by one ... talk about what state and what screen we are looking at" (`20f25864` L891), "It it a massive Ui dfiffernece lets just run it now" / "can you show me the iffrerneces" (`889d1f76` p2).

**E3. Parity captured late, loosely, or on the wrong surface.** After merge: THV-1202, THV-1204 (`a010cb0c`), THV-1292 parity pane found P1 to P4 after build and review passed. Loosely: THV-1209, THV-1213, THV-1215 "compared against the proto's layout loosely" (`d9f3ef92` p1 L13705); THV-1216 review "only compared the new pairing card against the design, never the full screen" (p0 L7784). Wrong surface: section V7. Blank shots: "2 of them are blank white ... captured before the card had drawn" (`39a12a43` p3 L35271). Only 1440x900 captured where 390 was due (`a010cb0c`). Not in briefs at all: PL3/PL4 follow-ups had "no design check and no principle-based premise check" until Andres asked "How is it verifying if tis desing realted match" (`39a12a43` p4 L49312). Rulings arriving after capture forced full re-captures three times on THV-1303 (`84b42c39`).

**E4. Linear as the record: thin and lagging.** 5 of 15 sampled Done issues have no comment. Two UI tickets cite `~/.thoven-artifacts/...` paths that the close step deletes. Linear fell a day behind design work (`b25b5fe5` L12116), showed THV-1215 Ready while it failed parity ("Why is linear not updated I am so confused", `d9f3ef92` p1 L13745), showed six tickets Done that were not (`41fac2b8`). The 50-attachment ceiling cut a 53-file upload (`889d1f76` p2). Uploads went through ad hoc scripts (`upload-qa-evidence.mjs`, curl PUT per image). The Linear connector needed reauth in nearly every session and in most panes (`edd99504`, `80293430`, `09157873` p1, `39a12a43` p2 THV-1260, `d9f3ef92` p2), so panes used stale `$TMPDIR/dispatch/linear-THV-*.md` copies ("The local copy of the spec is stale", `39a12a43` p5 L50626).

**E5. Local evidence sprawl.** `~/.thoven-artifacts/pl-hardening` 552 files, 54% byte-identical (`70ed8bbd` L2031); FE-4 runtime folder 2.2 GB; THV-1187 568 MB of traces; 620 PNG and 43 webm from one QA wave; a 39.6 MB walkthrough HTML over the 30 MB send limit. Receipts are overwritten per run so runs per diff cannot be counted. A `/tmp` QA script held a saved login token.

**E6. What worked.** HTML show-me pages with board frame beside 1440 and 390 shots (`39a12a43` p5 walkthrough, `d9f3ef92` p2 every-change.html with 106 shots, `889d1f76` p4 40-shot grid). Dated rulings written to the Linear parent and read back word for word (`889d1f76` p3, p4). Red-then-green per-file proof in pane reports with `[measured]` labels. The production promote path with harness counts and tags. Andres reviewing the grid himself found the defects the green run missed.

## 5. Orchestration (dispatch-work): what happened

**O1. Briefs that never arrived.** "DISPATCH FAILED THV-1113: ... never started on the brief; it may sit unsent in the input box" (3 of 4 Droid sends, `09157873` p1 L8446); same for THV-837 and THV-651 (`edd99504`), THV-1193 twice (`889d1f76` p1 L8264), THV-1215 (`d9f3ef92` p1 L14136), F3 "never sent" and two of four diagnosis panes at a shell prompt (`889d1f76` p2), `herdr agent send-keys` on a fresh pane returning `agent_not_found` (p4), `agent_prompt_stalled` while Droid loaded skills, invalid 32-char agent name, "options reached claude as one string" (`39a12a43` p1 L18365), bash 3 without `mapfile` starting Codex with the default model (`39a12a43` p2). The report-to-main instruction was found typed but unsubmitted in a pane's input box at least four times.

**O2. `send.sh` refuses legitimate text.** Any lowercase `<...>`: `<profile_id>`, `<button>`, `<flow>`, `<noreply@...>`, a TypeScript generic, `<sha>` left in a template. At least ten refusals across sessions; main hand-edited briefs with sed each time, and once sed clobbered `{{MAIN_PANE}}`. The one template field it misses is DESIGN.

**O3. Reports that never reached main.** Main was on an AskUserQuestion dialog when the pane sent (`39a12a43` p1 L16000, p5 THV-1291, `5ea4f196` THV-1127, `84b42c39` "main's pane is blocked on input"); stale reply address w21:p2 or hard-coded w6F:p1 sent reports to another session (`d9f3ef92` p0 L8622, `84b42c39` L8608; memory `feedback_reply_address_from_env`); capture pane's main "no longer exists" (`889d1f76` p0 L1127); main then reads the pane screen or scrollback.

**O4. The watcher.** 9-minute HEARTBEAT wakes with nothing to act on: about 60 assistant turns in `39a12a43` p1, 23 of 54 completions in `a010cb0c`, re-armed about 25 times in `889d1f76` p2, 61 `watch.sh` calls in p3, 15 re-arms in `39a12a43` p4. SETTLED fires while a pane waits in the verify queue ("The panes look 'done' to the watcher while they wait in the verify queue, so it keeps waking for nothing", `39a12a43` p1 L16240) or runs a background shell. It missed the stalls that mattered: a pane "working" 77 minutes with no commits ("the panes stoped", `39a12a43` p5 L58377), a pane dead on an API error for about three hours (`d9f3ef92` p1 L19871), a watcher killed for low memory and never re-armed ("OKay try again i think the panes fronze", `d9f3ef92` p0 L8301), five Droid panes frozen on a usage limit that Andres noticed first (`39a12a43` p3 L37781). Old watchers kept firing after their panes closed (at least 8 "that was an old watcher" lines per slice). Andres re-sent "I think some of the panels may be idle. Cna you use herdr to read them in" six times in 25 minutes after main died (`39a12a43` p5 L55126).

**O5. Fix rounds against the cap.** Cap written as 5, then 3. Actual: THV-1188 13 ("We shouldn't have 14 rounds of one ticket", `889d1f76` p0 L6706), THV-1189 7, THV-1190 6, THV-1229 5, THV-1285 8, THV-1303 8, THV-1289 about 8, THV-1287 about 9, THV-1288 about 6, THV-1043 5, THV-1227 3. Rounds are consumed by gate repair (rounds 5 to 13 of THV-1188 were verify.rb work), by CI fixes after merge, and by redesigns labelled as fix rounds ("FIX ROUND 2/3" was a five-ruling redesign, `84b42c39`). Per `70ed8bbd` L1111: THV-1188 about 20 h wall clock, 79 bin/verify runs; 34 + 59 brief files, about 40% `-fix`, `-ctx`, `-verify`.

**O6. Wrong base, wrong target, unnamed direction.** Worktrees cut from `origin/main` instead of the integration branch: THV-1193 (`889d1f76` p1), THV-1204 (`a010cb0c`), THV-1314 with PR #300 into main then 7 cherry-picks (`d9f3ef92` p2 L26881), a fresh `sessions/thv-1159` instead of the existing feature worktree ("did you merge into the frontend-private-lessons-rework again", `39a12a43` p0 L8885). Four draft PRs opened into main against the integration rule (`889d1f76` p0). Direction not named: "wait what are you merging this feature into main? I never seaid I want that" (`39a12a43` p3 L39797), "Are you saying merging into main or main into the integration" (`889d1f76` p2 L24680), "MERGE INTO THE inegration brnach?" (`d9f3ef92` p1 L17395). Frontend PR CI generated types from backend main, so a throwaway `ci/...-fe` branch with a rewritten `ref:` was needed (`889d1f76` p3).

**O7. The machine.** Disk: 20 GiB to 1.5 GiB in an hour (`d9f3ef92` p0 L684), ENOSPC mid-turn after four worktree bootstraps (`889d1f76` p1), the cleanup that deleted pnpm 11.28.2, 1.1 GB free at the start of `39a12a43` p2, 5.1 GiB (`a010cb0c`). Memory: 50 MB free, Claude Code killing the watcher, 9.6 of 10 GB swap, load 14 to 50 on 10 cores, a reboot. Causes named: main's own worktree-per-ticket bootstraps, two `next dev` at 1.4 GB each, panes leaving dev servers and chromium after each step, baseline builds, local QA Rails plus five scratch DBs, overlapping bin/verify and evidence capture. Andres had to ask for cleanup in nearly every slice ("puter computer is strggling", "Be careudl with disk, and clean the eessive verifications", "be more careful about space adn memory by not adding every single worktree for minor fixes", "Bro no it needs to be on my whole computer system /swarm i literally cannot use my pmputer right now"). Broad `pkill -f agent-browser` and `pkill -f next-server` hit other panes. The load gate queued a single browser test behind other sessions for 44 minutes; a slot was held by a dead process once; `heavy.sh` turned parallel panes into a queue that needed 44 ScheduleWakeups to babysit.

**O8. Classifier and permission blocks.** `[Create Unsafe Agents]` on the bypass launch flag (4 sessions; Andres types `! herdr agent start ... --dangerously-skip-permissions`), `[Merge Without Review]`, `[CI Bypass]` on `--no-verify`, `[External System Writes]` on a Linear-writing agent, `[Production Reads]`, `[Credential Materialization]`, "Security Test Removal", Write refused three times with "no verdict" (`11148b8e`, 35 min). Andres: "Approved and also how the fuck do we get the auto mode to stop flagging shit" (`09157873` p0 L6261); "Try again ur in bypass permissions". Chat approval is not honoured by the classifier, so each block costs a `/permissions` round plus "try again".

**O9. Model and CLI churn.** Codex weekly credits ran out mid-wave and stopped five panes (`39a12a43` p2); Codex "out of credits" killed three subagents (`41fac2b8`); Droid ignored `--auto`, ran at High, hit its 5-hour limit with 35 uncommitted files, then weekly limit; wrong model on panes (Kimi K3 instead of Opus, Astra instead of Sol); Terra unavailable; Claude session limits hit 4 times in one slice. Instructions flipped: "use codex for everything", "medium (high for complex)", "medium everything", "droid --auto medium", "claude code again instead of drooid". `agents.toml` still routes tiers 1, 3, 4, 5 to Codex or droid.

**O10. Linear writes.** Status moves were right but invisible ("did you mark the status as inprogress"), gated per ticket on Andres's word ("Yes, move X to Done once CI is green" asked 8 times in one slice), done at the end of a session rather than as work landed, and relayed through Haiku or Sonnet subagents because panes could not authenticate. Main once used the raw API key when the connector would not reauth.

**O11. Pane scope creep and self-dispatch.** A session-start hook sent three panes into Lessonspace sentinel work (`39a12a43` p2). THV-1143 spent 10 reports building a sandboxed Chrome, a Unix-socket policy and a private Postgres cluster to verify a merged colour swap ("You used 20% of my tokens on a simple neutral grading dropdown update", `edd99504` L11045). A builder pane spawned its own Codex pane after Andres typed a preference into it (`a010cb0c` L11847). A fix pane dropped three oxlint suppressions and left them uncommitted, blocking frontend verify and push for 8 hours (`889d1f76` p3). A tap-targets pane edited `tsconfig.json`. A subagent committed 2 of 11 changed files and left HEAD broken (`d9f3ef92` p2). Addenda typed into a busy pane ran after its DONE (`d9f3ef92` p2 L28299).

**O12. Panes closed or cleaned at the wrong time.** Closed before review ("clsoe the pane review it", `20f25864`), closed with unmerged PRs ("you should have not closed the panes", `edd99504` L9756), left open until asked ("Close the finsiehs panes in this herdr space", `39a12a43` p5 L50008), worktree per minor fix (two memory entries, 10-11). `git worktree remove` refused on pane `.audit` files; orphan DBs left by `thoven-worktree remove`; `branch -D` blocked by the guard hook on squash-merged branches.

**O13. Subagent limits.** 60-turn caps stopped builders mid-migration, mid-fix (nine dirty files), mid-commit; ENOTFOUND killed four agents and nobody retried until Andres typed "continue"; two research agents had no Write tool; "I have no Linear tool". Panes passed 250k, 322k, 400k tokens before a status line.

## 6. Frustration patterns, ranked by recurrence

| # | Pattern | Count (slices) | Representative quote |
|---|---|---|---|
| F1 | Silence; Andres polls | 20+ asks | "any update on the verifies? paste the last block from both repos" (`889d1f76` p1 L13951); "How much longer?" (`41fac2b8`); "the panes stoped" |
| F2 | Decisions asked in prose, not the tool | 9+ | "use the ask question tool" (`889d1f76` p0 L1480, L5527; p3 L35141; `39a12a43` p0 L2229, L5949; p1 L15999; p5 L58591; `a010cb0c` L565; `b25b5fe5` L3218; `20f25864` L1968, L4600) |
| F3 | Jargon; he cannot follow the status | 12+ | "What do you mean I am confued" (`70ed8bbd`); "Rewrite your last message so it's actually legible" (`39a12a43` p2 L22907); `/wait-what` and `/bro` invoked 8+ times |
| F4 | Process instead of product | 10+ | "we are not publishing , I ahve said this multiple times" (`39a12a43` p2 L18921); "you're trying to fix so much of the CI ... instead of building the actual feature" (`a010cb0c` L9086); "just do it bro ... skip the ceremony" (`19da0b54` L2540); "We don't need the ceremony" (`41fac2b8` L3125); "Jus tmerge it please stop worrying about the other items" |
| F5 | Re-asking settled decisions | 8+ | "We decided this aleady" (`21ad2c3c` L2766); "already made this decisions, checkl the full board, and the linear" (`39a12a43` p0); "Lesson or session im confused this is literally the whole feature and has been specced out" (p2); "all design baords are approved that should be knowwn" |
| F6 | Design-system miss | 8+ | "since when does our empty state contain a circle" (`21ad2c3c` L3660); "Use our global UI components" (`d9f3ef92` p0 L2578); "the back buttons nad state button does nto follwo thoven design what did you fucking build" (p1 L13529); "fix it to follow the desing system" |
| F7 | Wrong artifact or layer changed | 8+ | "I'm asking you one thing to iterate on and you move everything. Holy shit." (`20f25864` L1834); "You are hcanging the wrong thing nad making it look like a deck of cards" (`b25b5fe5` L9600); "Dude, you had the correct framing. Why is the ledge incorrect now?" (`5ea4f196` L1049) |
| F8 | Invented or overscoped features | 6+ | "you overscoped into some settings onboarding that I never asked for" (`d9f3ef92` p1 L13945); "intrsument grouping is nto a thing we do"; "Stop trying to decide what is a stamp" (`b25b5fe5`); "No fucking code i said this 20 fucking times" (`80293430` L308) |
| F9 | Hooks | 6+ | "It's firing even in Codex and it's really fucking annoying"; "Okay close the fucking paint. 1. Can you fix the fucking hook so it stops doing this?" (`41fac2b8` L11586) |
| F10 | Show me, don't tell me | 6+ | section E1 |
| F11 | Wrong scope of a triage or audit | 4 | "PL) is not you work I was asking for anything you may have added" (`889d1f76` p0 L4659, `a010cb0c` L6609); "No i am talkking abotu PRs not realeted to ..." (`d0d40add`) |
| F12 | Debt tickets filed | 4 | "Do nto file them as followups ... No techdebt and linear sprawl" (`889d1f76` p0 L1972); "Close all those fucking excessive tickets that you created" (`edd99504`); "17 subissues feels extremrely eexcessive"; "can this just be like one or two tickets" |

Design-phase sessions (`20f25864`, `b25b5fe5`, `21ad2c3c`) carry the highest correction density (14 to 22 per slice) and the most profanity; build sessions carry the most status polling.

## 7. How Andres architects and decides (stable across sessions)

- One integration branch per Project, in both repos, equal to the existing feature worktree. Slices merge into it, backend before frontend, on his word with the direction named. Nothing ships to main until the feature is complete. Catch-up merges from main are a separate, named step.
- The Linear parent holds numbered, dated rulings (THV-1187 reached ruling 85). Slice tickets cite ids. The tldraw board frame beats prose on layout; "the frame binds what shows, not how it sizes". Boards are approved; nobody re-asks.
- Units of work, not tasks: "clearly spaced units of work that are easy to check, test, and call completed"; keep ticket counts low; fix debt and bugs in-session on the owning branch; only genuine product decisions become tickets.
- Verification: targeted tests plus CI on the integration PR; bin/verify once per feature before main; a verifier pane for feature slices, a review subagent for cleanup; parity at 1440 and 390 beside the frame plus a video for every UI build unless he waives it; unconfirmed differences are defects; design-system tokens over proto values; unselectable over refused-with-copy.
- Reviews he orders by name: `/mattpocock-skills:code-review` per PR, then `/thermo-nuclear-code-quality-review` and `/deslop` in main after merge; `/interrogate` for plans; `/test-audit` to prune; `/interface-craft` before build.
- Delegation: Opus 5.5 panes under `/poteto-mode` that pick their own skills; Sonnet for status, cleanup, research; Haiku for Linear relays; Codex only when asked (since 10-10). Guard main's context. Close panes and prune scratch as work lands, never remove unpushed work.
- Communication: lead with the finding, plain English, visual first (HTML walkthroughs, ASCII maps, board frames), decisions through AskUserQuestion with a recommendation, status in eight lines. Picks the recommended option 7 of 9 times; overrides only on product intent.
- Build mode has no publish gates. Agent-skills merges directly. Production moves one "go" per promote step.

## 8. Human-side causes (blunt)

**H1. Bundled, dictated, multi-ask prompts.** One sentence-stream of about 230 words naming 12 skills and 12 asks "once all one ce all the main prs get merged" (`39a12a43` p3 L34097); five asks in two typo-heavy lines that produced the per-slice Thermos plus adversarial plus delta-review ceremony he complained about 16 hours later (`39a12a43` p1 L10793, L10861 then L18452); four asks that never said the computer was unusable (`70ed8bbd` L14 then "Bro no"); a pane report pasted inside his own message with no separator (`39a12a43` p3 L33664); "Only check for this work" covering continue, summary, evidence, links, prune (`889d1f76` p3 L32531). The cost is that Claude plans phases, over-builds process, and the status becomes unclear.

**H2. Duplicate and amended re-sends.** At least 15 pairs: `39a12a43` p0 L3067/L3072, L3491/L3495, L6358/L6362; p5 six identical sends; `b25b5fe5` five pairs; `d9f3ef92` p0 L7845/L7850, L8076/L8101, L10935/L10946 (the resend dropped "then rebase the live-lesson-portal workstream onto main"); `889d1f76` p2 L20570/L20573, L24718/L24733, L25386/L25396 (second appends "/dispatch-work"); `d0d40add` the same image message three times; `a010cb0c` five pairs. Claude answers each, or acts on the later one.

**H3. Rulings that flip within hours.** Verify cadence: raise the cap and rerun, then "No bin verify" (5 h); three cadences in 4 h (`a010cb0c`). Parity: "any discrepancy that I did not explicitly confirm needs to be fixed" (01:48), "hardening keeps the design" (02:26), "the confirmed ones might just be not realistic" (03:52), three briefs to panes (`39a12a43` p3). Model: Codex medium, high for complex, medium for all, droid, Claude again. Scope: "17 subissues feels extremely excessive" then "break those down into further units" (`39a12a43` p4). Merge: "Lets not do this yet", "Hold both", "Merge it" across three days (`889d1f76` p3); "we can test in staging" then "I may just publish the other project first" then "It still not ready" (`39a12a43` p5). Student view: needs nothing, "Yes mock those", "Move the student view from any of this" (`889d1f76` p0). Choose vs "keep these designs instead of choosing" (`b25b5fe5`).

**H4. One-off waivers read as standing rules, and the reverse.** "Can we run CI intesead of bin verify" became every later push `--no-verify`. "bypass if the review looks good" (about a CI pane) became a bin/verify bypass. "commit those files if needed" was conditional and Claude refused it. "push with --no-verify, I approve it" had to be said by name after the classifier blocked. The other direction: a standing rule Claude invented ("lab files stay uncommitted until he says 'commit it'", `b25b5fe5` L6665) that Andres never stated.

**H5. Ambiguous referents.** "go" and "do it" with no object (three identical "go"s while a promote ran, `09157873` p0); "merge it" with no direction (three sessions); "mege it to main" that meant the workstream (`d9f3ef92` p0 L9202); "prune the worktrees" (checkouts vs regenerable files); "reorganise" (pages vs layout); "the frame" (shell seam vs content, about 5 turns and a rant); "Execute the plan" right after "purely just brainstorm" (`80293430` L284); "done" for panes (merged vs reported, `edd99504` L9437); "wait for Phase 3 to merge" read as authority to merge; "Dont we use the e2e testing from test army". Voice typos that cost a turn: "doing 12", "Open Paint", "entry fixes" (Sentry), "Langfuse agents", "vicdece", "GraphQL" for graphify.

**H6. Context assumed that was not in the session.** "we have talked abotu this multiple times there is a dropdown in the FE, every time we touch book lessons you get confused" (`889d1f76` p0 L7375): the ruling lived in another session's memory. "as explicitly mentioned" (`889d1f76` p4 L42197) refers to an instruction outside the slice. Rulings repeated in chat (silent read-edit, notes render as typed, template is a hint) were not yet in the Linear parent, so later panes asked again (`39a12a43` p4). "You didn't read the linear project" when the project text had not been named as the source (`a010cb0c` L310). A handoff that required herdr access the session did not have (`41fac2b8`). "its in the backend space tab called Hex" after two wrong pane searches (`70ed8bbd`).

**H7. Scope pivots into running work.** Addenda typed into busy panes (`d9f3ef92` p2); copy rewrite and the UI-parity gate added mid fix round (p0); "Bring the filling-in forward" after deferring it to PL3 (`39a12a43` p2 L20140); the reschedule path redesigned to "unselectable" after a fix agent had already shipped refusal copy (`889d1f76` p3 L33782); "dispatch THV-1303 now and have the pane merge #289 in when it lands" (`d9f3ef92` p1); handoff to Codex of THV-1152 production erasure that he later remembered as "just testing" (`41fac2b8` L14105).

**H8. Approving the recommended option without its implication visible.** Ruling 77 "One line (Recommended)" dropped overlap warnings and merged; a day later it became ruling 81, a PR and three more questions (`889d1f76` p4). "Approved. Create the parent" for a design that reviewers then showed cannot precede main (`39a12a43` p5). THV-1190 "Close it?" answered on a "verified" label with BLOCKED rows above it.

**H9. Asking main for skills it cannot run.** `/show-me`, `/i-have-adhd`, `/andres-mode` carry `disable-model-invocation`; main had to say "that skill only runs when you type it" at least six times, and the deliverable stalled until Andres retyped it. `/code-review` was mis-aimed once ("your actual note was about CI").

**H10. Verification demanded, then dropped, then demanded.** Day 1 of the Design System work: "create the verification protocal... each dispatched work should return its evidence" (`edd99504` L1294). Day 2: "I dont undertsand what verification we are doing for some of these ticekts that was just a color swap" (L10551). The same arc in Scheduling (raise the cap, then "No bin verify") and in Live Lessons (three cadences in four hours).

**H11. Absence and limits.** A 45-hour gap on a "move to Done?" question; a three-day gap needing "Where are we at?"; Claude weekly and session limits hit mid-wave in five slices; Codex credits twice; Droid limits twice; GitHub Actions budget exhausted so every PR CI failed in 3 s and merges went `--admin`.

**Claude-side counterpart.** About 430 AskUserQuestion calls across the slices; 43, 45 and 47 in single slices; sequences of three calls on one topic; Done-gate confirmations he had already given in kind; questions on already-specced items (sections F5). Too few at the risk points: merge direction, slice base branch before 17 slices were designed, a 1.2 GB commit of 176 files, an `--admin` merge, whether Codex budget would last for six panes, whether the reschedule time was selectable at all, whether he had looked at the cockpit before the third rebuild. Twelve end-of-turn "Want me to / Should I" questions in one slice while he was in "just go" mode (`09157873` p0).

## 9. Skill by skill: text versus observed

### 9.1 dispatch-work

| Skill says | Observed |
|---|---|
| Step 1: ticket ready when blockers merged and no pane holds it | Dispatched on a preference typed into a pane; dispatched before orientation ("I was still trying to brainstorm", `20f25864` L8479); four worktrees bootstrapped at once and the disk filled |
| Step 2: brief points at the ticket, carries only what the ticket cannot know | Briefs grew to many KB with binding-rule blocks re-pasted after each compaction; a "simple prompt" override by Andres for small tickets; DONE WHEN never named repo guard tests, oxlint, knip or bin/verify |
| Step 3: `send.sh` refuses non-idle panes | Also refuses `<...>` text (undocumented); briefs sat unsent at least six times; classifier blocked the launch flag in four sessions; wrong base branch four times |
| Step 4: watcher is the only poll; every wake ends with one plain line to Andres | HEARTBEAT noise dominates; SETTLED fires on queued verify; stalls of 77 min and 3 h missed; killed for memory and not re-armed; status reached Andres only when he asked |
| `DONE` → Ready → step 5 | Panes marked Ready while failing parity (THV-1215, THV-1283); Ready meant built-and-green without the ship check (THV-1187) |
| Three fix rounds, round 3 one tier up | 5 to 13 rounds; redesigns and CI fixes counted as rounds; round 3 pane one tier up not observed |
| Step 5: verifier in a fresh pane; `review.md` "Working if" list | Verifier panes used on feature slices and caught real defects; "Working if" items (red run before green, diff touches only Paths, parity folder with no blank image) failed repeatedly without being treated as findings |
| Step 6: Done with evidence table and SHAs; parity images uploaded; evidence folder deleted | 5 of 15 Done issues have no comment; two cite deleted local paths; deletion ran before Andres had looked, so he asked to see them again |
| Roles: main never edits pane code | Main fixed CI, migrations, conflicts and another session's red test itself in at least four sessions |
| Pane sends one status line to `{{MAIN_PANE}}` | Stale hard-coded ids in briefs; main blocked on a dialog; reports read off the screen |
| Kind list `Meta Plan Design Build Review Research Audit Fix` | `label.sh` rejected "Refactor"; `thoven-worktree` has `verify` and no `Meta`; the skill names no Kind for the verifier pane |
| Codex gotcha: allowlisted skills only | Codex panes could not reach Linear in most dispatches; briefs had to carry the ticket text; `$resolving-merge-conflicts` and others fired per Codex syntax |

Invocations: typed by Andres about 12 times; loaded by main as a skill in most build slices; its scripts used throughout. `evals/dispatch-work/evals.json` exists, last touched 10-03, not run in the window.

### 9.2 andres-mode

| Skill says | Observed |
|---|---|
| `disable-model-invocation: true` | Main cannot load it; it was read as a file in two slices and run as a pane end-gate in one (`84b42c39`, which the pane first skipped). Typed by Andres 5 times, usually as a complaint suffix ("can we use /andres-mode", "/andres-mode" after the third screenshot ask) |
| Linear and the board are the only records; local files are scratch, deleted when work lands | Local deletion ran before Andres saw the evidence (E1); SPEC.md files written to artifacts until he said "Remebr linear will become sourth of truth" |
| After a Linear write, read it back and report one line | Followed consistently in `889d1f76` p3, p4 and `19da0b54` |
| Search Linear parents and Mem0 before asking; settled rulings get applied | Section F5: 8+ re-asks |
| Spec parity by decision id; visual parity 1440 and 390 beside frame plus video; unconfirmed difference is a defect | Became binding on 10-10, after most of the corpus; parity still landed on `/dev` routes and loose comparisons afterwards (THV-1215, THV-1283, FE-4) |
| Hardening keeps the product design | Had to be restated as an addendum mid-hardening (`39a12a43` p3 L35717) |
| Targeted tests only; bin/verify once per diff before push, cite its receipt; integration slices rely on targeted specs and CI | Internally contradictory with law and review.md (section 2.2); in practice "once per feature" |
| Panes under /poteto-mode pick their own skills; Codex only when asked | Memory still said "no poteto-mode in panes" on 10-08 ("I said potato mode That's what despatch work does"); `agents.toml` routes four tiers to Codex or droid |
| Replies: finding first, eight lines, question first | `/wait-what` and `/bro` invoked 8+ times; "What do you mean I am confued"; status not proactive (F1) |
| Do reversible work without asking; ask only product decisions, through the tool | 430 AskUserQuestion calls; decisions in prose 9+ times; "Want me to" end-of-turn questions |

Root `LEARNINGS.md:107` still says "Do not create `andres-mode`"; the skill was created 10-10.

### 9.3 verify

| Skill says | Observed |
|---|---|
| Run `bin/verify` in every changed repository | Run in main by hand in about half the slices; skipped by policy in integration slices; waived by Andres in two sessions; run by panes with `--base` discovered by hand |
| Include the complete `THOVEN_VERIFY_BEGIN` block | Two instances to Andres in 24 slices; 5 PRs of 330; 1 Done issue of 15; Codex pasted it only when a hook demanded |
| If any row fails, fix the cause, rerun, replace the block | Mutation and related rows accepted as FAIL or BLOCKED in prose every time; `--no-verify` pushes 14 to 42 per slice; the 10-16 `/verify` invocation ended "pushed with --no-verify" (`889d1f76` p3 L36029) |
| (10 lines, no branch for integration diffs, docs-only diffs, shared trees, lock waits, or a missing receipt) | Each of those cases occurred and was handled ad hoc |

The skill fired via a Stop hook in `11148b8e` on the agent-skills repo and was declared "does not apply". The verifier brief (`review.md:38-41`) tells the verifier to read the receipt file by hand and gives no instruction for a missing one, which is the common case because the file is written only on PASS.

## 10. Prior-audit items still open (from `prior-audits-and-enforcement.md`, re-observed here)

| Item | Then | Now |
|---|---|---|
| R5 tickets Done with no code; nothing reads status against the branch | 09-17 | THV-1232, THV-1215, six Testing Frameworks tickets |
| R7 "environment ready" with no expiry | 09-17 | disk, pnpm, Chromium, Linear auth all went stale mid-session |
| R10 verify emitted prose the model types | 09-17 | receipt now a script artifact; the check that refuses a claim without it was retired 10-07 |
| R18 done-predicate declared once, receipt with baseline, delta, verdict | 09-17 | receipt has none of those fields |
| R19 AskUserQuestion volume | 09-17: 119 calls, 66 in one session | about 430 across 24 slices, 47 max |
| E3 zero performance checks | 09-17 | one measured audit (`39a12a43` p3), baseline runs could not finish on the Mac |
| E6 done meant written not mounted | 09-17 | THV-1232 label, THV-1210 Codex gate "not completed" |
| B1 Stop hook on done-claims | 09-18 passed | retired 10-07 |
| C1 a mandate inside a skill is obeyed 1 in 6 | 09-19 | receipt step followed 2 of about 180 runs; "use the ask question tool" 9+ reminders |

## 11. Codex-specific observations

- Codex as main could not see herdr for 50 minutes (`Operation not permitted`) and wrote its own `approval_policy="never"` config on request; `HERDR_ENV=1` gating forced an override question in two sessions.
- Codex asked almost nothing (1 question in `41fac2b8`) and took `--admin` merges and a 1.2 GB commit without asking; Claude asked too much. Opposite failure, same cost.
- Codex applied brief rules literally (every hunk reversed → NEEDS_CONTEXT, `39a12a43` p2; memory `feedback_brief_rules_scope_literal`).
- Codex panes saw only allowlisted skills and no Linear; main relayed via files.
- Independent review subagents after each Codex pane DONE found a real defect each time (`41fac2b8` 1146 to 1149, `edd99504` 1135, 837, 651).
- Codex's own done-verifier hook misses app-server processes in separate groups and does not read the explanation, so it re-fires (`80293430` L901).

## 12. Caveats

- Counts are miner approximations from trimmed text; fix-round and verify-run counts in long slices carry ±20%.
- Several AskUserQuestion answers were truncated in the trim, so some rulings are known only from Claude's reply.
- `84b42c39` is pane-side evidence, not a main session.
- Linear authorship cannot separate agent from human comments.
- The PR evidence-line count is a keyword match.
- Sessions before 10-03 (cutover week, earlier PL design) were out of scope.

## 13. Inputs the next phase will need

Not solutions. The three skills Andres named for synthesis each consume a specific input, and this audit supplies it:

- `/automate-me` (revise `andres-mode` from evidence): sections 7 and 8 are the mined signals, with 2+ slice support marked by the session lists; section 9.2 is the row-by-row diff between the current skill and behaviour.
- `/create-verification-skill` (a project-local skill that drives the app the way a user does and captures evidence): sections 3 (V7), 4 (E3, E6) and 5 (O7) list what the drive surface, the doctor check, the evidence store and the cleanup must cover, and which captures were wrong or blank.
- `/maintain-verification-skill` (keep the verify skill and its feature map honest, one PR of proven corrections): section 9.3, section 10 and `prior-audits-and-enforcement.md` section 3 are the drift list between `verify/SKILL.md`, `bin/verify` in both repos, the law, `review.md` and `brief.md`.
