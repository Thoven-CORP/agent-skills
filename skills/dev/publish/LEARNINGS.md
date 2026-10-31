# Learnings — publish

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-31: a straight-through path for hotfixes, and the changelog moves to the start

> session · 2026-10-31 · 16b02206 · request · applied · seen 2

**What happened.** On two 2026-10-30 promotes (`prod/2026-10-30-1` and `-2`), Andres said "skip my skill ceremony" and "same as last time, skip the ceremony". The skill's rule that a go given before a command covers nothing meant every Stop had to be talked past. Neither release ran the changelog check, which still sat in a Pitfalls line about checking "before promote".
**Why.** The skill had one production path, with a go at every Stop. A small hotfix has nothing for a human to decide between `plan` and `tag` unless something refuses or fails. The changelog check was a Pitfalls line, not a step, so it got skipped.
**What changed.**
- A "Straight through" section in `production-2.0.md`, routed from "hotfix", "skip the ceremony" and "straight through". It reads the release against the last tag, names the steps it needs, runs them without stopping, and stops only on a refusal, a failure that repeats on one rerun, an unexpected skip, or a Stop the read did not foresee.
- Step 1 now starts with the changelog check.
- The "go before the command covers nothing" rule names the straight-through path as its one exception.

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
