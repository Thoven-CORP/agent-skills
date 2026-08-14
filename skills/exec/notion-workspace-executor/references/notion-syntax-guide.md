# Notion API Syntax Guide

Quick reference for Notion MCP tool parameters. Full docs: https://github.com/makenotion/notion-mcp-server

## Create Pages

### Create Under a Regular Page
```json
{
  "parent": {"type": "page_id", "page_id": "parent-page-uuid"},
  "pages": [
    {
      "properties": {"title": "Page Name"},
      "content": "# Heading\n\nContent here"
    }
  ]
}
```

### Create Under a Database (Data Source)
```json
{
  "parent": {"type": "data_source_id", "data_source_id": "data-source-uuid"},
  "pages": [
    {
      "properties": {
        "Title Field Name": "Entry Name",
        "Status": "Active",
        "Priority": 1,
        "date:Due Date:start": "2026-01-20",
        "date:Due Date:is_datetime": 0
      }
    }
  ]
}
```

### Key Rules
- `parent` is required (page_id OR data_source_id, not both)
- Property names must match database schema exactly
- Date format: `"date:[PropertyName]:start"` for single date, add `":end"` for range
- Boolean dates: `":is_datetime": 0` for date-only, `1` for date+time
- Special properties: Use `"userDefined:"` prefix for custom fields named "id" or "url"

## Move Pages

```json
{
  "page_or_database_ids": ["page-uuid-1", "page-uuid-2"],
  "new_parent": {"type": "page_id", "page_id": "new-parent-uuid"}
}
```

Or to move under a Teamspace (use data_source_id):
```json
{
  "page_or_database_ids": ["page-uuid"],
  "new_parent": {"type": "data_source_id", "data_source_id": "teamspace-uuid"}
}
```

## Update Pages

### Update Properties
```json
{
  "page_id": "page-uuid",
  "command": "update_properties",
  "properties": {
    "Status": "In Progress",
    "Priority": 2
  }
}
```

### Update Content
```json
{
  "page_id": "page-uuid",
  "command": "replace_content",
  "new_str": "# New Content\n\nReplaces all existing content"
}
```

### Insert After Specific Text
```json
{
  "page_id": "page-uuid",
  "command": "insert_content_after",
  "selection_with_ellipsis": "## Section heading...",
  "new_str": "\n## New Section\nNew content"
}
```

## Search & Fetch

### Search for Pages
```
notion-search with query: "search term"
Returns file paths you can pass to notion-fetch
```

### Fetch a Page by ID
```
notion-fetch with id: "page-uuid" or "page-uuid-with-dashes"
or
notion-fetch with id: "https://www.notion.so/page-title-uuid"
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using page title instead of ID | Always use UUID, not page name |
| Missing `parent` object structure | Must be `{type: "...", page_id/data_source_id: "..."}` |
| Wrong property name | Match exact field name from database schema |
| Date format `"2026-01-20T00:00"` | Use `"2026-01-20"` and `is_datetime: 0` separately |
| Creating under wrong Teamspace | Verify `data_source_id` is for correct Teamspace |

## Links in Notion Content

For markdown links in page content:
```
[Link Text](https://www.notion.so/page-title-page-uuid)
```

NOT:
```
[Link Text]({{https://www.notion.so/page-id}})  ← WRONG: double braces
[Link Text](page-id)  ← WRONG: no URL format
```

Test links after creating pages to ensure they work.
