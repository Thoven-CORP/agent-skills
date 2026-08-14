---
name: technical-spec-generator
description: Generate PM-level technical specifications ready to hand to Claude Code. Guides through problem, goals, flows, scope, and edge cases - leaving architecture decisions to the coding agent who has actual codebase context. Use when moving from feature planning to implementation handoff.
---

# Technical Spec Generator

## Overview

Create a PM-level specification that's ready to hand to Claude Code. This skill guides you through key product questions, then generates a spec focused on **what to build and why** - leaving **how to implement** to Claude Code with full codebase context.

**Philosophy:** The coding agent has access to DB architecture, dependencies, and existing patterns. Your spec should give them requirements and constraints, not prescribe implementation.

---

## Workflow

### Phase 1: Gather Context (Questions)

Ask these questions conversationally, one section at a time. Use multiple choice via AskUserQuestion when options are clear.

#### Step 1: Problem & Context

- **What problem are we solving?** (Who has it, what does it cost them?)
- **Why now?** (Market/business context)
- **How do we know this is real?** (Evidence: interviews, data, support tickets)

#### Step 2: Goals & Success Metrics

- **Product Goal** - What outcome are we driving?
- **User Outcome** - What does the user experience?
- **Business Metric** - How will we measure impact?
- **Leading Indicator** - What shows early progress?

#### Step 3: Feature Overview

- **What are we building?** (Plain English, 2-3 sentences)
- **How does it work?** (Basic happy path)
- **Key capabilities** (List core features)

#### Step 4: User Flows

- **Primary flow** (Step-by-step happy path)
- **Supporting flows** (2-3 other important paths)
- **Edge cases** (2-3 things that could break)

#### Step 5: Scope

- **In scope** for this release
- **Out of scope** (good ideas for later)

#### Step 6: Dependencies & Constraints (Light)

Keep this conceptual - no specific tables or schemas:

- **Data needed** (e.g., "user info, booking records, teacher availability")
- **Systems involved** (e.g., "notifications, payments integration")
- **Key constraints** (e.g., "must handle X concurrent users", "timezone-aware")

#### Step 7: Edge Cases & Error Handling

- **What can go wrong?** (2-3 biggest risks)
- **What should happen?** (Expected behavior for each)

---

### Phase 2: Design Exploration (Frontend Features Only)

**For features with UI/UX components**, invoke the brainstorming skill to explore design options:

1. **Invoke brainstorming skill** with the context gathered so far
2. Focus on: UI patterns, interaction models, visual hierarchy, mobile considerations
3. Generate **2-3 viable design approaches** with tradeoffs
4. Capture these as "Design Options for Discussion" to include in the spec

**Skip this phase for:**
- Pure backend features (APIs, data processing, etc.)
- Infrastructure work
- Bug fixes

---

### Phase 3: Generate Spec

After gathering answers (and design exploration if applicable), generate a markdown spec with these sections:

```markdown
# [Feature Name] Spec

**Date**: YYYY-MM-DD
**Status**: Ready for Implementation

## Problem & Context
[From Step 1 - why this matters, evidence]

## Goals & Success Metrics
| Type | Target |
|------|--------|
| Product Goal | [outcome] |
| User Outcome | [experience] |
| Business Metric | [measurable] |
| Leading Indicator | [early signal] |

## Feature Overview
[From Step 3 - what we're building, how it works]

### Key Capabilities
- Capability 1
- Capability 2
- ...

## User Flows

### Primary Flow
1. Step 1
2. Step 2
3. ...

### Supporting Flows
**[Flow Name]**: Description

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| [edge case] | [what should happen] |

## Scope

### In Scope
- Item 1
- Item 2

### Out of Scope
- Item 1 (reason/future consideration)
- Item 2

## Dependencies & Constraints
- **Data needed**: [conceptual - what info is required]
- **Systems involved**: [what services/integrations]
- **Constraints**: [performance, compliance, etc.]

## Error Handling
| Risk | Mitigation |
|------|------------|
| [what can go wrong] | [expected behavior] |

## Success Metrics
[How we'll know this worked - from Step 2]
```

---

### Phase 4: Save & Track

1. **Save spec** to `PRD's & Technical Specs/[Feature Name] Spec.md`
2. **Create Sprint (if applicable)** in Notion Sprint List
3. **Create Dev Tracker task** in Notion using structured template
4. **Offer to generate implementation prompt** if needed

---

## Dev Tracker Task Creation

When creating Dev Tracker tasks for PRDs/Epics, use this structured format:

**Task Properties:**
- **Feature / Item**: "[Feature Name] - [Brief Description]"
- **Epic**: [Select from: Setup Backend, Migrate Legacy Frontend, Routing & Navigation, Integration, Sign-Up & Application, Tax Compliance, Thovie Rollout Sprint]
- **Status**: "Mockup/Documentation"
- **Priority**: [High/Medium/Low based on business impact]
- **Link to PRD**: File path to spec in vault
- **Notes**: Link to Sprint if created

**Task Content Template:**

```markdown
## Overview
[1-2 sentence problem/solution summary]

## Implementation Checklist

### Frontend
- [ ] [UI component/screen 1]
- [ ] [UI component/screen 2]
- [ ] [Interaction/behavior]
- [ ] [Mobile-first responsive design]

### Backend
- [ ] [API endpoint/service 1]
- [ ] [Data model/schema changes]
- [ ] [Integration with external service]
- [ ] [Business logic implementation]

### Analytics
- [ ] [Core events instrumented]
- [ ] [Meta Pixel events (if applicable)]
- [ ] [Mixpanel funnels]
- [ ] [A/B test tracking (if applicable)]
- [ ] [Dashboard setup]

### Email (if applicable)
- [ ] [Email template 1]
- [ ] [Email service integration]
- [ ] [Delivery testing]

### Testing
- [ ] [Manual QA - happy path + edge cases]
- [ ] [Mobile device testing]
- [ ] [Analytics event validation]
- [ ] [A/B test variant routing (if applicable)]

## Success Metrics
[How we'll validate this worked - specific numbers/percentages from spec]

## Open Questions
- [Question 1 - need to check in code]
- [Question 2 - needs decision]

## Links
- **PRD**: [File path to spec]
- **Sprint**: [Link to Sprint List entry if created]
```

**Notion API Usage:**

Use `notion-create-pages` with:
- **parent**: `{"type": "data_source_id", "data_source_id": "f0c5c186-7c5f-4c25-89d8-775a4426da5a"}`
- **properties**: Feature name, Epic, Status, Priority, Link to PRD
- **content**: Use template above with feature-specific checklist items

---

## What NOT to Include

Per user preference, specs should NOT include:
- Code examples
- Specific database schemas
- Architecture decisions
- API endpoint definitions
- Implementation details

**Why:** The Replit coding agent has actual codebase context (DB architecture, dependencies, existing patterns). Let it make implementation decisions.

**Exception:** Include architecture specifics only if explicitly discussed during brainstorming.

---

## Handoff Instructions

When handing the spec to Claude Code, include:

> "Here's the spec for [Feature Name]. You have full codebase access, so:
> - Validate requirements against existing patterns
> - Reuse existing services where appropriate
> - Make architecture decisions based on actual codebase
> - Flag anything in the spec that conflicts with current implementation
> - Ask clarifying questions if requirements are ambiguous"

---

## Quality Checklist

Before handoff, verify:

**Spec Content:**
- [ ] Problem includes concrete evidence (numbers, quotes, data)
- [ ] Success metrics are measurable (not vague)
- [ ] User flows cover happy path + key edge cases
- [ ] Scope clearly separates in/out
- [ ] Dependencies are conceptual, not prescriptive
- [ ] Edge cases have expected behaviors defined
- [ ] Spec could be understood without asking questions

**Notion Tracking:**
- [ ] Sprint created in Sprint List (if applicable)
- [ ] Dev Tracker task created with structured template
- [ ] Task content includes Overview, Implementation Checklist (Frontend/Backend/Analytics/Email/Testing), Success Metrics, Open Questions
- [ ] Task properties set: Epic, Status (Mockup/Documentation), Priority, Link to PRD
- [ ] Links between Sprint and Dev Tracker task established
