# Changelog Format Reference

Detailed formatting guidelines for CHANGELOG.md entries.

---

## File Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased] - Not Published

### Added
- entries...

### Changed
- entries...

### Fixed
- entries...

---

## [1.0.17] - 2026-01-08 - Published

### Added
- entries...

---

## [1.0.16] - 2026-01-07 - Published
...
```

---

## Version Header Format

```markdown
## [X.X.X] - YYYY-MM-DD - Published
```

- **Version**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Date**: ISO format (YYYY-MM-DD)
- **Status**: `Published` or `Not Published`

---

## Categories

Use these categories in order:

| Category | When to Use |
|----------|-------------|
| `### Added` | New features, pages, components, API functions |
| `### Changed` | Modifications to existing features, renamed items, behavior changes |
| `### Fixed` | Bug fixes |
| `### Security` | Security improvements, accessibility compliance |
| `### Deprecated` | Features marked for future removal |
| `### Removed` | Deleted features |

Only include categories that have entries.

---

## Entry Format

### Standard Entry

```markdown
- **Feature Name** - Brief description
  - Detail 1
  - Detail 2
  - File: `path/to/file.tsx`
```

### Complex Entry (Multiple Files)

```markdown
- **Feature Name** - Brief description of what was added/changed
  - Sub-feature or detail 1
  - Sub-feature or detail 2
  - Technical note if relevant
  - Files: `file1.tsx`, `file2.ts`, `file3.tsx`
```

### Bug Fix Entry

```markdown
- **Bug Name** - Fixed [symptom description]
  - Root cause: [why it happened]
  - Solution: [how it was fixed]
  - File: `path/to/file.tsx`
```

---

## Examples from Project

### Added - New Feature

```markdown
- **Debug Skill** - Systematic debugging workflow with approval gates
  - 3-phase workflow: Investigate → Diagnose → Execute (with mandatory approval gate)
  - Integrates debug-specialist and code-explorer agents
  - Pre-seeded common-errors.md with 15+ error patterns
  - Files: `.claude/skills/debug/`
```

### Fixed - Bug Fix

```markdown
- **Meta Pixel Not Loading** - Fixed two critical bugs preventing pixel initialization
  - Bug 1: `initMetaPixel()` had guard that skipped init when `fbevents.js` loaded first
  - Bug 2: `isMetaPixelEnabled()` used server-side env var not available on client
  - Solution: Simplified to enable pixel whenever valid Pixel ID is configured
  - File: `lib/meta-pixel/pixel-core.ts`
```

### Changed - Modification

```markdown
- **Parent Signup Panel Thoven Redesign** - Complete UI overhaul for design consistency
  - Migrated icons from Lucide React to Phosphor icons
  - Updated buttons to Thoven 3D style with shadow animations
  - Redesigned step headers: icon + title side-by-side
  - File: `components/parent-signup-floating-panel.tsx`
```

---

## Version Increment Rules

| Change Type | Increment | Example |
|-------------|-----------|---------|
| Bug fixes, minor tweaks | Patch | 1.0.16 → 1.0.17 |
| New features (backward compatible) | Minor | 1.0.16 → 1.1.0 |
| Breaking changes | Major | 1.0.16 → 2.0.0 |

---

## Separator Rules

- Add `---` after each version section
- Add `---` after `[Unreleased]` section (even if empty)

---

## Common Mistakes to Avoid

1. **Missing file references** - Always include affected files
2. **Vague descriptions** - Be specific about what changed
3. **Wrong category** - "Added" is new, "Changed" is modification, "Fixed" is bug
4. **No root cause for fixes** - Explain why, not just what
5. **Forgetting Co-Authored-By** - Required in all commits
