# Learnings — publish

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — production is main at a SHA, never "on" a tag

> reflect · 2026-10-22 · 889d1f76 · correction · applied · seen 1

**What happened.** A report said production "stays on prod/…". Andres read it as a branch: "why is prod on that branch should it not just be on main, what is happening here."
**Why.** Under Model B production is a tagged commit of `main`; naming the tag alone sounds like a second long-lived branch.
**What changed.** Pitfalls line: describe production as `main` at a SHA with its tag, and say when this merge reaches it.
