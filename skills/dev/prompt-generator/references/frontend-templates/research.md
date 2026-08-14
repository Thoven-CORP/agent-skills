---
name: research
category: research
type: research
description: "Prompt template for research, analysis, and investigation tasks"
triggers:
  - "research", "investigate", "analyze", "compare", "evaluate options"
frameworks: [react-reasoning-acting, structured-output]
---

# Research Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria
- [ ] Output format specified
- [ ] Source qualification criteria (what counts as reliable)
- [ ] Citation/evidence requirements
- [ ] Depth boundaries (when to stop digging)
- [ ] Output structure (findings, analysis, recommendations)
- [ ] Comparison framework if evaluating options

## Recommended Sections
1. **Research Question** — Specific question(s) to answer
2. **Scope** — What's in bounds, what's out
3. **Source Requirements** — What qualifies as a valid source
4. **Depth** — How deep to go (surface survey vs. deep dive)
5. **Output Format** — Structure for findings (table, report, comparison matrix)
6. **Evaluation Criteria** — How to assess/compare findings
7. **Citation Requirements** — How to reference sources

## Framework
**ReAct (Reasoning + Acting).** Research prompts should structure iterative search-reason-search loops. Find information, analyze it, identify gaps, search for more.

## Example

### Research Question
What are the top 5 vector database options for a music education RAG system, and which best fits our constraints?

### Scope
**In:** Open-source and managed vector DBs, embedding strategies for educational content, cost at our scale.
**Out:** Building a custom vector DB, non-vector search approaches, general-purpose databases.

### Source Requirements
- Official documentation (primary)
- Benchmark comparisons from reputable sources (secondary)
- Community experience reports for music/education use cases (tertiary)
- Disqualify: marketing materials without benchmarks, posts older than 12 months

### Depth
Medium — need enough to make a decision, not a PhD thesis. 2-3 hours equivalent research.

### Output Format
| DB | Hosting | Cost (our scale) | Embedding Support | Pros | Cons | Fit Score |
Followed by 1-paragraph recommendation with justification.

### Evaluation Criteria
1. Ease of integration with Rails/PostgreSQL stack
2. Cost at ~10K documents, ~1K queries/day
3. Quality of similarity search for educational content
4. Managed vs self-hosted options
5. Community support and documentation quality
