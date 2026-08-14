---
name: product-strategy-brainstorming
description: Structure product ideation using RICE/ICE prioritization, jobs-to-be-done frameworks, and PRD templates. Use when evaluating new features, planning roadmaps, or deciding what to build next for Thoven.
---

# Product Strategy & Feature Brainstorming

Transform scattered product ideas into a prioritized, validated roadmap. This skill provides frameworks for generating, evaluating, and specifying features systematically.

## When to Use This Skill

- Brainstorming new feature ideas
- Prioritizing what to build next
- Creating PRDs for implementation
- Evaluating feature requests from users
- Planning quarterly roadmaps
- Deciding between competing priorities

---

## Jobs-to-Be-Done Framework

Before building features, understand the underlying job customers are trying to accomplish.

### The JTBD Statement Format

```
When [SITUATION],
I want to [MOTIVATION],
so I can [EXPECTED OUTCOME].
```

### Thoven JTBD Examples

```
TEACHER JOBS
════════════════════════════════════════════════

JOB 1: Progress Communication
─────────────────────────────
When a parent asks how their child is doing,
I want to provide specific, evidence-based feedback,
so I can demonstrate my value and keep them engaged.

JOB 2: Schedule Management
─────────────────────────────
When a student cancels last-minute,
I want to quickly fill that slot,
so I can maintain my income and help another student.

JOB 3: Student Motivation
─────────────────────────────
When a student loses interest in practice,
I want to identify what's causing the disconnect,
so I can adjust my approach before they quit.

JOB 4: Professional Growth
─────────────────────────────
When I hit a ceiling with my current students,
I want to expand my reach efficiently,
so I can grow my studio without burning out.
```

### Job Map: The Hiring Process

Customers "hire" products to do jobs. Map the full hiring journey:

```
JOB MAP: COMMUNICATING STUDENT PROGRESS
═══════════════════════════════════════════════════════════════

1. DEFINE          2. LOCATE           3. PREPARE
   What needs         Gather            Organize info
   to be              relevant          into shareable
   communicated?      information       format
       │                  │                  │
       ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │ Lesson  │       │ Review  │       │ Write   │
   │ ended,  │  ───► │ notes,  │  ───► │ email/  │
   │ parent  │       │ track   │       │ report  │
   │ wants   │       │ progress│       │         │
   │ update  │       │         │       │         │
   └─────────┘       └─────────┘       └─────────┘
       │                  │                  │
   PAIN: Not sure     PAIN: Info in      PAIN: Takes
   what to share      multiple places    30+ min

4. EXECUTE          5. CONFIRM          6. MODIFY
   Send the           Ensure parent      Adjust based
   communication      received and       on response
                      understood
       │                  │                  │
       ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │ Email   │       │ Wait    │       │ Answer  │
   │ or text │  ───► │ for     │  ───► │ follow- │
   │ parent  │       │ response│       │ up Qs   │
   │         │       │         │       │         │
   └─────────┘       └─────────┘       └─────────┘
       │                  │                  │
   PAIN: Multiple     PAIN: Often       PAIN: More
   channels           no response       time spent

WHERE THOVEN HELPS:
═══════════════════
• Steps 2-3: Auto-gather and format
• Step 4: One-click send
• Step 5: Track opens/engagement
• Step 6: AI suggests responses
```

---

## Feature Prioritization: RICE Framework

Score every feature idea on four dimensions:

### The Formula

```
RICE SCORE = (Reach × Impact × Confidence) / Effort
```

### Dimension Definitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    RICE DIMENSIONS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REACH                                                           │
│  ─────                                                           │
│  How many users will this affect in a given time period?         │
│                                                                  │
│  Examples for Thoven (per quarter):                              │
│  • Affects all teachers: 10 (your current WAU)                  │
│  • Affects teachers with 5+ students: 6                         │
│  • Affects only new signups: 2                                  │
│                                                                  │
│  IMPACT                                                          │
│  ──────                                                          │
│  How much will this move the needle for those users?             │
│                                                                  │
│  Scale:                                                          │
│  3 = Massive impact (changes how they work)                      │
│  2 = High impact (significant improvement)                       │
│  1 = Medium impact (noticeable improvement)                      │
│  0.5 = Low impact (minor improvement)                            │
│  0.25 = Minimal impact                                           │
│                                                                  │
│  CONFIDENCE                                                      │
│  ──────────                                                      │
│  How sure are you about your estimates?                          │
│                                                                  │
│  Scale:                                                          │
│  100% = High confidence (data-backed)                            │
│  80% = Medium confidence (some evidence)                         │
│  50% = Low confidence (gut feeling)                              │
│                                                                  │
│  EFFORT                                                          │
│  ──────                                                          │
│  How many person-months to ship this?                            │
│                                                                  │
│  Examples:                                                       │
│  0.5 = Half a month                                              │
│  1 = One month                                                   │
│  3 = One quarter                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### RICE Scoring Template

| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| Auto progress reports | 10 | 3 | 80% | 2 | 12 |
| Gamification XP | 10 | 1 | 50% | 1 | 5 |
| Marketplace SEO | 20 | 2 | 60% | 1 | 24 |
| Parent mobile app | 10 | 2 | 40% | 3 | 2.7 |

**Calculation example:**
Auto progress reports = (10 × 3 × 0.80) / 2 = 12

---

## ICE Framework (Faster Alternative)

When you need quick prioritization without detailed analysis:

### The Formula

```
ICE SCORE = (Impact + Confidence + Ease) / 3
```

### Dimension Definitions

| Dimension | Scale | Question |
|-----------|-------|----------|
| Impact | 1-10 | How much will this move our key metric? |
| Confidence | 1-10 | How sure am I this will work? |
| Ease | 1-10 | How easy is this to implement? |

### ICE vs RICE Decision Guide

| Use ICE When | Use RICE When |
|--------------|---------------|
| Quick prioritization needed | Strategic planning |
| Early-stage exploration | Roadmap commitments |
| Many ideas to filter | Stakeholder buy-in needed |
| Internal alignment | External communication |

---

## Opportunity Solution Tree

Map opportunities to solutions visually:

```
OPPORTUNITY SOLUTION TREE
═══════════════════════════════════════════════════════════════

                    OUTCOME
            "Increase teacher retention"
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   OPPORTUNITY     OPPORTUNITY     OPPORTUNITY
   "Save time      "Improve        "Grow their
    on admin"       income"         studio"
        │               │               │
   ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
   ▼         ▼     ▼         ▼     ▼         ▼
SOLUTION  SOLUTION SOLUTION SOLUTION SOLUTION SOLUTION
"Auto     "One-   "Price   "Upsell "Refer-  "Market-
 reports"  click   suggest" prompts" rals"    place"
           sched"

SELECTION CRITERIA:
───────────────────
For each solution, ask:
• Does it address the opportunity directly?
• Can we build it in < 1 month?
• Do we have evidence users want this?
• Does it compound over time?
```

---

## Brainstorming Techniques

### 0. Rapid Idea Generation (Create-Ideas)

Before filtering through frameworks, generate volume. Quantity first, quality later.

**How to Run:**

Launch a creative sampling agent to generate 20+ raw ideas:

```
Task tool:
  subagent_type: "general-purpose"
  model: "sonnet"
  prompt: |
    Generate 20+ feature ideas for Thoven (AI-native music education marketplace).

    CONTEXT:
    [Current state: stage, WAU, key pain points]

    TARGET OUTCOME:
    [What metric or experience are we trying to improve?]

    RULES:
    - Generate AT LEAST 20 ideas. More is better.
    - Mix practical (build this week) with ambitious (build this quarter)
    - Include at least 3 "that's crazy but..." ideas
    - One sentence per idea, no explanations yet
    - Don't self-censor — duplicates and overlaps are fine

    OUTPUT FORMAT:
    Number each idea 1-N. Just the idea, one line each.
```

**After generation:**

1. **Deduplicate** — Merge overlapping ideas into themes
2. **Quick-filter** — Remove anything that fails the Seibel test ("Can we ship a version this week?")
3. **Forward survivors** — Run remaining ideas through RICE scoring below

**When to skip this step:** If you already have a clear list of 5+ ideas from user conversations. Don't generate for the sake of generating.

### 1. Constraint Removal

Remove constraints one at a time and imagine solutions:

```
CONSTRAINT REMOVAL EXERCISE
═══════════════════════════════════════════════════════════════

What would Thoven look like if...

NO TIME CONSTRAINT
──────────────────
"If teachers had unlimited time, what would they do?"
→ Personal video messages to every parent
→ Detailed lesson breakdowns
→ Individual practice plans

THOVEN SOLUTION: AI does the time-consuming parts

NO SKILL CONSTRAINT
───────────────────
"If teachers were experts at everything?"
→ Perfect marketing copy
→ Data analysis of student progress
→ Therapeutic communication skills

THOVEN SOLUTION: AI provides expert-level assistance

NO TECHNOLOGY CONSTRAINT
────────────────────────
"If any technology existed?"
→ Real-time practice monitoring
→ Automatic performance analysis
→ AI that can hear and evaluate music

THOVEN SOLUTION: Build toward this vision incrementally
```

### 2. Worst Possible Idea

Generate intentionally bad ideas, then invert:

| Worst Idea | Inversion | Feature Idea |
|------------|-----------|--------------|
| Make parents wait a month for updates | Real-time progress visibility | Live progress dashboard |
| Require 10 clicks to log a lesson | Zero-click lesson logging | Auto-log from calendar |
| Send progress in complex jargon | Plain-language explanations | AI translation layer |

### 3. Analogous Inspiration

What do adjacent industries do well?

```
ANALOGOUS INSPIRATION
═══════════════════════════════════════════════════════════════

FITNESS APPS (Peloton, Strava)
────────────────────────────────
• Social sharing of achievements
• Streaks and consistency tracking
• Leaderboards and challenges
→ Apply to: Practice gamification

HEALTHCARE (Patient portals)
────────────────────────────────
• Clear progress visualizations
• Appointment reminders
• Secure messaging with providers
→ Apply to: Parent communication

FINTECH (Mint, YNAB)
────────────────────────────────
• Automatic categorization
• Insights from data
• Goal tracking
→ Apply to: Studio business health
```

---

## PRD Template

When a feature is prioritized, spec it properly:

```markdown
# PRD: [Feature Name]

## Overview
**Goal:** [One sentence describing the outcome]
**Owner:** [Who's responsible]
**Status:** Draft | In Review | Approved | In Development

## Problem Statement
[2-3 sentences describing the problem this solves]

### User Stories
- As a [user type], I want to [action], so that [benefit]
- As a [user type], I want to [action], so that [benefit]

## Success Metrics
| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| [Metric 1] | X | Y | Z weeks |
| [Metric 2] | X | Y | Z weeks |

## Solution

### User Flow
1. User does X
2. System responds with Y
3. User completes Z

### Requirements
**Must Have (P0)**
- [ ] Requirement 1
- [ ] Requirement 2

**Should Have (P1)**
- [ ] Requirement 3
- [ ] Requirement 4

**Nice to Have (P2)**
- [ ] Requirement 5

### Out of Scope
- [What we're explicitly NOT building]

## Design
[Link to Figma/mockups]

## Technical Considerations
- [API requirements]
- [Data model changes]
- [Dependencies]

## Rollout Plan
1. Phase 1: [Scope]
2. Phase 2: [Scope]

## Open Questions
- [ ] Question 1
- [ ] Question 2
```

---

## Roadmap Planning

### The Now / Next / Later Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROADMAP: NOW / NEXT / LATER                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NOW (Current quarter)                                           │
│  ═════════════════════                                           │
│  Committed work. High confidence.                                │
│                                                                  │
│  • Feature A (In progress - 60%)                                │
│  • Feature B (Starting next week)                               │
│  • Bug fix C (This sprint)                                      │
│                                                                  │
│  NEXT (Next quarter)                                             │
│  ══════════════════                                              │
│  Planned but not started. Medium confidence.                     │
│                                                                  │
│  • Feature D (Pending research)                                  │
│  • Feature E (Design in progress)                               │
│  • Initiative F (Scoping)                                       │
│                                                                  │
│  LATER (Future)                                                  │
│  ═════════════                                                   │
│  Ideas for the future. Low confidence.                           │
│                                                                  │
│  • Vision item G                                                 │
│  • Exploratory item H                                           │
│  • User request I                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Roadmap Review Cadence

| Timeframe | Activity |
|-----------|----------|
| Weekly | Update % complete on NOW items |
| Bi-weekly | Re-prioritize NEXT based on learnings |
| Monthly | Review LATER, promote to NEXT |
| Quarterly | Full roadmap reset and re-prioritization |

---

## Feature Validation Checklist

Before building, validate:

### User Evidence
- [ ] 3+ users have explicitly requested this
- [ ] Observed behavior supports the need
- [ ] Willingness to pay/use is confirmed

### Strategic Fit
- [ ] Aligns with current company priorities
- [ ] Doesn't fragment the product vision
- [ ] Can be shipped in < 1 month (MVP)

### Technical Feasibility
- [ ] Core team can build this
- [ ] No major architectural changes required
- [ ] Dependencies are manageable

### Business Impact
- [ ] Clear metric it will move
- [ ] Measurement plan in place
- [ ] Worth the opportunity cost

---

## Quick Decision Matrix

For rapid feature decisions:

```
                     HIGH IMPACT
                         │
          BUILD          │         BUILD
          (if easy)      │         (definitely)
                         │
    LOW ─────────────────┼───────────────── HIGH
    CONFIDENCE           │               CONFIDENCE
                         │
          SKIP           │         TEST
          (or research)  │         (validate first)
                         │
                     LOW IMPACT
```

---

## Thoven Feature Backlog Template

Maintain a living backlog with this structure:

| ID | Feature | RICE Score | Status | Owner | Notes |
|----|---------|------------|--------|-------|-------|
| F001 | Auto progress reports | 12 | In Dev | Andres | v1 shipping this week |
| F002 | Practice reminders | 8 | Next | - | Needs design |
| F003 | Parent mobile app | 2.7 | Later | - | Low priority now |
| F004 | Marketplace SEO | 24 | Now | Andres | Quick win |

Review weekly. Re-score monthly.
