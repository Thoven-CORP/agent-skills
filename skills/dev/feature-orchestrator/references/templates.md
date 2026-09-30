# Feature Orchestrator Templates

Templates for planning artifacts produced by the feature orchestrator. Read this file when entering Phase 4 (Design Documentation & Task Breakdown).

## Contents
- Master Plan template (00_MASTER_PLAN.md)
- Task file template (tasks/TASK_XX.md)
- Component Architecture template (COMPONENT_ARCHITECTURE.md)
- Status Tracker template (01_IMPLEMENTATION_STATUS.md)
- Reuse Audit template (REUSE_AUDIT.md)

---

## Master Plan Template (00_MASTER_PLAN.md)

Write to `docs/[Feature_Name]/00_MASTER_PLAN.md`:

```markdown
# [Feature Name] - Master Plan
**Feature:** [One-line description]
**Version:** 1.0
**Last Updated:** YYYY-MM-DD
**Status:** Planning Complete
**Tier:** [Lite/Standard/Full/Team]

---

## Business Requirements
- **What:** [Feature description]
- **Who:** [Target user role]
- **When:** [Usage context]
- **Why:** [Business justification]

### User Workflows
[Happy path description or ASCII diagram]

### Edge Cases
[List with responsive, accessibility, auth boundary considerations]

## Architecture Overview
[From Phase 3 — decisions table, rationale, component hierarchy]

### State Management
**Decision:** [Context / Redux / Local / URL params]
**Rationale:** [Why]

### Component Hierarchy
[Tree diagram with exact file paths]

## Global Constraints (binding every task)
Rules that apply uniformly across all tasks. Copy these verbatim into each task file so they reach implementers and reviewers downstream — don't assume a subagent seeing only its own task will infer them.
- **Colors:** amber-500 (Thoven Orange), never orange-500
- **Typography:** font-display (Fredoka) for h1/h2 only; font-sans (Montserrat) everywhere else
- **Version floors:** [e.g. Next 14.2, React 18 — any that bind the feature]
- **Naming / copy:** [exact route names, localStorage keys, copy strings that must match across tasks]
- **Exact values:** [any literal that must be identical wherever it appears]

## Reuse Summary
[From Phase 2 — what's reused, what's new, justifications]

## Design System Compliance
- Colors: amber-500 (Thoven Orange), NOT orange-500
- Typography: font-display (Fredoka) headers only, font-sans (Montserrat) everything else
- Buttons: 3D style, NO borders
- Responsive: mobile-first, breakpoints sm/md/lg
- Accessibility: WCAG 2.1 AA

## Implementation Tasks
[Task summary table]

## Success Criteria
- [ ] Components < 300 lines
- [ ] Test coverage > 90%
- [ ] WCAG 2.1 AA compliance
- [ ] Design system adherence
- [ ] TypeScript strict passes
- [ ] ESLint 0 warnings
```

---

## Task File Template (tasks/TASK_XX.md)

Each task follows bite-sized granularity from `superpowers:writing-plans`.

**Sizing:** 30min - 2.5hr per task. If > 2.5hr, split. If < 20min, combine.

**Categories:**

| Category | Typical Duration | Examples |
|----------|-----------------|----------|
| UI Component | 30min-2hr | Button, Card, Modal, Panel |
| Container/Page | 1-2.5hr | Dashboard page, settings page |
| Custom Hook | 15min-1hr | useAuth, useFetch |
| API Integration | 30min-1.5hr | Fetch wrapper, error handling |
| State Management | 30min-1.5hr | Context provider, Redux slice |
| Testing | 1-2hr | Component tests, hook tests |

**Template:**

```markdown
# Task XX: [Component/Feature Name]

**Duration:** [estimated time]
**Dependencies:** [Task IDs that must complete first]
**Files:**
- Create: `exact/path/to/new-file.tsx`
- Modify: `exact/path/to/existing.tsx` (lines ~XX-YY)
- Test: `__tests__/exact/path/to/test.tsx`
- Reuse: `components/ui/existing-component.tsx` (from REUSE_AUDIT)

**Acceptance Criteria:**
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]
- [ ] TypeScript strict passes
- [ ] Component < 300 lines

**Interfaces:**
- **Consumes:** [props / types / functions this task depends on — from earlier tasks or existing code, with exact names]
- **Produces:** [exported components / hooks / types / functions downstream tasks will import, with exact names]

**Steps (TDD where applicable):**

### Step 1: Write failing test
[Exact test code with file path]

### Step 2: Run test to verify failure
Run: `pnpm run test __tests__/path/test.tsx`
Expected: FAIL

### Step 3: Implement minimal code
[What to build, referencing reuse audit items, exact file paths]

### Step 4: Run test to verify pass
Run: `pnpm run test __tests__/path/test.tsx`
Expected: PASS

### Step 5: Commit
```

**Task dependency phases:**

| Phase | Tasks | Depends On |
|-------|-------|------------|
| Phase 1: Types & API | Types, API layer | Nothing |
| Phase 2: Core Components | UI components | Phase 1 |
| Phase 3: Container/Pages | Page components | Phase 2 |
| Phase 4: Testing | Integration tests | Phase 3 |
| Phase 5: Polish | A11y, responsive, perf | Phase 4 |

---

## Component Architecture Template (COMPONENT_ARCHITECTURE.md)

For Standard+ tiers:

```markdown
# Component Architecture - [Feature Name]

## Component Tree
[Tree diagram with exact file paths and line count targets]

## Props Interfaces
[Key interfaces with TypeScript definitions]

## State Flow
[Which state lives where: Context, Redux, local, URL params]

## Data Flow
API → hook/context → component → UI
[Diagram showing data fetching and rendering pipeline]
```

---

## Status Tracker Template (01_IMPLEMENTATION_STATUS.md)

Initialize with all tasks as "Not Started":

```markdown
# Implementation Status - [Feature]

| Task | Description | Status | Duration (est) | Duration (actual) |
|------|-------------|--------|----------------|-------------------|
| 01 | [name] | Not Started | 1.5hr | - |
| 02 | [name] | Not Started | 1hr | - |

## Progress by Phase
- Phase 1 (Types & API): 0%
- Phase 2 (Core Components): 0%
- Phase 3 (Container/Pages): 0%
- Phase 4 (Testing): 0%
- Phase 5 (Polish): 0%

## Blockers
None
```

---

## Reuse Audit Template (REUSE_AUDIT.md)

See `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` for the full template. Key sections:

```markdown
# Code Reuse Audit - [Feature Name]
**Date:** YYYY-MM-DD

## Can Reuse As-Is
| Component | Location | Why Suitable |
|-----------|----------|--------------|

## Can Extend/Modify
| Component | Location | Modifications Needed |
|-----------|----------|---------------------|

## Similar But Not Suitable
| Component | Location | Why Not Suitable |
|-----------|----------|-----------------|

## New Code Required
| Item | Justification | Nearest Existing |
|------|--------------|------------------|

## Audit Summary
- Total Reviewed: X
- Reuse: X | Extend: X | New: X (with justification)
```

---

## Current Status Template (CURRENT_STATUS.md)

Initialize at planning time, update during execution:

```markdown
# Current Status — [Feature Name]
**Date:** YYYY-MM-DD
**Phase:** Planning Complete
**Current Task:** None (not yet started)

## Progress Today
- [x] Planning complete — all docs created

## Blockers
- None / [Description]

## Next Steps
1. [First task to execute]

## Notes
[Any important context for the next session]
```

---

## Frontend Integration Guide Template (FRONTEND_INTEGRATION_GUIDE.md)

Create as a stub during planning. Populated as components are built:

```markdown
# Frontend Integration Guide — [Feature Name]
**Status:** Stub (populated during implementation)
**Procedure:** Follow `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`

## Quick Start
[How to enable/disable feature, key imports]

## Feature Flag
[Flag name, env var, default behavior]

## API Module
[Function signatures, parameters, return types — filled when API module is built]

## TypeScript Types
[Exported types — filled when types are defined]

## Components
[Per-component: props, states, usage examples — filled as each component is built]

## Error Handling
[Error class, status codes, patterns — filled when API module is built]

## Testing
[Test file locations, run commands, mock patterns — filled as tests are written]

## Architecture Notes
[Key design decisions that affect usage — from master plan]
```
