# Prompting Frameworks Catalog

## Task-Type Decision Matrix

| Task Type | Start With | Escalate To | Avoid |
|-----------|-----------|-------------|-------|
| Multi-step math | PAL | CoT + Self-Consistency | Zero-shot |
| Logic/causal reasoning | CoT (few-shot) | Self-Consistency | Over-instructing reasoning models |
| Complex problem-solving | Tree of Thoughts | Least-to-Most | Single-pass |
| Scientific/knowledge QA | Step-Back | CoT + RAG | Direct parametric memory |
| Document Q&A/research | RAG + context placement | Prompt chaining | Single monolithic prompt |
| Code generation (simple) | Zero-shot + requirements | Few-shot with examples | Over-specified CoT |
| Code generation (complex) | Role prompt + PAL | Reasoning model (o3/o4) | Verbose instructions for o-series |
| Code debugging | Reflexion loop | ReAct with execution | CoT without feedback |
| Agentic/multi-tool | ReAct | Prompt chaining + gates | Monolithic prompt |
| Long-form content | Skeleton of Thought | CO-STAR + few-shot | One-shot full generation |
| Creative/copywriting | CO-STAR or CRISPE | Few-shot with style examples | Zero-shot for brand voice |
| Summarization | Explicit format + context placement | Hierarchical chaining | Vague "summarize this" |
| Classification/extraction | Few-shot with diverse labels | Explicit output schema | Role prompting alone |
| Data analysis | PAL (Python) | CoT + structured output | Free-form prose reasoning |
| Brainstorming/ideation | CRISPE Experiment | Self-Consistency (parallel) | Narrow constrained prompts |
| Professional writing | CO-STAR | Prompt chaining (outline-draft-refine) | Unstructured single prompts |

## Reasoning Techniques

### Chain of Thought (CoT)
Step-by-step reasoning before final answer. "Think step by step" or show worked example.
Best for: Math, logic, causal reasoning, troubleshooting.

### Zero-Shot CoT
Append "Let's think step by step" without examples.
Best for: Quick reasoning when you don't have time for few-shot.

### Self-Consistency
Multiple reasoning chains, majority vote on answer. Request 3-5 independent attempts.
Best for: High-stakes reasoning where accuracy > cost.

### Tree of Thoughts (ToT)
Explore multiple branches, evaluate, backtrack. "Evaluate 3 approaches before selecting."
Best for: Creative planning, design decisions, architecture.

### ReAct (Reasoning + Acting)
Interleave reasoning with actions. Search-reason-act loops.
Best for: Agentic tasks, multi-step research, tool-use workflows.

### Reflexion
Reflect on failures, use reflection to improve. "Evaluate your output. What could be improved?"
Best for: Iterative coding, long-horizon planning.

### PAL (Program-Aided Language)
Generate executable code as reasoning. "Write code to solve this, then execute."
Best for: Math, algorithms, data analysis.

### Least-to-Most
Decompose into ordered subproblems, solve sequentially.
Best for: Complex compositional tasks, hierarchical planning.

### Step-Back Prompting
Ask abstract question first, use as context. "What general principles apply here?"
Best for: Scientific reasoning, knowledge-intensive QA.

## Structural Frameworks

### CO-STAR
Context, Objective, Style, Tone, Audience, Response format.
Best for: Content creation, professional writing.

### CRISPE
Capacity/Role, Insight, Statement, Personality, Experiment (multiple variations).
Best for: Creative tasks with multiple output options.

## Operational Techniques

### Few-Shot Prompting
3-5 input/output examples. Use diverse examples. Test zero-shot first.

### Role/Persona Prompting
Assign expert identity. Pair with task specifics.

### Prompt Chaining
Sequential prompts, validation gates between. For multi-stage workflows.

### XML Tag Structuring (Claude-specific)
Use <instructions>, <examples>, <context> tags. For multi-component prompts.

## Model-Specific Guidance

### Claude (Anthropic)
Be direct. Use XML tags. Place context before task. 3-5 diverse few-shot examples. Enable extended thinking for hard reasoning.

### OpenAI Reasoning Models (o1/o3/o4)
Simpler prompts. Don't say "think step by step." Direct task statements.

### OpenAI Standard Models (GPT-4.1/4o)
Use ### section markers. Persona + format + constraints. Few-shot for consistency.
