---
name: prospect-finder
description: Find ICP-fit angel investor prospects using Exa search, dedup against Notion CRM + seen history, and present qualified batches for approval. Use when user says "find prospects", "run prospect finder", "prospect search", or "find angels".
---

> **Mass mode available:** For bulk prospecting (50+ per wave, targeting 300+), use `/prospect-finder-mass` instead. It dispatches parallel subagents across web search, list scraping, acquisition mining, and Exa.

# Prospect Finder

Discovers angel investor prospects matching Thoven's ICP, deduplicates against the Notion Angel CRM and a local seen-list, and presents qualified batches for Andres to approve before writing to CRM.

> **INTAKE FREEZE (2026-08-10):** Identified backlog is oversized (~113). Do **not** create new CRM pages until Andres lifts the freeze in `Fundraising/automation-playbook/crm-contract.md`. Dedup reads are fine; **writes are blocked**. Prefer scoring/Passing existing Identified via `prospect-scorer`. Contract: `Fundraising/automation-playbook/crm-contract.md`.

---

## Phase 0: Load State

1. Read `Fundraising/prospect-finder-seen.json` (create if missing — see template below)
2. Query Notion Angel CRM for all existing names. Use the **paginated** `mcp__notion__API-query-data-source` on data source `170c7a68-da78-46be-bf70-9ba05ed47334` (`page_size: 100`, loop while `has_more == true` passing the prior `next_cursor` as `start_cursor`, accumulate ALL pages). Do NOT use `mcp__claude_ai_Notion__notion-query-data-sources` in rows mode (the successor to the retired `notion-query-database-view`) — it silently caps at 100 rows, so a dedup read off it would miss existing prospects past row 100 and re-surface them as "new." This is the paginated pattern `angel-outreach-loop` standardizes on (see its canonical query contract).
3. Build **exclusion set** = all CRM names + all `seen.json` names (any verdict)

### seen.json template (first run)

```json
{
  "seen": {},
  "queries_run": [],
  "stats": { "total_searched": 0, "total_qualified": 0, "total_approved": 0 }
}
```

---

## Phase 1: Select Queries

Pick 3-5 queries using this priority:

1. **User-supplied query** — if user passed one as argument, run it first
2. **Fresh seed queries** — from `references/icp.md`, deprioritize any run within last 14 days (check `queries_run` dates)
3. **Gap-filling queries** — check which Angle categories are underrepresented in CRM. If Marketplace has 8 but Music-Mission has 1, generate a music/arts-focused query
4. **Custom-generated queries** — when all seed queries from `icp.md` have been run within 14 days, generate NEW queries using the strategies below. Seed queries are a starting template, not a hard limit.

### Custom Query Generation Strategies

When seed queries are exhausted, craft fresh queries using these patterns:

**Specificity escalation** — name specific acquirers, PE firms, or companies:
- "founder who sold EdTech company to Vista Equity Partners or Thoma Bravo, now angel investor"
- "former VP at Outschool or Wyzant or Varsity Tutors who left and angel invests"
- "education company acquired by Pearson or McGraw Hill, founder now investing"

**Role-adjacent searches** — find operators near the ICP but via different search angles:
- "education startup advisor who previously exited a company, angel portfolio"
- "Ed-tech accelerator mentor with founder exit background, United States"
- "school district SaaS founder bootstrapped to acquisition, angel investor"

**Vertical deepening** — drill into underrepresented Angles:
- Music-Mission: "music instrument retail chain founder exited", "music school franchise founder sold company", "audio technology founder sold to Spotify or Apple or Amazon"
- Marketplace: "services marketplace founder exited (Thumbtack, Rover, Care.com adjacent)", "gig economy platform founder who sold company angel"
- Founder-Solidarity: "bootstrapped B2C SaaS founder exited $10M-$100M angel investor United States", "solo founder who sold company to PE firm now investing in startups"

**Company-name seeding** — search for people associated with known exits:
- "[Company that exited] founder OR cofounder angel investor"
- Use companies from CRM prospects' backgrounds as leads to find co-founders or early employees who also angel invest

**Anti-patterns to avoid** (queries that historically return 0 qualified):
- Broad creative arts queries ("art music dance theater founder") → returns nonprofit educators
- Generic marketplace queries without exit qualifier → returns VC fund GPs
- Homeschool queries → returns current operators without exits

Always cross-reference new queries against `queries_run` to avoid semantic duplicates (same intent, different wording).

---

## Phase 2: Discovery Loop

> **Exa fallback:** `mcp__exa__*` is optional and is not connected as of 2026-10-22. If it is unavailable, run the same query with `WebSearch` and read results with `WebFetch` (for LinkedIn, search `site:linkedin.com/in "{name}" {company}`). Say in the output which source you used.

```
target = 12  (configurable, default 10-15 range)
qualified = []
consecutive_dry = 0

while len(qualified) < target and consecutive_dry < 3:
    query = next from selected queries
    results = mcp__exa__people_search_exa(query, numResults=10)
    new_this_round = 0

    for each result:
        name = extract full name
        if name in exclusion_set → skip
        add name to exclusion_set  # prevent intra-batch dupes

        # Auto-filter (reject without presenting)
        if not US-based → reject, log to seen.json with reason
        if no exit/sale in background → reject
        if current role is GP/Partner at VC fund (not angel) → reject
        if built/runs a direct Thoven competitor → reject (see competitor list below)

        # If passes filters:
        qualified.append({
            name, linkedin_url, background_summary,
            suggested_angle, draft_hook, source_query
        })
        new_this_round += 1

    # Update query tracker
    log query + date + hits + qualified count to seen.json

    if new_this_round == 0:
        consecutive_dry += 1
    else:
        consecutive_dry = 0
```

### Angle Assignment Logic

Based on background keywords:
- **Marketplace**: "marketplace", "two-sided", "platform connecting", "supply-side", "Thumbtack", "Wyzant", "Outschool", "TakeLessons"
- **Education-LMS**: "LMS", "learning management", "K-12", "curriculum", "edtech", "school district", "tutoring"
- **Music-Mission**: "music", "arts", "instrument", "creative education", "Fender", "Yousician"
- **Founder-Solidarity**: fallback — if they're an exited founder/angel but none of the above match

### Draft Hook Generation

Write a 1-sentence hook referencing their most relevant experience. Example:
> "I came across your work scaling FEV Tutor to 300+ school districts — the parallels to what we're building with independent music teachers are striking."

Mark as `[DRAFT]` so Andres knows to edit.

---

## Phase 3: Present Batch

Display a numbered table:

```
## Prospect Batch — [date]
Queries run: [list]
Raw results: X | After dedup: Y | Qualified: Z

| # | Name | Background | LinkedIn | Angle | Draft Hook |
|---|------|------------|----------|-------|------------|
| 1 | ... | ... | ... | ... | [DRAFT] ... |
```

Then ask:
> "Mark each: **approve** (number), **skip** (number), or **reject** (number). Example: `approve 1 2 4, skip 3, reject 5`"

---

## Phase 4: Persist Results

### For approved prospects:

Create Notion CRM rows via `mcp__claude_ai_Notion__notion-create-pages`:
- **Parent**: `collection://170c7a68-da78-46be-bf70-9ba05ed47334`
- **Name**: full name
- **LinkedIn**: linkedin_url (e.g. `https://linkedin.com/in/username`)
- **Company / Background**: 1-line summary
- **Angle**: suggested angle (Andres can override)
- **Personalization Hook**: draft hook text
- **Stage**: "Identified"
- **Intro Path**: "Cold"
- **Notes**: `Source: prospect-finder | Query: [query used] | [date]`

### For ALL results (approved, skipped, rejected, auto-filtered):

Append to `Fundraising/prospect-finder-seen.json`:
```json
"Ryan Patenaude": {
  "date": "2026-04-14",
  "verdict": "approved",
  "query": "EdTech marketplace founder...",
  "linkedin": "https://linkedin.com/in/ryanpatenaude",
  "angle": "Education-LMS"
}
```

Update `queries_run` and `stats`.

---

## Notion CRM Reference

- **Data source**: `collection://170c7a68-da78-46be-bf70-9ba05ed47334`
- **Database ID**: `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`
- **View**: `view://4df68df7-63f3-40f8-b75e-f9a648ed2e68`
- **Angle options**: Marketplace, Education-LMS, Music-Mission, Founder-Solidarity
- **Stage options**: Identified, Researched, Ready to Send, Outreach Sent, Replied, Meeting Booked, Meeting Done, Committed, Passed, On Hold
- **Intro Path options**: Warm intro, Advisor-referred, Cold
- **Check Size options**: $10K, $25K, $50K+

---

## ICP Quick Reference

For full ICP definition and seed queries, see [references/icp.md](references/icp.md).

**Core ICP**: Exited operators (EdTech, marketplace, music), writes $10k-$25k angel checks, US-based, NOT VCs/GPs at funds.

---

## Competitor Filter

Auto-reject founders/operators who built or currently run platforms that directly compete with Thoven. These people have strategic conflict — they may extract intel rather than invest.

**Direct competitors** (online music lesson marketplaces / teacher platforms):
- Forte (acquired by Virtu), TakeLessons (acquired by Microsoft), Wyzant, Lessonface, LiveMusicTutor
- Outschool (broader but overlapping in music classes)
- Musika, TakeLessons, Music & Arts (Guitar Center)

**How to detect:** If their background includes founding, running, or holding a senior role at a company whose core product is connecting music teachers with students online, or a general tutor marketplace with significant music vertical — reject with reason "competitor."

**Exception:** If the person *exited* the competitor 3+ years ago and is now purely an investor with no ongoing role, flag as "Review — ex-competitor" rather than auto-rejecting. Andres decides.

---

## Edge Cases

- **Person appears in Exa results but is already in CRM with different name spelling**: Fuzzy match on first+last name. If >80% match, flag as potential dupe rather than auto-adding.
- **Same person returned by multiple queries in one batch**: Exclusion set prevents this — name gets added after first encounter.
- **Exa returns articles/posts instead of profiles**: Skip non-profile results (URL should contain `linkedin.com/in/`).
- **API rate limits**: If Exa returns errors, pause and report to user rather than retrying in a loop.
