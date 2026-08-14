---
name: customer-obsession-design-thinking
description: Apply Brian Chesky's 11-star experience framework and design thinking to create teacher experiences that generate word-of-mouth growth. Use when designing features, improving user journeys, or diagnosing why teachers aren't recommending Thoven.
---

# Customer Obsession & Design Thinking

Transform Thoven from a product teachers use into an experience they can't stop talking about. This skill applies Brian Chesky's Airbnb playbook and design thinking principles to music education.

## When to Use This Skill

- Designing new features or user flows
- Diagnosing why a feature isn't getting adoption
- Understanding why users aren't referring others
- Improving onboarding or first-time experiences
- Turning detractors into promoters
- Creating memorable moments in the product

---

## The 11-Star Experience Framework

Brian Chesky's core insight: Don't ask "what would make this good?" Ask "what would make this absolutely insane?"

### How It Works

Start at 5 stars (baseline acceptable) and scale up to 11 stars (absurdly impossible). The magic happens between 7-9 stars—ideas that sound crazy but are actually achievable.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE 11-STAR SCALE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1-STAR: Teacher has to do everything manually, system breaks   │
│                                                                  │
│  5-STAR: System works as expected. Progress reports generated.  │
│          Parents receive them. Functional.                      │
│                                                                  │
│  6-STAR: Reports are beautifully designed. Parents actually     │
│          read them and respond positively.                      │
│                                                                  │
│  7-STAR: System suggests specific talking points for parent     │
│          conversations. Teachers feel prepared.                 │
│                                                                  │
│  8-STAR: Parents receive reports with embedded video clips of   │
│          their child's progress. They share on social media.    │
│                                                                  │
│  9-STAR: Thovie proactively identifies struggling students and  │
│          drafts intervention plans before teachers notice.      │
│                                                                  │
│  10-STAR: Thoven handles all parent communication, scheduling,  │
│           billing, and even suggests repertoire based on        │
│           student progress. Teacher just teaches.               │
│                                                                  │
│  11-STAR: Thoven magically makes every student love practice,   │
│           parents deeply understand music education, and        │
│           teachers achieve their dream of pure teaching.        │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  BUILD BETWEEN 7-9 STARS: Ambitious but achievable              │
└─────────────────────────────────────────────────────────────────┘
```

### Application Exercise (Guided Narrowing)

Don't try to fill the matrix all at once. Use structured questioning to narrow from 11-star to actionable 7-star:

**Step 1: Start with the Extreme**

Ask: "If you had unlimited resources and magic technology, what would the PERFECT version of [feature] look like for teachers?"
- Let the user dream big — this is the 11-star anchor

**Step 2: Ground It**

Ask (multiple choice):
- "Which of these aspects matters MOST to teachers right now?"
  - Option A: [aspect from their 11-star vision]
  - Option B: [another aspect]
  - Option C: [another aspect]

**Step 3: Define the 7-Star Target**

Ask: "For [chosen aspect], what's the version that would make teachers say 'wow' but we could actually ship this month?"

**Step 4: Complete the Matrix**

| Star Level | Teacher Experience | What It Would Take |
|------------|-------------------|-------------------|
| 5-star | [Baseline — current state] | [Already built] |
| 7-star | [From Step 3] | [Achievable stretch] |
| 9-star | [From Step 1, filtered] | [Major investment] |
| 11-star | [Full vision from Step 1] | [Magic thinking] |

The 7-star version is your next milestone. Build that.

---

## The Design Thinking Process

A structured approach to solving user problems:

```
┌────────────────────────────────────────────────────────────────┐
│                    DESIGN THINKING LOOP                         │
│                                                                 │
│     ┌─────────┐      ┌─────────┐      ┌─────────┐             │
│     │EMPATHIZE│──────│ DEFINE  │──────│ IDEATE  │             │
│     └─────────┘      └─────────┘      └─────────┘             │
│          │                                  │                  │
│          │                                  │                  │
│          │         ┌─────────┐      ┌─────────┐               │
│          └─────────│  TEST   │◄─────│PROTOTYPE│               │
│                    └─────────┘      └─────────┘               │
│                         │                                      │
│                         └──────────► ITERATE                   │
└────────────────────────────────────────────────────────────────┘
```

### Phase 1: Empathize

**Goal:** Deeply understand teacher reality, not your assumptions.

**Methods for Thoven:**

1. **Shadow Sessions**
   - Watch a teacher use Thoven in real environment
   - Note frustrations they don't verbalize
   - Observe workarounds they've created

2. **Extreme User Interviews**
   - Power users: What makes them love it?
   - Churned users: What made them leave?
   - Non-users: What's stopping them?

3. **Day-in-the-Life Mapping**
   ```
   Teacher's Day Map:
   ────────────────────────────────────────────────
   6 AM  │ Wake, prep
   8 AM  │ First lessons
   12 PM │ Admin work ← PAIN POINT
   2 PM  │ More lessons
   5 PM  │ Parent emails ← PAIN POINT
   7 PM  │ Planning ← PAIN POINT
   9 PM  │ Personal time (if lucky)
   ────────────────────────────────────────────────
   Where does Thoven reduce pain in this day?
   ```

### Phase 2: Define

**Goal:** Articulate the specific problem you're solving.

**Problem Statement Formula:**
```
[USER TYPE] needs a way to [USER NEED]
because [INSIGHT FROM EMPATHY PHASE].
```

**Thoven Example:**
> Music teachers need a way to communicate student progress to parents
> because they currently spend 5+ hours weekly on emails that still leave
> parents feeling uninformed about their child's development.

**Avoid:**
- Defining problems as solutions ("Teachers need an automated email system")
- Being too broad ("Teachers need to be more efficient")
- Assuming you know the root cause

### Phase 3: Ideate

**Goal:** Generate many possible solutions before converging.

**Rules of Ideation:**
1. Quantity over quality initially
2. Build on others' ideas ("Yes, and...")
3. Defer judgment
4. Encourage wild ideas
5. Be visual

**Ideation Techniques:**

**Worst Possible Idea:** What's the absolute worst solution? Now invert it.

**How Might We...** Reframe problem as opportunity:
- HMW make progress reports so valuable parents request them?
- HMW make parent communication take zero teacher time?
- HMW make students excited to share their progress?

**Constraint Removal:** What would you build if you had:
- Unlimited engineering time?
- Zero technical constraints?
- Access to any data?

### Phase 4: Prototype

**Goal:** Make ideas tangible enough to test.

**Prototype Types:**

| Fidelity | Format | Use When |
|----------|--------|----------|
| Low | Paper sketches | Early concept testing |
| Medium | Clickable mockup | Flow validation |
| High | Working code | Final validation |

**For Thoven Features:**
1. Start with paper sketches of new UI
2. Create Figma mockup of flow
3. Build minimal version in code
4. Test with 3-5 teachers

**The 5-Prototype Rule:** Never show just one option. Create 3-5 variations to understand which elements work.

### Phase 5: Test

**Goal:** Learn what works and what doesn't.

**Testing Script:**
```
1. Set context (2 min)
   "I'm going to show you something we're working on.
   There are no wrong answers. Honest feedback helps."

2. Give task (don't explain) (5 min)
   "Try to [specific task]. Think aloud as you go."

3. Observe (10 min)
   - Where do they hesitate?
   - What do they try that doesn't work?
   - What do they say under their breath?

4. Probe (5 min)
   "What did you expect to happen when you clicked X?"
   "On a scale of 1-10, how useful would this be?"
   "What would make this a 10?"
```

**Key Testing Principles:**
- Test behavior, not opinion ("Would you use this?" is worthless)
- Watch what they do, not what they say
- Five users find 85% of usability problems

---

## Brian Chesky's Customer Obsession Principles

### 1. "If you want to build a perfect 100, start with 10 people who love you"

**Translation for Thoven:**
Don't optimize for getting 1000 teachers. Optimize for making your current 10 teachers absolutely love you.

**Action Items:**
- Name each of your 10 WAU teachers
- Know their biggest frustration
- Know what would make them refer 5 colleagues
- Personally solve their problems

### 2. "Design the perfect experience, then figure out how to make it scalable"

**Translation for Thoven:**
First, manually create the ideal teacher experience. Then automate.

**Example:**
Before building automated progress reports:
1. Write 10 progress reports by hand
2. Send them personally
3. Get feedback
4. Identify patterns
5. THEN automate

### 3. "Your brand is what people say about you when you're not in the room"

**Translation for Thoven:**
Word of mouth is your growth engine. What story do teachers tell about Thoven?

**The Story Test:**
What you want: "Thoven saved me 5 hours a week and parents actually understand what we're working on now."

What you don't want: "It's another edtech tool. Has some nice features."

---

## Creating Referral-Worthy Moments

### The Peak-End Rule

People judge experiences by:
1. The peak moment (best or worst)
2. The end moment

**Design for peaks:**
- First progress report sent (celebration moment)
- First parent response (validation moment)
- First hour saved (relief moment)

**Design the end:**
- End of lesson logging should feel complete
- End of week should show impact summary
- End of month should celebrate wins

### The Surprise Delight Framework

Unexpected positive moments create lasting memories.

```
┌─────────────────────────────────────────────────────────────────┐
│               SURPRISE & DELIGHT OPPORTUNITIES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ONBOARDING MOMENT                                               │
│  Expected: Teacher sets up profile                               │
│  Delight: "Based on your students, here are 3 practice tips     │
│           that work well for this age group"                     │
│                                                                  │
│  MILESTONE MOMENT                                                │
│  Expected: Teacher logs 100th lesson                             │
│  Delight: "You've helped students practice 500+ hours. Here's   │
│           a shareable achievement badge for your studio."        │
│                                                                  │
│  STRUGGLE MOMENT                                                 │
│  Expected: Teacher sees student isn't practicing                 │
│  Delight: "Here's a fun practice challenge that worked for      │
│           similar students. Want to send it to Sarah?"           │
│                                                                  │
│  SUCCESS MOMENT                                                  │
│  Expected: Student hits a goal                                   │
│  Delight: Auto-generated celebration message for parents with   │
│           specific accomplishment details                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Empathy Map

Use for any user research session:

```
┌─────────────────────────────────────────────────────────────────┐
│                      EMPATHY MAP                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      SAYS                                │    │
│  │ "I wish I had more time to actually teach"              │    │
│  │ "Parents don't understand how music education works"    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │        THINKS        │    │        FEELS         │           │
│  │ "Am I charging       │    │ Overwhelmed by       │           │
│  │  enough?"            │    │ admin work           │           │
│  │ "Is this sustainable?│    │ Passionate about     │           │
│  │                      │    │ teaching             │           │
│  └──────────────────────┘    └──────────────────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       DOES                               │    │
│  │ Uses 5 different apps to run their studio               │    │
│  │ Emails parents at 10pm after long teaching day          │    │
│  │ Tracks payments in spreadsheet                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  PAINS                               GAINS                       │
│  ─────                               ─────                       │
│  • Time consumed by admin            • More teaching time        │
│  • Parent miscommunication           • Parents who "get it"      │
│  • Unpredictable income              • Stable, growing studio    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Applying to Thoven

### Current State Diagnosis

Ask these questions:

1. **NPS Question:** "How likely are you to recommend Thoven to a colleague?" (0-10)
   - 0-6: Detractors (why?)
   - 7-8: Passives (what's missing?)
   - 9-10: Promoters (what do they love?)

2. **Magic Wand Question:** "If Thoven could do one thing perfectly, what would it be?"

3. **Switching Question:** "What would make you stop using Thoven tomorrow?"

### Experience Audit Checklist

- [ ] Have we mapped the teacher's full day?
- [ ] Do we know the "peak" moment in our product?
- [ ] What surprise delights do we create?
- [ ] Can teachers articulate what we do in one sentence?
- [ ] Would teachers be upset if Thoven disappeared?

---

## Quick Reference: Feature Design Process

1. **Empathize:** Talk to 5 teachers about the problem space
2. **Define:** Write a clear problem statement
3. **11-Star:** Map 5-star to 11-star experiences
4. **Target:** Choose 7-8 star as the goal
5. **Prototype:** Build smallest possible version
6. **Test:** Watch 5 teachers use it
7. **Iterate:** Improve based on behavior, not opinions
8. **Launch:** Ship when it creates a remarkable moment
9. **Measure:** Track referral behavior, not just usage
