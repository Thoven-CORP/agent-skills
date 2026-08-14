---
name: prospect-finder-mass
description: Mass prospecting mode -- dispatches parallel subagents across web search, list scraping, acquisition mining, and Exa to find 50+ ICP-fit angel investor prospects per wave. Use when user says "mass prospect", "find 300 prospects", "bulk prospect search", or "prospect-finder mass".
---

# Prospect Finder -- Mass Mode

Scales prospect discovery to 300+ by dispatching parallel subagents, each using different search strategies (web lists, acquisition mining, Exa people, Tavily research). Run multiple waves until target is met.

---

## Phase 0: Load State

Same as standard prospect-finder:
1. Read `Fundraising/prospect-finder-seen.json`
2. Query Notion Angel CRM for all existing names
3. Build exclusion set = CRM names + seen.json names
4. Read `Fundraising/prospect-staging.json` (create if missing)
5. Read `references/search-strategies.md` for available strategies

### prospect-staging.json template

```json
{
  "unreviewed": [],
  "wave_count": 0,
  "strategies_used": [],
  "last_wave": null
}
```

---

## Phase 1: Plan Wave

Each wave dispatches 4-5 subagents in parallel. Assign strategies from `references/search-strategies.md`, avoiding strategies already in `strategies_used`.

### Wave Assignment Pattern

| Subagent | Type | Strategies | Expected Yield |
|----------|------|------------|----------------|
| Alpha | A (List Scraping) | Pick 3-4 unused A strategies | 15-30 names |
| Bravo | B (Acquisition Mining) | Pick 3-4 unused B strategies | 10-20 names |
| Charlie | C (Exa People) | Pick 5-6 unused C queries | 5-15 names |
| Delta | D (Web Research) | Pick 3-4 unused D strategies | 10-20 names |
| Echo | C (Exa People) | Pick 5-6 more unused C queries | 5-15 names |

**Expected per wave:** 45-100 raw names -> 15-40 qualified after dedup/filter

### Building the Subagent Prompt

For each subagent:
1. Read `references/subagent-prompt.md` template
2. Replace `{{EXCLUSION_SET}}` with current exclusion set (all names, comma-separated)
3. Replace `{{STRATEGIES}}` with the assigned strategy IDs and their full text from `references/search-strategies.md`
4. Dispatch via Agent tool with `subagent_type: "general-purpose"`

---

## Phase 2: Dispatch Subagents

Dispatch ALL subagents in a SINGLE message using parallel Agent tool calls:

```
Agent(name="prospect-alpha", prompt=alpha_prompt, description="List scraping prospects")
Agent(name="prospect-bravo", prompt=bravo_prompt, description="Acquisition mining prospects")
Agent(name="prospect-charlie", prompt=charlie_prompt, description="Exa people search wave")
Agent(name="prospect-delta", prompt=delta_prompt, description="Web research prospects")
Agent(name="prospect-echo", prompt=echo_prompt, description="Exa people search wave 2")
```

Set `run_in_background: true` for all subagents so they run in parallel.

---

## Phase 3: Collect & Deduplicate

As each subagent returns:
1. Parse the JSON array from their response
2. For each prospect:
   - Check name against exclusion set (fuzzy match >80%)
   - If duplicate -> skip
   - If new -> add to `prospect-staging.json` unreviewed array
   - Add name to exclusion set for intra-wave dedup
3. Log strategies used to `strategies_used` array

---

## Phase 4: Review Batch

Present ALL unreviewed prospects from staging in a numbered table:

```
## Mass Prospect Batch -- Wave N -- [date]
Subagents: Alpha (X found), Bravo (Y found), Charlie (Z found), Delta (W found), Echo (V found)
Raw results: XX | After dedup: YY | Qualified: ZZ

| # | Name | Background | LinkedIn | Angle | Confidence | Source | Draft Hook |
|---|------|------------|----------|-------|------------|--------|------------|
| 1 | ... | ... | ... | ... | high/med/low | ... | [DRAFT] ... |
```

For batches >20, present in groups of 20 and ask:
> "Reviewing prospects 1-20. Approve all? Or mark specific: approve 1-15, skip 16-18, reject 19-20"

**Bulk approval shortcut:** If user says "approve all high confidence" or "approve all", handle accordingly.

---

## Phase 5: Persist Results

Same as standard prospect-finder:
- Approved -> Create Notion CRM rows (batch of up to 10 at a time via notion-create-pages)
- ALL results -> Update seen.json
- Clear reviewed items from staging
- Update wave_count and last_wave timestamp

---

## Phase 6: Loop

After persisting, report progress:

```
Wave N complete.
- This wave: X approved / Y reviewed
- Cumulative: Z total approved / 300 target
- Remaining strategies: N unused
- Next wave ready? (y/n)
```

If user confirms, go back to Phase 1 with updated state.

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| target | 300 | Total prospects to find across all waves |
| subagents_per_wave | 5 | Parallel subagents dispatched per wave |
| auto_approve_high | false | Auto-approve high-confidence prospects without review |
| strategies_per_subagent | 4 | Number of strategies assigned to each subagent |

---

## Notion CRM Reference

- **Data source**: `collection://170c7a68-da78-46be-bf70-9ba05ed47334`
- **Database ID**: `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`
- **View**: `view://4df68df7-63f3-40f8-b75e-f9a648ed2e68`
- **Angle options**: Marketplace, Education-LMS, Music-Mission, Founder-Solidarity
- **Stage options**: Identified, Researched, Outreach Sent, Replied, Meeting Booked, Meeting Done, Committed, Passed
- **Intro Path options**: Warm intro, Advisor-referred, Cold
- **Check Size options**: $10K, $25K, $50K+

---

## Error Handling

- **Subagent returns invalid JSON**: Log error, skip that subagent's results, continue with others
- **Subagent returns empty results**: Mark strategies as [SPENT] in search-strategies.md
- **API rate limits**: Reduce subagents_per_wave to 3, add 30s delay between waves
- **Notion API errors on batch create**: Retry in smaller batches (5 at a time)
- **Staging file corruption**: Re-read from seen.json as source of truth
