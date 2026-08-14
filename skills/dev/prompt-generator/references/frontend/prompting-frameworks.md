# Prompting Frameworks Catalog

Reference for the prompt-generator skill's framework selection phase. Consult the Task-Type Decision Matrix first, then read individual entries as needed.

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
**What:** Step-by-step reasoning before final answer.
**Apply by:** "Think step by step" or show worked reasoning example.
**Best for:** Math, logic, causal reasoning, troubleshooting.
**Source:** Wei et al., Google (2022)

### Zero-Shot CoT
**What:** Append "Let's think step by step" without examples.
**Apply by:** Add the phrase to any prompt.
**Best for:** Quick reasoning when you don't have time for few-shot examples.
**Source:** Kojima et al. (2022)

### Self-Consistency
**What:** Multiple reasoning chains, majority vote on answer.
**Apply by:** Request 3-5 independent reasoning attempts, compare.
**Best for:** High-stakes reasoning where accuracy > cost.
**Source:** Wang et al., Google (2022)

### Tree of Thoughts (ToT)
**What:** Explore multiple reasoning branches, evaluate, backtrack if needed.
**Apply by:** "Evaluate 3 approaches before selecting. For each, assess pros/cons."
**Best for:** Creative planning, puzzles, design decisions.
**Source:** Yao et al., Princeton/Google (NeurIPS 2023)

### ReAct (Reasoning + Acting)
**What:** Interleave reasoning with actions (tool calls, searches).
**Apply by:** Structure search-reason-act loops.
**Best for:** Agentic tasks, multi-step research, tool-use workflows.
**Source:** Yao et al., Princeton/Google (2022)

### Reflexion
**What:** Reflect on failures, use reflection to improve next attempt.
**Apply by:** "After completing, evaluate your output. What could be improved?"
**Best for:** Iterative coding, long-horizon planning, multi-turn tasks.
**Source:** Shinn et al. (2023)

### PAL (Program-Aided Language)
**What:** Generate executable code as reasoning, offload computation.
**Apply by:** "Write Python code to solve this, then execute."
**Best for:** Math, algorithms, data analysis, symbolic manipulation.
**Source:** Gao et al., CMU/Google (ICML 2023)

### Least-to-Most
**What:** Decompose into ordered subproblems, solve sequentially.
**Apply by:** "Break into subproblems. Solve each using previous answers."
**Best for:** Complex compositional tasks, hierarchical planning.
**Source:** Zhou et al., Google (2022). 99.7% vs 16.2% accuracy on length generalization.

### Step-Back Prompting
**What:** Ask abstract question first, use as context for specific problem.
**Apply by:** "What general principles apply here?" before the task.
**Best for:** Scientific reasoning, knowledge-intensive QA.
**Source:** Zheng et al., Google DeepMind (2023). Up to 36% improvement.

## Structural Frameworks

### CO-STAR
**Components:** Context, Objective, Style, Tone, Audience, Response format.
**Best for:** Content creation, professional writing, communications.
**Source:** GovTech Singapore (GPT-4 Prompt Competition winner, 2023)

### CRISPE
**Components:** Capacity/Role, Insight, Statement, Personality, Experiment (multiple variations).
**Best for:** Creative tasks where you want multiple output options.
**Source:** Community-developed

### RISEN
**Components:** Role, Instructions, Steps, Expectation, Novelty.
**Best for:** Procedural clarity + creative differentiation.
**Source:** Community-developed

### APE (Action, Purpose, Expectation)
**Best for:** Quick task prompts where brevity matters.
**Source:** Community-developed

## Operational Techniques

### Few-Shot Prompting
**What:** 3-5 input/output examples before the task.
**Best for:** Format consistency, domain classification, custom tone.
**Key:** Use diverse examples. Test zero-shot first.

### Role/Persona Prompting
**What:** Assign expert identity ("You are a senior security engineer").
**Best for:** Domain-specific tone/vocabulary. Pair with task specifics.

### Prompt Chaining
**What:** Sequential prompts, output feeds next, validation gates between.
**Best for:** Multi-stage workflows too complex for one prompt.
**Source:** Anthropic core agentic pattern (2024-2025)

### Skeleton of Thought
**What:** Generate outline first, expand each point.
**Best for:** Long-form content, latency-sensitive generation.
**Source:** Microsoft Research (ICLR 2024)

### XML Tag Structuring (Claude-specific)
**What:** Use `<instructions>`, `<examples>`, `<context>` tags to segment.
**Best for:** Any multi-component Claude prompt.

## Agentic Patterns (Anthropic)

- **Prompt Chaining + Gates:** Sequential with quality checks between steps.
- **Orchestrator-Workers:** Central dispatch, parallel subtasks, synthesize.
- **Evaluator-Optimizer:** Generate then evaluate in loop until quality met.

## Model-Specific Guidance

### Claude (Anthropic)
- Be direct. Claude takes instructions literally.
- Use XML tags for structure.
- Place context before task (up to 30% improvement for long-context).
- 3-5 diverse few-shot examples.
- Enable extended thinking for hard reasoning.

### OpenAI Reasoning Models (o1/o3/o4)
- Simpler prompts work better. They have internal CoT.
- Don't say "think step by step." They do it automatically.
- Direct, clear task statements. Trust built-in reasoning.

### OpenAI Standard Models (GPT-4.1/4o)
- Use `###` section markers.
- Specific persona + output format + constraints.
- Few-shot for format consistency.

### Google Gemini
- Be direct, avoid verbosity.
- 1-3 targeted examples (fewer than other models).
- Step-Back Prompting for knowledge tasks.

### Meta Llama
- Set rules in system prompt once, don't repeat.
- Prefill output structure.
- 1-2 minimal examples.

## Skip These (Low ROI)

- **Emotional prompting** — anecdotal, no rigorous validation
- **Graph of Thoughts** — complexity overhead, limited gains over ToT
- **Directional Stimulus Prompting** — niche, better alternatives exist
