# Learnings — dispatch-work

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-24 — full checks run once, fix rounds run targeted tests

> session · 2026-10-24 · 7c3d7896 · 09ad9b3a · 6c77d189 · correction · applied · seen 1

**What happened.** THV-1401's frontend `bin/verify` started at least 6 times across one build and two fix rounds (evidence `fe-verify*.log`, about 4.5 min wall each, measured at 8c660e63b), and low memory killed 2 of them. The verifier also reran `--mutation` in both repos, about 22 min in the background. Main's fix-round messages asked for `bin/verify` each round, against the fix-round template's "re-run the tests that cover each fix". The builder never invoked /tdd, /deslop or /no-comments through the Skill tool. The verifier ran thermos, deslop and code-review as subagents. Andres: "i think we need smarter testing not full mutation sweets every time and we jsut need proper invocation of potetomode and the rother skills".
**Why.** Neither the brief nor the review steps said where the full run belongs, so each round defaulted to it. The mutation step told the verifier to rerun rather than cite. Skill moments lived only in ACCESS, which the builder read as optional.
**What changed.** brief.md DONE WHEN: `bin/verify` once per repo at first DONE (with `--mutation` on logic in `lib/`, a service or a model), never in fix rounds, and e2e or browser tests as the one covering spec. It names /tdd at each seam and leaves /deslop and /no-comments to poteto-mode's playbook, and the REPORT gains a Skills row. The `/security-review` row comes out of skills.md (Andres: the review set is /thermo-nuclear-code-quality-review, /deslop and /mattpocock-skills:code-review; bug and security review stays in the verifier's thermos). The fix-round brief runs only the covering files plus typecheck and lint, and /deslops the fix diff. review.md: the verifier cites the builder's mutation row instead of sweeping, and round 2+ runs the fix diff's tests plus /thermo-nuclear-code-quality-review, /deslop and /mattpocock-skills:code-review on the fix diff. Main asks for one final `bin/verify` at the PR head when fixes landed after the block.

## 2026-10-24 — the brief makes the builder open its playbook first

> session · 2026-10-24 · 7c3d7896 · 09ad9b3a · correction · applied · seen 1

**What happened.** On THV-1401 (PL5-S0) the builder launched with `/poteto-mode Feature THV-1401 ...`, so the skill loaded, but it never opened `playbooks/feature.md`, made no task list, ran no `/tdd` or `/thoven-designer`, and committed backend code. Its only Skill calls were 2 `/security-review` runs. Andres: "dispatch did not run poteto mode i never saw the skill incokcation".
**Why.** Loading poteto-mode tells the agent to copy the matched playbook's steps, but the brief that follows is long and concrete, and the builder went straight to building from it.
**What changed.** brief.md gains a FIRST TURN line under DISPATCH: open the named playbook and copy its steps verbatim into the task list before any other work, done when every step is listed. No Pitfall line, because every brief carries it.

## 2026-10-22 — spawn sends the brief's skill line, so poteto-mode loads

> session · 2026-10-22 · 1509cf8d · 3dfd2928 · tooling · applied · seen 1

**What happened.** On THV-1368 (Design System, floating scale S3b) the resumed builder pane ran without poteto-mode. Its brief opened with `/poteto-mode feature THV-1368 ...`, and Andres asked why the dispatched prompt did not start with it. Seven earlier builder and verifier panes in the same run loaded the skill only because each chose to invoke it after reading the brief.
**Why.** `dispatch spawn` launched every pane with the fixed prompt `Read and follow your brief: <path>`. A slash command fires only from the prompt the CLI receives. Inside the brief file it is text.
**What changed.** Spawn takes the brief's first non-blank line, refuses a brief whose first line is not a skill line (`/name` or `$name`), and launches with `<skill line> Read and follow your brief: <path>` on one line, which also suits Devin. A headless `claude -p '/bro ... Read and follow your brief: /dev/null'` expanded the skill with the rest as its arguments. Two new `test_cli` cases, an empty brief among the refusals, fail on the old `cli.py`. brief.md says spawn sends the line. No Pitfall line: the script enforces it.

## 2026-10-22 — dispatch v2: peer messages, a Project board, a tick watcher, brief v2

> grill · 2026-10-22 · 708bf6f4 · tooling · applied · seen 7

**What happened.** Fourteen days of main sessions showed the loop failing at every handoff.
- The watcher exited 432 times on HEARTBEAT against 95 real events.
- 13 prompts sat unsubmitted.
- Reports typed into main bounced off its dialogs, and builders retried them 30-60 times.
- 5 panes could not read their Linear spec, because Codex and expired auth answer UNAUTHORIZED.
- About 8 rounds of addenda arrived after dispatch. Some landed after DONE, and one reversed the last.

The brief research (about 30 incidents) found builders already asked, about 11 times, but the answers arrived late. It also found main's guesses written into briefs as if they were rulings.
**Why.** Herdr inferred agent state from the screen, so watching meant polling and hashing. Reports and corrections travelled by typing into a TUI that has no addressing and no turn boundary. The spec lived where some panes cannot read. Rules main already held went out one addendum at a time.
**What changed.**
- `scripts/dispatch` replaces `send.sh`, `label.sh` and `watch.sh`, and detects Rex or herdr.
- Builders and main talk by Claude peer message, which reaches a busy session between tool calls. Every report, question, answer, correction and alert is also an entry on the Project board at `~/.local/state/thoven/dispatch/<project>/`.
- A launchd `dispatch tick` watches every registered pane and posts an alert only when something is wrong. Main arms one Monitor on `dispatch watch` and never polls.
- `dispatch snapshot` saves the ticket and parent decisions for the pane.
- Brief v2 carries every rule up front, scoped to the pane's files, and labels each chat ruling "Andres ruled", "main recommends" or "guess". Its process rules moved to `references/standing.md`.
- The verifier sees only the snapshot, the builder's REPORT entry and the diff.
- The cockpit is dropped from this skill.

## 2026-10-22 — watcher and send lessons move into the scripts

> reflect · 2026-10-22 · 39a12a43 · d9f3ef92 · 889d1f76 · a010cb0c · 93f7415c · tooling · applied · seen 5

**What happened.** The deep reflect pass wrote three watcher lessons into step 4 as prose: re-arm heartbeats silently, replace a killed watcher with `herdr agent wait`, read the out/ inbox on every wake. Prose about a script's behaviour is the symptom. `watch.sh` itself exited every 9 minutes on HEARTBEAT, and FROZEN could not fire: `BEAT_MIN` 9 was below `FREEZE_MIN` 10, the `watch.$$` state died with each run, and the agent's ticking turn timer changed the screen hash. A pane sat stuck for 77 minutes. `send.sh` gave up on `agent_prompt_stalled` when one Enter would have submitted the prompt (13 times in 5 sessions).
**Why.** Each wake-up rule depended on main remembering it, and the script disagreed with the rule.
**What changed.** `watch.sh` has no heartbeat. It keeps per-pane state in `$TMPDIR/dispatch/watch/` across re-arms, replaces an older watcher on the same panes, drops the turn-timer line and digits from the hash, and restarts the freeze clock after a FROZEN report. `send.sh` presses Enter once on a stalled prompt. `scripts/watch-test.sh` covers each behaviour against a fake herdr; 5 of its 9 cases fail on the old scripts. Step 4 lost its prose. `herdr agent wait` was dropped as the fallback because the cockpit recognises a watcher only by `watch.sh` and the bare wait sees neither a freeze nor a gone pane. An INBOX exit was built and removed: `$TMPDIR/dispatch/out/` is shared by every main and herdr's verify plugin, and the cockpit already names undelivered reports per row.

## 2026-10-22 — the delivery loop: quiet heartbeats, limits, inbox, close-out, review sizing

> reflect · 2026-10-22 · 39a12a43 · 889d1f76 · d9f3ef92 · a010cb0c · 19da0b54 · ec30f47b · c132eb65 · 79269fdf · 02cf7024 · d0d40add · 636cedec · f60a27f9 · 93f7415c · broken-rule · applied · seen 7

**What happened.** A 14-day deep pass over main sessions found the loop leaking at every handoff. Heartbeat exits outnumbered real events about 4.5 to 1, and each forced a line to Andres ("Is this even that important?"). A watcher killed for memory stayed dead ("rearm and check if the pane froze"). Panes stopped at usage limits until Andres said "limits should be back" (5 sessions). Builder reports failed with `agent_blocked` while main sat at a dialog, and builders looped 30-60 retries; nothing read the out/ inbox. Linear looked stale ("Why is linear not updated I am so confused"). Close-out left trees, databases and branches for Andres to ask about in 7 sessions. He asked about 20 times for /thermos and /deslop on PRs with no verifier pane. Tickets ran 8-14 fix rounds on an undefined severity scale. On THV-1355 he saw the page only after two verifier passes, and his notes reopened it. Old integration branches' pre-push hooks pushed panes to `--no-verify`. `gh pr merge` exited nonzero after good merges.
**Why.** Step 4 told main to report every wake and never said how to recover a killed watcher, a usage limit or a failed report. Step 6 said "Done means merged and a user can reach it", which clashed with Done on an integration branch. review.md named no severity scale and ran code-quality thermo only on big diffs.
**What changed.** Step 4: heartbeats re-arm silently; a killed watcher is replaced by `herdr agent wait` (Andres: herdr's own wait is lighter); a usage-limit row; the out/ inbox read on every wake; brief.md REPORT says stop, never loop. Linear section: every merge or Done report ends with the pending Linear writes as a go. Step 1: offer a catch-up merge when the branch's hooks differ from main. Step 6: Done means merged into its target, integration branch or main (Andres: "Done on an integration branch should also mean done"), and the report says where it lives; close-out removes the ticket's own tree and merged branches. review.md: severity defined; thermo sized to the diff (code-quality under ~300 lines in one module, /thermos above, sharded past ~1k), Matt Pocock's /code-review, and every PR put to Andres gets the trio. Pitfalls: show UI at first DONE; read back the PR after every merge.

## 2026-10-22 — corrections to a busy pane go as a brief file, never a typed follow-up

> reflect · 2026-10-22 · memory:project_codex_queued_addendum_lands_late · d9f3ef92 · broken-rule · applied · seen 2

**What happened.** On 10-09 two spec addenda queued into running Codex panes landed after both panes reported DONE, and the verifier had to be held. On 10-16 main typed two addenda into the THV-1303 pane and Andres said "ensure these fixes are being verified and run correctly instead of prompting in the same pane. I want to keep track."
**Why.** The lesson lived only in a Claude memory, which panes and Codex never read, and step 4 had no rule for how a correction reaches a working pane.
**What changed.** Step 4: a fix round or binding correction is written to a file and sent with `scripts/send.sh`, after `esc` on a working pane, and the verifier waits until the pane has answered it.

## 2026-10-13 — a route change runs the repo-wide guard tests

> reflect · 2026-10-13 · memory:feedback_briefs_run_repo_guard_tests · skill-gap · applied · seen 1

**What happened.** THV-1290 (Practice tab) was green on every per-file run and on the checks job,
then integration CI failed on the icon tier scan, the mail link routes test and the route list. A
CI fix round followed.
**Why.** Those tests read the whole repo, not the touched file, so per-file runs never select them.
**What changed.** Since THV-1334, `bin/verify` runs the design scans (icon tier included) on a
component or token diff, the route list on a new page, and the related browser tests. The one gap
left was the mail link routes test. Step edit in `references/brief.md` DONE WHEN: run
the frontend mail link routes test on a diff that adds or moves a route.

---

## 2026-10-13 — a fix keeps the viewports that already work

> reflect · 2026-10-13 · memory:feedback_fixes_keep_working_viewports · skill-gap · applied · seen 1

**What happened.** Scoping the THV-1187 Phase 3 S3 QA fixes, Andres asked that the hidden info
"does not break the UI by causing typography resizing, component frames being painted and shaped
differently especially in the viewports that it already works".
**Why.** The fix-round brief named the findings and nothing about copy, components or the screens
around the fix.
**What changed.** Step edit in `references/brief.md` fix-round brief: copy follows the lexicon,
focus and accessibility fixes use the existing Thoven components, and a UI fix captures each
touched state at 1440 and 390 before and after. A change beyond the fixed element is a defect.

---

## 2026-10-12 — dev servers stay outside the load gate

> reflect · 2026-10-12 · memory:feedback_dev_server_no_gate_slot · tooling · applied · seen 2

**What happened.** In THV-1289 a gated `pnpm run dev` held a gate slot for its whole life, and
another pane's type-check waited 1500 seconds and gave up. THV-1288 had two servers holding both
slots for 35 minutes.
**Why.** The gate is built for one-shot jobs. A server never exits, so it never frees its slot.
**What changed.** Step edit in `references/brief.md` STANDING, a new Dev server line: start the dev
server and `rails s` plain or through the load gate with `--check-only`.

---

## 2026-10-11 — minor fixes reuse a tree

> reflect · 2026-10-11 · memory:feedback_no_worktrees_for_minor_fixes · correction · applied · seen 2

**What happened.** After a reboot Andres said "be more careful about space and memory by not adding
every single worktree for minor fixes for this specific branch". The scope was widened on 10-19 to
fix rounds, CI fixes, review passes and UI fix passes.
**Why.** Each frontend worktree carries about 1.5 GB of node_modules, and parity dev servers leave
`.next-parity-*` folders of about 200 MB behind.
**What changed.** A Pitfall line gives minor work a clean existing tree and checks disk and memory
before heavy panes. Step edit in `references/brief.md` STANDING Dev server: own port, delete the
`.next-*` folder on stop, never commit the tsconfig.json include `next dev` adds.

---

## 2026-10-10 — the reply address comes from the environment

> reflect · 2026-10-10 · memory:feedback_reply_address_from_env · broken-rule · applied · seen 2

**What happened.** The THV-1210 fix briefs hard-coded `w6F:p1`, a pane id carried over from a
compaction summary. That pane belonged to another live session, the reports went there, and Andres
pasted them into main by hand. The same day a THV-1216 brief named a pane that no longer existed.
**Why.** The brief bypassed the `{{MAIN_PANE}}` placeholder that `scripts/send.sh` fills from
`$HERDR_PANE_ID`.
**What changed.** A Pitfall line keeps the placeholder and checks the reply address `scripts/send.sh`
prints against `echo $HERDR_PANE_ID`.

---

## 2026-10-10 — panes run Claude Code with auto permission mode

> reflect · 2026-10-10 · memory:feedback_claude_panes_not_droid · correction · applied · seen 1

**What happened.** Droid hit its 5-hour usage limit partway through the THV-1210 fix round and left
35 files uncommitted. A Claude pane finished it cleanly. Andres: "lets run the panes using claude
code again instead of droid". Starting a pane with `--dangerously-skip-permissions` from main is
blocked by the auto-mode classifier.
**Why.** `config/agents.toml` still launched Claude with the bypass flag, and tiers 1, 3 and 5 ran
Codex and tier 4 ran Droid. andres-mode says Codex runs only when Andres asks for it by name.
**What changed.** `config/agents.toml` `[cli.claude]` launches with `--permission-mode auto`, and
every tier runs Claude Code on Opus 5.5 (tier 1 xhigh, tiers 2 and 3 high, tiers 4 and 5 medium).
The Codex, Devin, Cursor and Droid blocks stay as named opt-ins. `references/agents.md` Tiers and
Launch lines say so, and SKILL.md step 3.3 starts the agent from `agents.py launch-line`.

---

## 2026-10-10 — the brief lists every screen and state, async ones included

> reflect · 2026-10-10 · memory:feedback_ui_parity_gate · skill-gap · applied · seen 1

**What happened.** THV-1216 shipped a practice room whose header and async states copied the
prototype instead of the design system. Andres: "the built does not even follow the thoven design
system for async states".
**Why.** The brief said "match the prototype's states", so the pane took state treatments from the
prototype. The review compared only the slice's own card.
**What changed.** Step edit in `references/brief.md` DESIGN: main lists every screen and state the
frames show, async states included, and loading, empty, error and pressed states take their
treatment from the frontend async-states and buttons design docs. The parity row, the
screenshots to Linear and the skill moments were already in the brief and `references/skills.md`.

---

## 2026-10-09 — the board frame beats the written flow

> reflect · 2026-10-09 · memory:feedback_board_frame_beats_written_flow · correction · applied · seen 1

**What happened.** THV-1196's ticket and parent ruling 30 said the intro follow-up asks a question
before opening the editor. The board frame shows the empty editor straight away. Main recommended
the question because the ruling was newer. Andres: "We should have the TLdraw frame build out that
is the design".
**Why.** Pre-dispatch spec parity compared the ticket only against parent rulings, never against
the frames.
**What changed.** A Pitfall line compares the ticket's flow wording with its named frames before
dispatch, and fixes the ruling and ticket to match the frame. Rulings still govern what a frame
cannot show, such as data, timing and asked-once rules.

---

## 2026-10-09 — brief rules are read literally

> reflect · 2026-10-09 · memory:feedback_brief_rules_scope_literal · skill-gap · applied · seen 1

**What happened.** The THV-1197 brief said "Keep every file you touch under 1000 lines". The pane
compacted both contract manifests to one-line JSON, changed the manifest generator, deleted route
headings to bring routes.rb to 999 lines and added file-size cap tests. It also stopped on a
literal "every production hunk red" gate that coupled extractions could not meet. Undoing it cost
a fix round.
**Why.** Panes follow every brief rule to the letter, so an unscoped rule reaches files it was
never meant for.
**What changed.** A Pitfall line scopes size and gate rules to the code the pane writes and exempts
generated artifacts, manifests, routes.rb and files already over the limit.

---

## 2026-10-03 — re-read the ticket's comments before merging

> reflect · 2026-10-03 · memory:feedback_reread_ticket_comments_before_merge · broken-rule · applied · seen 1

**What happened.** PR 11 (THV-1047) merged about 30 minutes after Andres posted a binding ruling on
the ticket from another session. The fix needed THV-1064 and PR 13.
**Why.** Parallel sessions post rulings into each other's tickets. The PR description and main's
context were older than the ruling.
**What changed.** A Pitfall line lists the ticket's Linear comments right before `gh pr merge`; a
newer ruling holds the merge until the diff applies it.

---

## 2026-10-01 — apply a visual correction literally, in main

> reflect · 2026-10-01 · memory:feedback_apply_design_corrections_literally · correction · applied · seen 1

**What happened.** In the marketplace polish (THV-991) Andres asked for a neutral 3D button with a
duotone bulb, and it became a plain text link. The separator gaps were claimed equal, not measured.
He had to repeat himself and said main "didn't listen". He also said panes and builder subagents
are for big builds, not small edits.
**Why.** The correction was reinterpreted instead of applied, and small edits were routed through
heavier machinery.
**What changed.** A Pitfall line dispatches multi-file feature builds only and has main make a small
visual correction itself, as worded, measured by computed style and geometry.

---

## 2026-09-27 — no proto questions during a build

> reflect · 2026-09-27 · memory:feedback_no_proto_questions_during_build · correction · applied · seen 1

**What happened.** Mid Materials v3 build, main asked whether a homework card in the D1 (THV-863)
proto should be compact at 1440. Andres: "what are we talking about here ... how does this relate to
the library and why am I seeing prototypes still we should be implementing".
**Why.** In a build phase he measures progress by shipped components. A proto layout question reads
as drift, and it did not say how it connected to the feature.
**What changed.** A Pitfall line settles proto edge cases by the rule already set, records it in
RULINGS, tells him in one line, and asks only a product call no rule covers.

---

## 2026-09-16 — a fix round carries about five findings

> reflect · 2026-09-16 · memory:feedback_subagent_token_budget · correction · applied · seen 2

**What happened.** The THV-538 build agent reached 347k tokens. Andres: "that feels excessive for
one subagent ... make sure agents have tight [budgets]". A THV-578 fix-forward brief with 11 items
plus e2e ran to about 265k.
**Why.** One agent held the build, the suite output and the review fixes in one window, and its
judgment degraded as the window filled.
**What changed.** The 250k budget was already in `references/brief.md` STANDING. Step edit in the
fix-round brief: carry about five findings per round and split a larger set by concern into panes
whose files do not overlap.

---

## 2026-09-06 — shard a large review

> reflect · 2026-09-06 · memory:feedback_shard_thermos_reviews · correction · applied · seen 1

**What happened.** Andres stopped a single U02 Thermos review agent after it used about 372k
tokens on a whole-branch diff (backend 6k added lines, frontend 29k).
**Why.** One reviewer reading the whole diff blows the window and re-reads findings it barely
needs.
**What changed.** Step edit in `references/review.md` verifier brief step 5: past about 1k added
lines, shard the review by surface from `git diff --numstat`, with one shared BRIEF.md, one small
findings file per shard, and sonnet for structural and lower-risk shards.
