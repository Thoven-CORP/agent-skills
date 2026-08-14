---
name: notion-workspace-executor
description: Create, organize, and manage content in Thoven's Notion workspace. Use when you need to create pages, databases, move content, or manage Thoven's Notion structure. Triggers on "create in Notion", "add to Notion", "organize Notion", "notion task/page/database", or direct workspace management requests.
---

# Notion Workspace Executor

## Overview

This skill executes Notion tasks efficiently while preventing common mistakes (wrong locations, broken links, organizational confusion). It's **70% execution-focused** with light design clarification. For deep structure planning, use the brainstorming skill first.

The workflow: clarify briefly → search existing → safety gate → execute → verify → document.

## Workflow

### Step 1: Load Agent Knowledge Context
Read the Notion-related memory files to understand current context:
- `Agent Knowledge/Memory/business_context.md` – product/company info
- `Agent Knowledge/Memory/major_memory.md` – strategic decisions (including 2026-01-20 Notion skill decision)
- `Agent Knowledge/Guides/notion-guide.md` – workspace structure, databases, IDs, patterns
- `Agent Knowledge/Guides/email-language-guide.md` – communication style (if relevant)

This prevents decisions that contradict settled strategy.

### Step 2: Understand What to Create
Ask the user: **"What do you need to create/add/move in Notion?"**

Get the high-level goal. Keep this brief—don't design deeply here. Examples:
- "Add Email Strategy Master Reference to Go-To-Market"
- "Create a new Dev Tracker task for Thovie Rollout Sprint"
- "Organize the Product Strategy Hub"

### Step 3: Clarify Structure & Destination (Light Questions)
Ask only the minimum needed to execute:
- **Destination**: "Which Teamspace? Or should this go in main workspace?" (if not obvious)
- **Scope**: "Is this a single page, multiple linked pages, or a database?"
- **Parent**: "Should this live under [existing page], or at root level?"

Do NOT re-design settled decisions. If the user has already decided these things, skip this step.

### Step 4: Search Notion for Related Content
Use `mcp__plugin_Notion_notion__notion-search` to find:
- Similar pages (check for duplicates)
- Related databases or pages in the same Teamspace
- Existing patterns you should follow

Report what you find. This prevents duplicates and ensures consistency.

### Step 5: Safety Gate – Confirm Before Executing
**Describe exactly what you're about to do:**

> "I'm about to:
> 1. Create [page/database/item] called '[Name]'
> 2. Place it under [Parent Page] in [Teamspace]
> 3. [Other actions: move pages, link to other pages, etc.]
>
> Does this match what you want?"

Wait for confirmation before proceeding.

### Step 6: Execute the Task
Use Notion MCP tools:
- `notion-create-pages` – create new pages/database entries
- `notion-move-pages` – move pages to different parents
- `notion-update-page` – update properties or content
- `notion-fetch` – read existing pages to verify structure

Reference `references/notion-syntax-guide.md` for correct parameter formats.

### Step 7: Verify It Worked
After executing:
1. **Check navigation**: Can you access it from where it should be accessed?
2. **Test links**: Do any links you created work?
3. **Confirm properties**: Are the right fields/values set?
4. **Screenshot or describe** what you created so user can visually verify

### Step 8: Update notion-guide.md (If Needed)
If you created a new database or established a new pattern:
- Update the guide with new database info (ID, schema, purpose)
- Add it to "Key Databases" or "Common Tasks" section
- Update "Last Updated" date to today

### Step 9: Offer Pattern Documentation
If you notice a pattern that should be documented:
> "I noticed you organize [X] this way. Should I add this pattern to the Notion guide for future reference?"

Suggest additions to anti-patterns or common operations sections.

## Safety Rules

**Do NOT:**
- Execute without the safety gate confirmation
- Move pages to multiple different locations without clarifying each one
- Assume a Teamspace/parent location if the user hasn't explicitly stated it
- Create links without testing them afterward

**Do:**
- Ask clarifying questions if destination is ambiguous
- Search first to avoid duplicates
- Verify everything worked before closing the task

## Common Operations

### Create a Page Under a Parent
```
notion-create-pages with:
- parent: {type: "page_id", page_id: "[parent-page-id]"}
- properties: {title: "Page Title", [other fields]}
```

### Create a Page in a Database (Data Source)
```
notion-create-pages with:
- parent: {type: "data_source_id", data_source_id: "[data-source-id]"}
- properties: {[Title Field]: "Name", [other fields]}
```

### Move a Page to a New Parent
```
notion-move-pages with:
- page_or_database_ids: ["page-id"]
- new_parent: {type: "page_id", page_id: "[new-parent-id]"}
```

### Add to Development Kanban (Dev Tracker)
```
notion-create-pages with:
- parent: {type: "data_source_id", data_source_id: "f0c5c186-7c5f-4c25-89d8-775a4426da5a"}
- properties: {
    "Feature / Item": "Task name",
    "Epic": "Setup Backend" | "Integrate Legacy Frontend" | "Routing & Navigation" | "Integration" | "Sign-Up & Application" | "Tax Compliance" | "Thovie Rollout Sprint",
    "Status": "Mockup/Documentation",
    "Priority": "High" | "Medium" | "Low",
    "Stage": "MVP" | "Thoven 1.5" | "Thoven 2.0" | "Thoven 2.5",
    "Notes": "Additional context"
  }
```

### Create a Sprint
```
notion-create-pages with:
- parent: {type: "data_source_id", data_source_id: "3f437e88-0a75-477a-ba04-b47e8b86370a"}
- properties: {
    "Sprint": "Sprint Name",
    "Status": "Active" | "Completed" | "Upcoming",
    "Focus": "Sprint focus description",
    "date:Dates:start": "2026-01-20",
    "date:Dates:end": "2026-02-03",
    "date:Dates:is_datetime": 0
  }
```

### Log a Feature Request
```
notion-create-pages with:
- parent: {type: "data_source_id", data_source_id: "f0020b2a-a064-4518-a70f-4eff80d69913"}
- properties: {
    "Feature / Initiative Name": "Feature name",
    "Impact": "High" | "Medium" | "Low",
    "Effort": "High" | "Medium" | "Low",
    "Status": "Not Started" | "In Progress" | "Shipped",
    "Stage": "MVP" | "Thoven 1.5" | "Thoven 2.0" | "Thoven 2.5",
    "Notes": "Feature description and context"
  }
```

### Log a Bug
```
notion-create-pages with:
- parent: {type: "data_source_id", data_source_id: "26a6c461-0760-8092-9c7a-000ba3008d92"}
- properties: {
    "Title": "Bug title",
    "Severity": "Critical" | "High" | "Medium" | "Low",
    "Status": "Reported",
    "Reported By": "Beta Teacher" | "Parent" | "Student" | "Internal" | "Other",
    "date:Date Reported:start": "2026-01-26",
    "date:Date Reported:is_datetime": 0,
    "Notes": "Bug description and reproduction steps"
  }
```

See `references/notion-syntax-guide.md` for more examples.

## References

- `references/notion-syntax-guide.md` – Notion API parameter formats
- `references/thoven-patterns.md` – Workspace organization patterns
- `references/anti-patterns.md` – Common mistakes to avoid
- Notion guide (workspace root): `Agent Knowledge/Guides/notion-guide.md`
