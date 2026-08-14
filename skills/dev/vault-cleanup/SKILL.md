---
name: vault-cleanup
description: Archive old files from Obsidian vault Active folders. Use for monthly vault maintenance or when user says "clean up vault", "archive old files", or requests vault organization
---

# Vault Cleanup & Archival

Monthly maintenance for `/Users/andresmartinez/Vaults/Executive Assistant/` - moves stale files from Active/ to Archive/ folders.

## Vault Structure

```
Research/[Category]/Active/     → Archive/
PRD's & Technical Specs/[Category]/Active/  → Archive/
Prompts/[Category]/Active/      → Archive/
```

Categories: Technical, Marketing, Legal, Product, Strategic (Research) | Growth, Core Product, Infrastructure, Analytics (PRD's) | Backend Pre-Implementation, Frontend Build, Analytics & Testing, Templates (Prompts)

## Archival Criteria

**60-day rule**: Files untouched 60+ days → Archive
**Project completion**: Shipped features, completed research, made decisions → Archive

**Exceptions** (never archive):
- `README*.md`, `*Quick Reference*.md`, `*INDEX*.md`
- Files with `[PAUSED]` prefix

## Workflow

1. **Scan**: Find files in Active/ folders older than 60 days using `find -path "*/Active/*.md" -mtime +60`
2. **Report**: Present table with Category, File, Days Old, Recommendation
3. **Execute**: For each approved file:
   - Add year prefix if missing: `Topic.md` → `2026-Topic.md`
   - Move to Category/Archive/
4. **Summarize**: Report total archived by category

## Output Format

```markdown
## Vault Archival Report - [Date]

| Category | File | Days Old | Action |
|----------|------|----------|--------|
| Research/Technical | file.md | 75 | Archive |

**Total**: X files | Research (Y) | PRD's (Z) | Prompts (W)

Ready to proceed?
```

After archival: "Archived X files. Research/Active: 60 files (was 74)."

---

Archival rules detailed in `/Users/andresmartinez/Vaults/Executive Assistant/CLAUDE.md`
