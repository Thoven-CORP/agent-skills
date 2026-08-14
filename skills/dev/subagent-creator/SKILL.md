---
description: Creates Claude Code agent files with proper structure, triggering conditions, and system prompts. Use when building new agents, updating agent definitions, or reviewing agent configurations.
argument-hint: [agent-name] [optional description of agent purpose]
allowed-tools: Read, Write, Glob, Grep, Bash(mkdir:*), Task
---

# Create Agent Command

Create autonomous Claude Code agents that handle complex, multi-step tasks independently. This command provides comprehensive guidance based on official Anthropic documentation and proven patterns.

## User Input

```text
Agent Name: $1
Description: $2
```

## What Are Agents?

Agents are **autonomous subprocesses** spawned via the Task tool that:

- Handle complex, multi-step tasks independently
- Have their own isolated context window
- Return results to the parent conversation
- Can be specialized for specific domains

| Concept | Agent | Command |
|---------|-------|---------|
| **Trigger** | Claude decides based on description | User invokes with `/name` |
| **Purpose** | Autonomous work | User-initiated actions |
| **Context** | Isolated subprocess | Shared conversation |
| **File format** | `agents/*.md` | `commands/*.md` |

## Agent File Structure

Agents use a unique format combining **YAML frontmatter** with a **markdown system prompt**:

```markdown
---
name: agent-identifier
description: Use this agent when [triggering conditions]. Examples:

<example>
Context: [Situation description]
user: "[User request]"
assistant: "[How assistant should respond and use this agent]"
<commentary>
[Why this agent should be triggered]
</commentary>
</example>

<example>
[Additional example...]
</example>

model: inherit
color: blue
tools: ["Read", "Write", "Grep"]
---

You are [agent role description]...

**Your Core Responsibilities:**
1. [Responsibility 1]
2. [Responsibility 2]

**Analysis Process:**
[Step-by-step workflow]

**Output Format:**
[What to return]
```

## Frontmatter Fields Reference

### Required Fields

#### `name` (Required)

**Format**: Lowercase with hyphens only
**Length**: 3-50 characters
**Rules**:

- Must start and end with alphanumeric character
- Only lowercase letters, numbers, and hyphens
- No underscores, spaces, or special characters

| Valid | Invalid | Reason |
|-------|---------|--------|
| `code-reviewer` | `helper` | Too generic |
| `test-generator` | `-agent-` | Starts/ends with hyphen |
| `api-docs-writer` | `my_agent` | Underscores not allowed |
| `security-analyzer` | `ag` | Too short (<3 chars) |
| `pr-quality-reviewer` | `MyAgent` | Uppercase not allowed |

#### `description` (Required, Critical)

**The most important field** - Defines when Claude triggers the agent. Must start with "Use this agent when..." and include `<example>` blocks. Ideal length: 200-1,000 characters with 2-4 examples.

> For detailed formatting rules, example block templates, DO/DON'T patterns, and model selection guidance, see **[description-formatting.md](description-formatting.md)**.

#### `color` (Required)

**Purpose**: Visual indicator in UI to distinguish agents

**Values**: `blue`, `cyan`, `green`, `yellow`, `magenta`, `red`

**Best Practice**: Use different colors for different agents in the same plugin to distinguish them visually.

### Optional Fields

#### `tools` (Optional)

**Purpose**: Restrict available tools (principle of least privilege)
**Format**: Array of tool names
**Default**: All tools available

```yaml
# Common tool restrictions
tools: ["Read", "Grep", "Glob"]           # Read-only analysis
tools: ["Read", "Write", "Grep", "Glob"]  # Code modification
tools: ["Read", "Bash", "Grep"]           # System operations
```

**Security Principle**: Only grant tools the agent actually needs.

## Triggering Patterns

### Pattern 1: Explicit Request

User directly asks for the agent's function.

```markdown
<example>
Context: User wants code reviewed
user: "Can you review my code changes?"
assistant: "I'll use the code-reviewer agent to analyze the changes."
<commentary>
User explicitly requested code review, trigger the code-reviewer agent.
</commentary>
</example>
```

### Pattern 2: Implicit Need

Agent needed based on context, not explicit request.

```markdown
<example>
Context: User mentions code is hard to understand
user: "This code is confusing and hard to follow"
assistant: "I can help improve the code clarity."
<commentary>
User indicates complexity issues. Trigger code-simplifier agent to refactor
for better readability.
</commentary>
assistant: "I'll use the code-simplifier agent to suggest improvements."
</example>
```

### Pattern 3: Proactive Trigger

Agent triggers after completing relevant work without explicit request.

```markdown
<example>
Context: User just implemented database queries
user: "I've added the user search functionality"
assistant: "Great! Let me review it for security."
<commentary>
Database code written. Proactively trigger security-analyzer to check
for SQL injection and other database security issues.
</commentary>
assistant: "I'll use the security-analyzer agent to check the database code."
</example>
```

### Pattern 4: Tool Usage Pattern

Agent triggers based on prior tool usage.

```markdown
<example>
Context: User made multiple edits to test files
user: "I've updated all the tests"
assistant: "Great! Let me verify test quality."
<commentary>
Multiple Edit tools used on test files. Proactively trigger test-quality-analyzer
to ensure tests follow best practices.
</commentary>
assistant: "I'll use the test-quality-analyzer agent to review the tests."
</example>
```

## System Prompt Design

The system prompt (markdown body after frontmatter) defines agent behavior. Use this proven template:

```markdown
You are [role] specializing in [domain].

**Your Core Responsibilities:**
1. [Primary responsibility - what the agent MUST do]
2. [Secondary responsibility]
3. [Additional responsibilities...]

**Analysis Process:**
1. [Step one - be specific]
2. [Step two]
3. [Step three]
[...]

**Quality Standards:**
- [Standard 1 - measurable criteria]
- [Standard 2]

**Output Format:**
Provide results in this format:
- [What to include]
- [How to structure]

**Edge Cases:**
Handle these situations:
- [Edge case 1]: [How to handle]
- [Edge case 2]: [How to handle]

**What NOT to Do:**
- [Anti-pattern 1]
- [Anti-pattern 2]
```

### System Prompt Principles

| Principle | Good | Bad |
|-----------|------|-----|
| Be specific | "Check for SQL injection in query strings" | "Look for security issues" |
| Include examples | "Format: `## Critical Issues\n- Issue 1`" | "Use proper formatting" |
| Define boundaries | "Do NOT modify files, only analyze" | No boundaries stated |
| Provide fallbacks | "If unsure, ask for clarification" | Assume and proceed |
| Quality mechanisms | "Verify each finding with evidence" | No verification |

### Validation Requirements

System prompts must be:

- **Length**: 20-10,000 characters (ideal: 500-3,000)
- **Well-structured**: Clear sections with responsibilities, process, output format
- **Specific**: Actionable instructions, not vague guidance
- **Complete**: Handles edge cases and quality standards

## Validation Rules

### Structural Validation

| Component | Rule | Valid | Invalid |
|-----------|------|-------|---------|
| Name | 3-50 chars, lowercase, hyphens | `code-reviewer` | `Code_Reviewer` |
| Description | 10-5000 chars, starts "Use this agent when" | `Use this agent when reviewing code...` | `Reviews code` |
| Model | One of: inherit, sonnet, opus, haiku | `inherit` | `gpt-4` |
| Color | One of: blue, cyan, green, yellow, magenta, red | `blue` | `purple` |
| System prompt | 20-10000 chars | 500+ char prompt | Empty body |
| Examples | At least one `<example>` block | Has examples | No examples |

### Validation Script

```bash
# Validate agent structure
scripts/validate-agent.sh agents/your-agent.md
```

### Quality Checklist

Before deployment:

- [ ] Name follows conventions (lowercase, hyphens, 3-50 chars)
- [ ] Description starts with "Use this agent when..."
- [ ] Description includes 2-4 `<example>` blocks
- [ ] Each example has context, user, assistant, commentary
- [ ] Model is appropriate for task complexity
- [ ] Color is unique among related agents
- [ ] Tools restricted to what's needed (least privilege)
- [ ] System prompt has clear structure
- [ ] Responsibilities are specific and actionable
- [ ] Process steps are concrete
- [ ] Output format is defined
- [ ] Edge cases are addressed

## Agent Creation Process

### Step 1: Gather Requirements

Ask user (if not provided):

1. **Agent name**: What should the agent be called? (kebab-case)
2. **Purpose**: What problem does this agent solve?
3. **Triggers**: When should Claude use this agent?
4. **Responsibilities**: What are the core tasks?
5. **Tools needed**: Read-only? Can modify files?
6. **Model**: Need maximum capability (opus) or balanced (sonnet/inherit)?

### Step 2: Create Agent File

```bash
# Create agents directory if needed
mkdir -p ${CLAUDE_PLUGIN_ROOT}/agents

# Create agent file
touch ${CLAUDE_PLUGIN_ROOT}/agents/<agent-name>.md
```

### Step 3: Write Frontmatter

Generate frontmatter with:

- Unique, descriptive name
- Description with triggering conditions and examples
- Appropriate model setting
- Distinct color
- Minimal required tools

### Step 4: Write System Prompt

Create system prompt following the template:

1. Role statement with specialization
2. Core responsibilities (numbered list)
3. Analysis/work process (step-by-step)
4. Quality standards (measurable criteria)
5. Output format (specific structure)
6. Edge cases (how to handle special situations)

### Step 5: Validate

Run validation:

```bash
scripts/validate-agent.sh agents/<agent-name>.md
```

Check:

- [ ] Frontmatter parses correctly
- [ ] All required fields present
- [ ] Examples are complete
- [ ] System prompt is comprehensive

### Step 6: Test Triggering

Test with various scenarios:

1. Explicit requests matching examples
2. Implicit needs where agent should activate
3. Scenarios where agent should NOT activate
4. Edge cases and variations

## Integration with Workflows

Agents integrate with plugin workflows:

1. **Phase 5: Component Implementation** uses agent-creator to generate agents
2. **Validation phase** uses validate-agent.sh script
3. **Testing phase** verifies triggering across scenarios

For comprehensive plugin development, use:

- `/plugin-dev:create-plugin` for full plugin workflow
- This command for individual agent creation/refinement

## Reference Documentation

- **[production-examples.md](production-examples.md)** - Complete production agent examples with full file contents
- **[description-formatting.md](description-formatting.md)** - Description formatting guide with DO/DON'T examples and model selection

## Create the Agent

Based on user input, create:

1. **Directory structure**: `${CLAUDE_PLUGIN_ROOT}/agents/`
2. **Agent file**: Complete markdown with frontmatter + system prompt
3. **Validation**: Run validation script
4. **Testing suggestions**: Scenarios to verify triggering

After creation, suggest testing with `/customaize-agent:test-prompt` command to verify agent behavior under various scenarios.
