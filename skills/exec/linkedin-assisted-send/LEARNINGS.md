# Learnings — linkedin-assisted-send

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — diff every draft's middle paragraph against the canonical template at send time

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 3

**What happened.** Drafts went out with a stale middle paragraph: 2026-06-01 said "100+" teachers after the number had moved to 120; 2026-06-10 sent drafts written on May 21; on 2026-07-27 Andres added the school-pilot clause in the middle of a send batch.
**Why.** The only freshness check was the 30-day `Drafted At` gate. A draft a few days old can still carry numbers or wording that changed since.
**What changed.** New middle-paragraph diff gate at run start: read the canonical middle from `angel-outreach-loop/references/standard-template.md`, confirm its five variables in session, and diff every draft's middle word for word, whatever its age. Fix any mismatch in the paste body and the CRM before sending. The per-prospect checklist gained a "middle diffed" box.

## 2026-10-22 — manual-only while angel work is dormant

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work.
**Why.** The skill was model-invocable.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name. Also removed two dead memory pointers in `references/field-notes.md` (`feedback_check_mutuals_before_linkedin_send`, `feedback_intro_path_warm_only_if_confirmed`); their rules were already inline.
