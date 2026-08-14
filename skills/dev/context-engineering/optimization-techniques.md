# Context Optimization Techniques

Context optimization extends the effective capacity of limited context windows through strategic compression, masking, caching, and partitioning. The goal is not to magically increase context windows but to make better use of available capacity. Effective optimization can double or triple effective context capacity without requiring larger models or longer contexts.

## Core Concepts

Context optimization extends effective capacity through four primary strategies: compaction (summarizing context near limits), observation masking (replacing verbose outputs with references), KV-cache optimization (reusing cached computations), and context partitioning (splitting work across isolated contexts).

The key insight is that context quality matters more than quantity. Optimization preserves signal while reducing noise. The art lies in selecting what to keep versus what to discard, and when to apply each technique.

## Detailed Topics

### Compaction Strategies

**What is Compaction**
Compaction is the practice of summarizing context contents when approaching limits, then reinitializing a new context window with the summary. This distills the contents of a context window in a high-fidelity manner, enabling the agent to continue with minimal performance degradation.

Compaction typically serves as the first lever in context optimization. The art lies in selecting what to keep versus what to discard.

**Compaction in Practice**
Compaction works by identifying sections that can be compressed, generating summaries that capture essential points, and replacing full content with summaries. Priority for compression:

1. **Tool outputs** - Replace verbose outputs with key findings
2. **Old conversation turns** - Summarize early exchanges
3. **Retrieved documents** - Summarize if task context captured
4. **Never compress** - System prompt and critical constraints

**Summary Generation**
Effective summaries preserve different elements depending on content type:

- **Tool outputs**: Preserve key findings, metrics, and conclusions. Remove verbose raw output.
- **Conversational turns**: Preserve key decisions, commitments, and context shifts. Remove filler and back-and-forth.
- **Retrieved documents**: Preserve key facts and claims. Remove supporting evidence and elaboration.

### Observation Masking

**The Observation Problem**
Tool outputs can comprise 80%+ of token usage in agent trajectories. Much of this is verbose output that has already served its purpose. Once an agent has used a tool output to make a decision, keeping the full output provides diminishing value while consuming significant context.

Observation masking replaces verbose tool outputs with compact references. The information remains accessible if needed but does not consume context continuously.

**Masking Strategy Selection**
Not all observations should be masked equally:

**Never mask:**
- Observations critical to current task
- Observations from the most recent turn
- Observations used in active reasoning

**Consider masking:**
- Observations from 3+ turns ago
- Verbose outputs with key points extractable
- Observations whose purpose has been served

**Always mask:**
- Repeated outputs
- Boilerplate headers/footers
- Outputs already summarized in conversation

### Context Partitioning

**Sub-Agent Partitioning**
The most aggressive form of context optimization is partitioning work across sub-agents with isolated contexts. Each sub-agent operates in a clean context focused on its subtask without carrying accumulated context from other subtasks.

This approach achieves separation of concerns--the detailed search context remains isolated within sub-agents while the coordinator focuses on synthesis and analysis.

**When to Partition**
Consider partitioning when:
- Task naturally decomposes into independent subtasks
- Different subtasks require different specialized context
- Context accumulation threatens to exceed limits
- Different subtasks have conflicting requirements

**Result Aggregation**
Aggregate results from partitioned subtasks by:
1. Validating all partitions completed
2. Merging compatible results
3. Summarizing if combined results still too large
4. Resolving conflicts between partition outputs


## Practical Guidance

### Optimization Decision Framework

**When to optimize:**
- Response quality degrades as conversations extend
- Costs increase due to long contexts
- Latency increases with conversation length

**What to apply:**
- Tool outputs dominate: observation masking
- Retrieved documents dominate: summarization or partitioning
- Message history dominates: compaction with summarization
- Multiple components: combine strategies

### Applying Optimization to Claude Code Prompts

**Command Optimization**
Commands load on-demand, so focus on keeping individual commands focused:
```markdown
# Good: Focused command with clear scope
---
name: review-security
description: Review code for security vulnerabilities
---
# Specific security review instructions only

# Avoid: Overloaded command trying to do everything
---
name: review-all
description: Review code for everything
---
# 50 different review checklists crammed together
```

**Skill Optimization**
Skills load their descriptions by default, so descriptions must be concise:
```markdown
# Good: Concise description
description: Analyze code architecture. Use for design reviews.

# Avoid: Verbose description that wastes context budget
description: This skill provides comprehensive analysis of code
architecture including but not limited to class hierarchies,
dependency graphs, coupling metrics, cohesion analysis...
```

**Sub-Agent Context Design**
When spawning sub-agents, provide focused context:
```markdown
# Coordinator provides minimal handoff:
"Review authentication module for security issues.
Return findings in structured format."

# NOT this verbose handoff:
"I need you to look at the authentication module which is
located in src/auth/ and contains several files including
login.ts, session.ts, tokens.ts... [500 more tokens of context]"
```

## Guidelines

1. Measure before optimizing--know your current state
2. Apply compaction before masking when possible
3. Design for cache stability with consistent prompts
4. Partition before context becomes problematic
5. Monitor optimization effectiveness over time
6. Balance token savings against quality preservation
7. Test optimization at production scale
8. Implement graceful degradation for edge cases
