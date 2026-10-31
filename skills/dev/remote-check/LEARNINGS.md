# Learnings — remote-check

A running log of what went wrong in real use and what changed. **Read this before editing SKILL.md.**
New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-10-31 — read the mini yourself

> reflect · 2026-10-31 · 01a17981 · tooling · applied · seen 1

**What happened.** A handover told Andres to paste the mini's output back.
**Why.** The MacBook session already had an ssh host for the mini.
**What changed.** Pitfall: read mini-side logs and screenshots over the ssh host in `host.json`.
