# Enforcement rules

Read this before Phase 1.

### NEVER Do This:
- NEVER skip the pattern check against common-errors.md
- NEVER attempt to debug without launching the MANDATORY agents for the bug category
- NEVER use "optional" specialist logic. Classification dictates the roster
- NEVER proceed to FIX without explicit user approval at the GATE
- NEVER claim root cause without evidence from agent investigation
- NEVER say "I think the issue is..." without agent findings to support it
- NEVER read code directly and propose fixes (use agents to investigate)
- NEVER skip pattern logging in CLOSE phase

### ALWAYS Do This:
- ALWAYS check common-errors.md for matching patterns BEFORE launching agents
- ALWAYS launch the MANDATORY agents for the classified bug category (no optional specialists)
- ALWAYS wait for agent results before diagnosing
- ALWAYS present a diagnostic report with "Investigation Sources" section
- ALWAYS ask user to choose a fix option before implementing
- ALWAYS cite specific file:line references from agent findings
- ALWAYS run the pattern quality gate before logging to common-errors.md
- ALWAYS determine fix tier (simple/medium/complex) from classification, not intuition
