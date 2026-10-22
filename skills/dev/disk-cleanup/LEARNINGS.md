# Learnings — disk-cleanup

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — stale dev processes are mapped to panes before anything is offered

> reflect · 2026-10-22 · 39a12a43 · 01a15a9b · skill-gap · applied · seen 2

**What happened.** Asked for stale processes, an agent offered Andres's live tunnel and panes. He answered "none of those, find other stale processes beyond those"; a Codex session the same day needed three asks ending "find stale node processes and things… that may be hung".
**Why.** Step 1b classified by CPU and memory only, with no step that maps Thoven dev processes to their owning pane or worktree.
**What changed.** Step 1b opens with a stale-dev-process sweep: map each process to its pane or worktree, list orphans with owner and age, never offer a live item.
