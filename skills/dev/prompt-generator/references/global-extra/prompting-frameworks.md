# Prompting Frameworks Reference

## Reasoning Techniques

| Technique | When to Use | How to Embed |
|-----------|-------------|--------------|
| **Chain of Thought (CoT)** | Multi-step reasoning, debugging, analysis | "Think step-by-step before answering..." |
| **Zero-Shot CoT** | Quick reasoning without examples | Append "Let's think step by step." |
| **Self-Consistency** | High-stakes decisions, verify correctness | "Generate 3 independent solutions, then select the most consistent one." |
| **Tree of Thoughts (ToT)** | Architecture decisions, complex tradeoffs | "Evaluate 3 distinct approaches. For each: outline the approach, list pros/cons, assess feasibility. Then select the best." |
| **ReAct (Reason + Act)** | Research, investigation, information gathering | Interleave: "Reason: [what do I know?] → Act: [what should I search/check?] → Observe: [what did I find?] → Repeat." |
| **Reflexion** | Debugging, iterative improvement | "After completing, review your output critically. Identify weaknesses. Revise." |
| **Step-Back Prompting** | Unfamiliar domains, when getting lost in details | "Before answering, step back: what general principles or frameworks apply here?" |
| **Least-to-Most** | Testing, learning paths, scaffolding complexity | "Start with the simplest case. Solve it. Build to more complex scenarios incrementally." |

## Structural Frameworks

| Framework | Structure | Best For |
|-----------|-----------|----------|
| **CRISPE** | Capacity, Role, Insight, Statement, Personality, Experiment | General-purpose role + goal framing |
| **CO-STAR** | Context, Objective, Style, Tone, Audience, Response | Content, marketing, communication tasks |
| **RISEN** | Role, Instructions, Steps, End goal, Narrowing | Implementation and process tasks |

## Operational Techniques

| Technique | When to Use | How to Apply |
|-----------|-------------|-------------|
| **Few-Shot** | Output format matters, pattern matching | Include 2-3 examples of ideal input → output before the actual request |
| **Role/Persona** | Domain expertise needed | "You are a [senior backend engineer / legal advisor / etc.] specializing in [X]..." |
| **Prompt Chaining** | Multi-phase tasks where output of step N feeds step N+1 | Design each step as a standalone prompt; pass output explicitly |
| **Skeleton of Thought** | Long structured outputs (PRDs, reports) | "First, outline the sections. Then expand each section one at a time." |
| **Divergent + Constraints** | Brainstorming, creative exploration | "Generate [N] distinct options. Constraints: [list]. After generating, evaluate each against [criteria]." |
| **Requirements-Only** | Cross-team handoffs | State what is needed (interface, contract, behavior) — not how to build it. Receiver owns implementation. |

## Type → Framework Mapping

| Prompt Type | Primary Framework | Secondary |
|------------|------------------|-----------|
| Implementation | Structured step-by-step (RISEN) | Few-Shot for pattern matching |
| Architecture/Design | Tree of Thoughts | Step-Back Prompting |
| Research | ReAct | Self-Consistency for conflicting sources |
| Debugging | CoT + Reflexion | Least-to-Most to isolate issue |
| Audit | Checklist-driven + Few-Shot | Role/Persona |
| PRD/Spec | Skeleton of Thought + JTBD framing | CO-STAR for stakeholder framing |
| Testing | Least-to-Most | Few-Shot for test format |
| Creative/Brainstorming | Divergent + Constraints | Tree of Thoughts for evaluation |
| Cross-Codebase Handoff | Requirements-Only | Prompt Chaining (design → implement) |
| Backend Pre-Implementation | Tree of Thoughts + Step-Back | ReAct for exploration |
| General/Unknown | CoT | Safe default |

## Model-Specific Notes

**Claude (Sonnet/Opus):**
- Responds well to explicit reasoning instructions ("think step by step", "evaluate before deciding")
- Benefits from explicit scope boundaries — will fill gaps with plausible but wrong assumptions if scope is vague
- For long outputs, Skeleton of Thought reduces coherence drift
- Explicit "non-goals" section reduces scope creep significantly

**GPT-4 / o-series:**
- o-series models have internal CoT — don't over-specify reasoning steps
- Responds well to concise, direct instructions
- Few-Shot examples are highly effective for format consistency

**General (model-agnostic):**
- Shorter prompts usually outperform padded ones — every sentence should earn its place
- Explicit output format > implicit expectations
- "Don't do X" often works better than "only do Y"
