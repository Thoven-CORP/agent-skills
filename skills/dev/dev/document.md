---
name: dev-document
description: Use when the PLAN phase is approved and locked decisions, wave groupings, and acceptance criteria exist in the MANIFEST. Converts plan artifacts into 5-layer documentation and wave-level execution plans. Triggers on /dev:document or when the /dev pipeline advances past PLAN.
---

# /dev:document — Write Docs + Wave Execution Plans

## Purpose

Convert PLAN phase outputs (locked decisions, wave groupings, acceptance criteria) into the full 5-layer documentation framework and wave-level execution plans. Every task and wave gets a detailed, actionable document before any code is written.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH

Review PLAN artifacts for completeness before writing anything.

1. **Read MANIFEST** at `docs/[feature]/.dev/MANIFEST.md`
   - Verify all decisions have `status: locked` or `status: deferred` (no unresolved)
   - Verify wave groupings exist with task assignments and dependencies
   - Verify acceptance criteria defined for BUILD, VALIDATE, and HANDOVER
   - Verify domain tags are complete

2. **Read design doc** at path listed in MANIFEST `Artifacts > Design`
   - Cross-reference design sections against PLAN decisions
   - Flag gaps: design mentions something with no corresponding decision

3. **Read prompt transition** at `docs/[feature]/prompt-transitions/document.md`
   - Load context passed from PLAN phase

4. **Verify wave groupings make sense:**
   - No circular dependencies between waves
   - Tasks within a wave are parallelizable (no intra-wave dependencies)
   - Each wave has assigned agent types
   - Wave ordering respects task dependencies

5. **If gaps found:** Present findings to user BEFORE proceeding. Do not write docs with known gaps.

---

## EXECUTE

### Step 1: Create folder structure

```
docs/[feature]/
├── 00_MASTER_PLAN.md
├── 01_IMPLEMENTATION_STATUS.md
├── CURRENT_STATUS.md
├── tasks/
│   ├── TASK_01_[name].md
│   ├── TASK_02_[name].md
│   ├── ...
│   ├── WAVE_01_PLAN.md
│   ├── WAVE_02_PLAN.md
│   └── ...
└── api/
    └── [FEATURE]_API_CONTRACT.md
```

### Step 2: Write 5-layer documentation

Write each layer using templates from `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`.

#### Layer 1: 00_MASTER_PLAN.md

Source: PLAN decisions + design doc. Include:
- Business requirements (from design doc)
- Architecture overview with design decisions (from decision log — reference D01, D02, etc.)
- Database schema (from design doc + PLAN refinements)
- API design (endpoints, auth, authorization)
- Business logic (state machines, workflows, rules)
- Analytics and metrics
- Implementation tasks (grouped by wave, with dependencies)
- Success criteria (from MANIFEST acceptance criteria)

Every architecture decision MUST include:
- Decision ID (D01, D02...)
- Rationale
- Alternatives rejected with reasons
- Which waves/tasks it affects

#### Layer 2: tasks/TASK_01_[name].md through TASK_N_[name].md

One file per task. Each includes:
- Status (initialized to Not Started)
- Assigned agent type (from MANIFEST wave groupings)
- Estimated duration (30min-3hr target per task)
- Dependencies (which tasks must complete first)
- What to build (detailed implementation instructions)
- Acceptance criteria (task-level)
- Files to create and files to modify
- Implementation details (methods, error handling, testing requirements)
- References to relevant decision log entries ("See D01 for rationale")
- Empty "What Was Actually Implemented" section (filled during BUILD)

#### Layer 3: api/[FEATURE]_API_CONTRACT.md

Write BEFORE any implementation. Include:
- Endpoint specifications with request/response examples
- Validation rules with error messages
- Status codes (200, 201, 401, 403, 404, 422)
- Error response formats (per `docs/reference/API_ERROR_RESPONSE_CONTRACT.md`)
- WebSocket notification payloads (if applicable)
- Complete workflow examples
- Business rules summary table

Skip this layer if the feature has no API endpoints.

#### Layer 4: 01_IMPLEMENTATION_STATUS.md

Initialize with:
- Task status table (all tasks listed as Not Started)
- Progress by wave (0% complete)
- Estimated duration per task and per wave
- Blockers section (empty)
- Timeline section (started date = today)

#### Layer 5: CURRENT_STATUS.md

Initialize with:
- Current phase: DOCUMENT (completing)
- Feature summary
- Next phase: BUILD
- Blockers: None

### Step 3: Generate wave execution plans

For EACH wave defined in MANIFEST, invoke `/writing-plans` to generate a detailed execution plan.

**Input to /writing-plans per wave:**
- All task files for tasks in this wave
- Decision log entries that affect this wave
- Dependencies (which waves must complete first)
- Assigned agent types from MANIFEST

**Each wave execution plan (tasks/WAVE_NN_PLAN.md) MUST contain:**

1. **Wave overview** — Which tasks, why grouped together, what this wave delivers
2. **Prerequisites** — Which waves must be complete, what state the codebase must be in
3. **Steps for all tasks in the wave** — Ordered execution within the wave
4. **Assigned subagent types per task** — e.g., `rails-expert`, `master-backend-ai-rails`, `security-engineer`
5. **Files to create/modify** — Complete list across all tasks in the wave
6. **Completion criteria per task** — Specific, verifiable conditions
7. **Completion criteria for the wave** — What "wave done" means (all task criteria met + integration verified)
8. **References to decision log entries** — e.g., "Per D01, use service layer pattern", "Per D02, integer seconds for duration"
9. **Estimated duration per task** — Individual task estimates
10. **Wave total estimated duration** — Sum + buffer for integration

**Wave execution plan template:**

```markdown
# Wave [N] Execution Plan — [Wave Title]

## Overview
[What this wave delivers and why these tasks are grouped]

## Prerequisites
- [Wave dependencies]
- [Required codebase state]

## Tasks

### TASK_[XX]: [Name]
- **Agent:** [subagent type]
- **Estimated Duration:** [X hours]
- **Files to Create:** [list]
- **Files to Modify:** [list]
- **Steps:**
  1. [Step with specifics]
  2. [Step with specifics]
- **Decision References:** [D01, D03]
- **Completion Criteria:**
  - [ ] [Specific verifiable criterion]
  - [ ] Tests passing

[Repeat for each task in wave]

## Wave Completion Criteria
- [ ] All task criteria met
- [ ] [Integration criterion]
- [ ] Full test suite passing
- [ ] `01_IMPLEMENTATION_STATUS.md` updated

## Estimated Total Duration: [X hours]
```

---

## DOCUMENT

After all docs and wave execution plans are written:

1. **Update MANIFEST** `Artifacts` section with paths to all created documents:
   ```
   ## Artifacts
   - Design: docs/plans/YYYY-MM-DD-[topic]-design.md
   - Master Plan: docs/[feature]/00_MASTER_PLAN.md
   - Tasks: docs/[feature]/tasks/TASK_01_[name].md, ..., TASK_N_[name].md
   - API Contract: docs/[feature]/api/[FEATURE]_API_CONTRACT.md
   - Wave Plans: docs/[feature]/tasks/WAVE_01_PLAN.md, ..., WAVE_N_PLAN.md
   - Status: docs/[feature]/01_IMPLEMENTATION_STATUS.md
   - Current: docs/[feature]/CURRENT_STATUS.md
   ```

2. **Update MANIFEST** phase progress:
   - Mark DOCUMENT phase as complete (pending gate approval)

3. **Verify doc consistency:**
   - Task count in master plan matches task file count
   - Wave execution plans reference correct task IDs
   - Decision IDs in task files exist in decision log
   - Acceptance criteria in implementation status match MANIFEST

---

## GATE

Present to user:

**PHASE GATE: DOCUMENT**

**Summary:**
- 5-layer docs written
- N task files created
- M wave execution plans generated
- API contract(s) written

**Master Plan:** [1-paragraph summary]

**Task List:**
- Wave 1: TASK_01, TASK_02 [agents]
- Wave 2: TASK_03, TASK_04 [agents]

**Decision Log:**
- D01: [decision] — locked
- D02: [decision] — locked

**Estimated Total Duration:** [X hours]
**Artifacts Created:** [count] files
**MANIFEST:** Updated with all doc paths
**Next Phase:** BUILD

**Options:**
1. Approve → advance to BUILD
2. Revise → address feedback
3. Pause → /dev:pause

---

## TRANSITION

On approval:

1. Invoke `/prompt-generator` to create the BUILD phase prompt
2. Save output to `docs/[feature]/prompt-transitions/build.md`
3. Contents must include:
   - Feature summary
   - Tier (KNOWN/COMBINATION/NOVEL) — determines build strategy
   - Wave execution plan paths
   - Task file paths
   - Decision log (full)
   - Acceptance criteria for BUILD phase
   - Agent assignments per wave
   - Current codebase state assumptions
   - Reference paths to all artifacts

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing docs before verifying PLAN completeness | ALWAYS run RESEARCH step first — gaps propagate |
| Skipping wave execution plans ("tasks are enough") | Wave execution plans coordinate parallel execution — tasks alone lack orchestration context |
| Decision log IDs missing from task files | Every task MUST reference which decisions affect it |
| API contract written after implementation | API contract is Layer 3 — written BEFORE BUILD, not during |
| Wave execution plans missing completion criteria | Without criteria, BUILD cannot verify wave is done |
| Estimated durations missing or > 3hrs per task | Break down further — tasks over 3hrs are too large |
