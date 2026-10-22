# Learnings — investigate-thoven

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — confirm who should see it before diagnosing a display bug

> reflect · 2026-10-22 · 01a151d4 · correction · applied · seen 1

**What happened.** A notification that looked mislabelled was diagnosed as a label bug. Andres: "you misdiagnosed the full bug. The issue was a teacher led item that did not need his review showed up as parent inbound."
**Why.** The "what should happen" slot was filled with the display symptom, so nobody asked whether this viewer should get the item at all.
**What changed.** Pitfalls line: write and confirm the receive-or-see rule before diagnosing a display bug.
