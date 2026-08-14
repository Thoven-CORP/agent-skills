---
name: edtech-learning-science
description: Apply learning science principles (Bloom's taxonomy, spaced repetition, deliberate practice) and EdTech business models (Duolingo, Khan Academy) to music education features. Use when designing learning experiences, practice tools, or evaluating pedagogical soundness of AI responses.
---

# EdTech Principles & Learning Science

Build music education features grounded in how humans actually learn. This skill combines learning science research with successful EdTech patterns to ensure Thoven's features drive real learning outcomes.

## When to Use This Skill

- Designing practice tools or progress tracking
- Evaluating if AI responses are pedagogically sound
- Building gamification that drives learning (not just engagement)
- Creating curriculum structures or learning paths
- Validating features against learning science
- Studying successful EdTech models for inspiration

---

## Core Learning Science Principles

### 1. Bloom's Taxonomy

A hierarchy of cognitive skills, from basic to complex:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOOM'S TAXONOMY                              │
│                    (Revised, 2001)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      ▲ CREATE                                    │
│                     ╱ ╲ Produce original work                    │
│                    ╱   ╲ "Compose a piece in this style"        │
│                   ╱─────╲                                        │
│                  ╱EVALUATE╲                                      │
│                 ╱  Justify  ╲                                    │
│                ╱  decisions   ╲                                  │
│               ╱─────────────────╲                                │
│              ╱      ANALYZE      ╲                               │
│             ╱  Draw connections   ╲                              │
│            ╱   between concepts    ╲                             │
│           ╱─────────────────────────╲                            │
│          ╱         APPLY            ╲                            │
│         ╱   Use in new situations    ╲                           │
│        ╱   "Play this scale in G"     ╲                          │
│       ╱───────────────────────────────────╲                      │
│      ╱          UNDERSTAND                 ╲                     │
│     ╱   Explain concepts, interpret         ╲                    │
│    ╱   "Why does this chord sound sad?"      ╲                   │
│   ╱───────────────────────────────────────────╲                  │
│  ╱              REMEMBER                       ╲                 │
│ ╱    Recall facts, terms, basic concepts        ╲                │
│╱    "What are the notes in a C major chord?"     ╲               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Application to Thoven

| Bloom Level | Music Learning Example | Thoven Feature Opportunity |
|-------------|----------------------|---------------------------|
| Remember | Name notes on staff | Flashcard drills |
| Understand | Explain why a key signature works | AI explanations |
| Apply | Play a scale in a new key | Practice exercises |
| Analyze | Compare two interpretations | Listening assignments |
| Evaluate | Critique a performance | Self-assessment tools |
| Create | Compose original piece | Composition prompts |

**Design Principle:** Progress tracking should move students UP the pyramid, not just accumulate hours at the Remember level.

---

### 2. Deliberate Practice

Anders Ericsson's research on expertise development:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELIBERATE PRACTICE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NOT DELIBERATE PRACTICE          DELIBERATE PRACTICE            │
│  ──────────────────────           ────────────────────           │
│  Playing through pieces           Isolating difficult passages   │
│  for fun                                                         │
│                                                                  │
│  Practicing at comfortable        Practicing at edge of ability  │
│  difficulty                                                      │
│                                                                  │
│  No specific goals                Clear, specific objectives     │
│                                                                  │
│  Mindless repetition              Focused attention on technique │
│                                                                  │
│  No feedback                      Immediate, accurate feedback   │
│                                                                  │
│  Practice time only               Reflection + adjustment        │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  THE 4 PILLARS OF DELIBERATE PRACTICE:                          │
│                                                                  │
│  1. SPECIFIC GOALS                                               │
│     "Play measures 12-16 at 80 BPM with no mistakes"            │
│     Not: "Practice the sonata"                                   │
│                                                                  │
│  2. FOCUSED ATTENTION                                            │
│     Full concentration on the task                               │
│     No multitasking, no autopilot                               │
│                                                                  │
│  3. IMMEDIATE FEEDBACK                                           │
│     Know right away if you succeeded                             │
│     External (teacher) or internal (trained ear)                 │
│                                                                  │
│  4. STRETCH ZONE                                                 │
│     Just beyond current ability                                  │
│     Not comfortable, not impossible                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Application to Thoven

**Practice Logging Should Capture:**
- What specific skill was worked on?
- What was the goal?
- Was feedback received?
- What was challenging?

**AI Features Should:**
- Suggest specific practice goals, not vague "practice more"
- Help identify the stretch zone for each student
- Provide or prompt for immediate feedback
- Track skill-level progress, not just time

---

### 3. Spaced Repetition

Optimal learning happens when review is timed based on forgetting curves:

```
FORGETTING CURVE & OPTIMAL SPACING
═══════════════════════════════════════════════════════════════

   100%│━━━━━━╮
       │      ╰━━━━━╮
Memory │             ╰━━━━━━╮
       │                    ╰━━━━━━━━╮
       │                             ╰━━━━━━━━━━━━━━━━
    0% │
       └──────────────────────────────────────────────────────
         Day 1    Day 2    Day 7    Day 14    Day 30

   WITH SPACED REPETITION:

   100%│━━╮  ━━╮    ━━━╮         ━━━━━╮              ━━━━━━━━━
       │  ╰━╮ ╰━━╮    ╰━━━╮          ╰━━━━━╮
Memory │    ╰━   ╰━━     ╰━━━━         ━━━╰━━━━━━━━━━━━━━━━━━
       │       ▲     ▲         ▲                ▲
       │       │     │         │                │
    0% │    Review Review   Review          Review
       └──────────────────────────────────────────────────────
         Day 1  Day 2  Day 4    Day 8          Day 16

   Optimal spacing: Review just before you'd forget
```

### Application to Thoven

**Progress Reports Should:**
- Highlight skills that haven't been reviewed recently
- Suggest "review these concepts" based on time since last practice
- Track retention patterns per student

**Practice Recommendations:**
- "It's been 2 weeks since Sarah practiced her scales—consider a quick review"
- "This piece is well-learned; focus on new material"

---

### 4. Zone of Proximal Development (ZPD)

Vygotsky's concept: Learning happens best in the zone between "can do alone" and "cannot do even with help."

```
┌─────────────────────────────────────────────────────────────────┐
│                 ZONE OF PROXIMAL DEVELOPMENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     ┌───────────────────────────────────────────────────────┐   │
│     │                                                        │   │
│     │   ┌─────────────────────────────────────────────┐     │   │
│     │   │                                              │     │   │
│     │   │   ┌───────────────────────────────────┐     │     │   │
│     │   │   │                                    │     │     │   │
│     │   │   │         CAN DO ALONE              │     │     │   │
│     │   │   │       (Mastered skills)           │     │     │   │
│     │   │   │                                    │     │     │   │
│     │   │   └───────────────────────────────────┘     │     │   │
│     │   │                                              │     │   │
│     │   │              ZPD                             │     │   │
│     │   │      (Can do WITH support)                  │     │   │
│     │   │      ← LEARNING HAPPENS HERE →              │     │   │
│     │   │                                              │     │   │
│     │   └─────────────────────────────────────────────┘     │   │
│     │                                                        │   │
│     │                   CANNOT DO                            │   │
│     │                (Even with help)                        │   │
│     │                                                        │   │
│     └───────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scaffolding

Provide support that can be gradually removed:

| Stage | Teacher Support | Thoven Support |
|-------|----------------|----------------|
| High scaffolding | Demonstrate, guide hands | Step-by-step video, AI coaching |
| Medium scaffolding | Verbal cues, hints | Prompts, partial solutions |
| Low scaffolding | Observe, occasional feedback | Progress tracking, check-ins |
| Independent | Monitor from distance | Celebration, next challenge |

---

### 5. Growth Mindset

Carol Dweck's research on the impact of beliefs about ability:

```
FIXED MINDSET                    GROWTH MINDSET
═══════════════                  ═══════════════

"I'm not musical"                "I can develop my musical skills"

Avoids challenges               Embraces challenges
Gives up easily                 Persists through setbacks
Sees effort as pointless        Sees effort as path to mastery
Ignores criticism               Learns from criticism
Threatened by others' success   Inspired by others' success

LANGUAGE THAT BUILDS GROWTH MINDSET:
────────────────────────────────────
Instead of:                     Say:
"You're so talented!"           "You worked so hard on that!"
"This is too hard"              "This is challenging—let's break it down"
"I can't do this"               "I can't do this YET"
"That was perfect"              "You've really improved at X"
```

### Application to Thoven

**Progress Reports Should:**
- Highlight effort and improvement, not just achievement
- Use "yet" language: "hasn't mastered yet" vs "failed"
- Celebrate the process, not just outcomes

**AI Responses Should:**
- Avoid fixed-mindset language
- Frame struggles as growth opportunities
- Suggest specific, actionable next steps

---

## EdTech Business Model Patterns

### Duolingo Model

```
DUOLINGO SUCCESS FACTORS
═══════════════════════════════════════════════════════════════

1. STREAK MECHANICS
   ─────────────────
   • Daily streaks create habit loops
   • Loss aversion (fear of breaking streak) drives retention
   • Social proof (friends' streaks)

   THOVEN APPLICATION:
   • Practice streaks for students
   • Teacher engagement streaks
   • Parent check-in streaks

2. GAMIFICATION LOOPS
   ──────────────────
   • XP for every action
   • Levels and progression
   • Leaderboards (optional, can be stressful)
   • Achievements and badges

   THOVEN APPLICATION:
   • Practice XP that teachers can track
   • Skill trees for learning paths
   • Studio-level achievements

3. BITE-SIZE LESSONS
   ─────────────────
   • 5-10 minute sessions
   • Low barrier to start
   • Completion feels rewarding

   THOVEN APPLICATION:
   • Micro-practice prompts
   • Quick check-in exercises
   • Small daily goals

4. NOTIFICATION STRATEGY
   ─────────────────────
   • Reminder at optimal times
   • Personalized based on behavior
   • Balance urgency with respect

   THOVEN APPLICATION:
   • Practice reminders (not spam)
   • Teacher nudges for students at risk
   • Parent engagement prompts
```

### Khan Academy Model

```
KHAN ACADEMY SUCCESS FACTORS
═══════════════════════════════════════════════════════════════

1. MASTERY-BASED PROGRESSION
   ─────────────────────────
   • Can't move forward without demonstrating mastery
   • Multiple attempts encouraged
   • No time pressure

   THOVEN APPLICATION:
   • Skill-based progress tracking
   • "Mastery" badges per skill
   • Self-paced learning paths

2. TEACHER DASHBOARD
   ─────────────────
   • Real-time student progress
   • Identify struggling students
   • Actionable intervention suggestions

   THOVEN APPLICATION:
   • Already building this—Thovie does this
   • Predictive analytics for at-risk students
   • Suggested talking points for lessons

3. FREE + SUPPLEMENT MODEL
   ───────────────────────
   • Core content free
   • Premium for teachers/parents
   • Institutional licenses

   THOVEN APPLICATION:
   • Consider free tier for students
   • Teacher subscription for full features
   • Studio/institution pricing

4. CONTENT AS MOAT
   ────────────────
   • Massive content library
   • Consistent quality
   • Difficult to replicate

   THOVEN APPLICATION:
   • Teacher-created content network
   • Curated practice resources
   • AI-generated personalized content
```

---

## Designing for Learning Outcomes

### The Learning Experience Canvas

Use this when designing any learning feature:

```
LEARNING EXPERIENCE CANVAS
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  LEARNING OBJECTIVE                                          │
│  ────────────────────                                        │
│  What will the learner be able to DO after this?            │
│  (Use action verbs: perform, explain, analyze, create)      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRIOR KNOWLEDGE              MOTIVATION                     │
│  ───────────────              ──────────                     │
│  What must learner            Why would learner              │
│  already know?                care about this?               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LEARNING ACTIVITIES                                         │
│  ───────────────────                                         │
│  • Watch/Read (passive intake)                               │
│  • Practice (active application)                             │
│  • Reflect (metacognition)                                   │
│  • Create (synthesis)                                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ASSESSMENT                   FEEDBACK                       │
│  ──────────                   ────────                       │
│  How will we know             What feedback will             │
│  learning happened?           guide improvement?             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SCAFFOLDING                  SPACING                        │
│  ──────────                   ───────                        │
│  What support is              How will this be               │
│  provided at start?           reviewed over time?            │
│  How does it fade?                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Pedagogical Soundness Checklist

When evaluating Thovie AI responses or any learning feature:

### Content Accuracy
- [ ] Information is factually correct
- [ ] Appropriate for student's level
- [ ] Uses accurate musical terminology

### Pedagogical Approach
- [ ] Breaks complex concepts into steps
- [ ] Builds on prior knowledge
- [ ] Provides clear examples
- [ ] Avoids cognitive overload

### Growth Mindset Language
- [ ] Emphasizes effort over talent
- [ ] Uses "yet" language for unmastered skills
- [ ] Celebrates progress, not just achievement
- [ ] Frames challenges positively

### Actionability
- [ ] Suggests specific next steps
- [ ] Goals are achievable and measurable
- [ ] Practice activities are appropriate difficulty
- [ ] Feedback is constructive and specific

### Parent Communication
- [ ] Jargon-free explanations
- [ ] Context for why this matters
- [ ] Concrete examples of progress
- [ ] Suggestions for home support

---

## Music Learning Specifics

### Motor Skill Development

Music involves motor learning, which has unique properties:

```
MOTOR LEARNING STAGES
═══════════════════════════════════════════════════════════════

1. COGNITIVE STAGE
   ────────────────
   • Understanding what to do
   • Lots of errors
   • Requires full attention
   • "How do I hold my fingers?"

   TEACHER FOCUS: Clear demonstrations, patience

2. ASSOCIATIVE STAGE
   ─────────────────
   • Fewer errors
   • Some automation
   • Still needs concentration
   • "I can do it if I think about it"

   TEACHER FOCUS: Repetition, refinement

3. AUTONOMOUS STAGE
   ────────────────
   • Movement is automatic
   • Can focus on expression
   • Minimal conscious effort
   • "I don't think about technique anymore"

   TEACHER FOCUS: Artistic development

IMPLICATION: Progress tracking should reflect STAGE, not just time
```

### Practice Quality Indicators

What makes practice effective for music?

| Low Quality | High Quality |
|-------------|--------------|
| Playing through mindlessly | Focused on specific sections |
| Same tempo always | Varied tempos, slow practice |
| No goals | Clear objectives each session |
| No breaks | Strategic rest periods |
| Avoiding hard parts | Targeting weaknesses |
| No listening | Active listening to recordings |

**Thoven Opportunity:** Help teachers guide students toward high-quality practice by providing frameworks and tracking.

---

## Metrics for Learning Success

### Beyond Time Spent

Don't just track practice minutes. Track:

| Metric | What It Measures | How to Track |
|--------|-----------------|--------------|
| Skill Progression | Mastery over time | Skill-specific assessments |
| Consistency | Regular practice habits | Streak/frequency data |
| Engagement | Active participation | Session quality ratings |
| Retention | Long-term memory | Spaced repetition results |
| Transfer | Applying to new contexts | New piece/skill acquisition |

### Leading vs Lagging Indicators

| Lagging (Results) | Leading (Predictive) |
|-------------------|---------------------|
| Recital performance | Practice consistency |
| Exam scores | Skill progression rate |
| Student retention | Engagement metrics |
| Parent satisfaction | Communication frequency |

**Build dashboards around leading indicators** to predict and prevent problems.

---

## Pedagogical Soundness Review (Devil's Advocate)

For learning features that affect student outcomes, run a pedagogical critique before shipping.

### When to Use

- Any AI-generated content shown to students or parents
- Gamification features (streaks, XP, leaderboards)
- Practice recommendations or learning path suggestions
- Progress report language and framing

### How to Run

Launch a critique agent that challenges the pedagogical soundness:

```
Task tool:
  subagent_type: "general-purpose"
  model: "sonnet"
  prompt: |
    You are a learning science critic reviewing a Thoven feature.
    Your job is to find pedagogical problems before this ships to students.

    FEATURE: [Description of the feature]
    IMPLEMENTATION: [Key code/content being reviewed]

    Challenge it against these criteria:

    1. BLOOM'S ALIGNMENT: Does this target the right cognitive level,
       or does it keep students stuck at "Remember"?
    2. DELIBERATE PRACTICE: Does this encourage focused, goal-directed
       practice, or does it reward mindless repetition?
    3. GROWTH MINDSET: Does the language celebrate effort and progress,
       or does it inadvertently reinforce fixed mindset?
    4. ZPD APPROPRIATENESS: Is the difficulty calibrated to the student's
       level, or is it one-size-fits-all?
    5. MOTIVATION TYPE: Is the motivation intrinsic (curiosity, mastery)
       or purely extrinsic (points, badges)? Extrinsic-only can
       undermine long-term motivation.
    6. PARENT COMMUNICATION: If parents see this, will they understand
       their child's progress, or just see numbers?

    For each criterion:
    - Score 1-5 (default 2, justify any score above 2)
    - Flag specific problems with evidence
    - Suggest concrete improvements

    Be critical. Bad pedagogy shipped to students is worse than no feature.
```

### Resolution

- Score >= 4.0 weighted average → Ship
- Score 3.0-4.0 → Fix flagged issues, re-review
- Score < 3.0 → Redesign the learning mechanics before shipping

---

## Quick Reference: Feature Validation

Before shipping any learning feature, ask:

1. **Bloom's:** Which cognitive level does this target?
2. **Practice:** Does this encourage deliberate practice?
3. **Spacing:** Is review timed appropriately?
4. **Zone:** Is this in the student's ZPD?
5. **Mindset:** Does the language encourage growth?
6. **Motivation:** Is there intrinsic value, not just extrinsic rewards?
7. **Outcome:** Can we measure if learning happened?

If any answer is unclear, run the Pedagogical Soundness Review above before shipping.
