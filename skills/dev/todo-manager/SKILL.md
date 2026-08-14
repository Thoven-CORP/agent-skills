---
name: todo-manager
description: Manage personal and Thoven work todos. Use when user says "add todo", "check todos", "done", or mentions todo management. Personal todos in todo.md, Thoven work in Notion (managed separately). Integrates with daily-work-log for EOD workflow.
---

# Todo Manager

Todo management with `todo.md` for personal tasks and a manually-maintained Thoven work section. Notion is the source of truth for Thoven tasks and is managed directly in Notion -- no automatic syncing.

## Trigger Phrases

Activate this skill when user says:
- "add todo: [task]"
- "add personal todo: [task]"
- "add notion todo: [task]"
- "check todos" / "show todos"
- "check personal todos"
- "done: [task]" / "complete todo: [task]"

## File Locations

- **Personal todos**: `/Users/andresmartinez/Vaults/Executive Assistant/todo.md`
- **Notion Tasks database**: `1ac6c461-0760-8002-84c2-c5bd85cebc1c`
- **Notion data source**: `collection://1ce6c461-0760-804d-81cf-000b3ee6a2e0`

## Workflow

### Adding Todos

**Command**: "add todo: [task]"

1. **Analyze task content** for classification:
   - **Thoven indicators**: "fix", "implement", "build", "meeting with", "review", "deploy", "test", "debug", "refactor", "design", "spec"
   - **Personal indicators**: "call", "email", "buy", "remember", "pick up", "schedule", "text", "respond to"

2. **If clear classification**:
   - Personal → Add to `todo.md` under "## Active"
   - Thoven → Add to Notion Tasks database using `mcp__plugin_Notion_notion__notion-create-task`

3. **If uncertain**:
   - Ask user: "Is this personal or Thoven work?"
   - Wait for response, then add to appropriate location

4. **Force classification** (user can override):
   - "add personal todo: X" → Always goes to todo.md
   - "add notion todo: Y" → Always goes to Notion

**Adding to todo.md**:
```markdown
- [ ] [task text]
```

**Adding to Notion**:
Use `Skill` tool with `Notion:notion-create-task` and natural language task description.

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
- Query Notion Tasks database directly and display results (this is the only command that reads from Notion)

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
- Notion is the source of truth for Thoven work

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
| `add todo: [task]` | Smart add (personal vs Thoven) | Only if Thoven (creates task) |
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

**Example 2: Adding a Thoven todo**
```
User: "add todo: Fix Get Matched analytics bug"
Claude: [Analyzes "fix" keyword → Thoven]
        [Creates task in Notion using notion-create-task]
        "Added to Notion Tasks: Fix Get Matched analytics bug"
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
Claude: "Is 'Review designs' personal or Thoven work?"
User: "Thoven"
Claude: [Creates task in Notion]
        "Added to Notion Tasks: Review designs"
```
