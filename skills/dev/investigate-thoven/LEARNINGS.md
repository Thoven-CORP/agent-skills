# Learnings — investigate-thoven

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

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
