# Learnings — daily-work-log

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — read today live; name a stale source once and never replay it

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 8

**What happened.** Daily logs replayed old snapshots: 2026-08-15 to 08-18 replayed 08-14, 2026-08-06 to 08-13 replayed 06-04, and 31 of 42 logs carried content over from an earlier day. Step 5 called `current_focus.md` "the live active state".
**Why.** The log was built from feed files and `current_focus.md`, and nothing checked their dates. The local fleet sensors that wrote the feeds were retired on 2026-10-22, so the feeds no longer exist at all.
**What changed.** Step 1 reads today live by default: Google Calendar, Gmail, git, `todo.md`, and GSD rows edited today. A stale-source rule says that any source more than one day old gets its date named once, and its content is not copied; the section is filled from live reads or left empty. Step 4 restates the rule. Step 5 treats `current_focus.md` as a snapshot and the GSD OKR Tracker as the live state. The description no longer calls current_focus "active state".
