---
name: market-research-vc-intelligence
description: Structure market analysis, competitive intelligence, and investor-ready narratives using VC frameworks (TAM/SAM/SOM, market mapping, competitive moats). Use when preparing pitch materials, analyzing competitors, sizing markets, or building investor update narratives.
---

# Market Research & VC Intelligence

Transform raw market data into compelling investor narratives. This skill provides frameworks for market sizing, competitive analysis, and the storytelling patterns VCs expect to see.

Show each result as a picture first: market size as a nested or bar chart, the competitive landscape as the 2x2, timing as a curve, drawn by the `dataviz` skill (`andres-mode`, "Documents default to visual").

## When to Use This Skill

- Preparing pitch deck market slides
- Sizing the music education market opportunity
- Analyzing competitive landscape
- Crafting investor update narratives
- Building defensibility/moat arguments
- Validating market timing thesis

---

## TAM / SAM / SOM Framework

The standard VC market sizing approach. Get this right, and investors take your numbers seriously.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAM / SAM / SOM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                          TAM                               │  │
│  │              Total Addressable Market                      │  │
│  │   "If we had 100% of the market, what's the revenue?"     │  │
│  │                                                            │  │
│  │   ┌─────────────────────────────────────────────────┐     │  │
│  │   │                     SAM                          │     │  │
│  │   │         Serviceable Addressable Market           │     │  │
│  │   │     "What portion can we realistically serve?"   │     │  │
│  │   │                                                  │     │  │
│  │   │   ┌─────────────────────────────────────┐       │     │  │
│  │   │   │              SOM                     │       │     │  │
│  │   │   │    Serviceable Obtainable Market    │       │     │  │
│  │   │   │  "What can we capture in 3-5 years?"│       │     │  │
│  │   │   └─────────────────────────────────────┘       │     │  │
│  │   │                                                  │     │  │
│  │   └─────────────────────────────────────────────────┘     │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Two Approaches: Top-Down vs. Bottom-Up

**Top-Down (less credible, useful for context):**
Start with industry reports and work down.

```
THOVEN TOP-DOWN EXAMPLE:
─────────────────────────────────
Global EdTech Market:        $400B
  × Music Education %:       ~2%
  = Music EdTech TAM:        $8B
  × Private Lessons Focus:   ~25%
  = SAM:                     $2B
  × US Market Focus:         ~40%
  = Addressable:             $800M
```

**Bottom-Up (more credible, use this):**
Start with unit economics and scale up.

```
THOVEN BOTTOM-UP EXAMPLE:
─────────────────────────────────
Private music teachers in US:     ~300,000
  × Teachers with 10+ students:   ~200,000
  = Target teachers:              200,000
  × Annual platform value/teacher: $600/yr
  = SAM:                          $120M
  × Realistic capture (5 yrs):    5%
  = SOM:                          $6M ARR
```

### Multi-Boundary TAM Exploration (Tree of Thoughts)

Don't commit to a single TAM definition. Explore 3+ boundary definitions in parallel, then prune to the most defensible.

**Step 1: Branch** — Launch 3 agents, each with a different market boundary:

```
Task tool (×3, in parallel):
  subagent_type: "general-purpose"
  model: "haiku"
  prompt: |
    Size Thoven's TAM/SAM/SOM using this specific market boundary:

    BOUNDARY [1/2/3]:
    1: "All private music lesson revenue in the US"
    2: "Music teacher SaaS tools + marketplace commission"
    3: "Parent spend on music education technology"

    For your boundary:
    - Build bottom-up calculation with sourced numbers
    - Calculate TAM, SAM, SOM
    - Identify the strongest and weakest assumption
    - Rate credibility for VC audience (1-5)

    Be specific. Cite real data sources where possible.
```

**Step 2: Prune** — Discard boundaries that:
- VCs will immediately discount (too broad, too speculative)
- Don't have credible data sources
- Don't tell a compelling story about Thoven's opportunity

**Step 3: Synthesize** — Lead pitch with the most credible boundary. Use others as supporting context: "Our core SAM is $X, but the broader opportunity is $Y as we expand into Z."

---

### The VC Credibility Test

VCs discount your numbers. Make them believable:

| Red Flag | Better Approach |
|----------|-----------------|
| "We only need 1% of the market" | Show bottom-up path to specific customers |
| "$50B TAM" with no breakdown | Build from unit economics |
| No source citations | Link to industry reports, census data |
| Only top-down | Lead with bottom-up, support with top-down |

---

## Competitive Landscape Mapping

### The 2x2 Competitive Matrix

Position Thoven against alternatives on two meaningful axes:

```
┌─────────────────────────────────────────────────────────────────┐
│                 COMPETITIVE POSITIONING                          │
│                                                                  │
│                        COMPREHENSIVE                             │
│                             │                                    │
│         MY MUSIC STAFF      │        THOVEN                     │
│         ●                   │        ★                          │
│                             │                                    │
│                             │                                    │
│   GENERIC ──────────────────┼────────────────── MUSIC-SPECIFIC  │
│                             │                                    │
│                             │                                    │
│         GOOGLE CALENDAR     │        TONARA                     │
│         + VENMO             │        ●                          │
│         ●                   │                                    │
│                             │                                    │
│                        POINT SOLUTION                            │
│                                                                  │
│  ───────────────────────────────────────────────────────────    │
│  LEGEND:                                                         │
│  ★ = Thoven (your position)                                     │
│  ● = Competitors                                                 │
│  White space = Opportunity                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Axis Selection

Choose axes that:
1. Matter to customers (validated in interviews)
2. Create clear white space for your product
3. Are defensible (you can actually deliver)

**Good Axis Examples:**
- Integration depth ↔ Standalone
- AI-native ↔ Manual
- Teacher-centric ↔ Student-centric
- Enterprise ↔ Individual

**Avoid:**
- Price (race to bottom)
- "Quality" (everyone claims this)
- Feature count (misleading)

### Competitive Intelligence Template

For each significant competitor:

```
COMPETITOR PROFILE: [NAME]
═══════════════════════════════════════════════

BASICS
------
Website:          [URL]
Founded:          [Year]
Funding:          [Amount, stage, investors]
Team size:        [Approx]
Pricing:          [Model + numbers]

PRODUCT
-------
Core value prop:  [One sentence]
Target user:      [Specific segment]
Key features:     [Top 3]
Weaknesses:       [2-3 gaps]
Tech stack:       [If known]

TRACTION
--------
User base:        [Estimated]
Revenue:          [Estimated or known]
Growth signals:   [Hiring, press, social]

STRATEGIC POSITION
------------------
Why they win:     [Their advantage]
Why we win:       [Our advantage vs them]
Threat level:     [Low / Medium / High]
Watch for:        [Signals they're moving our direction]
```

---

## Building Your Moat

VCs want to understand defensibility. Map your moat sources:

### The Seven Powers Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEVEN POWERS (Hamilton Helmer)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SCALE ECONOMIES                                              │
│     Cost advantages from size                                    │
│     Thoven: More teachers = better AI training data = better    │
│     recommendations = more teachers (flywheel)                   │
│                                                                  │
│  2. NETWORK EFFECTS                                              │
│     Product improves as more people use it                       │
│     Thoven: Teacher-parent-student network. More parents =      │
│     more referrals = more students = more teachers               │
│                                                                  │
│  3. COUNTER-POSITIONING                                          │
│     New approach incumbents can't copy without self-harm         │
│     Thoven: AI-native vs legacy platforms that would need       │
│     to rebuild from scratch                                      │
│                                                                  │
│  4. SWITCHING COSTS                                              │
│     Cost/pain of switching to competitor                         │
│     Thoven: Student history, parent relationships, schedules,   │
│     payment setup all in one place                               │
│                                                                  │
│  5. BRANDING                                                     │
│     Premium from reputation                                      │
│     Thoven: Not yet (but Juilliard teachers = credibility)      │
│                                                                  │
│  6. CORNERED RESOURCE                                            │
│     Exclusive access to something valuable                       │
│     Thoven: Pedagogical expertise from Keri + teacher network   │
│                                                                  │
│  7. PROCESS POWER                                                │
│     Embedded organizational processes                            │
│     Thoven: Not yet (early stage)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Thoven Moat Development Roadmap

| Phase | Primary Moat | How We Build It |
|-------|-------------|-----------------|
| Now | Counter-positioning | AI-native approach from day 1 |
| 6 months | Switching costs | Deep integrations, data lock-in |
| 1 year | Network effects | Teacher referrals, parent sharing |
| 2 years | Scale economies | AI improvements from aggregated data |

---

## Investor Narrative Structures

### The Problem → Solution → Why Now Story

```
NARRATIVE STRUCTURE:
════════════════════

1. HOOK (10 seconds)
   "Music teachers spend 10 hours a week on admin instead of teaching."

2. PROBLEM (30 seconds)
   - Quantify the pain
   - Make it feel urgent
   - Show it's getting worse

3. SOLUTION (45 seconds)
   - What you do (simple)
   - How it works (demo-able)
   - Why it's different

4. WHY NOW (30 seconds)
   - Technology unlock
   - Market shift
   - Regulatory change

5. TRACTION (30 seconds)
   - Users/revenue
   - Growth rate
   - Quality signals (Juilliard, etc.)

6. TEAM (30 seconds)
   - Why you will win
   - Unfair advantages

7. ASK (15 seconds)
   - How much raising
   - What you'll do with it
```

### The "Why Now" Framework

Investors need to believe the timing is right:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHY NOW? FRAMEWORK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TECHNOLOGY UNLOCK                                               │
│  ────────────────────                                            │
│  What recently became possible that wasn't before?               │
│  • LLMs can now generate pedagogically-sound content            │
│  • AI can understand context from lesson notes                   │
│  • Cost of AI dropped 10x in 2 years                            │
│                                                                  │
│  MARKET SHIFT                                                    │
│  ────────────────────                                            │
│  What's changing in buyer behavior?                              │
│  • Post-COVID: parents expect digital engagement                 │
│  • Teachers burned out, seeking efficiency                       │
│  • Competition for students increasing (oversupply)              │
│                                                                  │
│  ECOSYSTEM CHANGE                                                │
│  ────────────────────                                            │
│  What's happening in adjacent markets?                           │
│  • EdTech proving parents will pay for quality                   │
│  • Music as wellness gaining mainstream attention                │
│  • Gig economy normalizing independent teachers                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Investor Update Best Practices

### Monthly/Bi-Weekly Update Format

```
INVESTOR UPDATE: [MONTH YEAR]
═══════════════════════════════════════════════

TL;DR (3 bullets max)
─────────────────────
• [Biggest win]
• [Key metric movement]
• [What's next]

KEY METRICS
───────────
| Metric        | This Month | Last Month | Change |
|---------------|------------|------------|--------|
| WAU           |            |            |        |
| Revenue       |            |            |        |
| Teachers      |            |            |        |
| Retention     |            |            |        |

WINS
────
• [Win 1 with context]
• [Win 2 with context]

CHALLENGES
──────────
• [Challenge 1 - what you're doing about it]

ASKS
────
• [Specific, actionable ask 1]
• [Specific, actionable ask 2]

RUNWAY
──────
X months at current burn
```

### The Rule of Transparency

**Good news:** Share metrics, be specific.
**Bad news:** Share early, share with plan.

VCs respect founders who acknowledge problems and show how they're addressing them.

---

## Market Timing Analysis

### The S-Curve Position

Where is the music edtech market on the adoption curve?

```
ADOPTION CURVE
═══════════════════════════════════════════════

                                    Late
                                   Majority
                         Early      ████
                        Majority   ████████
              Early     ███████   ██████████
             Adopters  █████████ ████████████
Innovators   ████████ ██████████ ████████████
    ████    █████████ ██████████ ████████████
═══════════════════════════════════════════════
    2.5%      13.5%      34%        34%

    ▲
    │
    └─── MUSIC EDTECH IS HERE
         (Early Adopters → Early Majority transition)
```

### Timing Signals

| Signal | Bearish | Bullish |
|--------|---------|---------|
| Incumbents | Innovating fast | Slow, legacy systems |
| VC Interest | Over-funded space | Under-funded but growing |
| Customer Pull | Have to push hard | Inbound interest |
| Regulation | Tightening | Stable or loosening |
| Technology | Incremental | Step-change improvement |

---

## Quick Research Checklist

When analyzing market opportunity:

- [ ] Bottom-up TAM calculation complete
- [ ] 3-5 direct competitors profiled
- [ ] 2x2 positioning map created
- [ ] Primary moat source identified
- [ ] "Why now" narrative documented
- [ ] Customer acquisition cost estimated
- [ ] LTV/CAC ratio calculated or hypothesized
- [ ] Market growth rate sourced

---

## Thoven-Specific Market Thesis

### The Core Narrative

> "The private music lesson market is a $2B+ fragmented mess where teachers use 5+ tools to run their businesses. Thoven is the first AI-native platform that eliminates the admin burden, letting teachers focus on what they love—teaching. We've proven demand with teachers from Juilliard and Manhattan School of Music, and we're raising to capture the early majority of tech-forward music educators."

### Key Proof Points

1. **Problem validation:** Teachers confirm 5-10 hours/week on admin
2. **Solution validation:** Automated reports save measured time
3. **Market validation:** Prestigious institution adoption
4. **Team validation:** Technical + pedagogical expertise

### Defensibility Story

1. **Short-term:** First-mover in AI-native music ed
2. **Medium-term:** Switching costs from data/relationships
3. **Long-term:** Network effects from teacher referrals
