# Learnings — publish

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — hotfix PR first; owed backfills and changelog entries are release-plan steps

> reflect · 2026-10-22 · 01a151d4 · skill-gap · applied · seen 1

**What happened.** A production hotfix spent hours on local full gates and gate repairs while Andres said "we need this out"; another session opened the PR about 8.5 hours later. Production dogfood failed with "Meeting is full" because the THV-1348 room-capacity backfill, planned for after promote, was missing from the release plan. Production went live with five changelog entries missing ("So we are live now, is the changelogupdates?").
**Why.** Nothing put the PR ahead of the heavy gates on a hotfix, and the release plan was not built from the range's owed data steps or checked for changelog entries.
**What changed.** Three Pitfalls lines: open a hotfix PR once targeted tests are green; build the post-promote list from merged tickets and mem0 and run owed backfills as numbered steps; check every PR wrote its changelog entry before promote.

## 2026-10-22 — production is main at a SHA, never "on" a tag

> reflect · 2026-10-22 · 889d1f76 · correction · applied · seen 1

**What happened.** A report said production "stays on prod/…". Andres read it as a branch: "why is prod on that branch should it not just be on main, what is happening here."
**Why.** Under Model B production is a tagged commit of `main`; naming the tag alone sounds like a second long-lived branch.
**What changed.** Pitfalls line: describe production as `main` at a SHA with its tag, and say when this merge reaches it.
