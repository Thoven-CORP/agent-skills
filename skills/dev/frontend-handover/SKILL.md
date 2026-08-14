---
name: frontend-handover
description: Use when handing over a completed backend feature to the frontend for implementation. Triggers on "handover", "frontend handover", "hand over to frontend", "frontend implementation", "build the frontend". Orchestrates brainstorming, architecture, and implementation using agent teams, gate-checked task lists, Thoven frontend skills, and subagents.
---

# Frontend Handover

## Overview

Orchestrate the handover of a completed backend feature to a frontend Claude Code session. Produces a self-contained handover prompt that the receiving frontend agent uses to brainstorm, design, plan, and build — invoking the correct skills, subagents, and agent teams at each phase with gates that block progression until approved.

**REQUIRED PROTOCOL:** Follow `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` for all documentation structure, task breakdown, and status tracking.

---

## What YOU (the backend agent) Produce

Generate a handover document at `docs/implementation/frontend/[feature-name]/FRONTEND_HANDOVER_PROMPT.md` containing:

1. **Business context** — What the feature is, who it's for, why, key user stories
2. **What the backend built** — Architecture summary, key decisions (no source code)
3. **Complete API contract** — Every endpoint with exact request/response JSON, field types, error codes
4. **Frontend responsibilities** — What the backend expects the frontend to handle
5. **Original spec vision** — High-level product goals from the original spec
6. **Design questions** — Questions for the user to answer during brainstorming
7. **The agent orchestration workflow below** — Copy it verbatim into the handover

---

## Agent Orchestration Workflow

**Embed this entire section in the handover prompt. This is what the frontend agent executes.**

---

### FIRST ACTION: Create Gate Checklist

Immediately use `TaskCreate` for each gate. No gate can be skipped. Each must be marked completed via `TaskUpdate` before the next phase begins.

```
TaskCreate: "GATE 1: Brainstorming complete — user approved design direction"
TaskCreate: "GATE 2: Codebase exploration complete — existing patterns documented"
TaskCreate: "GATE 3: Architecture design approved by user"
TaskCreate: "GATE 4: Component designs approved by user"
TaskCreate: "GATE 5: Implementation plan approved by user"
TaskCreate: "GATE 6: Implementation complete — all components built"
TaskCreate: "GATE 7: Review complete — code reviewed and verified"
```

---

### Phase 1: Brainstorm & Explore

**Step 1 — Brainstorm with the user:**

```
Invoke Skill: superpowers:brainstorming
```

Feed it the business context, user stories, and design questions from this handover. The brainstorming skill asks the user questions ONE AT A TIME to explore design direction, UX priorities, visual hierarchy, and component reuse.

When brainstorming concludes and user approves direction → `TaskUpdate: GATE 1 → completed`

**Step 2 — Explore the existing frontend codebase:**

Dispatch a `feature-dev:code-explorer` subagent via the Task tool to deeply analyze the existing frontend codebase (framework, state management, auth flow, routes, design system, reusable components).
See [references/prompt-templates.md](references/prompt-templates.md#code-explorer-analysis) for the full prompt template.

When exploration completes → `TaskUpdate: GATE 2 → completed`

**GATE CHECK: GATE 1 + GATE 2 must both be completed before proceeding to Phase 2.**

---

### Phase 2: Architecture & Design

**Step 3 — Spin up an agent team for architecture debate:**

Use `TeamCreate` with team name `[feature]-frontend-architecture`. Spawn two teammates via Task tool:

**Teammate 1 -- Architect:** Dispatch a `feature-dev:code-architect` subagent to design the complete frontend architecture (component tree, routes, state management, API integration, file plan, build sequence).
See [references/prompt-templates.md](references/prompt-templates.md#architecture-team-architect) for the full prompt template.

**Teammate 2 -- Reviewer:** Dispatch a `feature-dev:code-reviewer` subagent to review the architect's output for consistency, reuse opportunities, over-engineering, and accessibility.
See [references/prompt-templates.md](references/prompt-templates.md#architecture-team-reviewer) for the full prompt template.

When team completes and user approves → `TaskUpdate: GATE 3 → completed`
Shut down team via `SendMessage type: shutdown_request` to both teammates.

**Step 4 — Design the components using Thoven design skills:**

```
Invoke Skill: thoven-designer
```

This is the Thoven-specific design skill available in the frontend repo. Feed it:
- The approved architecture from Step 3
- The design direction from brainstorming (Step 1)
- The existing design system discovered by code-explorer (Step 2)
- The API contract data shapes from this handover

Then also invoke:

```
Invoke Skill: frontend-design:frontend-design
```

Use this for any components that need production-grade, distinctive UI treatment beyond what `thoven-designer` covers. This skill avoids generic AI aesthetics and produces polished interfaces.

When component designs are approved by user → `TaskUpdate: GATE 4 → completed`

**GATE CHECK: GATE 3 + GATE 4 must both be completed before proceeding to Phase 3.**

---

### Phase 3: Planning

**Step 5 — Write the implementation plan:**

```
Invoke Skill: superpowers:writing-plans
```

The plan MUST follow `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`:
- Tasks sized at 30min–2hr each
- Dependencies mapped between tasks
- Files to create/modify per task
- Testing strategy per component
- Phases grouped for parallel execution

Typical parallel groups for frontend features:
- **Group A (foundation):** Utility functions, API client hooks, route setup
- **Group B (core pages):** Main feature pages/views
- **Group C (admin):** Admin management views
- **Group D (integration):** Form modifications, conditional navigation, edge cases
- **Group E (review):** Integration testing, cross-browser verification

When user approves plan → `TaskUpdate: GATE 5 → completed`

**GATE CHECK: GATE 5 must be completed before proceeding to Phase 4.**

---

### Phase 4: Implementation

**Step 6 — Execute with parallel subagents:**

```
Invoke Skill: superpowers:subagent-driven-development
```

OR if tasks are clearly independent:

```
Invoke Skill: superpowers:dispatching-parallel-agents
```

Use `TaskCreate` for each implementation task from the plan. Mark each completed via `TaskUpdate` as work finishes.

When all tasks complete → `TaskUpdate: GATE 6 → completed`

---

### Phase 5: Review

**Step 7 — Verify and review:**

```
Invoke Skill: superpowers:verification-before-completion
```

Verify all new pages render, API integration works, conditional navigation works.

Then launch a review subagent:

Dispatch a `feature-dev:code-reviewer` subagent via the Task tool to review all code written for the feature (conventions, quality, error handling, accessibility, API errors, hardcoded values).
See [references/prompt-templates.md](references/prompt-templates.md#final-code-reviewer) for the full prompt template.

Then:

```
Invoke Skill: superpowers:requesting-code-review
```

When review passes → `TaskUpdate: GATE 7 → completed`

---

## Quick Reference

| Phase | Action | Tool |
|-------|--------|------|
| Brainstorm | `superpowers:brainstorming` | Skill |
| Explore codebase | `feature-dev:code-explorer` | Task subagent |
| Architecture | `feature-dev:code-architect` | Task subagent via TeamCreate |
| Architecture review | `feature-dev:code-reviewer` | Task subagent via TeamCreate |
| Component design | `thoven-designer` | Skill (frontend repo) |
| Component design | `frontend-design:frontend-design` | Skill |
| Implementation plan | `superpowers:writing-plans` | Skill |
| Parallel execution | `superpowers:subagent-driven-development` | Skill |
| Verification | `superpowers:verification-before-completion` | Skill |
| Code review | `feature-dev:code-reviewer` | Task subagent |
| Final review | `superpowers:requesting-code-review` | Skill |

## Enforcement

**YOU MUST:**
- Create ALL 7 gates via `TaskCreate` before doing anything else
- Invoke `superpowers:brainstorming` before any design work
- Use `TeamCreate` for the architecture debate phase with architect + reviewer
- Invoke `thoven-designer` for Thoven-specific component design
- Invoke `frontend-design:frontend-design` for production-grade UI polish
- Follow `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` for all documentation and task structure
- Check every gate via `TaskUpdate` before advancing to the next phase

**YOU CANNOT:**
- Skip brainstorming and jump straight to architecture
- Design components without invoking `thoven-designer`
- Start implementation without gates 1–5 all passed
- Bypass the `feature-dev:code-reviewer` subagent at review time
- Declare done without `superpowers:verification-before-completion`
