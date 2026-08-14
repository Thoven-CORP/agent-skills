# Orchestrate — Task Router

## Overview

Classify incoming tasks and route to the correct skill. This eliminates decision fatigue from overlapping skill frameworks.

**Core Principle:** Right skill, right mode, right away.

## Process

### Step 1: Classify the Task

Read the user's request and classify into ONE primary category:

| Category | Signals | Route To |
|----------|---------|----------|
| **Creative/Design** | "build", "create", "add feature", "new", "design" | `brainstorm` |
| **Planning** | "plan", "break down", "scaffold", "implement plan" | `feature-plan` |
| **Complex Execution** | "build this", "implement", multi-file changes, needs debate | `expert-team` |
| **Investigation** | "bug", "error", "broken", "not working", "debug", "fix" | `investigate` |
| **Verification** | "check", "verify", "review", "is this done", "test" | `verify` |
| **Session Mgmt** | "where was I", "continue", "resume", "end session" | `resume-session` |
| **Domain-Specific** | Email work, migrations, security, user deletion, deploy | Domain skill (see below) |

### Step 2: Check for Domain Skills

If the task involves a specific domain, route to the specialized skill:

| Domain | Skill | Trigger Words |
|--------|-------|---------------|
| Email templates/mailers | `email` | "email", "mailer", "SendGrid", "template" |
| Database migrations | `safe-migrate` | "migrate", "migration", "schema change" |
| Security/auth | `security-review` | "security", "auth", "COPPA", "Stripe audit" |
| Production data | `production-data-audit` | "audit", "production data", "data state" |
| Account deletion | `delete-user-account` | "delete user", "remove account" |
| Frontend handover | `frontend-handover` | "handover", "API contract", "frontend docs" |
| TODO management | `manage-todos` | "todo", "task list", "what's next" |
| Deferred improvements | `future-improvements` | "future improvement", "defer this", "backlog this", "too complex for now" |
| Technical debt | `tech-debt` | "tech debt", "workaround", "known issue", "temporary fix", "hack" |
| Publishing/deploy | `publish` | "publish", "deploy", "release" |

### Step 3: Recommend Skill + Mode

Present a concise recommendation:

```
**Recommended:** `/[skill-name]` — [one-line reason]
**Mode:** [if skill has modes, recommend one]
**Chain:** [if task needs multiple skills in sequence]
```

### Step 4: Check for Skill Chains

Some tasks benefit from chaining skills in sequence:

| Pattern | Chain |
|---------|-------|
| New feature (idea → code) | `brainstorm` → `feature-plan` → `expert-team` |
| New feature (spec exists) | `feature-plan` → `expert-team` |
| Bug report | `investigate` → `verify` |
| Feature complete | `verify` → `publish` |
| Complex design problem | `brainstorm` (Deep mode) → `feature-plan` |

## Model Selection (Embedded — from SADD)

When dispatching sub-agents from ANY skill, use this decision tree:

```
Is task COMPLEX (architecture, design, novel problem, critical decision)?
→ YES → Opus
→ NO → Is task SIMPLE and SHORT?
        → YES → Haiku
        → NO → Is output LONG but task not complex?
                → YES → Sonnet
                → NO → Opus (default)
```

## When NOT to Use
- User explicitly names a skill ("run /investigate") — just invoke it directly
- Task is a simple question or clarification — no routing needed
- Already mid-workflow in another skill — don't re-route

## Common Mistakes
- Recommending multiple skills when one is clearly best — pick ONE
- Routing to brainstorm for simple bug fixes — use investigate instead
- Suggesting expert-team for tasks a single agent can handle
- Re-routing mid-workflow instead of continuing the current skill

## Rules

- **ONE recommendation** — Don't list 3 options. Pick the best one.
- **Explain briefly** — One sentence on why this skill fits.
- **Offer chain if applicable** — But don't force multi-step workflows for simple tasks.
- **Domain skills take priority** — If it's clearly email work, route to `email`, not `brainstorm`.
- **When in doubt, ask** — If classification is genuinely ambiguous, ask ONE clarifying question.
