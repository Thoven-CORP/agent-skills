---
name: todo-manager
description: Manage Andres's personal todos in the Executive Assistant vault todo.md. Use when user says "add todo", "check todos", "done", or mentions todo management. Personal scope only — engineering work belongs in Linear (workspace `thoven`, team `THV`; see ~/thoven/.workspace/SPEC-linear.md) and must never be routed here. Integrates with daily-work-log for EOD workflow.
---

# Todo Manager

Todo management with `todo.md` for Andres's **personal** tasks.

**Engineering work is not tracked here.** It lives in Linear — workspace `thoven`, team `THV`
(`~/thoven/.workspace/SPEC-linear.md`). Never write an engineering item into `todo.md` and never
route one to Notion; it is a Linear Issue or it does not exist.

The manually-maintained "## Thoven Work" section holds only **non-engineering** admin (CFO,
fundraising, marketing, partnerships), which the user manages directly in Notion -- no automatic
syncing.

## Trigger Phrases

Activate this skill when user says:
- "add todo: [task]"
- "add personal todo: [task]"
- "add notion todo: [task]"
- "check todos" / "show todos"
- "check personal todos"
- "done: [task]" / "complete todo: [task]"

## File Locations

- **Personal todos**: `/Users/andresmartinez/Vaults/Executive-Assistant/todo.md`
- **Notion GSD hub (live work surface since 2026-10-22)**: page `cbb6c461-0760-8325-bf6a-01344d41e228`; OKR Tracker data source `collection://2076c461-0760-8228-803f-07e52f6bfcd2`
- **Legacy Notion Tasks database** (read-only history; do not add new rows): `1ac6c461-0760-8002-84c2-c5bd85cebc1c`, data source `collection://1ce6c461-0760-804d-81cf-000b3ee6a2e0`

## Workflow

### Adding Todos

**Command**: "add todo: [task]"

1. **Analyze task content** for classification:
   - **Engineering indicators** (→ Linear, never here): "fix", "implement", "build", "deploy", "test", "debug", "refactor", "design", "spec"
   - **Personal indicators**: "call", "email", "buy", "remember", "pick up", "schedule", "text", "respond to"
   - **Non-engineering Thoven admin**: "meeting with", CFO / fundraising / marketing / partnership work

2. **If clear classification**:
   - Personal → Add to `todo.md` under "## Active"
   - Engineering → **Do not add it anywhere from this skill.** Say it belongs in Linear (team `THV`)
     and offer to open an Issue there instead. The test (`SPEC-linear.md` §7.4): *would an agent
     claim this and open a branch?* If yes, it is a Linear Issue.
   - Non-engineering Thoven admin → Add to the Notion GSD hub (page `cbb6c461-0760-8325-bf6a-01344d41e228`; OKR Tracker data source `collection://2076c461-0760-8228-803f-07e52f6bfcd2`). `mcp__claude_ai_Notion__notion-fetch` the hub first to pick the right data source, then create the row with `mcp__claude_ai_Notion__notion-create-pages`.

3. **If uncertain**:
   - Ask user: "Is this personal, non-engineering Thoven admin, or engineering work?"
   - Wait for response, then add to appropriate location — engineering always goes to Linear

4. **Force classification** (user can override):
   - "add personal todo: X" → Always goes to todo.md
   - "add notion todo: Y" → Always goes to Notion

**Adding to todo.md**:
```markdown
- [ ] [task text]
```

**Adding to Notion**:
Fetch the GSD hub with `mcp__claude_ai_Notion__notion-fetch`, pick the data source the item belongs in, then create the row with `mcp__claude_ai_Notion__notion-create-pages`. The old `Notion:notion-create-task` skill no longer exists.

### Checking Todos

**Command**: "check todos"

1. **Read todo.md** (do NOT query Notion -- no auto-sync)
2. **Display combined view** from what's already in the file:
   ```
   Personal Todos:
   - Call dentist
   - Buy birthday gift for Mom

   Thoven Work:
   - [Notion] Fix Get Matched analytics - Priority: High
   - [Notion] Review parent signup designs
   ```

**Command**: "check personal todos"
- Read and display only "## Active" section from todo.md

**Command**: "check notion tasks"
- Query the GSD hub's data sources with `mcp__claude_ai_Notion__notion-query-data-sources` and display results (this is the only command that reads from Notion)

### Completing Todos

**Command**: "done: [task name]" or "complete todo: [task name]"

1. **Find task** in todo.md (search Active and Thoven Work sections)
2. **Move to "## Completed" section** with strikethrough and date:
   `~~[x] [task]~~ - YYYY-MM-DD`
3. **If task not found**: Ask user to clarify which task to complete

**Important**: Completing a `[Notion]` task only marks it locally in todo.md. The user manages Notion task status directly in Notion. Do NOT attempt to update Notion.

## No Automatic Notion Sync

**Why**: Previously we had two-way sync that caused circular issues -- Notion pulls would overwrite local annotations, and the sync loop between "check todos" → Notion query → rewrite Thoven section was fragile and lost context.

**Current approach**:
- The "## Thoven Work" section in todo.md is **manually maintained**
- To add Notion tasks to todo.md, the user says "add notion todo: X" (creates in Notion) and can manually add a `[Notion]` line to todo.md if they want local tracking
- To see live Notion tasks, use "check notion tasks" (queries Notion directly, does NOT write to todo.md)
- Notion is the source of truth for **non-engineering** Thoven admin only. **Linear (team `THV`) is
  the source of truth for engineering work** — see `~/thoven/.workspace/SPEC-linear.md`

## Integration with daily-work-log

When user runs `/daily-work-log` or says "eod", the daily-work-log skill should:

1. **Read todo.md** directly (no Notion sync)
2. **Show active todos** before asking completion questions
3. **Cross-reference** session work with active todos
4. **Suggest completions**: "I see you worked on analytics today. Should I mark 'Fix Get Matched analytics' as done?"
5. **Mark completed todos** locally when user confirms
6. **Add completed todos** to Daily Work log "## Completed" section
7. **Show remaining high-priority todos** in "## Tomorrow's Focus"

## File Format

### todo.md Structure

```markdown
# Todos

## Active
- [ ] Call dentist to reschedule appointment
- [ ] Buy birthday gift for Mom

## Thoven Work (Synced from Notion)
- [ ] [Notion] Build Partner Referral System (Audrey Mora) - Priority: High
- [ ] [Notion] Fix Mixpanel Dashboards

## Completed
- ~~[x] Email Andrew Carlins call prep summary~~ - 2026-02-01
- ~~[x] [Notion] Set up Google Ads account~~ - 2026-01-23

<!-- Last sync: 2026-02-09 -->
```

Note: The "Synced from Notion" header is legacy naming. The section is now manually maintained.

### Initial Setup

If `todo.md` doesn't exist, create it with this template:

```markdown
# Todos

## Active

## Thoven Work (Synced from Notion)

## Completed

<!-- Last sync: YYYY-MM-DD -->
```

## Error Handling

**Task not found**:
- Show all tasks and ask user to clarify

**Duplicate task names**:
- Show all matches and ask user to clarify

## Command Summary

| Command | Action | Touches Notion? |
|---------|--------|-----------------|
| `add todo: [task]` | Smart add (personal vs Thoven admin). **Engineering → Linear, added nowhere here** | Only if non-engineering Thoven admin (creates task) |
| `add personal todo: [task]` | Force personal | No |
| `add notion todo: [task]` | Force Notion | Yes (creates task) |
| `check todos` | Read & display todo.md | No |
| `check personal todos` | Show personal only | No |
| `check notion tasks` | Query Notion directly | Yes (read-only) |
| `done: [task]` | Mark complete locally | No |

## Examples

**Example 1: Adding a personal todo**
```
User: "add todo: Call dentist to reschedule"
Claude: [Analyzes "call" keyword → personal]
        [Adds to todo.md "## Active" section]
        "Added personal todo: Call dentist to reschedule"
```

**Example 2: An engineering todo — refused, routed to Linear**
```
User: "add todo: Fix Get Matched analytics bug"
Claude: [Analyzes "fix" keyword → engineering]
        [Adds nothing to todo.md and nothing to Notion]
        "That's engineering work, so it belongs in Linear (team THV), not here.
         Want me to open an Issue for it?"
```

**Example 3: Checking all todos**
```
User: "check todos"
Claude: [Reads todo.md]

        Personal Todos:
        - Call dentist to reschedule
        - Buy birthday gift for Mom

        Thoven Work:
        - [Notion] Build Partner Referral System - Priority: High
        - [Notion] Fix Mixpanel Dashboards

        4 active todos (2 personal, 2 Thoven)
```

**Example 4: Completing a todo**
```
User: "done: Call dentist"
Claude: [Finds in todo.md "## Active"]
        [Moves to "## Completed" with strikethrough + date]
        "Completed: Call dentist to reschedule"
```

**Example 5: Uncertain classification**
```
User: "add todo: Review designs"
Claude: "Is 'Review designs' personal, non-engineering Thoven admin, or engineering work?"
User: "Engineering"
Claude: [Adds nothing here]
        "Then it's a Linear Issue (team THV), not a todo. Want me to open one?"
```
