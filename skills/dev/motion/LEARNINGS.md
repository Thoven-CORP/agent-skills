# Learnings — motion

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-08-03 — Measure a reported feel before arguing with it

> reflect · 2026-08-03 · memory:measure-motion-dont-argue · correction · applied · seen 1

**What happened.** Andres said the buttons were broken five times. The agent told him the values were correct four times, reading the right files each time, and offered three wrong theories (hit area, focus ring, a missing hued variant). He was describing a 0ms transition and a desynced ledge with total accuracy.
**Why.** Reading CSS gives the two endpoints and says nothing about whether the browser moved between them. For motion the unit of truth is a trace, not a value.
**What changed.** Already performed by `references/feel-vocabulary.md` ("A timing in a class string is a claim" and "Perception beats the suite": drive real input, sample computed style over time, trace before you argue). No Pitfall line.

---

## 2026-05-28 — A one-shot in-view reveal is not GSAP

**What happened.** The most common mis-route to watch was sending a one-shot in-view reveal to GSAP.
**Why.** GSAP is for scrubbed or pinned scroll only.
**What changed.** In Thoven that reveal is `motion-react` `whileInView`, encoded in `decision-tree.md` under "The scroll distinction".
