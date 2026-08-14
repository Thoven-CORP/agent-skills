---
name: audit
category: quality
type: audit
description: "Prompt template for code audits, security reviews, performance assessments, and compliance checks"
triggers:
  - "audit", "review", "assess", "compliance check", "security review"
frameworks: [checklist-driven, few-shot-examples]
---

# Audit Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria
- [ ] Output format specified
- [ ] Evaluation criteria and severity levels
- [ ] Scope of audit (which files/systems)
- [ ] Output format (findings table, prioritized list)
- [ ] Baseline/standard being audited against
- [ ] Actionable recommendation requirement

## Recommended Sections
1. **Audit Goal** — What to assess and why
2. **Scope** — Files, systems, or areas to audit
3. **Standard/Baseline** — What to audit against (WCAG, OWASP, internal standards)
4. **Severity Levels** — How to classify findings (Critical/High/Medium/Low)
5. **Output Format** — Findings table with severity, location, recommendation
6. **Exclusions** — What's explicitly out of scope

## Framework
**Checklist-driven + few-shot examples.** Audit prompts should provide clear evaluation criteria and severity definitions. Include 1-2 example findings to calibrate severity expectations.

## Example

### Audit Goal
Assess WCAG 2.1 AA accessibility compliance for the teacher marketplace pages.

### Scope
- `app/marketplace/page.tsx` and all child components
- `app/teacher/[id]/page.tsx` and profile components
- Navigation and search functionality on these pages

### Standard
WCAG 2.1 Level AA guidelines, specifically:
- 1.1.1 Non-text Content (alt text)
- 1.4.3 Contrast (Minimum)
- 2.1.1 Keyboard
- 2.4.7 Focus Visible
- 4.1.2 Name, Role, Value (ARIA)

### Severity Levels
- **Critical:** Blocks entire user groups (no keyboard access, missing alt text on functional images)
- **High:** Significantly impairs experience (poor contrast, missing ARIA labels)
- **Medium:** Reduces usability (inconsistent focus order, missing skip links)
- **Low:** Best practice improvements (redundant ARIA, suboptimal heading hierarchy)

### Output Format
| # | Severity | Location | Issue | WCAG Criterion | Recommendation |
|---|----------|----------|-------|----------------|----------------|
| 1 | Critical | TeacherCard.tsx:42 | Image has no alt text | 1.1.1 | Add descriptive alt: "Teacher photo of {name}" |

### Exclusions
- Third-party embedded widgets
- Admin-only pages
- Print stylesheets
