# Thoven Notion Anti-Patterns & Mistakes to Avoid

Documented mistakes and lessons from workspace management work.

## Critical Mistakes (Learned 2026-01-20)

### ❌ Anti-Pattern 1: Wrong Teamspace Destination
**What happened**: Moved Email Strategy Master Reference to "Product Strategy Hub" instead of "Go-To-Market Teamspace"

**Error message**: "why the fuck did you do product strategy i wanted under the Go to Market teamspace"

**Root cause**: Confused Product Strategy Hub (within main workspace) with Go-To-Market Teamspace (separate organizational unit)

**Prevention**:
- Always ask: "Which Teamspace?" before moving/creating pages
- Remember: Teamspaces are separate from workspace hierarchy
- Confirm destination explicitly in safety gate
- Reference the workspace structure diagram in `thoven-patterns.md`

---

### ❌ Anti-Pattern 2: Broken Links in Created Pages
**What happened**: Created links with incorrect syntax that returned 404 errors

**Examples of broken formats**:
```
[Text]({{https://www.notion.so/page-id}})  ← double braces syntax error
[Text](notion.so/page-id)  ← missing https://
[Text](page-id)  ← no URL format at all
```

**Prevention**:
- Use proper format: `[Text](https://www.notion.so/Page-Title-page-uuid)`
- Always test links after creation by clicking from Notion
- If a link returns 404, the syntax is likely wrong

---

### ❌ Anti-Pattern 3: Wrong Page ID References
**What happened**: Lead Magnet Nurture link pointed to wrong page; Signup→Booking link pointed to a page named "FINAL" instead of the actual email strategy page

**Root cause**: Copied old/stale links without verifying they pointed to correct pages

**Prevention**:
- Fetch the page you're linking to; copy the ID from the URL
- Verify page titles match what you intend to link to
- Test all links after creation
- Use search to find the correct page if unsure

---

## Common Pattern Mistakes

### ❌ Anti-Pattern 4: Re-Designing Already-Settled Decisions
**Error message**: "we literally just fucking discussed the formats"

**What it means**: Don't ask clarifying questions about structure/content if it's already been decided

**Prevention**:
- Ask: "Has this been decided already?"
- If user responds with "yes" or provides specific details, proceed with execution
- Skip the clarification step if user says "I already know how I want this organized"
- Only ask clarifying questions if the decision is genuinely ambiguous

---

### ❌ Anti-Pattern 5: Creating Duplicate Pages
**What happens**: Create a new page that already exists elsewhere in workspace

**Prevention**:
- Always search Notion first before creating
- Check if similar pages exist in related Teamspaces
- Ask: "Should this be a new page or a modification of existing page X?"

---

### ❌ Anti-Pattern 6: Inconsistent Naming/Organization
**What happens**: New pages don't follow existing naming patterns or organizational structure

**Example**: Creating "Email - Signup Flow" when existing pattern is "Email Sequence - [Type]"

**Prevention**:
- Check existing pages in same area for naming patterns
- Follow the organizational pattern established
- If establishing new pattern, document it in notion-guide.md

---

## Notion Syntax Mistakes

### ❌ Anti-Pattern 7: Wrong Parent Structure
```json
// WRONG
{
  "parent": "page-uuid"  ← should be object with type + id
}

// CORRECT
{
  "parent": {"type": "page_id", "page_id": "page-uuid"}
}
```

---

### ❌ Anti-Pattern 8: Creating in Wrong Database
**What happens**: Create entry in Tasks Database when it should go in Dev Tracker

**Prevention**:
- Understand the database schema before creating
- Confirm: "Is this a dev task (Dev Tracker), general task (Tasks DB), or strategic page (regular page)?"
- Reference `notion-guide.md` for which database to use

---

### ❌ Anti-Pattern 9: Missing Required Properties
**What happens**: Create database entry without setting required fields (Title, Status, Epic)

**Prevention**:
- Always check database schema
- Set at minimum: Title/Name, Status, and any categorization field (Epic, Priority, etc.)
- Example for Dev Tracker: Feature/Item (title), Epic, Status, Priority

---

## Safety Procedure Mistakes

### ❌ Anti-Pattern 10: Skipping Safety Gate
**What it is**: Executing without confirming what you're about to do

**Why it happens**: Feels inefficient, but prevents the big mistakes

**Prevention**:
- ALWAYS use the safety gate
- Describe: what you're creating, where you're putting it, what links you're making
- Wait for confirmation before executing
- If user says "that's wrong," stop and don't execute

---

## Verification Mistakes

### ❌ Anti-Pattern 11: Not Testing After Creation
**What happens**: Create pages/links but don't verify they work

**Prevention**:
- After creating pages: check navigation to confirm they're accessible
- After creating links: click links from Notion to verify they work
- For databases: confirm properties are set correctly
- Screenshot or describe what was created so user can visually verify

---

## Documentation Mistakes

### ❌ Anti-Pattern 12: Not Updating notion-guide.md
**What happens**: Create new database or establish new pattern but don't document it

**Impact**: Next time, same confusion happens because the guide is outdated

**Prevention**:
- After creating new database: update notion-guide.md
- After establishing new pattern: document in thoven-patterns.md
- Always update "Last Updated" date
- Ask user: "Should I add this to the guide for future reference?"

---

## Quick Checklist: Avoid These

- [ ] Confirmed correct Teamspace before creating/moving
- [ ] Used proper link syntax with full URL
- [ ] Searched first to avoid duplicates
- [ ] Used safety gate before executing
- [ ] Tested links/navigation after creation
- [ ] Updated notion-guide.md if creating new database/pattern
- [ ] Following existing naming/organizational patterns
- [ ] All required fields filled in database entries

---

## When in Doubt

**Safety over speed:** Use the safety gate. Wait for confirmation.

**Search first:** Before creating anything, check if it exists.

**Verify thoroughly:** Test every link, check navigation, describe what you created.

**Update the guide:** If you create something new or learn something new, document it.

**Ask clarifying questions:** If destination/structure is ambiguous, confirm before executing.
