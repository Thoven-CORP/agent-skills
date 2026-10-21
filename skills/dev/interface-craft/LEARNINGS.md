# Learnings — interface-craft

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-09 — Each pasted DialKit config is a version

> reflect · 2026-10-09 · memory:feedback_dialkit_pastes_are_versions · correction · applied · seen 1

**What happened.** In the passport crest lab (THV-1245) Andres pasted several DialKit configurations. The agent kept only the last one, left all nine layouts in the dials, and a "match cover" toggle overrode his hue picks. He asked why he could not change the colours on every layer and said his versions had not been listened to.
**Why.** The pastes were read as a sequence where the last wins, and narrowing was applied to the page but not the dials.
**What changed.** Pitfall line: every pasted config becomes a named entry in a Version select; narrowing removes the other layouts and marks from the selects too; each layer gets its own hue and design-system step, and a global control such as cover colour retints the layers once and leaves them editable.

## 2026-10-02 — One mix-and-match lab, not one prototype per option

> reflect · 2026-10-02 · memory:feedback_mix_and_match_dialkit_labs · correction · applied · seen 1

**What happened.** In the teacher profile grill Andres said: "Instead of building one of each and then trying to put them all together… we can put them all in and mix and match at the same time."
**Why.** Separate builds compared one by one cannot show how the sections combine.
**What changed.** Pitfall line: one lab route with a variant slot per section, a DialKit select per slot, spacing dials and a data picker fed real empty, typical and worst-case records. Values are tuned by eye and land as token modules at build.
