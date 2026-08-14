# Agent Prompt Template

Use this template when dispatching domain-triggered subagents in `/dev:plan`.

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
[Use references/codebase-context-block.md]

Output findings as structured sections with file:line citations.
```
