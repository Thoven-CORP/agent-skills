---
name: daily-work-log
description: Generate end-of-day work journal entries. Use when user says "eod", "end of day", or "daily log". Marks completed todos, creates daily entry, updates the current_focus.md snapshot, appends a tagged session entry to minor_memory.md, and flags major decisions for major_memory_archive escalation (with user confirmation). Also supports RECONCILE MODE ("eod reconcile", "reconcile memory", "memory audit") that cross-references new state against the canonical memory files and auto-fixes stale / contradictory / dangling / done-vs-not-done drift — flagging (never inventing) facts only Andres knows.
---

# Daily Work Log (Executable)

Capture the day, mark completed todos, create daily entry, and update ALL relevant memory files.

## Trigger Phrases
- "eod" / "end of day"
- "daily log" / "daily work log"
- "log today's work" / "capture today"

**Reconcile Mode** (see "Mode: Reconcile" below):
- "eod reconcile" / "reconcile memory" / "deep eod"
- "memory audit" / "audit memory" / "reconcile the vault"

---

## Workflow

### Step 1: Read Files

Read in parallel:
- `todo.md` — get active todos
- `Agent Knowledge/Memory/current_focus.md` — a dated snapshot of the center of gravity (not live state)
- `Daily Work/YYYY-MM-DD.md` — check if today's log already exists

**Then read today live (the default since 2026-10-22).** The local fleet sensors that used to write feed files were retired on 2026-10-22, so no feed refreshes itself. Pull today's events from Google Calendar, today's sent and received threads from Gmail, today's commits from `git log --since=midnight` in the vault and any repo Andres worked in, and the GSD OKR Tracker rows (`collection://2076c461-0760-8228-803f-07e52f6bfcd2`) edited today.

**Stale-source rule.** If any source you read (a feed file, a sensor output, an earlier log, `current_focus.md`) is dated more than one day before today, name its date once ("the last feed is from 2026-08-14") and do not copy its content into today's log. Fill the section from the live reads above, or leave it empty. An empty section is correct; a replayed one is wrong. (2026-08-15 to 08-18 replayed the 08-14 snapshot, 2026-08-06 to 08-13 replayed 06-04, and 31 of 42 logs carried content over.)

### Step 2: Show Context & Ask

Display active todos, then ask:
> "What did you complete today?"
> "Any meetings, decisions, blockers, or notes?"
> "Top priorities for tomorrow?"

Wait for user response.

### Step 3: Mark Completed Todos

For each completed item mentioned:
1. Cross-reference with todo.md Active section
2. Use Edit tool: move to Completed with strikethrough + date
   - `~~[x] Task name~~ - YYYY-MM-DD`

### Step 4: Generate Daily Log

If file exists for today → append new section. If new → create with full structure. Every bullet must come from today's live reads or from what Andres said in Step 2; apply the stale-source rule from Step 1.

```markdown
# Daily Work - [Day, Month Date, Year]

## Summary
[2-3 sentence overview]

## Completed
- ✓ [Task with context]

## Meetings & Calls
- [Name] - [key takeaways]

## Decisions Made
- [Decision] - [reasoning]

## Blockers / Open Items
- [Issue] - [next step]

## Notes
- [Observations, ideas, errands]

## Tomorrow's Focus
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

### Step 4.5: Surface Vault Connections

**After generating the daily log, scan for vault connections.**

1. Read all files in `Concepts/` to get the list of existing concept files
2. Review today's completed work, decisions, and notes — identify which concepts this day connects to
3. Add `[[backlinks]]` to today's daily work entry:
   - People mentioned → `[[Person Name]]`
   - Strategies/decisions → `[[Concept Name]]`
   - Channels → `[[ESA Channels]]`, `[[Google Ads]]`, etc.
   - First mention per section gets the link; subsequent stay plain text
4. Check if today's work mentions ideas, people, or strategies that DON'T have concept files yet
5. If new concepts are found, suggest them:

> **Vault connections for today:**
> - Linked to: [[Concept A]], [[Concept B]], [[Concept C]]
> - **Potential new concept:** "[idea name]" — mentioned today but has no concept file. Want me to create one?

Only suggest new concepts if the idea appeared in 2+ previous daily notes OR represents a significant new direction.

### Step 5: Update current_focus.md

Review what was completed today and what's now active. Update `Agent Knowledge/Memory/current_focus.md`:
- Remove completed items from focus bullets
- Add newly started work if relevant
- Update status text on continuing projects
- Keep file under 3KB

`current_focus.md` is a snapshot, not the live state. The live state is the GSD OKR Tracker (`collection://2076c461-0760-8228-803f-07e52f6bfcd2`); read it before you edit focus bullets, and change a bullet only for something Andres confirmed this session or the Tracker shows. Do NOT add session log entries here.

### Step 5.5: Reconcile drift (run every EOD)

Memory's failure mode is append-only logging: new state gets logged while canonical files keep stale state. Counter it every EOD with a quick cross-check of today's outcomes against `current_focus.md`, `business_context.md`, and `todo.md`:

- **Finished or died today but still framed active elsewhere?** Retire it. If a strategic thread went dormant/dead (a partnership, a deal), add a **terminal** entry to `major_memory.md` (e.g., "ABANDONED — …") so the timeline doesn't dead-end on "in progress" and read as live forever.
- **Todo done but still open (or vice versa)?** Fix the checkbox.
- **A number/status changed?** Update it ONLY if confirmed this session or by a more-recent authoritative source. Otherwise write `[VERIFY: …]` — never guess.

This is the lightweight pass. For a deep multi-file sweep, run **Mode: Reconcile** (below).

### Step 6: Append tagged entry to minor_memory.md

Append a new session entry at the top of the `## Recent Sessions` block in `Agent Knowledge/Memory/minor_memory.md`:

```
### YYYY-MM-DD [TOPIC] — [Session Title]

[2-5 sentence summary of what happened today, decisions made, outcomes, why it matters]
```

Pick ONE primary topic tag from: `[FUNDRAISING]`, `[PRODUCT]`, `[FINANCE]`, `[INFRA]`, `[LEGAL]`, `[MARKETING]`, `[OUTREACH]`, `[DAILY]`. If a session covers multiple topics, choose the one with the most weight.

### Step 7: Flag major decisions for major_memory_archive

If today included a strategic decision, milestone, resolved blocker, or pivot — flag it for archive:

> "This looks like a major decision worth adding to major_memory_archive. Want me to add it? I'll create the full entry in `major_memory_archive.md` (with HTML anchor) and add the one-liner pointer to `major_memory.md`."

Wait for user confirmation. Only on yes:
1. Append entry to `major_memory_archive.md`:
   ```
   <a id="YYYY-MM-DD-kebab-title"></a>
   ## YYYY-MM-DD | Category | Title

   **Context**: [paragraph]
   **Outcome/Resolution**: [paragraph]
   **Impact**: [paragraph]

   ---
   ```
2. Add one-liner pointer to the appropriate topic bucket in `major_memory.md`:
   ```
   - YYYY-MM-DD: [10-word summary] → major_memory_archive.md#YYYY-MM-DD-kebab-title
   ```

If the decision SUPERSEDES an earlier one, mention `(SUPERSEDES: YYYY-MM-DD)` in the new entry header and update the pointer in `major_memory.md` to the new anchor (don't delete the old archive entry — it's the historical record).

### Step 8: Confirm

> "Daily log saved. Updated [N] todos. Memory updated: [list which files were touched]."

---

## File Locations

| File | Path | Tier |
|------|------|------|
| Daily log | `Daily Work/YYYY-MM-DD.md` | — |
| Todos | `/Users/andresmartinez/Vaults/Executive-Assistant/todo.md` | — |
| current_focus | `Agent Knowledge/Memory/current_focus.md` | Tier 1 (always loaded) |
| minor_memory | `Agent Knowledge/Memory/minor_memory.md` | Tier 3 (on-demand session log) |
| major_memory | `Agent Knowledge/Memory/major_memory.md` | Tier 1 (one-liner index only) |
| major_memory_archive | `Agent Knowledge/Memory/major_memory_archive.md` | Tier 2 (full decision detail) |
| business_context | `Agent Knowledge/Memory/business_context.md` | Tier 1 (always loaded) |
| personal_preferences | `Agent Knowledge/Memory/personal_preferences.md` | Tier 1 (always loaded) |

---

## Error Handling

**Daily log already exists**: Read it, append new section. Don't overwrite.

**Todo not found in Active**: Only mark what exists. Tell user: "[Task] not in Active section."

**Memory file missing**: Create with minimal structure, add entry, confirm with user.

**Not sure if something qualifies for major_memory**: Default to writing it. It's easier to trim later than reconstruct.

---

## Mode: Reconcile (Memory Audit)

The deep, multi-file version of Step 5.5. Triggered by "eod reconcile" / "reconcile memory" / "memory audit" / "deep eod". It cross-references all canonical memory against ground truth, fans out read-only sub-agents per focus group, and **full auto-fixes** drift — with one hard guardrail: it flags (`[VERIFY: …]`), never guesses, any fact only Andres knows. That guardrail is what keeps auto-fix from re-introducing drift.

**For the full procedure, the 4 drift classes, the 5 sub-agent fan-out scopes, and a copy-able checklist, read [reference/reconcile-mode.md](reference/reconcile-mode.md).**

Cadence: lightweight Step 5.5 every EOD; deep fan-out weekly or whenever stale items resurface in conversation.
