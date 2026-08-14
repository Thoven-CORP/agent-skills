---
name: feature-orchestrator
description: Coordinates feature planning, architecture decisions, and task breakdown across multiple concerns (UI, API, tests, accessibility). Produces complete planning docs (master plan, reuse audit, architecture, bite-sized tasks) ready for execution via writing-plans and subagent-driven-development. Triggers on feature specs, new features, or multi-concern implementation requests.
---

# Feature Orchestrator

Meta-orchestrator for feature planning. Assesses complexity, coordinates architecture decisions, produces comprehensive planning documentation following the Frontend Standard Development Procedure. Outputs are handed off to `superpowers:writing-plans` + `superpowers:subagent-driven-development` for execution.

> **Canonical procedure (read before Phase 1):** [`references/procedure.md`](references/procedure.md) — symlinked to the repo-root `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`. Defines the 5-layer doc framework, commit format, status-tracking rules, and TDD step shape that every artifact this skill produces must conform to.

## Required Reading (Per Phase)

| Phase | MUST read before starting |
|-------|--------------------------|
| Phase 1: Intake | `references/procedure.md` — 5-layer framework + commit format |
| Phase 2: Reuse Audit | `references/templates.md` — REUSE_AUDIT.md template |
| Phase 3: Architecture | `references/templates.md` — Decision Decision Record template |
| Phase 4: Design Doc | `references/templates.md` — Master Plan + Task File templates |

**Skipping `procedure.md` is the #1 cause of master plans that don't conform to the 5-layer framework — execution sessions then fail because the procedure header is missing or inconsistent.**

## When to Use

- Receiving a feature spec or requirements document
- Starting a new feature that touches 2+ concerns (UI, API, tests, a11y, mobile)
- User says "let's build X" or "implement this feature"
- A design doc needs to be created before implementation

**Don't use for:** Bug fixes (use `investigate`), single-file changes, pure research, or tasks handled by one skill alone.

## What This Skill Produces (NOT Implements)

This skill produces **planning artifacts only**, following the 5-layer documentation framework defined in `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`:

- `docs/[Feature]/00_MASTER_PLAN.md` — single source of truth
- `docs/[Feature]/REUSE_AUDIT.md` — mandatory codebase reuse analysis
- `docs/[Feature]/COMPONENT_ARCHITECTURE.md` — component hierarchy + state flow
- `docs/[Feature]/tasks/TASK_01.md` through `TASK_N.md` — bite-sized implementation tasks
- `docs/[Feature]/01_IMPLEMENTATION_STATUS.md` — status tracker (initialized)
- `docs/[Feature]/CURRENT_STATUS.md` — daily progress snapshot (initialized)
- `docs/[Feature]/FRONTEND_INTEGRATION_GUIDE.md` — developer usage guide (stub with planned sections)

**Every master plan and task file MUST include this header reference:**
```
**Procedure:** Follow `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` for execution workflow, commit format, and status tracking.
```
This ensures execution sessions (which don't invoke this skill) can discover the procedure.

After this skill completes, the user executes tasks via `superpowers:writing-plans` → `superpowers:subagent-driven-development`.

---

## MANDATORY First Action: Assess Complexity

Before anything else, assess the feature to determine the right tier:

| Tier | Signal | Files Affected | Phases Used | Agent Strategy |
|------|--------|---------------|-------------|----------------|
| **Lite** | Simple component, hook, or page | 1-2 | Intake → Design Doc | Solo (no subagents) |
| **Standard** | Multi-component feature | 3-5 | Intake → Reuse Audit → Design Doc | 1-2 subagents (explorer + architect) |
| **Full** | Cross-cutting feature, 3+ concerns | 6-10 | Intake → Reuse Audit → Architecture Review → Design Doc | 2-3 subagents |
| **Team** | Major feature, system-level, needs debate | 10+ | Intake → Reuse Audit → Debate → Design Doc | TeamCreate with Architect + Challenger |

Use AskUserQuestion to confirm tier:
- question: "Based on [feature description], this looks like a **[Tier]** feature ([N files, N concerns]). Does this sizing feel right?"
- options: "[Tier] sounds right" | "Bigger — bump to [next tier]" | "Smaller — drop to [previous tier]"

Then create the phase checklist via TaskCreate (only phases for the selected tier).

---

## Zero-Shot CoT Preamble (ALL Agent Prompts)

**Every subagent prompt in this skill MUST include this preamble:**

```
Before responding, think step by step:
1. What exactly is being asked of me?
2. What context do I need to gather first?
3. What are the key constraints?
4. What could go wrong with my approach?
5. How will I verify my work is correct?

After completing your work, self-critique:
- Did I fully address the requirements?
- Did I miss any edge cases?
- Is my solution the simplest that works?
- Would I be confident defending this in code review?
- What would I do differently with more time?
```

## Model Selection (ALL Agent Spawns)

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Architecture decisions, debate | `model: "opus"` | Complex reasoning, trade-off analysis |
| Codebase exploration, reuse audit | `model: "sonnet"` | Good pattern recognition, fast |
| Simple lookups, formatting | `model: "haiku"` | Quick, cheap |

---

## Phase 1: Intake & Context Building

**Goal:** Confirm requirements and build codebase context. Runs for ALL tiers.

### Process

1. **Invoke brainstorming skill** — handles clarifying questions, approach proposals, design approval:
   ```
   Skill tool: skill: "superpowers:brainstorming"
   ```

2. **In parallel** (Standard+ tiers), dispatch code-explorer:
   ```
   Task tool:
     subagent_type: "feature-dev:code-explorer"
     model: "sonnet"
     prompt: "[CoT Preamble]
       Analyze codebase for patterns related to [feature]:
       1. Existing reusable components in components/ui/, components/shared/, components/parent/, components/teacher/
       2. Similar API patterns in lib/*-api.ts
       3. State management approach for similar features (Context vs Redux vs local)
       4. Related types/interfaces in types/ and lib/*-types.ts
       5. Custom hooks in hooks/ and lib/
       6. Design system patterns used in similar features
       Report: file paths, line counts, patterns found, reuse recommendations"
   ```

3. **Synthesize** into Confirmed Requirements:
   - What we're building (from brainstorming)
   - Codebase context (from explorer): reusable components, API patterns, state approach
   - Constraints and dependencies
   - Preliminary tier confirmation

### GATE 1

Use AskUserQuestion:
- question: "Confirmed requirements summary: [summary]. Codebase has [N reusable components, N API patterns]. Proceed?"
- options: "Approved" | "Needs revision"

---

## Phase 2: Reuse Audit

**Goal:** Mandatory codebase reuse analysis before any new code is planned. Runs for Standard+ tiers.

For **Lite** tier: Lead performs a quick inline audit (search components/ui/, lib/*-api.ts, hooks/) and documents in the master plan. No separate REUSE_AUDIT.md needed.

### Process

1. **Create folder structure:**
   ```
   docs/[Feature_Name]/
   ├── 00_MASTER_PLAN.md
   ├── 01_IMPLEMENTATION_STATUS.md
   ├── REUSE_AUDIT.md
   ├── COMPONENT_ARCHITECTURE.md
   └── tasks/
   ```

2. **Dispatch reuse audit subagent** (or do inline for Standard):
   ```
   Task tool:
     subagent_type: "feature-dev:code-explorer"
     model: "sonnet"
     prompt: "[CoT Preamble]
       Perform a comprehensive reuse audit for [feature]. Search:
       - components/ui/ and components/shared/ for existing UI primitives
       - components/parent/, components/teacher/, components/student/ for similar feature components
       - lib/*-api.ts for existing API functions
       - hooks/, lib/, contexts/ for custom hooks
       - types/ and lib/*-types.ts for TypeScript interfaces
       - Similar features for design patterns (floating panels, 3D buttons, modals)

       For EACH item found, classify as:
       - CAN REUSE AS-IS: [component, path, why suitable]
       - CAN EXTEND: [component, path, modifications needed]
       - SIMILAR BUT NOT SUITABLE: [component, path, why not]

       Also identify what MUST be created new, with justification for each.

       Format output as REUSE_AUDIT.md following the template in FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md"
   ```

3. **Write REUSE_AUDIT.md** from subagent output.

### Reuse Decision Tree

```
Need a component/function?
├── Does something similar exist?
│   ├── YES → Can it be used as-is?
│   │   ├── YES → REUSE IT
│   │   └── NO → Can it be extended?
│   │       ├── YES → EXTEND IT (document changes)
│   │       └── NO → Document why, then CREATE NEW
│   └── NO → Document search performed, then CREATE NEW
```

**No gate after this phase** — reuse audit feeds directly into architecture.

---

## Phase 3: Architecture Review

**Goal:** Stress-test architecture decisions. Depth varies by tier.

### Lite Tier: Skip
Lead makes architecture decisions inline in the master plan. No separate review needed.

### Standard Tier: Solo Architecture Review
Lead proposes architecture, dispatches a single reviewer subagent:

```
Task tool:
  subagent_type: "feature-dev:code-architect"
  model: "opus"
  prompt: "[CoT Preamble]
    Review this architecture proposal for [feature]:
    [paste proposal: component hierarchy, state approach, API contracts]

    Challenge each decision against:
    1. Does this match existing codebase patterns? Cite specific files.
    2. Edge cases: empty data, loading states, error states, auth boundaries
    3. State management: is the approach (Context/Redux/local) appropriate?
    4. Performance: unnecessary re-renders, bundle size impact
    5. Mobile/responsive: layout behavior on small screens
    6. COPPA compliance: under-13 student handling (if applicable)
    7. Accessibility: WCAG 2.1 AA requirements

    Output: Decision table with [Decision | Choice | Rationale | Concerns | Resolution]"
```

### Full Tier: Dual-Perspective Review
Dispatch Architect + Reviewer as parallel subagents (NOT teammates — no TeamCreate):

**Architect subagent:**
```
Task tool:
  subagent_type: "feature-dev:code-architect"
  model: "opus"
  prompt: "[CoT Preamble]
    You are the Architect for [feature]. Propose:
    1. Component hierarchy with exact file paths
    2. Data flow: API → State → UI
    3. API contracts (endpoints, request/response types)
    4. State management approach (Context vs Redux vs local) with rationale
    5. Key design decisions with trade-off analysis

    Context: [confirmed requirements + reuse audit findings]
    Design system: Thoven (amber-500 primary, font-display headers, font-sans body,
    3D buttons with shadow-[0_4px_0_0_rgb(217,119,6)] and NO borders,
    spring animations stiffness:500 damping:35 mass:0.6)

    Output: Complete architecture proposal"
```

**Reviewer subagent (in parallel):**
```
Task tool:
  subagent_type: "feature-dev:code-architect"
  model: "opus"
  prompt: "[CoT Preamble]
    You will receive an architecture proposal for [feature].
    Here are the confirmed requirements: [requirements]
    Here is the reuse audit: [reuse audit summary]

    Independently propose your OWN architecture, then when comparing:
    1. Edge cases: empty data, offline, concurrent requests, auth boundaries
    2. COPPA: under-13 student handling
    3. Mobile/responsive behavior
    4. Performance: re-renders, bundle size
    5. Pattern adherence: does this match similar codebase features?

    Output: Your independent proposal + critique of any differences"
```

**Lead synthesizes** both proposals into a Design Decision Record.

### Team Tier: Full Debate (TeamCreate)
Only when the feature is large enough to warrant it. Follows the Architect + Challenger debate pattern:

1. **Load deferred tools first**: `TeamCreate`, `SendMessage`, `TeamDelete` are deferred — call `ToolSearch` with `select:TeamCreate,SendMessage,TeamDelete` before using.
2. Create debate team: `TeamCreate: team_name: "[feature]-debate"`
3. Spawn Architect + Challenger as teammates with `mode: "plan"`
4. Relay proposals via SendMessage, cap at 2-3 rounds
5. Lead synthesizes, shutdown teammates, TeamDelete

**Fallback if TeamCreate is unavailable in the current Claude Code version**: drop to Full tier (parallel subagents via Task tool, no real-time debate). Document the downgrade in the master plan.

### Scoring Rubric (Full + Team tiers)

| Criterion | Weight | Evidence Required |
|-----------|--------|-------------------|
| Correctness | 35% | Does it solve the stated requirements? |
| Quality | 25% | Clean, follows existing patterns? |
| Completeness | 25% | All edge cases addressed? |
| Pattern Adherence | 15% | Matches codebase conventions? |

**Default score is 2.** Justify any score above 2.
- Weighted total >= 3.5 → PASS
- Weighted total < 3.5 → Needs revision (max 2 retries, then escalate to user)

### GATE 2 (Standard+ tiers)

Use AskUserQuestion:
- question: "Architecture decisions: [summary table]. Approve?"
- options: "Approved" | "Disagree with [decision]" | "Need deeper review"

---

## Phase 4: Design Documentation & Task Breakdown

**Goal:** Write the master plan and break work into bite-sized tasks. Runs for ALL tiers.

This is the core output. Follow `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` as backbone. For all templates, read [references/templates.md](references/templates.md).

### Process

1. **Write Master Plan** (`docs/[Feature_Name]/00_MASTER_PLAN.md`) — use template from references/templates.md. Sections: business requirements, architecture overview (from Phase 3), reuse summary (from Phase 2), design system compliance, implementation tasks, success criteria. **Include procedure header reference.**

2. **Write Task Files** (`docs/[Feature_Name]/tasks/TASK_XX.md`) — use task template. Each task: 30min-2.5hr, exact file paths, TDD steps (failing test → implement → pass → commit), acceptance criteria, dependencies. **Include procedure header reference in each task file.**

3. **Write Component Architecture** (Standard+ tiers) — component tree, props interfaces, state flow, data flow diagram.

4. **Initialize Status Tracker** (`01_IMPLEMENTATION_STATUS.md`) — all tasks as "Not Started" with estimated durations.

5. **Initialize Current Status** (`CURRENT_STATUS.md`) — daily snapshot with current phase, blockers, next steps.

6. **Create Integration Guide stub** (`FRONTEND_INTEGRATION_GUIDE.md`) — section headers for components, API functions, types, usage examples. Populated as components are built.

### Task Sizing Rules

- **30min - 2.5hr** per task. If > 2.5hr, split. If < 20min, combine.
- Every task lists exact file paths (create, modify, test, reuse)
- Every task has TDD steps where applicable
- Dependencies mapped via task phase ordering (Types → Components → Pages → Tests → Polish)

### GATE 3 (Final Gate)

Use AskUserQuestion:
- question: "Planning complete: [N] tasks across [N] phases, estimated [X] hours total. Docs saved to docs/[Feature]/. Ready for execution?"
- options: "Looks good — I'll execute via writing-plans" | "Adjust tasks" | "Need more detail on [area]"

---

## Handoff

After Gate 3 approval, summarize:

```
Planning complete for [Feature]:

📁 docs/[Feature_Name]/
├── 00_MASTER_PLAN.md — [N sections, architecture decisions]
├── REUSE_AUDIT.md — [N reusable, N new, N extend]
├── COMPONENT_ARCHITECTURE.md — [component tree, state flow]
├── 01_IMPLEMENTATION_STATUS.md — [N tasks initialized]
├── CURRENT_STATUS.md — [daily snapshot, initialized]
├── FRONTEND_INTEGRATION_GUIDE.md — [section stubs for developer usage]
└── tasks/
    ├── TASK_01_[name].md — [duration, dependencies]
    ├── TASK_02_[name].md
    └── ... TASK_N

Procedure: FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md
(referenced in master plan + all task files for execution-time discovery)

To execute: Use superpowers:writing-plans on each task,
then superpowers:subagent-driven-development for parallel execution.
```

---

## Error Handling & Recovery

| Problem | Detection | Recovery |
|---------|-----------|----------|
| Subagent returns incomplete audit | Missing sections in output | Re-dispatch with more specific prompt |
| Gate rejected multiple times | User keeps selecting "revise" | Ask what specifically needs to change |
| Architecture debate deadlocked | 3+ rounds with no convergence | Lead makes final call, documents dissent |
| Reuse audit finds nothing | No existing patterns match | Document search performed, proceed with new code (justified) |
| Tier mismatch discovered mid-planning | Feature grows/shrinks during intake | Re-assess tier, adjust phases, notify user |

## Red Flags — STOP If You See These

- Skipping reuse audit → Go back, it's mandatory
- Tasks > 2.5 hours → Split into smaller tasks
- No exact file paths in tasks → Add them
- Architecture decisions without rationale → Add trade-off analysis
- No test steps in task files → Add TDD steps
- Proceeding past a gate without user approval → Go back to gate

## Quick Reference: Tools Per Phase

| Phase | Primary Tools | Gate |
|-------|-------------|------|
| Intake | `Skill("superpowers:brainstorming")` + `Task("feature-dev:code-explorer")` | `AskUserQuestion` |
| Reuse Audit | `Task("feature-dev:code-explorer")` + `Write` | None (feeds into architecture) |
| Architecture | `Task("feature-dev:code-architect")` or `TeamCreate` (Team tier only) | `AskUserQuestion` |
| Design Doc | `Write` + `TaskCreate` | `AskUserQuestion` (final) |
