**Lens: skill walk.** Judge how each skill on your list did in real runs, corrected or not. A skill nobody corrected can still be failing quietly.

Skills to walk: <WALK_BATCH>.

For each skill:
1. Read its `SKILL.md` and the top of its `LEARNINGS.md` under `~/thoven/agent-skills/skills/`.
2. Pick 2 to 3 sessions that loaded it from `<OUT>/skills.tsv` (match the name after stripping a leading `/` or `<plugin>:`), on different days or origins where possible. `<OUT>/index.tsv` and the digest headings give the transcript path; a subagent lives under `<parent session>/subagents/`.
3. In each transcript, find where the skill loaded (`rg -n` its `SKILL.md` path, a `Base directory for this skill:` line, or its Skill call) and read from there to where its work ended: the steps the agent took, what it produced, and what Andres or main said next.
4. Judge it: did it fire on the right task, did the agent follow its steps, did its output hold up (no later correction, rework or bug ticket on the same work), and which step was skipped, misleading or missing.

Done when every skill on your list has a verdict line, `<skill> · worked | partly | failed | not judged (<reason>) · <session ids read>`, and every partly or failed verdict, and every success worth preserving, has a finding in the common format.
