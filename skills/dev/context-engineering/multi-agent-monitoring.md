# Context Degradation Patterns: Multi-Agent Workflows

This section transforms context degradation detection and mitigation concepts into actionable multi-agent workflows for Claude Code. Use these patterns when building commands, skills, or complex agent pipelines to ensure quality and reliability.

## Hallucination Detection Workflow

Hallucinations in agent output can poison downstream context and propagate errors through multi-step workflows. This workflow detects hallucinations before they compound.

### When to Use

- After any agent completes a task that produces factual claims
- Before committing agent-generated code or documentation
- When output will be used as input for subsequent agents
- During review of long-running agent sessions

### Multi-Agent Verification Pattern

**Step 1: Generate Output**

Have the primary agent complete its task normally.

**Step 2: Extract Claims**

Spawn a verification sub-agent with this prompt:

```markdown
<TASK>
Extract all factual claims from the following output. List each claim on a separate line.
</TASK>

<FOCUS_AREAS>
- File paths and their existence
- Function/class/method names referenced
- Code behavior assertions ("this function returns X")
- External facts about APIs, libraries, or specifications
- Numerical values and metrics
</FOCUS_AREAS>

<OUTPUT_TO_ANALYZE>
{agent_output}
</OUTPUT_TO_ANALYZE>

<OUTPUT_FORMAT>
One claim per line, prefixed with category:
[PATH] /src/auth/login.ts exists
[CODE] validateCredentials() returns a boolean
[FACT] JWT tokens expire after 24 hours by default
[METRIC] The function has O(n) complexity
</OUTPUT_FORMAT>
```

**Step 3: Verify Claims**

For groups of extracted claimd, spawn a verification agent:

```markdown
<TASK>
Verify this claim by checking the actual codebase and context.
</TASK>

<CLAIM>
{claim}
</CLAIM>

<VERIFICATION_APPROACH>
- For file paths: Use file tools to check existence
- For code claims: Read the actual code and verify behavior
- For external facts: Cross-reference with documentation or web search
- For metrics: Analyze the code structure
</VERIFICATION_APPROACH>

<RESPONSE_FORMAT>
STATUS: [VERIFIED | FALSE | UNVERIFIABLE]
EVIDENCE: [What you found]
CONFIDENCE: [HIGH | MEDIUM | LOW]
</RESPONSE_FORMAT>
```

**Step 4: Calculate Poisoning Risk**

Aggregate verification results:

```
total_claims = number of claims extracted
verified_count = claims marked VERIFIED
false_count = claims marked FALSE
unverifiable_count = claims marked UNVERIFIABLE

poisoning_risk = (false_count * 2 + unverifiable_count) / total_claims
```

**Step 5: Decision Threshold**

- **Risk < 0.1**: Output is reliable, proceed normally
- **Risk 0.1-0.3**: Review flagged claims manually before proceeding
- **Risk > 0.3**: Regenerate output with more explicit grounding instructions:

```markdown
<REGENERATION_PROMPT>
Previous output contained {false_count} false claims and {unverifiable_count} unverifiable claims.

Specific issues:
{list of FALSE and UNVERIFIABLE claims with evidence}

Please regenerate your response. For each factual claim:
1. Explicitly verify it using tools before stating it
2. If you cannot verify, state "I cannot verify..." instead of asserting
3. Cite the specific file/line/source for verifiable facts
</REGENERATION_PROMPT>
```

## Lost-in-Middle Detection Workflow

Critical information buried in the middle of long prompts receives less attention. This workflow detects which parts of your prompt are at risk of being ignored by running multiple agents and verifying their outputs against the original instructions.

### When to Use

- When designing new commands or skills with long prompts
- When agents inconsistently follow instructions across runs
- Before deploying prompts to production
- During prompt optimization

### Multi-Run Verification Pattern

**Step 1: Identify Critical Instructions**

Extract all critical instructions from your prompt that the agent MUST follow:

```markdown
Critical instructions to verify:
1. "Never modify files in /production"
2. "Always run tests before committing"
3. "Use TypeScript strict mode"
4. "Maximum function length: 50 lines"
5. "Include JSDoc for public APIs"
6. "Format output as JSON"
7. "Log all file modifications"
```

**Step 2: Run Multiple Agents with Same Prompt**

Spawn 3-5 agents with the SAME prompt (the command/skill/agent being tested). Each agent runs independently with identical inputs:

```markdown
<AGENT_RUN_CONFIG>
Number of runs: 5
Prompt: {your_full_prompt_being_tested}
Task: {representative_task_that_exercises_all_instructions}

For each run, save:
- run_id: unique identifier
- agent_output: complete response from agent
- timestamp: when run completed
</AGENT_RUN_CONFIG>
```

**Step 3: Verify Each Output Against Original Prompt**

For each agent's output, spawn a NEW verification agent that checks compliance with every critical instruction:

```markdown
<VERIFICATION_AGENT_PROMPT>
<TASK>
You are a compliance verification agent. Analyze whether the agent output followed each instruction from the original prompt.
</TASK>

<ORIGINAL_PROMPT>
{the_full_prompt_being_tested}
</ORIGINAL_PROMPT>

<CRITICAL_INSTRUCTIONS>
{numbered_list_of_critical_instructions}
</CRITICAL_INSTRUCTIONS>

<AGENT_OUTPUT>
{output_from_run_N}
</AGENT_OUTPUT>

<VERIFICATION_APPROACH>
For each critical instruction:
1. Determine if the instruction was applicable to this task
2. If applicable, check whether the output complies
3. Look for both explicit violations and omissions
4. Note any partial compliance
</VERIFICATION_APPROACH>

<OUTPUT_FORMAT>
RUN_ID: {run_id}

INSTRUCTION_COMPLIANCE:
- Instruction 1: "Never modify files in /production"
  STATUS: [FOLLOWED | VIOLATED | NOT_APPLICABLE]
  EVIDENCE: {quote from output or explanation}

- Instruction 2: "Always run tests before committing"
  STATUS: [FOLLOWED | VIOLATED | NOT_APPLICABLE]
  EVIDENCE: {quote from output or explanation}

[... continue for all instructions ...]

SUMMARY:
- Instructions followed: {count}
- Instructions violated: {count}
- Not applicable: {count}
</OUTPUT_FORMAT>
</VERIFICATION_AGENT_PROMPT>
```

**Step 4: Aggregate Results and Identify At-Risk Parts**

Collect verification results from all runs and identify instructions that were inconsistently followed:

```markdown
<AGGREGATION_LOGIC>
For each instruction:
  followed_count = number of runs where STATUS == FOLLOWED
  violated_count = number of runs where STATUS == VIOLATED
  applicable_runs = total_runs - (runs where STATUS == NOT_APPLICABLE)

  compliance_rate = followed_count / applicable_runs

  Classification:
  - compliance_rate == 1.0: RELIABLE (always followed)
  - compliance_rate >= 0.8: MOSTLY_RELIABLE (minor inconsistency)
  - compliance_rate >= 0.5: AT_RISK (inconsistent - likely lost-in-middle)
  - compliance_rate < 0.5: FREQUENTLY_IGNORED (severe issue)
  - compliance_rate == 0.0: ALWAYS_IGNORED (critical failure)

AT_RISK instructions are the primary signal for lost-in-middle problems.
These are instructions that work sometimes but not consistently, indicating
they are in attention-weak positions.
</AGGREGATION_LOGIC>

<AGGREGATION_OUTPUT_FORMAT>
INSTRUCTION COMPLIANCE SUMMARY:

| Instruction | Followed | Violated | Compliance Rate | Status |
|-------------|----------|----------|-----------------|--------|
| 1. Never modify /production | 5/5 | 0/5 | 100% | RELIABLE |
| 2. Run tests before commit | 3/5 | 2/5 | 60% | AT_RISK |
| 3. TypeScript strict mode | 4/5 | 1/5 | 80% | MOSTLY_RELIABLE |
| 4. Max function length 50 | 2/5 | 3/5 | 40% | FREQUENTLY_IGNORED |
| 5. Include JSDoc | 5/5 | 0/5 | 100% | RELIABLE |
| 6. Format as JSON | 1/5 | 4/5 | 20% | ALWAYS_IGNORED |
| 7. Log modifications | 3/5 | 2/5 | 60% | AT_RISK |

AT-RISK INSTRUCTIONS (likely in lost-in-middle zone):
- Instruction 2: "Run tests before commit" (60% compliance)
- Instruction 4: "Max function length 50" (40% compliance)
- Instruction 6: "Format as JSON" (20% compliance)
- Instruction 7: "Log modifications" (60% compliance)
</AGGREGATION_OUTPUT_FORMAT>
```

**Step 5: Output Recommendations**

Based on the at-risk parts identified, provide specific remediation guidance:

```markdown
<RECOMMENDATIONS_OUTPUT>
LOST-IN-MIDDLE ANALYSIS COMPLETE

At-Risk Instructions Detected: {count}
These instructions are inconsistently followed, indicating they likely
reside in attention-weak positions (middle of prompt).

SPECIFIC RECOMMENDATIONS:

1. MOVE CRITICAL INFORMATION TO ATTENTION-FAVORED POSITIONS
   The following instructions should be relocated to the beginning or end of your prompt:
   - "Run tests before commit" -> Move to <CRITICAL_CONSTRAINTS> at prompt START
   - "Max function length 50" -> Move to <KEY_REMINDERS> at prompt END
   - "Format as JSON" -> Move to <OUTPUT_FORMAT> at prompt END
   - "Log modifications" -> Add to both START and END sections

2. USE EXPLICIT MARKERS TO HIGHLIGHT CRITICAL INFORMATION
   Restructure at-risk instructions with emphasis:

   Before: "Always run tests before committing"
   After:  "**CRITICAL:** You MUST run tests before committing. Never skip this step."

   Before: "Maximum function length: 50 lines"
   After:  "3. [REQUIRED] Maximum function length: 50 lines"

   Use numbered lists, bold markers, or explicit tags like [REQUIRED], [CRITICAL], [MUST].

3. CONSIDER SPLITTING CONTEXT TO REDUCE MIDDLE SECTION
   If your prompt has many instructions, consider:
   - Breaking into focused sub-prompts for different aspects
   - Using sub-agents with specialized, shorter contexts
   - Moving detailed guidance to on-demand sections loaded only when needed

   Current prompt structure creates a large middle section where
   {count} instructions are being lost. Reduce middle section by:
   - Moving 2-3 most critical items to edges
   - Converting remaining middle items to a numbered checklist
   - Adding explicit "verify these items" reminder at end
</RECOMMENDATIONS_OUTPUT>
```

### Complete Workflow Example

```markdown
# Example: Testing a Code Review Command

## Original Prompt Being Tested:
"Review the code for: security issues, performance problems,
code style, test coverage, documentation completeness,
error handling, and logging practices."

## Run 5 Agents:
Each agent reviews the same code sample with this prompt.

## Verification Results:
| Instruction | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Rate |
|-------------|-------|-------|-------|-------|-------|------|
| Security | Y | Y | Y | Y | Y | 100% |
| Performance | Y | X | Y | X | Y | 60% |
| Code style | X | X | Y | X | X | 20% |
| Test coverage | X | Y | X | X | Y | 40% |
| Documentation | X | X | X | Y | X | 20% |
| Error handling | Y | Y | X | Y | Y | 80% |
| Logging | Y | Y | Y | Y | Y | 100% |

## Analysis:
- RELIABLE: Security, Logging (at edges of list)
- AT_RISK: Performance, Error handling
- FREQUENTLY_IGNORED: Code style, Test coverage, Documentation (middle of list)

## Remediation Applied:
"**CRITICAL REVIEW AREAS:**
1. Security vulnerabilities
2. Test coverage gaps
3. Documentation completeness

Review also: performance, code style, error handling, logging.

**BEFORE COMPLETING:** Verify you addressed items 1-3 above."
```

## Error Propagation Analysis Workflow

In multi-agent chains, errors from early agents propagate and amplify through subsequent agents. This workflow traces errors to their source.

### When to Use

- When final output contains errors despite correct intermediate steps
- When debugging complex multi-agent workflows
- When establishing error boundaries in agent chains
- During post-mortem analysis of failed agent tasks

### Error Trace Pattern

**Step 1: Capture Agent Chain Outputs**

Record the output of each agent in your chain:

```markdown
Agent Chain Record:
- Agent 1 (Analyzer): {output_1}
- Agent 2 (Planner): {output_2}
- Agent 3 (Implementer): {output_3}
- Agent 4 (Reviewer): {output_4}
```

**Step 2: Identify Error Symptoms**

Spawn an error identification agent:

```markdown
<TASK>
Analyze the final output and identify all errors, inconsistencies, or quality issues.
</TASK>

<FINAL_OUTPUT>
{output_from_last_agent}
</FINAL_OUTPUT>

<OUTPUT_FORMAT>
ERROR_ID: E1
DESCRIPTION: Function missing null check
LOCATION: src/utils/parser.ts:45
SEVERITY: HIGH

ERROR_ID: E2
...
</OUTPUT_FORMAT>
```

**Step 3: Trace Each Error Backward**

For each identified error, spawn a trace agent:

```markdown
<TASK>
Trace this error backward through the agent chain to find its origin.
</TASK>

<ERROR>
{error_description}
</ERROR>

<AGENT_CHAIN_OUTPUTS>
Agent 1 Output: {output_1}
Agent 2 Output: {output_2}
Agent 3 Output: {output_3}
Agent 4 Output: {output_4}
</AGENT_CHAIN_OUTPUTS>

<ANALYSIS_APPROACH>
For each agent output (starting from the last):
1. Does this output contain the error?
2. If yes, was the error present in the input to this agent?
3. If error is in output but not input: This agent INTRODUCED the error
4. If error is in both: This agent PROPAGATED the error
</ANALYSIS_APPROACH>

<OUTPUT_FORMAT>
ERROR: {error_id}
ORIGIN_AGENT: Agent {N}
ORIGIN_TYPE: [INTRODUCED | PROPAGATED_FROM_CONTEXT | PROPAGATED_FROM_TOOL_OUTPUT]
ROOT_CAUSE: {explanation}
CONTEXT_THAT_CAUSED_IT: {relevant context snippet if applicable}
</OUTPUT_FORMAT>
```

**Step 4: Calculate Propagation Metrics**

```
For each agent in chain:
  errors_introduced = count of errors this agent created
  errors_propagated = count of errors this agent passed through
  errors_caught = count of errors this agent fixed or flagged

propagation_rate = errors_at_end / errors_introduced_total
amplification_factor = errors_at_end / errors_at_start
```

**Step 5: Establish Error Boundaries**

Based on analysis, add verification checkpoints:

```markdown
<ERROR_BOUNDARY_TEMPLATE>
After Agent {N} completes:

1. Spawn verification agent to check for common error patterns:
   - {error_pattern_1 that Agent N tends to introduce}
   - {error_pattern_2 that Agent N tends to introduce}

2. If errors detected:
   - Log error for analysis
   - Either: Fix inline and continue
   - Or: Regenerate Agent N output with explicit guidance

3. Only proceed to Agent {N+1} if verification passes
</ERROR_BOUNDARY_TEMPLATE>
```

## Context Relevance Scoring Workflow

Not all parts of a prompt contribute equally to task completion. This workflow identifies distractor parts within a prompt that consume attention budget without adding value.

### When to Use

- When optimizing prompt length and content
- When deciding what to include in CLAUDE.md
- When a prompt feels bloated but you are unsure what to cut
- When debugging agents that ignore provided context
- Before deploying new commands, skills, or agent prompts

### Distractor Identification Pattern

**Step 1: Split Prompt into Parts**

Divide the prompt (command/skill/agent) into logical sections. Each part should be a coherent unit:

```markdown
<PROMPT_PARTS>
PART_1:
  ID: background
  CONTENT: |
    You are a Python expert helping a development team.
    Current project: Data processing pipeline in Python 3.9+

PART_2:
  ID: code_style_rules
  CONTENT: |
    - Write clean, idiomatic Python code
    - Include type hints for function signatures
    - Add docstrings for public functions
    - Follow PEP 8 style guidelines

PART_3:
  ID: historical_context
  CONTENT: |
    The project was migrated from Python 2.7 in 2019.
    Original team used camelCase naming but we now use snake_case.
    Legacy modules in /legacy folder are frozen.

PART_4:
  ID: output_format
  CONTENT: |
    Provide actionable feedback with specific line references.
    Explain the reasoning behind suggestions.
</PROMPT_PARTS>
```

Splitting guidelines:
- Each XML section or Markdown header becomes a part
- Separate conceptually distinct instructions into their own parts
- Keep related instructions together (do not split mid-thought)
- Aim for 3-15 parts depending on prompt length

**Step 2: Spawn Scoring Agents**

Spawn multiple scoring agents in parallel:

```markdown
<TASK>
Score how relevant this prompt parts is for accomplishing the specified task.
</TASK>

<TASK_DESCRIPTION>
{description of what the agent should accomplish}
Example: "Review a pull request for code quality issues and suggest improvements"
</TASK_DESCRIPTION>

<PROMPT_PARTS>
{contents of all the parts being evaluated}
</PROMPT_PARTS>

<SCORING_CRITERIA>
Score 0-10 based on these criteria:

ESSENTIAL (8-10):
- Part directly enables task completion
- Removing this part would cause task failure
- Part contains critical constraints that prevent errors
- Part defines required output format or structure

HELPFUL (5-7):
- Part improves output quality but is not strictly required
- Part provides useful context that guides better decisions
- Part contains preferences that affect style but not correctness

MARGINAL (2-4):
- Part has tangential relevance to the task
- Part might occasionally be useful but usually is not
- Part provides historical context rarely needed

DISTRACTOR (0-1):
- Part is irrelevant to the task
- Part could confuse the agent about what to focus on
- Part competes for attention without contributing value
</SCORING_CRITERIA>

<OUTPUT_FORMAT>
RELEVANCE_SCORE: [0-10]
JUSTIFICATION: [2-3 sentences explaining the score]
USAGE_LIKELIHOOD: [How often would the agent reference this part during task execution? ALWAYS | OFTEN | SOMETIMES | RARELY | NEVER]
</OUTPUT_FORMAT>
```

**Step 3: Aggregate Relevance Scores**

Collect scores from all scoring agents:

```
PART_SCORES = [
  {id: "background", score: 8, usage: "ALWAYS"},
  {id: "code_style_rules", score: 9, usage: "ALWAYS"},
  {id: "historical_context", score: 3, usage: "RARELY"},
  {id: "output_format", score: 7, usage: "OFTEN"}
]
```

Calculate aggregate metrics:

```
total_parts = count(PART_SCORES)
high_relevance_parts = count(parts where score >= 5)
distractor_parts = count(parts where score < 5)

context_efficiency = high_relevance_parts / total_parts
average_relevance = sum(scores) / total_parts
```

**Step 4: Identify Distractor Parts**

Apply the distractor threshold (score < 5):

```markdown
DISTRACTOR_ANALYSIS:

Identified Distractors:
1. PART: historical_context
   SCORE: 3/10
   JUSTIFICATION: "Migration history from Python 2.7 is rarely relevant to reviewing current code. The naming convention note is useful but should be in code_style_rules instead."
   RECOMMENDATION: REMOVE or RELOCATE

Summary:
- Total parts: 4
- High-relevance parts (>=5): 3
- Distractor parts (<5): 1
- Context efficiency: 75%
- Average relevance: 6.75

Token Impact:
- Distractor tokens: ~45 (historical_context)
- Potential savings: 45 tokens (11% of prompt)
```

**Step 5: Generate Optimization Recommendations**

Based on distractor analysis, provide actionable recommendations:

```markdown
OPTIMIZATION_RECOMMENDATIONS:

1. REMOVE: historical_context
   Reason: Score 3/10, usage RARELY. Migration history does not inform code review decisions.

2. RELOCATE: "we now use snake_case" from historical_context
   Target: code_style_rules section
   Reason: This specific rule is relevant but buried in irrelevant historical context.

3. CONSIDER CONDENSING: background
   Current: 2 sentences
   Could be: 1 sentence ("Python 3.9+ data pipeline expert")
   Savings: ~15 tokens

OPTIMIZED PROMPT STRUCTURE:
- background (condensed): 8 tokens
- code_style_rules (with snake_case added): 52 tokens
- output_format: 28 tokens
- Total: 88 tokens (down from 133 tokens)
- Efficiency improvement: 34% reduction
```

### Distractor Threshold Guidelines

The default threshold of 5 balances comprehensiveness against efficiency:

| Threshold | Use Case |
|-----------|----------|
| < 3 | Aggressive pruning for token-constrained contexts |
| < 5 | Standard optimization (recommended default) |
| < 7 | Conservative pruning for critical prompts |

Adjust threshold based on:
- **Context budget pressure**: Lower threshold when approaching limits
- **Task criticality**: Higher threshold for production prompts
- **Prompt stability**: Lower threshold for experimental prompts

### Scoring Agent Deployment

For efficiency, parallelize scoring agents:

```markdown
# Parallel execution pattern
spawn_parallel([
  scoring_agent(part_1, task_description),
  scoring_agent(part_2, task_description),
  scoring_agent(part_3, task_description),
  ...
])

# Collect and aggregate
scores = await_all(scoring_agents)
analysis = aggregate_scores(scores)
```

For large prompts (>10 parts), batch scoring agents in groups of 5-7 to manage orchestration overhead.

## Context Health Monitoring Workflow

Long-running agent sessions accumulate context that degrades over time. This workflow monitors context health and triggers intervention.

### When to Use

- During long-running agent sessions (>20 turns)
- When agents start exhibiting degradation symptoms
- As a periodic health check in agent orchestration systems
- Before critical decision points in agent workflows

### Health Check Pattern

**Step 1: Periodic Symptom Detection**

Every N turns (recommended: every 10 turns), spawn a health check agent:

```markdown
<TASK>
Analyze the recent conversation history for signs of context degradation.
</TASK>

<RECENT_HISTORY>
{last 10 turns of conversation}
</RECENT_HISTORY>

<SYMPTOM_CHECKLIST>
Check for these degradation symptoms:

LOST_IN_MIDDLE:
- [ ] Agent missing instructions from early in conversation
- [ ] Critical constraints being ignored
- [ ] Agent asking for information already provided

CONTEXT_POISONING:
- [ ] Same error appearing repeatedly
- [ ] Agent referencing incorrect information as fact
- [ ] Hallucinations that persist despite correction

CONTEXT_DISTRACTION:
- [ ] Responses becoming unfocused
- [ ] Agent using irrelevant context inappropriately
- [ ] Quality declining on previously-successful tasks

CONTEXT_CONFUSION:
- [ ] Agent mixing up different task requirements
- [ ] Wrong tool selections for obvious tasks
- [ ] Outputs that blend requirements from different tasks

CONTEXT_CLASH:
- [ ] Agent expressing uncertainty about conflicting information
- [ ] Inconsistent behavior between turns
- [ ] Agent asking for clarification on resolved issues
</SYMPTOM_CHECKLIST>

<OUTPUT_FORMAT>
HEALTH_STATUS: [HEALTHY | DEGRADED | CRITICAL]
SYMPTOMS_DETECTED: [list of checked symptoms]
RECOMMENDED_ACTION: [CONTINUE | COMPACT | RESTART]
SPECIFIC_ISSUES: [detailed description of problems found]
</OUTPUT_FORMAT>
```

**Step 2: Automated Intervention**

Based on health status, trigger appropriate intervention:

```markdown
IF HEALTH_STATUS == "DEGRADED" or HEALTH_STATUS == "CRITICAL":
  <RESTART_INTERVENTION>
  1. Extract essential state to preserve and save to a file
  2. Ask user to start a new session with clean context and load the preserved state from the file after the new session is started
  </RESTART_INTERVENTION>
```

## Guidelines for Multi-Agent Verification

1. Spawn verification agents with focused, single-purpose prompts
2. Use structured output formats for reliable parsing
3. Set clear thresholds for action vs. continue decisions
4. Log all verification results for debugging and optimization
5. Balance verification overhead against error prevention value
6. Implement verification at natural checkpoints, not every turn
7. Use lighter-weight checks for routine operations, heavier for critical ones
8. Design verification to be skippable in time-critical scenarios
