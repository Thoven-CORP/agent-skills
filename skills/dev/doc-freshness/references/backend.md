# Doc Freshness — Audit Then Fix

## Critical Guidelines

You MUST audit before fixing. You MUST get approval before changing any doc. You MUST verify changes against live code, not memory.

## Overview

Detect stale documentation across all tiers, report findings with severity and evidence, then update approved docs by reading current source code. Never guess what changed — always diff against the actual codebase.

## Workflow

```
AUDIT → REPORT → APPROVE → FIX → VERIFY
```

### Phase 1: Audit

Run detection across all four tiers. Read `references/doc-registry.md` for the complete mapping of docs to source code dependencies.

**Detection strategies (combine all three):**

1. **Git distance** — count commits between doc's last update and its watched code dirs:
   ```bash
   DOC_COMMIT=$(git log -1 --format=%H -- <doc_path>)
   CODE_COMMIT=$(git log -1 --format=%H -- <code_paths>)
   git rev-list --count $DOC_COMMIT..$CODE_COMMIT
   ```

2. **Content verification** — for critical docs, cross-check doc content against live code:
   - API_ROUTES.md: run `rails routes --expanded` and diff against documented routes
   - ARCHITECTURE.md: check `db/schema.rb` for tables/columns not in doc
   - BACKGROUND_JOBS.md: scan `app/jobs/**/*.rb` and `app/mailers/**/*.rb` for undocumented classes
   - DATA_MODEL.md: compare documented schema against `db/schema.rb`

3. **Semantic check** — read recent git log for the watched dirs and check if changes are doc-worthy:
   ```bash
   git log --oneline <DOC_COMMIT>..HEAD -- <code_paths>
   ```
   Filter out pure refactors, test-only changes, and whitespace commits.

**Severity levels:**

| Severity | Criteria | Action |
|----------|----------|--------|
| **CRITICAL** | 10+ commits behind OR content verification finds missing items | Must fix now |
| **WARNING** | 3-9 commits behind OR minor content gaps | Should fix |
| **INFO** | 1-2 commits behind, changes are cosmetic/refactor | Note only |

### Phase 2: Report

Present findings as a structured report. Group by severity, show evidence.

```
## Doc Freshness Audit — YYYY-MM-DD

### CRITICAL (must fix)
- API_ROUTES.md — 12 commits behind (controllers changed)
  Evidence: 3 new endpoints not documented (POST /api/v1/foo, ...)

### WARNING (should fix)
- BACKGROUND_JOBS.md — 5 commits behind (jobs/mailers changed)
  Evidence: NewFeatureJob added, not in doc

### INFO (note only)
- DEPLOYMENT.md — 1 commit behind (Procfile whitespace change)

### Up to date
- ARCHITECTURE.md, COMMON_ERRORS.md
```

**STOP HERE. Wait for user to select which docs to update.**

### Phase 3: Fix (with approval)

For each approved doc:

1. **Read the current doc** — full content, understand structure and voice
2. **Read the source code** that changed — the actual files, not git summaries
3. **Draft updates** — match existing doc style, voice, and structure
4. **Show diff to user** — present what will change before applying
5. **Apply on approval** — use Edit tool for surgical updates, not full rewrites

**Per-doc update strategies** are in `references/doc-registry.md` — read that file before updating any doc.

**Rules for updates:**
- Match the existing doc's formatting, heading style, and level of detail
- Add new content near related existing content (don't append everything at the bottom)
- Remove documented items that no longer exist in code
- Update counts, table sizes, and summary numbers (e.g., "98 tables" → "101 tables")
- Never remove historical context or architectural decision records unless the decision was reversed

### Phase 4: Verify

After all updates:
1. Re-run the git distance check — doc should now be at HEAD
2. Re-run content verification for any critical-tier doc that was updated
3. Report final status

## Scoping Options

When invoked, ask the user which scope to run:

| Scope | What it covers |
|-------|---------------|
| **quick** | Tier 1 only (5 critical docs in `.claude/docs/`) |
| **standard** | Tier 1 + Tier 2 (+ reference docs, CLAUDE.md) |
| **full** | All 4 tiers including feature docs and architecture |
| **targeted** | Specific doc or directory the user names |

Default to **standard** unless user specifies otherwise.

## After /publish or /ship

When this skill runs post-release, also:
- Update CHANGELOG.md version references if they mention doc sections
- Check if CLAUDE.md Quick Reference numbers are still accurate (table counts, route counts, job counts)
- Verify the session startup hook mappings still cover all critical docs

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Updating docs from memory instead of reading code | Always `Read` the source files before writing doc updates |
| Rewriting entire doc when only a section changed | Use `Edit` for surgical updates to specific sections |
| Missing new files added since last doc update | Use `Glob` to find all files in watched dirs, not just changed ones |
| Forgetting to update summary counts | After content changes, search for "N tables", "N routes", etc. and update |
| Not checking CLAUDE.md after updating .claude/docs/ | CLAUDE.md references these docs — verify cross-references still hold |

## Resources

- **Doc Registry**: `references/doc-registry.md` — complete mapping of all tracked docs to source dependencies and update strategies
- **Existing hooks**: `.claude/hooks/session-context.js` (startup audit), `.claude/hooks/doc-staleness-nudge.js` (real-time nudge)
