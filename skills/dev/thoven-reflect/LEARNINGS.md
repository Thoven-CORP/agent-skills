# Learnings — thoven-reflect

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-23 — review every skill in use, not only the last one loaded before a correction

> reflect · 2026-11-23 · e2ee8938 · skill-gap · applied · seen 1

**What happened.** Andres asked why reflect covers so few skills and ruled "the scope needs to be increased" (Spec S27, S28, S33). In one window andres-mode took 54 of 189 correction rows while thoven-art, qa-flow and the research skills took none. THV-2003, an adult signup that got the kid flow, reached production and never became a row, and reflect filed what it did not apply into a Backlog that nobody closed.
**Why.** Each row credited only the last skill loaded. The miner dropped subagent transcripts and whole pane sessions, and recorded no Codex skill use. Reviewers read only corrections, so a skill nobody corrected and a bug a user found were invisible, and no lens proposed a new or split skill.
**What changed.** The miner tags each row by origin (main, subagent, pane), credits every skill the session loaded, mines subagents and panes past their brief, and records Codex skill use in `skills.tsv`; Codex subagent prompts leave the human corpus. Three lenses join: a skill walk for each Thoven skill loaded in three or more sessions, escaped defects from the window's bug tickets, and opportunity proposals (new, split, umbrella, rework). Reviewers check git history before a finding counts. The synthesis has Accepted, Fix in this run, Ask and Rejected, with no Backlog; step 5 routes `fix:`, `new skill:`, `split:` and `sub-issue:`.

## 2026-11-23 — count only what Andres typed, not what he accepted or the harness wrapped

**What happened.** `corrections.tsv` counted a CI-monitor auto-fix event and a Codex `<codex_internal_context source="goal">` continuation as Andres's corrections, and could count prompts he only accepted from Claude Code's suggestion chip and Claude Desktop's `<artifact-view-context>` board wrapper, whose boilerplate says "read it again".
**Why.** The filter judged text by its opening words only. A suggestion-accepted prompt reads like a typed one; only the JSONL record's `promptSource` tells them apart.
**What changed.** Each row carries `source` (the `promptSource`, `compaction` for a compaction preamble, `-` when absent). `suggestion_accepted` and `compaction` rows drop by source; CI-monitor and Codex internal-context drop by marker; the artifact-view wrapper is stripped so the text Andres typed after it still counts. Fixtures and `scripts/mine-transcripts-test.sh` cover each class.

## 2026-11-08 — diagnose skill gaps and focus a named skill

**What happened.** Andres requested that Reflect improve skills from corrections, useful discoveries and summaries, including focused reviews of a named skill.
**Why.** Rule presence and last-loaded attribution alone cannot establish a usable capability or its cause; correction-only mining can miss successful and untriggered cases.
**What changed.** Added cause-first diagnosis, focused evidence and window handling, and preserved the recurrence ladder when Pitfalls are full. This is a direct requested revision, not a mined recurrence.

## 2026-10-31 — reviewers read the digest, not the chats

> reflect · 2026-10-31 · d041edf0 · correction · applied · seen 1

**What happened.** Andres asked how the weekly check works and said he was worried it would turn into a token hog.
**Why.** The mine file is small. The three reviewers then opened the raw chats.
**What changed.** Reviewers read `corrections.md` and `dispatch.md`. A transcript open is the lines around one correction, not the file.

## 2026-10-21 — one rung ladder for every kind of lesson

> reflect · 2026-10-21 · 997fee44 · skill-gap · applied · seen 1

**What happened.** In a blind A/B against round 1, the round-2 weekly synthesis lost on routing. It sent four first-time lessons (`seen` 1, corrections and skill gaps) to `step:` edits, and andres-mode took 12 edits. A migration deleted a memory and named another deleted row as the replacement.

**Why.** The synthesizer gave a ladder to broken rules only. Every other kind had no rung, so it defaulted to a step. "The source must stay" left room for a chain of deleted rows.

**What changed.** Every kind now climbs one ladder: `pitfall:` or `learnings:` at `seen` 1, `step:` from 2. The one exception is correcting a step whose own text teaches the wrong fix. A delete names a skill or file, never another memory row. Rerunning the synthesizer on the same reviewer output gave 25 rows with 0 `step:` rows at `seen` 1, down from 4 of 22.

---

## 2026-10-21 — round 2 from the first eval

> reflect · 2026-10-21 · 997fee44 · skill-gap · applied · seen 1

**What happened.** Three prompts were run with the skill and without it. The skill passed 18/18 checks; the baseline passed 13/18. The baseline still found 158 feedback memories to the skill's 151, because the skill inventoried by filename. About 7 of the 37 digest rows were herdr relays (`Main:`, `THV-1303 from main:`, `Lock released:`), and the tooling reviewer built 6 findings on them. A migration routed 45 Pitfall lines to andres-mode against a cap of 10. `seen` was never defined, and two memories that contradict each other had no destination.

**Why.** The filename was standing in for the memory type. The miner's noise list knew pasted reports but not relays. The cap had no overflow rule.

**What changed.** The inventory greps `type: feedback`. The miner drops relays, and a message seen again in the same or another session counts once (37 rows down to 27 on the same window). Overflow becomes `step:` edits. `seen` is defined. `conflict` is a migration destination that Andres settles first. Named rows go in the free-text answer. The mine gets a 10-minute timeout.

---

## 2026-10-20 — one miner, and the noise it had already learned

> reflect · 2026-10-20 · 997fee44 · tooling · applied · seen 1

**What happened.** The first build shipped its own Python miner beside `scripts/mine-transcripts.sh`, which already pulled human turns with eight verified noise classes. Folding the corrections output in surfaced two classes the old filter missed: pane reports pasted inside `<pasted_content>` (the closing tag carries an id, `</pasted_content id="…">`) and slash echoes that open with `<command-message>`. Unfixed, a one-week window gave 359 "corrections", mostly relayed pane reports.

**Why.** A second miner restarts the noise lessons from zero.

**What changed.** `scripts/mine-transcripts.sh` writes `<out>/corrections.tsv` and `<out>/corrections.md`. It judges only the human's own words, with pasted blocks stripped, and counts only turns inside `--since`. The Python miner is deleted. The same window now gives 38 rows (27 Claude, 11 Codex).

---

## 2026-10-20 — why this skill exists

> reflect · 2026-10-20 · 997fee44 · skill-gap · applied · seen 1

**What happened.** A memory audit (`~/thoven/.workspace/plans/memory-meta-2026-10-20.html`) found 26 clear memory failures in 1,816 prompts since 10-03. In 9 of 11 repeated corrections, the rule already existed in Claude memory and the agent broke it anyway. The pstack `reflect` had run 0 times since 10-03: it reads one Cursor transcript and routes to GPT and Cursor's `create-skill`.

**Why.** Lessons landed in Claude memory, which Codex, panes, subagents and the backend project never read. Nothing turned a repeated correction into a skill step.

**What changed.** Built `thoven-reflect`: mine a window of main sessions, keep reflect's three lenses and approval gate, route to `LEARNINGS.md` plus a capped Pitfalls block, and promote a rule broken twice into a skill step. Andres chose manual runs (no schedule), main sessions only, and moving skill-shaped memories into skills.
