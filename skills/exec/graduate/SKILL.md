---
name: graduate
description: Scan daily notes for ideas that never became standalone concept files. Promote the best ones interactively.
---

# Vault Graduate

Scan recent daily notes for ideas, insights, and recurring themes that never graduated into standalone concept files. Present candidates for promotion and create new concept files interactively.

## Trigger Phrases

- `/graduate`
- "graduate ideas"
- "what should I promote from daily notes"
- "idea review"
- "what's buried in my daily notes"

## Workflow

### Step 1: Scan Daily Notes

Read the last 30 days of `Daily Work/` files. Focus on these sections:
- "Notes" — often contains loose observations
- "Decisions Made" — may contain strategies not yet formalized
- "What I'm Thinking About" — raw thinking that may have matured
- "Blockers / Open Items" — recurring blockers may deserve their own concept

### Step 2: Read Existing Concepts

List all files in `Concepts/` to know what already has a concept file. Do NOT suggest ideas that already have one.

### Step 3: Identify Candidates

Look for:
1. **Ideas/observations** appearing in daily notes without `[[concept]]` links that feel significant
2. **Recurring themes** mentioned across 2+ daily notes without a concept file
3. **People** mentioned 3+ times who don't have a concept file (potential advisors, partners, competitors)
4. **Strategies or frameworks** that keep coming up without being formalized
5. **Tools or channels** repeatedly referenced without their own file

Maximum 7 candidates per run. Quality over quantity.

### Step 4: Present Candidates

For each candidate, show:

```
### Candidate [N]: [Proposed concept name]

**Found in:**
- [YYYY-MM-DD] — "[excerpt from daily note — the relevant sentence]"
- [YYYY-MM-DD] — "[excerpt]"
[- more if applicable]

**Why this might deserve its own file:** [1 sentence — what makes it concept-worthy]

**Action?**
1. ✅ Create concept file
2. ➕ Add to existing concept: [suggest which one]
3. ❌ Dismiss
```

### Step 5: Wait for User Response

Ask:
> "Which candidates should I promote? Give me the numbers (e.g., '1, 3, 5 create; 2 add to Google Ads; rest dismiss')."

### Step 6: Execute Promotions

**For each "Create" decision:**

1. Create `Concepts/[Name].md` using the standard template:
```markdown
---
type: concept
tags: [concept]
---

# [Name]

[2-3 sentences based on what the daily notes say about this — grounded in the actual excerpts, not generic]

## Current state
- [Key detail from the daily note excerpts]
- [Another detail]

## Related
[[Existing Concept A]] | [[Existing Concept B]]
```

2. Go back to the source daily work files where the idea appeared and add `[[backlinks]]` to the first mention in each file.

**For each "Add to existing" decision:**
- Read the target concept file
- Add relevant context from the daily note excerpts to the concept's "Current state" section

### Step 7: Summary

```
## Graduate Summary
- **Scanned:** [N] daily notes ([date range])
- **Candidates found:** [N]
- **Promoted:** [N] new concept files created
- **Added to existing:** [N]
- **Dismissed:** [N]
- **New files:** [list of new Concepts/ files created]

Your Obsidian graph now has [N] new nodes. Run `/graduate` again in 2-4 weeks as more daily notes accumulate.
```

## Rules

- **Only suggest what doesn't already exist.** Cross-reference against `Concepts/` before presenting.
- **Be specific, not generic.** "Post-Intro-Call Onboarding Gap" is a good candidate. "Product Development" is not.
- **Interactive — always ask before creating.** Never create concept files without user approval.
- **Use the standard template.** New concept files must match the format in existing `Concepts/` files.
- **Add backlinks to source files.** When promoting an idea, link it in the daily notes where it appeared.
- **Maximum 7 candidates.** If you find more, prioritize by: (1) frequency of mention, (2) recency, (3) strategic importance.

## Error Handling

**No candidates found:** "All significant ideas in the last 30 days already have concept files, or the daily notes are too sparse. Try again after more writing, or extend the scan range."

**Daily notes missing:** "Only found [N] daily notes in the last 30 days. Graduate works best with consistent daily writing. Consider writing more 'Notes' and 'What I'm Thinking About' sections."
