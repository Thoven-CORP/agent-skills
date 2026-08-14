---
name: trace
description: Trace how a concept, idea, or decision has evolved across the vault over time. Run with a topic name.
---

# Vault Trace

Show how thinking on a specific topic has evolved across the vault — in chronological order.

## Trigger Phrases

- `/trace [topic]`
- "trace [topic]"
- "how has my thinking on X evolved"
- "show me the history of X"

## Workflow

### Step 1: Parse Topic

Extract the topic from the user's message. Examples:
- `/trace "teacher lock-in"` → topic = "teacher lock-in"
- `/trace Isaac Squires` → topic = "Isaac Squires"
- `/trace ESA` → topic = "ESA"

### Step 2: Check for Concept File

Search `Concepts/` for a matching file. If found, read it first for grounding context.

### Step 3: Search the Vault

Use Grep to find ALL files mentioning the topic across these directories:

1. `Daily Work/` — daily work logs
2. `Meetings/` — call preps and meeting notes
3. `Meetings/Thoven Boardroom/` — boardroom session notes
4. `Research/*/Active/` — active research files
5. `Concepts/` — concept files
6. `Agent Knowledge/Memory/` — memory files

Search for the topic and common variations (e.g., "teacher lock-in", "teacher stickiness", "lock-in strategy").

If more than 20 files match, keep only the 20 most relevant (prioritize Daily Work and Meetings over Memory files).

### Step 4: Date-Sort Results

Order all matching files chronologically using:
- Frontmatter `date:` field (preferred)
- Filename prefix `YYYY-MM-DD` (fallback)

### Step 5: Extract Signal

For each file, read it and pull the 1-3 sentences MOST relevant to the topic. Rules:
- Skip frontmatter, headings, and boilerplate
- Pull the sentences that show a decision, shift, or insight about the topic
- Keep excerpts SHORT — this is a navigation tool, not a summary

### Step 6: Build the Trace

Output in this format:

```
## Trace: [Topic]
**Vault span:** [earliest date] → [today] ([N months/weeks])
**Files found:** [count]

### [YYYY-MM-DD] — [File name without path]
> [1-3 sentence excerpt most relevant to the topic]

### [YYYY-MM-DD] — [File name]
> [excerpt]
[🔄 Shift detected — describe what changed from the previous entry]

### [YYYY-MM-DD] — [File name]
> [excerpt]

...

## What this reveals
- [Pattern 1 — something the user might not have noticed]
- [Pattern 2 — a shift in thinking over time]
- [Unarticulated conclusion — if scattered premises point somewhere never stated]
- [What's missing — any gaps in the trace where the topic goes silent]
```

## Rules

- **Read-only.** Never write to vault files during a trace.
- **Flag shifts.** Add "🔄 Shift detected" when the stance, position, or energy noticeably changes between entries.
- **Keep excerpts short.** 1-3 sentences max per file. This is navigation, not summary.
- **"What this reveals" is the money.** Surface patterns, shifts, and unarticulated conclusions the user hasn't explicitly stated. This section should contain genuine insight, not restatement.
- **Cite specifically.** Use file names and dates, not vague references.
- **Be honest about gaps.** If the topic disappears for weeks, note that — silence is signal.

## Error Handling

**Topic not found:** "No mentions of '[topic]' found in the vault. Try a broader term or check spelling."

**Too few results (< 3 files):** Still output the trace, but note: "Only [N] files mention this topic — the trace is thin. Consider whether this idea needs more development."
