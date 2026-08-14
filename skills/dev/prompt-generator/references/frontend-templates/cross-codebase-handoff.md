---
name: cross-codebase-handoff
category: cross-codebase-handover
type: architecture
description: "Handoff prompt from one codebase (e.g. frontend) to another (e.g. backend) for architectural exploration and debate. Requirements-only -- the receiving side owns architecture decisions."
triggers:
  - "handover to backend"
  - "backend prompt"
  - "create exploration handover"
  - "cross-codebase feature exploration needed"
frameworks: [tree-of-thoughts, multi-option-evaluation]
---

# Feature Exploration Handover Template

## Quality Checklist
- [ ] Clear task title and one-line problem summary
- [ ] Business context with problem and solution
- [ ] Data contract with exact JSON shape
- [ ] Data rules (non-negotiable constraints)
- [ ] "What we don't care about" section filled in
- [ ] Architectural options seeded (2-3 approaches)
- [ ] Debate focus areas numbered
- [ ] Existing endpoint reference with response shape
- [ ] Stakeholder decisions already made documented
- [ ] Scale context and guidance provided
- [ ] Debate skill specified for receiving side

## When to Use

When one codebase (typically frontend) needs the other (typically backend) to explore, debate, and decide on the best architectural approach for a new feature. The sending side defines WHAT it needs; the receiving side decides HOW.

Key traits:
- **Debate-first, not implement-first** -- triggers an architectural debate skill before any code
- **Requirements-only** -- business context + data contract, zero prescriptive architecture
- **Receiving side owns the decision** -- explicitly states what the sender doesn't care about

## Recommended Sections
1. **Task** — Clear action-oriented title and one-line problem summary
2. **Business Context** — Problem, solution, details, stakeholder decisions, scale
3. **Data Contract** — Exact JSON shape the sending side needs
4. **What We Don't Care About** — Explicitly frees the receiver to make decisions
5. **Architectural Options to Debate** — 2-3 seed approaches (not prescriptions)
6. **Debate Instructions** — Skill to invoke and focus areas
7. **Expected Output** — Architecture decision, endpoint spec, implementation plan
8. **Existing Reference** — Current endpoint shapes, auth patterns

## Framework
**Tree of Thoughts / multi-option evaluation.** The receiving side should explore multiple approaches, evaluate tradeoffs, and justify the chosen path through structured debate.

## Template

```
## Task: {TASK_TITLE}

{ONE_LINE_PROBLEM_SUMMARY}. Before implementing anything, invoke the `/{DEBATE_SKILL}` skill to debate the best architectural approach. The {SENDING_TEAM} team has documented the requirements below -- your job is to decide HOW to serve this data given your knowledge of the {RECEIVING_CONTEXT}.

## Business Context

**Problem:** {BUSINESS_PROBLEM}

**Solution:** {SOLUTION_SUMMARY}

{BUSINESS_DETAILS_TABLE_OR_LIST}

**Key Decision(s):** {CEO_OR_STAKEHOLDER_DECISIONS}

**Scale context:** {CURRENT_SCALE}. {SCALE_GUIDANCE}.

## {SENDING_TEAM} Data Contract

The {SENDING_TEAM} needs exactly {N} values per {ENTITY}:

```json
{DATA_CONTRACT_JSON}
```

**Rules:**
{DATA_RULES_LIST}

## What the {SENDING_TEAM} Does NOT Care About

{DONT_CARE_LIST}

The {SENDING_TEAM} just needs {SIMPLE_REQUIREMENT_SUMMARY}.

## Architectural Options to Debate

The {SENDING_TEAM} team identified broad approaches, but the {RECEIVING_TEAM} should decide:

{OPTIONS_LIST}

## Debate Instructions

Use the `/{DEBATE_SKILL}` skill to debate this with the following focus areas:

{NUMBERED_FOCUS_AREAS}

## Expected Output

After the debate, produce:

1. **Architecture decision** -- which option and why
2. **Endpoint spec** -- exact URL, request/response JSON, auth requirements
3. **Implementation plan** -- which files to create/modify, estimated effort
4. **Query/logic details** -- the actual queries or business logic needed
5. **Migration needs** -- any schema/infrastructure changes required (if any)

## Existing {ENTITY} Reference

The {SENDING_TEAM} currently calls:

```
{EXISTING_ENDPOINT_METHOD} {EXISTING_ENDPOINT_URL}
Authorization: {AUTH_MECHANISM}
```

Response shape:
```json
{EXISTING_RESPONSE_JSON}
```

{CLOSING_CONTEXT}
```

## Placeholders

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{TASK_TITLE}` | `Design API Architecture for Class Analytics Strip` | Clear action-oriented title |
| `{ONE_LINE_PROBLEM_SUMMARY}` | `The frontend needs per-class analytics data to display on teacher ClassCards` | What + where |
| `{DEBATE_SKILL}` | `expert-team` | The skill the receiving side should invoke to debate |
| `{SENDING_TEAM}` | `frontend` | Team/codebase sending the requirements |
| `{RECEIVING_TEAM}` | `backend` | Team/codebase making architecture decisions |
| `{RECEIVING_CONTEXT}` | `DB schema, existing endpoints, and Rails patterns` | What the receiver knows best |
| `{BUSINESS_PROBLEM}` | `After enrollment, ClassCard class code box becomes dead space` | Why this matters |
| `{SOLUTION_SUMMARY}` | `Replace class code box with 3 stat chips` | What we're building |
| `{BUSINESS_DETAILS_TABLE_OR_LIST}` | Table of stats with labels and business meaning | Rich context for debate |
| `{CEO_OR_STAKEHOLDER_DECISIONS}` | `Credits stat dropped -- teachers book all at once` | Decisions already made |
| `{CURRENT_SCALE}` | `~25 WAU, 3-5 classes per teacher` | Current usage numbers |
| `{SCALE_GUIDANCE}` | `Optimize for simplicity and speed, not scale` | How to weigh tradeoffs |
| `{N}` | `3` | Number of data points needed |
| `{ENTITY}` | `class` | The domain object being enriched |
| `{DATA_CONTRACT_JSON}` | `{"completed_sessions_count": 8, ...}` | Exact shape needed |
| `{DATA_RULES_LIST}` | `- Return 0 not null\n- No COPPA concern` | Non-negotiable rules |
| `{DONT_CARE_LIST}` | `- Whether it's a new or existing endpoint\n- SQL details` | Explicitly not prescribed |
| `{SIMPLE_REQUIREMENT_SUMMARY}` | `those 3 integers per class, reliably` | One-line need |
| `{OPTIONS_LIST}` | Options A, B, C with pros/cons | Debate seeds, not prescriptions |
| `{NUMBERED_FOCUS_AREAS}` | `1. DB Schema Fit\n2. Existing Patterns\n3. Query Performance` | What the debate should cover |
| `{EXISTING_ENDPOINT_METHOD}` | `GET` | HTTP method |
| `{EXISTING_ENDPOINT_URL}` | `/api/v1/teachers/classes` | Current endpoint URL |
| `{AUTH_MECHANISM}` | `Bearer <teacher_jwt>` | Auth pattern |
| `{EXISTING_RESPONSE_JSON}` | Full current response shape | Concrete context |
| `{CLOSING_CONTEXT}` | `Where and how is the backend's decision.` | Final framing |

## Key Principles

1. **Requirements, not architecture** -- the sender defines WHAT, the receiver decides HOW
2. **Debate before code** -- always trigger an exploration/debate skill first
3. **Options as seeds** -- present 2-3 approaches to kickstart debate, not to prescribe
4. **"Don't care" section is critical** -- explicitly frees the receiver to make decisions
5. **Include existing context** -- current endpoint shapes, scale numbers, auth patterns
6. **Business reasoning for each data point** -- so the receiver can make informed tradeoffs
7. **Stakeholder decisions already made** -- prevents re-litigating settled questions

## Anti-Patterns

- Do NOT prescribe database queries or model structure
- Do NOT specify which files to create on the receiving side
- Do NOT include implementation code snippets for the receiver
- Do NOT assume the receiver's architecture patterns -- let them discover
- Do NOT skip the "What we don't care about" section -- it's the key differentiator

## Workflow Position

```
Frontend feature planning -> [requirements clear] -> THIS TEMPLATE -> [prompt to backend] -> backend debate -> architecture decision -> implementation
```

## Example

See `docs/Teacher_Credit_Balance_Visibility/CLASS_ANALYTICS_STRIP_BACKEND_PROMPT.md` for a filled-in instance (Class Analytics Strip, 2026-03-05).
