# Learnings — thoven-reflect

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-20 — why this skill exists

> reflect · 2026-10-20 · 997fee44 · skill-gap · applied · seen 1

**What happened.** A memory audit (`~/thoven/.workspace/plans/memory-meta-2026-10-20.html`) found 26 clear memory failures in 1,816 prompts since 10-03. In 9 of 11 repeated corrections, the rule already existed in Claude memory and the agent broke it anyway. The pstack `reflect` had run 0 times since 10-03: it reads one Cursor transcript and routes to GPT and Cursor's `create-skill`.

**Why.** Lessons landed in Claude memory, which Codex, panes, subagents and the backend project never read. Nothing turned a repeated correction into a skill step.

**What changed.** Built `thoven-reflect`: mine a window of main sessions, keep reflect's three lenses and approval gate, route to `LEARNINGS.md` plus a capped Pitfalls block, and promote a rule broken twice into a skill step. Andres chose manual runs (no schedule), main sessions only, and moving skill-shaped memories into skills.
