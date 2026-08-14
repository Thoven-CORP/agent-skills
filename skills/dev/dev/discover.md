---
name: dev-discover
description: Use when exploring the solution space for a feature after INTAKE classification. Translates ideas into technical designs at tier-appropriate depth. Triggers on /dev:discover or pipeline advancement past INTAKE.
---

# /dev:discover — Brainstorm + Explore the Solution Space

## Purpose

Translate the feature idea into a technical design. Nothing is locked yet — DISCOVER explores WHAT we're building. PLAN (next phase) decides HOW and locks decisions.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH

### 1. Read MANIFEST

```
Read: docs/[feature]/.dev/MANIFEST.md
  → Get: tier, domains, entry mode, feature description
```

### 2. Read Prompt Transition

```
Read: docs/[feature]/prompt-transitions/discover.md
  → Load context from INTAKE phase
```

### 3. Codebase Context (tier-dependent)

**KNOWN tier — Quick scan:**
- Search for existing patterns matching this feature type
- Read 1-2 similar controller/service/model files as reference

**COMBINATION tier — Standard exploration:**
- Search all related models, services, controllers
- Read recent commits in affected areas
- Check `docs/` for related plans or specs
- Read `.claude/docs/COMMON_ERRORS.md` for pitfalls in affected domains

**NOVEL tier — Deep research:**
- All of the above PLUS:
- Launch `Explore` agent for comprehensive codebase analysis of affected areas
- Check external documentation (Context7) for unfamiliar libraries/patterns

---

## EXECUTE

### Invoke /brainstorm (Mode Determined by Tier)

**KNOWN → Quick brainstorm:**
- 2-3 clarifying questions max
- Present 2 approaches, recommend one
- Brief design (3-5 paragraphs)

**COMBINATION → Standard brainstorm:**
- Full `/brainstorm` skill execution
- One question at a time, multiple choice preferred
- 2-3 approaches with trade-offs
- Design doc with all 6 sections: Architecture, Data Model, API Design, Business Logic, Edge Cases, Analytics

**NOVEL → Deep brainstorm + TeamCreate:**

1. First, run Standard brainstorm to establish baseline understanding
2. Then, launch TeamCreate for collaborative exploration:

```
TeamCreate:
  Team: "[feature-name]-architecture"
  Members:
    - name: "architect"
      role: "Feature Architect — designs the technical solution"
    - name: "critic"
      role: "Devil's Advocate — challenges assumptions, finds edge cases"
    - name: "researcher"
      role: "Domain Researcher — investigates patterns, libraries, prior art"

  Initial task for architect:
    "Propose a technical architecture for [feature]. Consider [domains]. Reference existing patterns in app/services/ and app/models/."

  Initial task for critic:
    "Wait for architect's proposal, then challenge it. Focus on: scalability, edge cases, production data messiness, auth complexity."

  Initial task for researcher:
    "Research how [feature-type] is typically implemented in Rails. Check Context7 for relevant library patterns. Look for similar implementations in this codebase."
```

3. After TeamCreate debate, synthesize findings
4. If debate surfaces multiple strong approaches with no clear winner:
   - Invoke `/expert-team` Architecture mode for competitive evaluation
   - Present winning approach to user

### Bug/Issue Mode (Entry Mode = bug)

If entry mode is `bug`, DISCOVER is shortened:
- Skip brainstorm
- Instead: classify bug type per `/investigate` bug classification table
- Identify affected areas and domains
- Set up for BUILD phase which will invoke `/investigate`

---

## DOCUMENT

### 1. Write Design Doc

Save to `docs/plans/YYYY-MM-DD-[feature-slug]-design.md`

For KNOWN tier: Brief design (architecture, data model, key decisions)
For COMBINATION/NOVEL tier: Full design with all 6 sections

### 2. Log Deferred Ideas

If brainstorm surfaced ideas beyond current scope:
- Invoke `/future-improvements` for each deferred idea

### 3. Update MANIFEST

```markdown
## Phase Progress
| 1 | DISCOVER | ✅ | [started] | [now] | [Approved/Pending] |

## Artifacts
- Design: docs/plans/YYYY-MM-DD-[feature-slug]-design.md
```

Add any new domain tags discovered during brainstorm.

---

## GATE (Tier-Dependent)

### KNOWN Tier Gate

```
PHASE GATE: DISCOVER (Quick)
  Approach: [recommended approach, 1-2 sentences]
  Key decisions (proposed, not locked):
    - [decision 1]
    - [decision 2]
  Next phase: PLAN

  Options:
    1. Approve → advance to PLAN
    2. Revise → explore different approach
    3. Pause → /dev:pause
```

### COMBINATION Tier Gate

```
PHASE GATE: DISCOVER (Standard)
  Summary: [what was designed]
  Design doc: [path]
  Sections covered:
    ✅ Architecture
    ✅ Data Model
    ✅ API Design
    ✅ Business Logic
    ✅ Edge Cases
    ✅ Analytics
  Deferred ideas: [count] logged to FUTURE_IMPROVEMENTS.md
  Next phase: PLAN

  Options:
    1. Approve → advance to PLAN
    2. Revise → address feedback on design
    3. Pause → /dev:pause
```

### NOVEL Tier Gate

```
PHASE GATE: DISCOVER (Deep)
  Summary: [what was designed]
  Design doc: [path]
  TeamCreate debate summary:
    - Architect proposed: [summary]
    - Critic challenged: [key concerns]
    - Researcher found: [relevant patterns]
    - Synthesis: [resulting design]
  [If expert-team used]: Architecture decision: [winner and why]
  Deferred ideas: [count]
  Next phase: PLAN

  Options:
    1. Approve → advance to PLAN
    2. Revise → re-explore with different constraints
    3. Pause → /dev:pause
```

---

## TRANSITION

On approval:

1. Invoke `/prompt-generator` to create PLAN phase prompt
2. Save to `docs/[feature]/prompt-transitions/plan.md`
3. Contents MUST include:
   - Feature summary
   - Approved design decisions (PROPOSED — not locked yet)
   - Models and domains identified
   - Open questions for PLAN research
   - Agents to dispatch based on domains (from MANIFEST domain-agent map)
   - Reference paths: design doc, MANIFEST
   - Tier (drives PLAN depth)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Locking decisions in DISCOVER | DISCOVER proposes, PLAN locks. Nothing is final here. |
| Skipping brainstorm for KNOWN tier | Even KNOWN gets Quick brainstorm — confirms assumptions |
| Using expert-team as default in DISCOVER | Expert-team only AFTER TeamCreate surfaces genuinely contested approaches with no clear winner. Default is TeamCreate only. |
| Not logging deferred ideas | Every "not now" idea gets `/future-improvements` |
| Skipping analytics section | Analytics is REQUIRED per STANDARD_FEATURE_DEVELOPMENT_PROCEDURE |
