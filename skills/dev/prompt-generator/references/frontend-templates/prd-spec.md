---
name: prd-spec
category: product
type: prd-spec
description: "Prompt template for PRD generation, feature specs, and product requirement documents"
triggers:
  - "PRD", "product spec", "feature spec", "requirements document", "user stories"
frameworks: [structured-sections, jtbd-framing]
---

# PRD/Spec Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria (quantifiable)
- [ ] Output format specified
- [ ] User stories or jobs-to-be-done
- [ ] Success metrics (quantifiable)
- [ ] Scope boundaries and non-goals
- [ ] Stakeholder context
- [ ] Timeline/phase awareness
- [ ] Technical constraints the spec must respect

## Recommended Sections
1. **Problem Statement** — What user problem this solves
2. **Jobs to Be Done** — User goals in JTBD format
3. **User Stories** — As a [role], I want [action], so that [benefit]
4. **Success Metrics** — Quantifiable measures of success
5. **Scope** — What's in v1, what's deferred
6. **Non-Goals** — What we're explicitly NOT building
7. **Technical Constraints** — Known limitations to design around
8. **Open Questions** — Decisions still needed

## Framework
**Structured sections + JTBD framing.** Product specs need user-centric structure. Frame everything from the user's perspective, with measurable success criteria.

## Example

### Problem Statement
Teachers have no visibility into their remaining class credits after purchasing a bundle, leading to support tickets and booking hesitation.

### Jobs to Be Done
- When I'm planning my teaching week, I want to see my available credits so I can decide whether to open more slots.
- When I'm running low on credits, I want to be notified so I can purchase more before running out.

### User Stories
1. As a teacher, I want to see my credit balance on my dashboard so I know how many classes I can still book.
2. As a teacher, I want a low-credit warning when I have fewer than 3 credits remaining.
3. As a teacher, I want to click through to purchase more credits directly from the warning.

### Success Metrics
- 50% reduction in "how many credits do I have?" support tickets within 30 days
- 20% increase in repeat bundle purchases within 60 days
- Credit balance viewed by 80%+ of active teachers weekly

### Scope
**v1:** Dashboard credit display, low-credit warning banner, link to purchase page.
**Deferred:** Credit history/transaction log, auto-purchase, credit sharing between teachers.

### Technical Constraints
- Credit data comes from `GET /api/v1/teachers/credit_balance` (existing endpoint)
- Must work with both Parent/Teacher auth system
- Dashboard already has a complex layout — credit display must fit without redesign
