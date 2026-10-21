# Learnings — thoven-reflect

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

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
