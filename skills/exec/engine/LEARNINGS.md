# Learnings — engine

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — goal-spec paths restored; drafting loads the T1 link-formatting rules

> reflect · 2026-10-22 · ea-vault · correction · applied · seen 2

**What happened.** The Manifest and Reference sections marked three of the four engine goal specs (drafting, send, follow-up) MISSING, so drafting ran by hand. The 2026-08-07 Orlando drafts shipped `google.com/url?q=` redirect links.
**Why.** The three templates were stranded on a branch. Drafts made by hand skipped the locked T1 template's link-formatting section.
**What changed.** The MISSING lines now point at `goal-specs/_TEMPLATE-microschool-engine-metro-drafting.md`, `-metro-send.md` and `-followup.md`, which are being restored 2026-10-22, with a check that each file exists before firing. Until they are verified, every drafting or follow-up run loads the locked T1 template doc § "Email link formatting".

## 2026-10-22 — OVERDUE render section; autoresponder skip only during a dated OOO

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 3

**What happened.** Touch-1 / Touch-3 were missed for Austin and about 55 rows (2026-07-31), and Orlando ran 3 days late (2026-08-19). Lake Travis STEM was skipped on an autoresponder (2026-07-31).
**Why.** The render showed only DUE TODAY and IMMINENT, so anything past due fell off the screen. No rule said when an autoresponder justifies a skip.
**What changed.** The render has a seventh section, OVERDUE, for past-due Touch-1 / Touch-3 with days late, and "none" is printed only after every Sent row was checked. A reference rule allows a Touch skip only while a date-limited out-of-office is active.

## 2026-10-22 — probe Exa and Context.dev before enrichment; tag degraded-source fields

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 5

**What happened.** Enrichment ran on depleted credits four times: 2026-06-23 (all four agents got 402/401), 2026-06-25 (refutations from that run were wrong), 2026-08-05 Orlando, and once more. False refutations led to bad cuts and HALTs.
**Why.** Nothing checked credits before firing, and the judge could not tell fallback-sourced fields from primary ones.
**What changed.** Step 3: before any enrichment or sourcing goal, probe Exa and Context.dev once; a 401 or 402 halts. If Andres runs anyway, fallback-filled fields are tagged `degraded-source`, and the `lab-roster-judge` brief says to score them at lower trust and treat refutations resting on them as unverified.

## 2026-10-22 — manual-only on the maintenance floor

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Lab skills kept auto-triggering after the lab moved to its maintenance floor.
**Why.** The description did not say the skill is manual-only. It already carried `disable-model-invocation: true`.
**What changed.** The description now says it is manual-only since 2026-10-22, on the maintenance floor, invoked by name.
