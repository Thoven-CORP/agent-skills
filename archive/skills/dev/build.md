---
name: dev-build
description: Use when executing approved wave execution plans to build a feature with tier-driven subagent dispatch and auto-escalation. Triggers on /dev:build or pipeline advancement past DOCUMENT.
---

# /dev:build — Execute the Plan

## Purpose

Execute wave execution plans task-by-task. Tier drives execution strategy (sequential, wave-parallel, or expert-team waves). Auto-escalate failures through self-fix → /investigate → 3-strikes pause.

## Phase Pattern: RESEARCH > EXECUTE (per wave) > DOCUMENT (per task) > GATE

---

## RESEARCH (Per Wave)

Before each wave:

### 1. Read Wave Execution Plan
```
Read: docs/[feature]/tasks/WAVE_[N]_PLAN.md
  → Tasks, agents, steps, completion criteria
```

### 2. Read MANIFEST
```
Read: docs/[feature]/.dev/MANIFEST.md
  → Current wave, build progress, acceptance criteria
```

### 3. Verify Previous Wave (if not Wave 1)
- Run `bundle exec rspec` — confirm tests still pass
- Check previous wave's completion criteria are met
- Verify no regressions from previous wave's changes

### 4. Check Codebase State
- Verify assumptions from PLAN still hold (files exist, no conflicting changes)
- Read task files for this wave

---

## EXECUTE (Tier-Driven)

**Default execution strategy:** COMBINATION (wave-based parallel). Override based on MANIFEST tier:

### KNOWN Tier — Sequential Execution

```
Task 1 → single subagent → /verify (quick) →
Task 2 → single subagent → /verify (quick) →
Task N → single subagent → /verify (quick) → wave done
```

One task at a time. Simple, predictable.

### COMBINATION Tier — Wave-Based Parallel

```
Wave 1: [Task 1, Task 2, Task 3] → parallel subagents → /verify wave →
Wave 2: [Task 4, Task 5]         → parallel subagents → /verify wave →
Wave N: ...                       → done
```

Use `superpowers:dispatching-parallel-agents` for parallel dispatch within waves.

### NOVEL Tier — Expert-Team Wave Execution

```
Wave 1: [tasks] → /expert-team Execution mode → /verify wave + code review →
Wave 2: [tasks] → /expert-team Execution mode → /verify wave + code review →
Wave N: → done
```

Expert-team provides senior-level implementation with built-in review.

### Per-Task Execution Pattern

For each task, regardless of tier:

**1. Read task context:**
```
Read: docs/[feature]/tasks/TASK_[XX]_[name].md
  → Implementation details, decision references, files to create/modify
```

**2. Dispatch subagent with task-specific prompt:**
```
subagent:
  subagent_type: [from wave execution plan — e.g., "rails-expert"]
  description: "Execute TASK_[XX]: [name]"
  prompt: |
    Execute this task from the [feature] feature:

    TASK: [task description from task file]
    DECISION REFERENCES: [D01, D03 — include full reasoning]
    FILES TO CREATE: [list]
    FILES TO MODIFY: [list]
    COMPLETION CRITERIA: [from task file]

    APPROACH:
    - Follow test-driven development (write test first, then implementation)
    - Use existing codebase patterns (check app/services/, app/models/, app/controllers/)
    - Reference decision log for architectural choices

    CODEBASE CONTEXT:
    [Standard Thoven context block — see references/codebase-context-block.md for the standard Thoven context block]

    When done, update the task file with "What Was Actually Implemented" section.
```

**3. Auto-invoke tools based on task type:**

| Task Type | Auto-Invoke | When |
|-----------|-------------|------|
| Migration | `/safe-migrate` | BEFORE running migration |
| Model/Service/Controller | `superpowers:test-driven-development` | Test first, implement second |
| Email/Mailer | `/email` | Mailer creation |
| Background Job | Check `BACKGROUND_JOBS.md` | Job conventions |

**4. Review execution checkpoints:**
- Use `superpowers:executing-plans` for review checkpoints during wave execution
- Compare actual progress against wave execution plan expectations

**5. Verify task:**
- Run `/verify` (quick mode) after each task
- If tests fail → enter error handling (below)

### Error Handling — Auto-Escalation

```
Subagent executes task
  │
  ├─ Tests pass? → Continue to next task
  │
  └─ Tests fail?
     │
     ├─ Simple error (typo, import, syntax, missing require)?
     │   → Subagent self-fixes (1 retry max)
     │   → Run tests again
     │   → If pass: continue
     │   → If fail: escalate
     │
     └─ Complex error (logic, integration, state, race condition)?
         → Auto-invoke /investigate
         │   - Bug type: classify per /investigate table
         │   - Launch appropriate agents
         │   - Wait for diagnostic report
         │   - Implement approved fix
         │
         ├─ /investigate fixes it
         │   → Resume BUILD from current task
         │
         └─ 3 strikes (3 failed fix attempts across this task)?
             → /dev:pause
             → Surface to user:
               "BUILD blocked on TASK_[XX]: [error summary]"
               "Investigated 3 times, likely architectural"
               Options:
                 1. Review & guide fix manually
                 2. Revise plan (go back to /dev:plan)
                 3. Pause feature entirely
```

### Between Waves

After all tasks in a wave complete:

1. Run `/verify` (standard mode — tests + docs sync)
2. Check wave completion criteria from wave execution plan
3. Update `01_IMPLEMENTATION_STATUS.md`
4. Update MANIFEST progress:
   ```
   build_progress: "Wave 2 of 3 complete"
   current_wave: 3
   tests_passing: true
   ```

### Tech Debt Tracking

When any task reveals technical debt during development:
- Invoke `/tech-debt` to log the debt with context
- Note the tech debt item in the task file's "What Was Actually Implemented" section
- Track count for the gate report

### End of BUILD (All Waves Complete)

1. Run `/verify` (full mode — tests + docs sync + stub check)
2. Launch `code-simplifier` agent to review ALL changed files
3. Update task actuals in each task file
4. Check custom BUILD acceptance criteria from MANIFEST

---

## DOCUMENT (Auto-Update After Each Task)

After EVERY task completion, update these files:

### 1. Task File
```markdown
## Status: ✅ Complete
## Actual Duration: [X hours]

## What Was Actually Implemented
- [What the subagent actually built]
- [Any deviations from plan and why]
- [Files created/modified with brief description]
```

### 2. Implementation Status (`01_IMPLEMENTATION_STATUS.md`)
Update the status table row for this task.

### 3. MANIFEST
```
build_progress: "TASK_[XX] complete, [Y] of [Z] tasks done"
current_wave: [N]
tests_passing: [true/false]
```

### 4. CURRENT_STATUS.md
```
Current phase: BUILD
Last completed: TASK_[XX] — [name]
Next: TASK_[YY] — [name]
Blockers: [none or description]
```

---

## GATE

After all waves complete and end-of-BUILD checks pass:

```
PHASE GATE: BUILD

Tasks Completed: [X] of [Y]
Waves Completed: [N] of [M]
Test Results: [XXX examples, 0 failures]
Code Simplifier: [findings summary or "No issues"]

BUILD Acceptance Criteria:
  ✅ [criterion 1]
  ✅ [criterion 2]
  ✅ [criterion 3]
  [or ❌ with explanation]

Deviations from Plan:
  - [Any changes made during BUILD with reasoning]

Tech Debt Logged: [count] items (if any)

Next phase: VALIDATE

Options:
  1. Approve → advance to VALIDATE
  2. Revise → address issues
  3. Pause → /dev:pause
```

---

## TRANSITION

On approval:

1. Invoke `/prompt-generator` → create VALIDATE phase prompt
2. Save to `docs/[feature]/prompt-transitions/validate.md`
3. Contents MUST include:
   - Feature summary and what was built
   - All changed files (from task actuals)
   - Test results
   - VALIDATE acceptance criteria from MANIFEST
   - Domains touched (for conditional security review)
   - Deviations from plan (for reviewer context)
   - Known tech debt (from BUILD)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping TDD for "simple" tasks | ALL model/service/controller tasks use TDD |
| Running migration without /safe-migrate | EVERY migration goes through /safe-migrate |
| Not updating docs after each task | Auto-update is MANDATORY — 4 files per task |
| Retrying failed task more than once before escalating | 1 self-fix retry, then /investigate |
| Using expert-team for KNOWN/COMBINATION tier | Expert-team execution only for NOVEL tier |
| Skipping between-wave verification | ALWAYS run /verify between waves |
| Ignoring code-simplifier findings | Review and address before gate |
