# Thoven Notion Organization Patterns

Workspace organization conventions and patterns specific to Thoven's setup.

## Workspace Structure

**Main Workspace:** `Thoven Home`
- Root level for company-wide pages
- Contains Product Home, Sprint List, Tasks Database, LinkedIn Post Tracker

**Teamspaces:** Separate, dedicated spaces for different functions
- **Go-To-Market Teamspace** – Marketing, email strategies, campaigns (where "Mom Influencer Campaign Hub" lives)
- **Product Strategy Hub** – Product planning (in main workspace)
- **Product Development Hub** – Dev tasks, technical work (in Product Home)
- Teamspaces are NOT accessed via parent URL; they're separate organizational units

## Key Organization Rules

### 1. Notion Guide Reference
- Primary reference: `Agent Knowledge/Guides/notion-guide.md`
- Lists all key databases with IDs, schemas, parent relationships
- If something isn't in the guide, it might be new—ask before creating duplicates

### 2. Databases vs. Regular Pages
- **Databases** (like Dev Tracker, Sprint List, Tasks, LinkedIn Post Tracker) have structured schemas
- **Regular pages** (like Email Strategy Master Reference) are unstructured content with optional links
- When creating: confirm if it should be a database entry or a standalone page

### 3. Email Strategy Organization Pattern
From recent work (2026-01-20):
- **Master reference page** = navigation hub with links to detailed strategies
- **Detailed strategy pages** = one page per sequence (Lead Magnet Nurture, Signup → Booking, etc.)
- **Location**: Go-To-Market Teamspace, under "Signup → Booking Email Strategies" parent
- **Link format**: `[Link Text](https://www.notion.so/Page-Title-page-uuid)`
- **Test links after creation** to ensure they work

### 4. Go-To-Market Teamspace Pattern
- Similar to main workspace but for marketing/GTM
- Pages like "Mom Influencer Campaign Hub" live at root level
- New email strategies nest under relevant parent pages (e.g., under "Signup → Booking Email Strategies")
- Same hierarchy principles as main workspace—respect parent-child relationships

### 5. Dev Tracker Pattern (Engineering)
- **Database**: Dev Tracker under Product Development Hub
- **Fields to always set**: Epic (groups by sprint), Status (workflow stage), Priority (High/Medium/Low)
- **Epic values** = sprints (e.g., "Thovie Rollout Sprint")
- **Example**: Creating a task for Thovie rollout → Epic="Thovie Rollout Sprint", Status="Mockup/Documentation", Priority="Medium"

## When to Create New Pages vs. Database Entries

| Scenario | Type | Where |
|----------|------|-------|
| Strategic document (email strategy, roadmap) | Regular page | Appropriate Teamspace or Product Strategy Hub |
| Engineering task or feature | Database entry | Dev Tracker (under Product Development Hub) |
| Marketing campaign hub | Regular page | Go-To-Market Teamspace |
| General task/todo | Database entry | Tasks Database (main workspace) |
| Sprint overview | Database entry | Sprint List (main workspace) |
| Personal tracking | Database entry | Relevant tracker (LinkedIn Post Tracker, etc.) |

## Common Thoven Patterns to Follow

### Pattern: Master Reference + Detailed Pages
**When to use**: Complex strategies with multiple components
**Structure**:
```
Master Reference Page (navigation hub)
├── Deep Dive 1 (specific strategy)
├── Deep Dive 2 (specific strategy)
└── Deep Dive 3 (specific strategy)
```
**Example**: Email Strategy Master Reference → Lead Magnet, Signup→Booking, etc.

### Pattern: Database with Kanban View
**When to use**: Workflows with multiple stages
**Common**: Dev Tracker (Status column) has Kanban view

### Pattern: Nested Page Hierarchies
**When to use**: Organizing related content
**Example**: Go-To-Market Teamspace → Email Strategies → specific campaigns

## Properties to Always Consider

### For Email Strategy Pages
- Keep links to detailed sequences
- Use consistent naming (e.g., "Email Sequence - [Type]")
- Link back to master reference from detail pages

### For Database Entries
- Always set the Title/Name field (required)
- Fill Epic or Category field (helps with organization)
- Set Status appropriately for the workflow
- Use Priority to rank importance

## Linking Between Pages

**DO:**
```markdown
[Email Strategy Master Reference](https://www.notion.so/Email-Strategy-Master-Reference-page-uuid)
```

**DO NOT:**
```markdown
[Link](page-uuid)  ← missing URL format
[Link]({{https://www.notion.so/page-id}})  ← double braces, syntax error
[Link](../relative/path)  ← relative links don't work in Notion
```

**Testing links**: After creating pages with links, click them from Notion to verify they work.

## Workspace Structure Hierarchy

```
Thoven Home (main workspace)
├── Product Home
│   ├── Product Development Hub
│   │   └── Dev Tracker (database) ← Engineering kanban
│   └── Product Strategy Hub
├── Sprint List (database) ← Sprint planning
├── Tasks Database ← General tasks
└── LinkedIn Post Tracker (database) ← Personal tracking

Go-To-Market Teamspace (separate organization)
├── Mom Influencer Campaign Hub
└── Signup → Booking Email Strategies (parent page)
    └── Email Strategy Master Reference (and other email pages)
```

Remember: Teamspaces are separate—they don't have URLs in the hierarchy visualization. Treat them as distinct organizational units.
