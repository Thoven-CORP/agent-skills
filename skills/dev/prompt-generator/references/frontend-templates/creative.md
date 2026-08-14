---
name: creative
category: ideation
type: creative
description: "Prompt template for brainstorming, ideation, and creative exploration tasks"
triggers:
  - "brainstorm", "ideate", "explore options", "creative", "generate ideas"
frameworks: [divergent-prompting, crispe-experiment]
---

# Creative/Brainstorming Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria
- [ ] Output format specified
- [ ] Divergent exploration boundaries
- [ ] Constraint parameters (what must be preserved)
- [ ] Evaluation criteria for ideas
- [ ] Output format (list, ranked, pros/cons)
- [ ] Number of options/variations expected

## Recommended Sections
1. **Creative Goal** — What to explore and why
2. **Constraints** — What must be preserved or respected
3. **Exploration Boundaries** — How far to diverge
4. **Evaluation Criteria** — How to assess generated ideas
5. **Output Format** — Number of ideas, structure, comparison format
6. **Inspiration Sources** — Existing examples or reference points

## Framework
**Divergent prompting + constraints.** Creative prompts need freedom within guardrails. Use CRISPE's Experiment component to request multiple variations.

## Example

### Creative Goal
Generate 5 distinct approaches for gamifying student practice sessions in a music education app.

### Constraints
- Must work for ages 8-18 (wide age range)
- No real-money transactions (COPPA compliance)
- Must integrate with existing XP/level system
- Should encourage daily practice, not marathon sessions

### Exploration Boundaries
- Can draw from gaming, fitness apps, social media, or education platforms
- Can propose new UI components but not full app redesigns
- Budget: implementable by a solo dev in 1-2 weeks each

### Evaluation Criteria
- Engagement potential (will students actually use it?)
- Implementation complexity (solo dev feasibility)
- Pedagogical soundness (does it reinforce good practice habits?)
- Age appropriateness (works for both 8-year-olds and teenagers)

### Output Format
For each of the 5 approaches:
1. Name and one-line description
2. How it works (3-5 sentences)
3. Pros and cons
4. Implementation estimate (days)
5. Similar feature in another app (reference point)
