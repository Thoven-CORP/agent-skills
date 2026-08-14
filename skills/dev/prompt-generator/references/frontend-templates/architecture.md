---
name: architecture
category: design
type: architecture
description: "Prompt template for architecture design, system design, and technical planning"
triggers:
  - "design", "architect", "system design", "technical plan", "data model"
frameworks: [tree-of-thoughts, multi-option-evaluation]
---

# Architecture Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria
- [ ] Output format specified
- [ ] Constraints (scale, performance, compatibility)
- [ ] Tradeoff dimensions to evaluate
- [ ] Decision criteria (what makes one approach better)
- [ ] Integration points with existing systems
- [ ] Migration/rollback considerations
- [ ] Non-goals (what NOT to over-engineer)

## Recommended Sections
1. **Goal** — What architectural decision needs to be made
2. **Context** — Current system state, existing patterns, constraints
3. **Constraints** — Scale, performance, budget, compatibility, timeline
4. **Requirements** — What the architecture must support
5. **Evaluation Criteria** — How to compare approaches (weighted if possible)
6. **Options to Explore** — Seed 2-3 approaches to evaluate
7. **Integration Points** — How this connects to existing systems
8. **Non-Goals** — What to explicitly NOT optimize for
9. **Expected Output** — Architecture decision doc, diagrams, migration plan

## Framework
**Tree of Thoughts / multi-option evaluation.** Architecture prompts should explore multiple approaches, evaluate tradeoffs, and justify the chosen path. Avoid anchoring on a single solution.

## Example

### Goal
Design the data architecture for a student practice tracking system that records practice sessions, tracks progress over time, and feeds into an AI-powered recommendation engine.

### Context
- Existing Rails backend with PostgreSQL
- Current student model has basic profile data only
- No existing practice data storage
- Frontend is Next.js 14 with React Context state management

### Constraints
- Must support offline-first (students practice without internet)
- PostgreSQL for relational data (existing infra)
- Sub-200ms API response times for dashboard queries
- COPPA compliant (students may be under 13)

### Evaluation Criteria
1. Query performance for dashboard aggregations (weight: high)
2. Offline sync complexity (weight: high)
3. Schema flexibility for future practice types (weight: medium)
4. Migration effort from current schema (weight: low)

### Options to Explore
- **Option A:** Normalized relational (sessions, exercises, metrics tables)
- **Option B:** Event-sourced (append-only practice events, materialized views)
- **Option C:** Hybrid (relational for structure, JSONB for flexible metrics)

### Non-Goals
- Real-time multiplayer practice (future phase)
- Video/audio storage (separate system)
- ML model training pipeline (just data collection for now)

### Expected Output
1. Recommended architecture with justification
2. Entity-relationship diagram
3. API endpoint design for CRUD + aggregations
4. Migration plan from current schema
5. Offline sync strategy
