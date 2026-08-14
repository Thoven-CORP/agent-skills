---
name: Scoring Angel Prospects
description: Scores angel investor prospects 0-10 for Thoven using the calibrated rubric derived from 36 sent outreach records. Use when scoring new CRM entries, validating batch-enrich output, or recalibrating priorities.
---

# Prospect Scorer — Thoven Angel CRM

Calibrated 0-10 scoring rubric for Thoven angel investor prospects.
Derived from pattern analysis of 36 real outreach records (High + Medium + Sent).
Locked 2026-04-26.

---

## Dimensions

### A: EdTech / Education Fit (0-4)

| Score | Signal |
|-------|--------|
| 4 | Founded K-12/consumer learning/music education **product company**; OR exit to major ed acquirer (HMH, Newsela, Savvas, PowerSchool, Keypath); OR music education platform specifically |
| 3 | K-12 infrastructure product founder (SIS, assessment, STEAM); OR consumer marketplace for families/parents/kids; OR ESA product builder; OR consumer marketplace founder with **documented EdTech angel investing** |
| 2 | Music industry platform (non-education); OR general consumer marketplace (not family-focused); OR workforce/professional learning founder; OR education nonprofit/org leader; OR charter school operator |
| 1 | B2B SaaS, no education angle; OR general consumer, no family signal |
| 0 | No signal |

**Key distinctions:**
- EdTech PRODUCT company (has software, not just services) → 4
- Nonprofit/org leader (KIPP, charter operator, ed nonprofit) → 2 (not 3)
- Music industry platform (Spotify-adjacent, streaming, non-ed) → 2 (not 3)
- Consumer marketplace for families (MatchED, parent-facing) → 3 (not 2)
- General consumer marketplace without family signal → 2

### B: Founder / Operator Credential (0-3)

| Score | Signal |
|-------|--------|
| 3 | Co-founder/solo founder with acquisition, IPO, or 1M+ scale; OR CEO 7+ years at $1B+ exit; OR 5x+ serial founder with multiple exits |
| 2 | Founding role with small/unreported exit; OR VP/C-suite at major outcome (didn't originate); OR 2x founder with notable traction |
| 1 | Exec/advisor only; OR founder with active company, no exit yet |
| 0 | No relevant operator credential |

### C: Angel / Check-Writing Capacity (0-2)

| Score | Signal |
|-------|--------|
| 2 | Confirmed active angel: documented deal history, named angel network (37 Angels, Hustle Fund Angel Squad), OR consistent post-exit deployment in public records |
| 1 | Implied capacity: meaningful liquidity event last 5 years but no confirmed angel activity; OR YC alum with exit |
| 0 | No exit, no liquidity signal |

### D: Hook Potential (0-1)

| Score | Signal |
|-------|--------|
| 1 | Public writing (Substack/Medium/podcast), investment with stated rationale, background mirror (teacher→founder, musician→EdTech), OR recent career move with stated mission |
| 0 | No public signal — hook would be generic |

---

## Pre-Scoring Gates (apply BEFORE the 4 dimensions)

Added 2026-07-22 after the graphscout-20260709 batch surfaced only 3 of 15 as worth sending — the rubric let through a non-founder IC and a cohort of pure e-commerce founders with no education/family tie.

### (a) Founder / investor qualification gate (HARD FILTER)

Before scoring, confirm the prospect is a **founder, an exec-with-a-real-exit, or a known/active angel investor** — i.e. someone who actually writes angel checks. Employees, individual contributors, and non-exec staff (e.g. a "Product Designer" or "Engineer" at a startup they did **not** found) are **DISQUALIFIED regardless of how relevant the company is** — they don't write angel checks. If the role cannot be confirmed as founder / exec-with-exit / investor, **do not score High** — flag for verification instead.

> Cautionary example: **Vani Mehta / Sawyer** — a Product Designer (IC), not a founder or investor. Sawyer is a highly relevant kids-enrichment marketplace, but Mehta is not a check-writer and should have been rejected before scoring.

### (b) Vertical / mission-fit weighting (cap raw marketplace overlap)

Weight **education / family / learning / kids-enrichment / mission adjacency ABOVE raw two-sided-marketplace structural overlap**. A pure e-commerce / retail / commerce marketplace founder with **no education/family/mission tie** should **NOT score High on marketplace structure alone** — cap or penalize the A-dimension (treat as A:1, not A:2) so structural-overlap-only prospects land in Medium/Low. Marketplace mechanics are not fit; the education/family/mission tie is.

> Cautionary example: the 2026-07-22 e-commerce cohort — **LTK, One Kings Lane, HauteLook, Whatnot** (also Zulily, Ideeli, CommentSold). Structurally two-sided marketplaces, but weak fit for a cold music-education advice ask — low odds, should not have reached Ready-to-Send.

---

## Priority Bands

| Score | Priority |
|-------|----------|
| 7-10  | High     |
| 5-6   | Medium   |
| 1-4   | Low      |
| 0     | Low + PASS FLAG |

> **Band update 2026-06-15:** High threshold loosened from ≥8 to **≥7** (volume push for the angel pipeline; decision by Andres). Applied to both rubric copies — this skill and the scheduled batch-enrich agent (`trig_01N96M3x2s13QMK5RK2oYtca`).

---

## Calibration Examples (from 36-record dataset)

| Prospect | A | B | C | D | Total | Priority |
|----------|---|---|---|---|-------|----------|
| Sol Kennedy | 4 | 2 | 2 | 1 | 9 | High |
| Hardeep Gulati | 3 | 3 | 2 | 1 | 9 | High |
| Kashif Devani | 3 | 2 | 2 | 1 | 8 | High |
| Gavin Schiffres | 3 | 2 | 1 | 1 | 7 | High (≥7 band, updated 2026-06-15) |
| Andrew Neumann | 3 | 2 | 1 | 0 | 6 | Medium |
| Vanessa Wilkins | 2 | 2 | 2 | 1 | 7 | High (Future School Lab = nonprofit → A:2; ≥7 band 2026-06-15) |
| Aishwarya Balaji | 3 | 2 | 2 | 1 | 8 | High (Build Academy = EdTech product → A:3) |

**Calibration note on A-dimension edge cases:**
- Future School Lab (ed nonprofit) → A:2
- Build Academy (EdTech product company) → A:3
- Same total score can mean different priorities if A-dimension is wrong — always check if it's a PRODUCT company vs. a nonprofit/org

---

## Usage

This rubric is used by:
1. **batch-enrich scheduled agent** (remote CCR) — scores new CRM records daily
2. **angel-outreach-loop skill** — context for queue prioritization
3. **Manual session scoring** — when adding prospects manually to Notion CRM

When scoring manually: apply all 4 dimensions, sum, assign priority band, then do BOTH writes below (a Notes-only score block is not enough — the structured column is what feeds `angel-outreach-loop`'s queue).

**1. Write the band to the `Prioirty` select column (REQUIRED — verified write).** Patch the CRM page setting `Prioirty` = the computed band (`Low` / `Medium` / `High`). The column is misspelled **`Prioirty`** in the schema — keep that exact spelling; do not "correct" it. Re-fetch the page and confirm the select landed. Without this write the prospect never enters `angel-outreach-loop`'s `Prioirty = High` queue, so a Notes-only score is invisible to outreach. (Query the CRM only via paginated `mcp__notion__API-query-data-source`, never the capped view tool — per the canonical contract in `angel-outreach-loop`'s SKILL.md.)

**2. Append the score block to the CRM `Notes` field** (append, do NOT replace) using this format:

```
--- SCORE [YYYY-MM-DD] ---
A([x]/4) + B([x]/3) + C([x]/2) + D([x]/1) = [TOTAL]/10 → [Priority]
A: [1-line reason]
B: [1-line reason]
C: [1-line reason]
D: [1-line reason]
```
