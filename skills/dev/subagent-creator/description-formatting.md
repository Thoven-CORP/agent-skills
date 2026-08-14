# Description Formatting Guide

Comprehensive guide for writing agent descriptions, model selection, and AI-assisted generation.

## Description Field (Required, Critical)

**The most important field** - Defines when Claude triggers the agent.

**Requirements**:

- Length: 10-5,000 characters (ideal: 200-1,000 with 2-4 examples)
- **MUST start with**: "Use this agent when..."
- **MUST include**: `<example>` blocks showing usage patterns
- Each example needs: context, user request, assistant response, commentary

### Example Block Format

```markdown
<example>
Context: [Describe the situation - what led to this interaction]
user: "[Exact user message or request]"
assistant: "[How Claude should respond before triggering]"
<commentary>
[Explanation of why this agent should be triggered in this scenario]
</commentary>
assistant: "[How Claude triggers the agent - 'I'll use the [agent-name] agent...']"
</example>
```

### Best Practices for Descriptions

- Include 2-4 concrete examples
- Show both proactive and reactive triggering scenarios
- Cover different phrasings of the same intent
- Explain reasoning in commentary
- Be specific about when NOT to use the agent

## Model Selection Guidance

**Values**: `inherit`, `sonnet`, `opus`, `haiku`
**Default**: `inherit` (recommended)

| Value | Use Case | Cost |
|-------|----------|------|
| `inherit` | Use parent conversation model | Default |
| `haiku` | Fast, simple tasks | Lowest |
| `sonnet` | Balanced performance | Medium |
| `opus` | Maximum capability, complex reasoning | Highest |

**Recommendation**: Use `inherit` unless you have a specific reason to override.

## AI-Assisted Agent Generation

Use this prompt to generate agent configurations automatically:

```markdown
Create an agent configuration based on this request: "[YOUR DESCRIPTION]"

Requirements:
1. Extract core intent and responsibilities
2. Design expert persona for the domain
3. Create comprehensive system prompt with:
   - Clear behavioral boundaries
   - Specific methodologies
   - Edge case handling
   - Output format
4. Create identifier (lowercase, hyphens, 3-50 chars)
5. Write description with triggering conditions
6. Include 2-3 <example> blocks showing when to use

Return JSON with:
{
  "identifier": "agent-name",
  "whenToUse": "Use this agent when... Examples: <example>...</example>",
  "systemPrompt": "You are..."
}
```

### Elite Agent Architect Process

When creating agents, follow this 6-step process:

1. **Extract Core Intent**: Identify fundamental purpose, key responsibilities, success criteria
2. **Design Expert Persona**: Create compelling expert identity with domain knowledge
3. **Architect Comprehensive Instructions**: Behavioral boundaries, methodologies, edge cases, output formats
4. **Optimize for Performance**: Decision frameworks, quality control, workflow patterns, fallback strategies
5. **Create Identifier**: Concise, descriptive, 2-4 words with hyphens
6. **Generate Examples**: Triggering scenarios with context, user/assistant dialogue, commentary

## DO / DON'T Summary

### DO

- Include 2-4 concrete examples in agent descriptions
- Write specific, unambiguous triggering conditions
- Use "inherit" model setting unless specific need
- Apply principle of least privilege for tools
- Write clear, structured system prompts with explicit steps
- Test agent triggering thoroughly before deployment
- Use different colors for different agents
- Include commentary explaining trigger logic

### DON'T

- Generic descriptions without examples
- Omit triggering conditions
- Use same color for multiple agents in same plugin
- Grant unnecessary tool access
- Write vague system prompts
- Skip testing phases
- Use underscores or uppercase in names
- Forget to handle edge cases

## Default Agent Standards

### Frontmatter Rules

- `description`: Keep to ONE sentence - descriptions load into parent context, every token counts
- Do NOT add verbose `<example>` blocks in description - they waste context tokens

### Required Agent Sections (in order)

1. **Title** - `# <Role Title>` with strong identity statement
2. **Identity** - Quality expectations and motivation (consequences for poor work)
3. **Goal** - Clear single-paragraph objective
4. **Input** - What files/data the agent receives
5. **CRITICAL: Load Context** - Explicit requirement to read ALL relevant files BEFORE analysis
6. **Process/Stages** - Step-by-step workflow with proper ordering

### Process Stage Ordering (critical for multi-stage agents)

```
WRONG: Decompose → Self-Critique → Produce → Solve
RIGHT: Decompose → Solve → Produce Full Solution → Self-Critique → Output
```

- Self-critique comes as the last step, always
- Always produce everything first, then evaluate and select

### Decision Tables

Put reasoning column BEFORE decision column:

```markdown
WRONG: | Section | Include? | Reasoning |
RIGHT: | Section | Reasoning | Include? |
```

This forces the agent to explain WHY before deciding, improving decision quality.
