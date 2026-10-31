# Learnings — product-fundamentals

A running log of what went wrong in real use and what changed. **Read it before editing SKILL.md.**
New entries go on top. Each entry covers what happened, why, and what changed.

---

## 2026-10-31 — a confirmed brief is a Linear write, not only a chat recap

> reflect · 2026-10-31 · d041edf0 · correction · applied · seen 1

**What happened.** Andres asked for product-fundamentals to update Linear natively when he confirms the brief.
**Why.** The brief was copied to the design board on his go, and the ruling waited for a later log.
**What changed.** Step 6 runs workspace `update THV-n brief` in that same turn. The slot map stays on the board. The decision entry points at it.

## 2026-10-23 — Replaces customer-obsession-design-thinking

> reflect + grill · 2026-10-23 · ~60 product sessions · 0f23577b · origin

**What happened.**
- Across about 60 Thoven product sessions, `customer-obsession-design-thinking` ran once, and only because Andres called it by name.
- Four minutes in he corrected it: "less about the teachers' journeys… what makes a delightful experience, what do we optimise for, where does this slot into the product journey". The agent had built a teacher-only 11-star ladder and asked him to dream up the 11-star version himself.
- Across sessions, the grills jumped between flows and down to details too early. Andres said: "Why are we diving ten steps ahead and thinking about what the email looks like…" and "when the fuck did we make all these assumptions?"

**Why.**
- The old skill was built for teacher SaaS.
- Its research steps (shadowing, interviews with five teachers) are things an agent cannot do.
- It had no ordering rule and no assumptions list.
- Its description never matched a journey, hardening or "what do we optimise for" prompt.

**What changed.**
- The skill was rebuilt in a grill with Andres around the altitude ladder, a visible assumptions list and a Keep / Cut / Defer close. Grilling runs the rounds.
- Primary-only quote libraries were built for Chesky, Pincus and Jobs.
- Two quotes in the old skill were dropped as unverified: "build at 7-9 stars" and "10 people who love you".
- andres-mode gained a "Product thinking" section, so a plain `/grilling` also holds altitude.
