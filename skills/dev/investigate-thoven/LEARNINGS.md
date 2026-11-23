# Learnings — investigate-thoven

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-23 — the Mixpanel organization and Render workspace IDs are written down

> reflect · 2026-11-23 · f89bf100 · d5c04bcd · skill-gap · applied · seen 16

**What happened.** Mixpanel's `Get-Business-Context` failed with "organization_id is required when project_id is not provided" in 16 sessions (f89bf100 and many subagents), and Render MCP calls failed with "no workspace selected" in 15 (d5c04bcd and others).
**Why.** `vendor-access.md` named the Mixpanel project but not its organization, had no Render line, and analytics and staging sessions never load this skill.
**What changed.** `references/vendor-access.md`: Mixpanel organization `3073149` (from a real `List-Organizations` result) and which ID each call takes; a Render line with workspace `tea-dao3d9qjnfac73aebo90` from `render workspaces`, the MCP's `select_workspace` and the CLI's `render workspace set`. The pointer for sessions that never load this skill lives in `~/thoven/CLAUDE.md` (Andres's ruling Q3, 2026-11-23).

## 2026-11-05 — vendor access is written down, not guessed

> reflect · 2026-11-05 · 39a12a43 · DEP-20 pane · tooling · applied · seen 2

**What happened.** A DEP-20 pane hit a Sentry 403 on the wrong org slug, and 39a12a43 opened several Mixpanel connections instead of the configured MCP.
**Why.** No skill named the org slugs, project ids or which tool reaches each vendor, so every session rediscovered them.
**What changed.** New `references/vendor-access.md`, one line per vendor, linked from References. Facts not confirmed against config or sessions are labelled unverified.

## 2026-11-05 — pull the named user's records before explaining

> reflect · 2026-11-05 · 01a19d63 · skill-gap · applied · seen 1

**What happened.** A user-reported failure was explained before her Mixpanel and Stripe records were pulled.
**Why.** The workflow investigates code and errors first and never says to start from the person's own records.
**What changed.** Pitfalls line: for a named user's failure, pull her records from the prod DB, Render logs, Sentry, Mixpanel and Stripe before explaining.

## 2026-10-22 — confirm who should see it before diagnosing a display bug

> reflect · 2026-10-22 · 01a151d4 · correction · applied · seen 1

**What happened.** A notification that looked mislabelled was diagnosed as a label bug. Andres: "you misdiagnosed the full bug. The issue was a teacher led item that did not need his review showed up as parent inbound."
**Why.** The "what should happen" slot was filled with the display symptom, so nobody asked whether this viewer should get the item at all.
**What changed.** Pitfalls line: write and confirm the receive-or-see rule before diagnosing a display bug.
