# Wave Execution Plan Template

Use this template when generating wave execution plans in `/dev:document`.

```markdown
# Wave [N] Execution Plan — [Wave Title]

## Overview
[What this wave delivers and why these tasks are grouped]

## Prerequisites
- [Wave dependencies]
- [Required codebase state]

## Tasks

### TASK_[XX]: [Name]
- **Subagent:** [subagent type]
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
- [ ] Implementation status updated

## Estimated Total Duration: [X hours]
```
