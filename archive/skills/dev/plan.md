---
name: dev-plan
description: Use when grounding a feature design with codebase research and locking architecture decisions. Triggers on /dev:plan or pipeline advancement past DISCOVER.
---

# /dev:plan — Research, Decide, Lock

## Purpose

Ground the DISCOVER design in codebase reality. Dispatch domain-triggered agents for deep research. Make architecture decisions with full reasoning — decisions get LOCKED here. Define wave groupings, task assignments, and acceptance criteria for all remaining phases.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH (Agent Deep-Dive)

### 1. Read Context

```
Read: docs/[feature]/.dev/MANIFEST.md → tier, domains, entry mode
Read: docs/[feature]/prompt-transitions/plan.md → context from DISCOVER
Read: Design doc path from MANIFEST → proposed design (NOT locked yet)
```

### 2. Dispatch Domain-Triggered Agents

Based on MANIFEST domain tags, launch agents in PARALLEL (single message, multiple subagent calls):

| Domain | Agent | Prompt Focus |
|--------|-------|-------------|
| `auth` | `security-engineer` | Auth patterns, role-based access, JWT considerations |
| `database` | `master-backend-ai-rails` | Schema review, existing table constraints, index strategy |
| `database` | `postgres-pro` | Query performance, migration strategy for large tables, index optimization |
| `payments` | `security-engineer` | Payment security, Stripe patterns, race conditions |
| `payments` | `backend-service-developer` | Stripe integration patterns, webhook handling |
| `students` | `security-engineer` | COPPA compliance, data isolation, consent flow |
| `real-time` | `websocket-engineer` | Action Cable patterns, channel design |
| `external-api` | `backend-service-developer` | API integration, error handling, retry patterns |
| `performance` | `performance-engineer` | Query optimization, caching strategy |
| `api-design` | `api-designer` | Endpoint design, serializer patterns |
| `background-jobs` | `rails-expert` | Solid Queue patterns, job design |
| Any domain | `rails-expert` | Codebase conventions, existing patterns |
| Any domain | `architecture-reviewer` | Design validation, constraint identification |

**Agent prompt template:**
```
Research [domain] aspects of [feature] in the Thoven codebase.

PROPOSED DESIGN: [summary from design doc]
MANIFEST DOMAINS: [domain tags]

INVESTIGATE:
1. Existing patterns in codebase for [domain]
2. Constraints that affect proposed design
3. Risks and edge cases specific to [domain]
4. Recommended approach with file:line references

CODEBASE CONTEXT:
- Rails 7.2.2 API-only backend
- Dual auth: Users (Devise JWT) vs Students (separate Devise)
- Profile types: integers (ADMIN=1, PARENT=2, TEACHER=3)
- Soft deletes via archived_at, services in app/services/
- Check .claude/docs/ARCHITECTURE.md for schema
- Check .claude/docs/COMMON_ERRORS.md for known pitfalls

Output findings as structured sections with file:line citations.
```

### 3. Production Data Audit (Conditional)

If feature touches existing models:
- Invoke `/production-data-audit` for affected models
- Understand real data shape, nullability, edge cases

### 4. NOVEL Tier: Additional Research

For NOVEL tier only:
- Launch TeamCreate research team if agents surface conflicting recommendations
- May invoke `/expert-team` Architecture mode for competitive evaluation of hardest decisions

---

## EXECUTE

### Step 1: Synthesize Agent Findings

When all agents return:
1. Collect findings with file:line references
2. Identify agreements (where agents found same pattern/constraint)
3. Identify conflicts (where agents disagree)
4. Note gaps (what wasn't investigated)
5. Cross-reference with production data audit results

### Step 2: Make Architecture Decisions

For each design element from DISCOVER, create a decision entry:

```markdown
- id: D[XX]
  decision: "[what we decided]"
  reasoning: >
    [WHY this was chosen. Reference agent findings.
    Include file:line citations from agent research.
    Mention production data constraints if relevant.]
  alternatives_rejected:
    - "[Alternative 1]" — [why rejected, with evidence]
    - "[Alternative 2]" — [why rejected, with evidence]
  affects: [wave_X, wave_Y]
  status: locked
```

**Decision quality rules:**
- Every decision MUST cite agent research evidence
- Every rejected alternative MUST have a specific reason (not "too complex")
- Reasoning must explain WHY, not just WHAT
- If agents disagreed, document both positions and the tiebreaker

### Step 3: Define Wave Groupings

Break tasks into waves based on dependencies:

```markdown
## Waves
  wave_1:
    title: "[Foundation — DB + Models]"
    tasks: [TASK_01_migration, TASK_02_model, TASK_03_factory]
    dependencies: none
    agents: [master-backend-ai-rails]

  wave_2:
    title: "[Core Logic — Services + Controller]"
    tasks: [TASK_04_service, TASK_05_controller, TASK_06_serializer]
    dependencies: [wave_1]
    agents: [rails-expert]

  wave_3:
    title: "[Integration — Tests + Polish]"
    tasks: [TASK_07_request_specs, TASK_08_edge_cases]
    dependencies: [wave_2]
    agents: [rails-expert, test-automator]
```

**Wave rules:**
- Tasks within a wave MUST be parallelizable (no intra-wave dependencies)
- Each task should be 30min-3hr scope. If larger, break it down.
- Each wave has assigned agent types
- Wave ordering respects data dependencies (models before services before controllers)

### Step 4: Define Acceptance Criteria

Set custom acceptance criteria for remaining phases:

```markdown
## Acceptance Criteria

### BUILD
- [ ] [Specific criterion 1 — e.g., "Migration creates table with all columns from D01"]
- [ ] [Specific criterion 2 — e.g., "Service handles credit hold per D03"]
- [ ] [Specific criterion 3 — e.g., "All sad paths return proper error responses"]

### VALIDATE
- [ ] [e.g., "Security review passes with no CRITICAL findings"]
- [ ] [e.g., "95%+ test coverage on new code"]
- [ ] [e.g., "Production data audit confirms feature handles NULL fields"]

### HANDOVER (if applicable)
- [ ] [e.g., "API contract matches actual implementation"]
- [ ] [e.g., "Error codes documented for all failure modes"]
```

---

## DOCUMENT

### Update MANIFEST

Add to MANIFEST:
1. All decisions (D01, D02, etc.) with full decision log
2. Wave groupings with task assignments
3. Acceptance criteria for BUILD, VALIDATE, HANDOVER
4. Agent findings summary (key constraints discovered)
5. Update phase progress: PLAN → ✅

### Update Domain Tags

If research revealed new domains (e.g., agent found the feature needs background jobs), add them.

---

## GATE

Present to user:

```
PHASE GATE: PLAN

Architecture Decisions:
  D01: [decision] — locked — [1-line reasoning]
  D02: [decision] — locked — [1-line reasoning]
  ...
  [Any deferred]: D0X — deferred — [why and when to revisit]

Wave Execution Plan:
  Wave 1: [tasks] — [agents] — no dependencies
  Wave 2: [tasks] — [agents] — depends on Wave 1
  ...

Acceptance Criteria Set For:
  BUILD: [count] criteria
  VALIDATE: [count] criteria
  HANDOVER: [count] criteria (or N/A)

Agent Research Summary:
  - [key finding 1]
  - [key finding 2]
  - [constraint discovered]

Production Data Notes:
  - [relevant data shape issues]

Next phase: DOCUMENT

Options:
  1. Approve → advance to DOCUMENT
  2. Revise → revisit specific decisions
  3. Pause → /dev:pause
```

---

## TRANSITION

On approval:

1. Invoke `/prompt-generator` → create DOCUMENT phase prompt
2. Save to `docs/[feature]/prompt-transitions/document.md`
3. Contents MUST include:
   - Feature summary
   - Full decision log (all D01-DXX entries)
   - Wave groupings with task assignments and dependencies
   - Acceptance criteria for all phases
   - Design doc path
   - MANIFEST path
   - Agent assignment per wave
   - Files to create/modify hints from agent research

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Locking decisions without agent evidence | Every decision MUST cite agent research |
| Vague reasoning ("it's simpler") | Reasoning must reference specific files, patterns, or constraints |
| Tasks too large (> 3hr) | Break down until each is 30min-3hr |
| Intra-wave dependencies | Tasks in same wave MUST be parallelizable |
| Missing acceptance criteria | Every phase needs criteria — they guide BUILD and VALIDATE |
| Skipping production data audit | If touching existing models, ALWAYS audit first |
| Using expert-team for everything | Expert-team only for genuinely contested decisions, not routine ones |
