# Frontend Handover — Sub-Agent Prompt Templates

This file contains the full prompt templates for all sub-agent dispatches used by the frontend handover skill. Each template is referenced from the main [SKILL.md](../SKILL.md) workflow.

---

## Table of Contents

- [Code Explorer Analysis](#code-explorer-analysis) — Phase 1, Step 2
- [Architecture Team: Architect](#architecture-team-architect) — Phase 2, Step 3
- [Architecture Team: Reviewer](#architecture-team-reviewer) — Phase 2, Step 3
- [Final Code Reviewer](#final-code-reviewer) — Phase 5, Step 7

---

## Code Explorer Analysis

**Phase:** 1 — Brainstorm & Explore
**Step:** 2 — Explore the existing frontend codebase
**Subagent type:** `feature-dev:code-explorer`
**Dispatch method:** Task tool

```
Deeply analyze the existing frontend codebase. Discover and document:
  - Framework and component library
  - State management pattern
  - Existing auth flow and JWT handling
  - Route structure
  - Design system / tokens / existing component library
  - API client pattern
  - Existing dashboard and admin components that can be reused
  - The signup form and where new params would be injected
  Report all findings with file paths.
```

---

## Architecture Team: Architect

**Phase:** 2 — Architecture & Design
**Step:** 3 — Spin up an agent team for architecture debate
**Subagent type:** `feature-dev:code-architect`
**Team name:** `[feature]-frontend-architecture`
**Teammate name:** `architect`
**Dispatch method:** Task tool via TeamCreate

```
Using the brainstorming decisions and codebase exploration findings,
  design the complete frontend architecture:
  - Component tree for each page/view (components, props, data flow)
  - Route plan (new routes, where they go in the router config)
  - State management plan (new contexts/stores, how data flows)
  - API integration plan (hooks/services to create, caching strategy)
  - File creation plan (exact files to create, directory placement)
  - Build sequence (dependencies, what to build first -> last)
  Follow the existing codebase patterns from the code-explorer findings.
```

---

## Architecture Team: Reviewer

**Phase:** 2 — Architecture & Design
**Step:** 3 — Spin up an agent team for architecture debate
**Subagent type:** `feature-dev:code-reviewer`
**Team name:** `[feature]-frontend-architecture`
**Teammate name:** `reviewer`
**Dispatch method:** Task tool via TeamCreate

```
Review the architect's output for:
  - Consistency with existing codebase patterns
  - Component reuse opportunities missed
  - Over-engineering or unnecessary abstractions
  - Missing error/loading states
  - Accessibility concerns
  Provide: APPROVED / NEEDS REVISION with specific items.
```

---

## Final Code Reviewer

**Phase:** 5 — Review
**Step:** 7 — Verify and review
**Subagent type:** `feature-dev:code-reviewer`
**Dispatch method:** Task tool

```
Review all code written for the [feature] frontend.
  Check for:
  - Adherence to existing codebase conventions
  - Component quality and reusability
  - Error handling and loading states
  - Accessibility
  - API error handling (401, 403, 404, 422)
  - No hardcoded values that should come from API
  Provide: APPROVED / NEEDS CHANGES with specific items.
```
