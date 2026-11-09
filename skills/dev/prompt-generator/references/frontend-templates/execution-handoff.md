---
name: execution-handoff
category: feature-execution
type: implementation
description: "Handoff prompt from writing-plans to subagent-driven-development in a fresh session"
triggers:
  - "execute the plan"
  - "create execution prompt"
  - "handoff to new session"
frameworks: [structured-step-by-step, constraints]
---

# Execution Handoff Template

## When to Use

After `superpowers:writing-plans` saves a plan to `docs/plans/` and the user wants to execute it in a fresh session. Fill in the placeholders, save next to the plan as `{plan-name}-EXECUTE.md`.

## Template

```
Use the `superpowers:subagent-driven-development` skill to execute the implementation
plan at `{PLAN_PATH}`, dispatching a fresh subagent per task with code review between
each. This plan implements {FEATURE_NAME} — {ONE_LINE_SCOPE_DESCRIPTION}, organized
into {N} sequential TDD tasks: {COMMA_SEPARATED_TASK_NAMES}. Each implementation
subagent must follow strict TDD — write failing test, confirm failure, implement minimal
code, confirm pass, commit — using patterns from {PATTERN_FILE_1}
({what it demonstrates}), {PATTERN_FILE_2} ({what it demonstrates}), and
{PATTERN_FILE_3} ({what it demonstrates}). The design specs with exact Tailwind classes,
accessibility annotations, and animations are in {DESIGN_SPEC_PATH}, and the backend API
contract with response shapes and type constraints is in {API_CONTRACT_PATH}. In addition
to the implementation subagent per task, dispatch a parallel documentation subagent after
each completed task that updates `TODO.md` (mark completed items, note progress) and the implementation plan's acceptance
criteria checkboxes — this keeps all project docs in sync as work progresses per our
feature protocol. The documentation subagent should also update `CLAUDE.md` if the task
changes any documented surface (feature flags, API modules, component structure, etc.).
After all tasks complete, run `pnpm run type-check && pnpm run lint && pnpm exec vitest run` as
a final gate before declaring the phase done. Source-of-truth docs:
{COMMA_SEPARATED_DOC_PATHS}. Commit after each task with descriptive messages, never
batch multiple tasks into one commit, and ensure every new file has test coverage meeting
the 80% threshold.
```

## Placeholders

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{PLAN_PATH}` | `docs/plans/2026-02-28-occ-frontend-phase1.md` | Path to the saved plan |
| `{FEATURE_NAME}` | `Optimistic Class Creation Phase 1` | Human-readable name |
| `{ONE_LINE_SCOPE_DESCRIPTION}` | `frontend-only tasks with no live backend dependency` | Scope boundary |
| `{N}` | `6` | Task count |
| `{COMMA_SEPARATED_TASK_NAMES}` | `brand fix, feature flag + API, EditableClassName, notice cards, verification, docs` | Brief names |
| `{PATTERN_FILE_1..3}` | `lib/intro-call-api.ts` (API structure) | Existing files to mimic |
| `{DESIGN_SPEC_PATH}` | `docs/Feature/DESIGN_SPEC.md` | Visual/a11y spec |
| `{API_CONTRACT_PATH}` | `docs/Feature/FRONTEND_CONTRACT.md` | API contract |
| `{COMMA_SEPARATED_DOC_PATHS}` | `TECHNICAL_SPEC.md, DESIGN_SPEC.md` | Source-of-truth docs |

## Key Principles

1. **`subagent-driven-development`** not `executing-plans` — fresh context per task + code review gates
2. **Two subagents per task** — implementation + documentation keeps docs current
3. **TDD non-negotiable** — failing test first, every task
4. **Pattern files** — 2-3 existing codebase files for the subagent to mimic
5. **Final verification gate** — type-check + lint + tests before declaring done
6. **One commit per task** — clean history for rollback

## Workflow Position

```
writing-plans -> [plan saved] -> THIS TEMPLATE -> [prompt saved] -> fresh session -> subagent-driven-development
```

## Example

See `docs/plans/2026-02-28-occ-phase1-EXECUTE.md` for a filled-in instance.
