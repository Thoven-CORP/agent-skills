# Quick reference

**First action before anything else:** `TaskCreate` for all 8 phases.

| Phase | Mandatory Action | Gate |
|-------|-----------------|------|
| **0. TASKS** | TaskCreate for all phases (MANDATORY FIRST) | Tasks created |
| 1. CLASSIFY | Category / Severity / Complexity / Context label | Classification label output |
| 2. PATTERN CHECK | Scan common-errors.md by category | Match found? User decides |
| 3. INVESTIGATE | Launch MANDATORY agents (no optional) | Agent findings received |
| 4. DIAGNOSE | Present structured report with sources | Report complete |
| 5. GATE | USER CHOOSES FIX OPTION | Explicit selection |
| 6. FIX | Execute at correct tier (inline/subagent/orchestrator) | Fix implemented |
| 7. VERIFY | type-check + lint + user confirms fixed | User says the bug is fixed |
| 8. CLOSE | Log pattern, commit (conditional) | Pattern gate evaluated |
