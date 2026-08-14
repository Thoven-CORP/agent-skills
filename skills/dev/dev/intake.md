---
name: dev-intake
description: Use when starting a new feature in the /dev pipeline or when /dev routes to classification. Triggers on /dev:intake or when /dev starts a new feature.
---

# /dev:intake — Classify, Scope, Create MANIFEST

## Purpose

Parse user input, classify complexity tier, identify domains, create MANIFEST. This is the only phase that auto-advances (no gate — INTAKE is automatic).

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > AUTO-ADVANCE

---

## RESEARCH

### 1. Parse Entry Mode

Detect from user input or `/dev` arguments:

| Signal | Mode | Starting Phase After Intake |
|--------|------|---------------------------|
| Rough idea, feature description | **Idea dump** | DISCOVER |
| `--spec path/to/file.md` or references existing spec | **Tech spec** | DISCOVER (post-spec brainstorm) |
| `--handover feature-name` or "hand over to frontend" | **Frontend handover** | HANDOVER |
| `--bug` or describes error/broken behavior | **Bug/issue** | BUILD (via /investigate) |

### 2. Quick Context Scan

Read these files (in parallel) to classify the feature:

```
Glob: app/models/*.rb         → Identify touched models
Glob: app/controllers/**/*.rb → Check for existing endpoints
Read: .claude/docs/ARCHITECTURE.md → Schema context
Read: .claude/docs/API_ROUTES.md   → Existing routes
Glob: docs/plans/*.md              → Check for related plans
```

---

## EXECUTE

### Step 1: Classify Complexity Tier

Based on the feature description and context scan:

**KNOWN** — Pattern exists in this codebase or is standard Rails:
- CRUD endpoints, new model with standard associations
- Email templates, background jobs following existing patterns
- Landing pages, static content, simple UI changes
- Bug fixes with clear symptoms

**COMBINATION** — Combines known patterns in new ways:
- New workflow that chains existing services
- Feature touching multiple models with new business rules
- Integration of existing subsystems (e.g., booking + calendar + notifications)
- Multi-step process with state management

**NOVEL** — No existing pattern, needs research:
- AI/ML features, real-time collaboration
- New architectural patterns not in the codebase
- Complex third-party integrations with unknown APIs
- Features requiring new infrastructure

**Present classification to user for confirmation:**
```
I've classified this as:
  Tier: [KNOWN/COMBINATION/NOVEL]
  Reason: [1 sentence]

Does this feel right, or should I adjust?
```

### Step 2: Identify Domain Tags

Scan the feature description and context for domain signals:

| Signal | Domain Tag |
|--------|-----------|
| Login, JWT, Devise, roles, permissions | `auth` |
| New table, column, migration, schema | `database` |
| Stripe, credits, wallet, payment | `payments` |
| Student model, COPPA, under-13, guardianship | `students` |
| Action Cable, WebSocket, live update | `real-time` |
| Mailer, SendGrid, notification email | `email` |
| Stripe webhook, Google Calendar, Daily.co, Twilio | `external-api` |
| Dashboard, aggregation, slow query, N+1 | `performance` |
| Solid Queue, async, job, scheduled task | `background-jobs` |
| Endpoint, REST, serializer | `api-design` |
| RSpec, factory, test coverage | `testing` |
| UI component, frontend, React | `frontend` |

### Step 3: Determine Feature Slug

Generate a kebab-case slug for directory naming:
- "practice tracking system" → `practice-tracking`
- "booking cancellation" → `booking-cancellation`
- "AI curriculum generator" → `ai-curriculum-generator`

---

## DOCUMENT

### Create MANIFEST

Write to `docs/[feature-slug]/.dev/MANIFEST.md`:

```markdown
# DEV MANIFEST — [Feature Name]

**Feature:** [description from user]
**Created:** [today's date]
**Entry Mode:** [idea | spec | handover | bug]
**Tier:** [KNOWN | COMBINATION | NOVEL]
**Current Phase:** INTAKE
**Status:** In Progress

## Domains
- [domain tags from Step 2]

## Phase Progress
| # | Phase | Status | Started | Completed | Gate |
|---|-------|--------|---------|-----------|------|
| 0 | INTAKE | In Progress | [now] | | Auto |
| 1 | DISCOVER | Not Started | | | |
| 2 | PLAN | Not Started | | | |
| 3 | DOCUMENT | Not Started | | | |
| 4 | BUILD | Not Started | | | |
| 5 | VALIDATE | Not Started | | | |
| 6 | HANDOVER | Not Started | | | |
| 7 | SHIP | Not Started | | | |

## Decisions
[None yet — populated during PLAN]

## Waves
[None yet — populated during PLAN]

## Acceptance Criteria
[None yet — populated during PLAN]

## Artifacts
- MANIFEST: docs/[feature-slug]/.dev/MANIFEST.md

## Pause Context
[Not paused]
```

### Create Directories

```bash
mkdir -p docs/[feature-slug]/.dev/reports
mkdir -p docs/[feature-slug]/prompt-transitions
mkdir -p docs/[feature-slug]/tasks
mkdir -p docs/[feature-slug]/api
```

### Update MANIFEST

Mark INTAKE as complete:
```
| 0 | INTAKE | ✅ | [now] | [now] | Auto |
```

Update Current Phase to next phase based on entry mode.

---

## TRANSITION (Auto-Advance)

INTAKE has no gate — it auto-advances.

### Route Based on Entry Mode

| Entry Mode | Next Phase | Action |
|-----------|-----------|--------|
| Idea dump | DISCOVER | Invoke `/prompt-generator` → save to `prompt-transitions/discover.md` → advance to `/dev:discover` |
| Tech spec | DISCOVER | Invoke `/prompt-generator` with spec context → save → advance to `/dev:discover` |
| Frontend handover | HANDOVER | Invoke `/prompt-generator` → save to `prompt-transitions/handover.md` → advance to `/dev:handover` |
| Bug/issue | BUILD | Invoke `/prompt-generator` → save to `prompt-transitions/build.md` → advance to `/dev:build` (which will invoke `/investigate`) |

### Prompt Transition Contents

The /prompt-generator output for the next phase MUST include:
- Feature name and description
- Tier classification and reasoning
- Domain tags
- Entry mode
- MANIFEST path
- Any specs or references provided by user
- Specific instructions for the next phase based on tier

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Over-classifying as NOVEL | Most features are COMBINATION. NOVEL = genuinely no existing pattern |
| Missing domain tags | Scan feature description AND the models/tables it touches |
| Skipping tier confirmation | ALWAYS present tier to user — misclassification wastes entire pipeline |
| Creating empty MANIFEST | Every field must have a value, even if "None yet" |
