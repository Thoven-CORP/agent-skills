---
name: investigate-thoven
description: Systematic 7-phase debugging workflow with mandatory pattern checking, agent investigation, approval gates, and conditional close. Use when investigating bugs, errors, crashes, or unexpected behavior. Triggers on "debug", "bug", "error", "fix", "broken", "not working", "investigate", "issue", "problem".
---

# Investigate Skill

Systematic 7-phase debugging workflow aligned with backend architecture. Classification drives everything downstream — agent roster, fix strategy, and close workflow are all determined by the initial classification. No judgment calls mid-workflow.

## Enforcement Rules (READ FIRST)

**CRITICAL — YOU MUST FOLLOW THESE RULES:**

### NEVER Do This:
- ❌ NEVER skip the pattern check against common-errors.md
- ❌ NEVER attempt to debug without launching the MANDATORY agents for the bug category
- ❌ NEVER use "optional" specialist logic — classification dictates the roster
- ❌ NEVER proceed to FIX without explicit user approval at the GATE
- ❌ NEVER claim root cause without evidence from agent investigation
- ❌ NEVER say "I think the issue is..." without agent findings to support it
- ❌ NEVER read code directly and propose fixes (use agents to investigate)
- ❌ NEVER skip pattern logging in CLOSE phase

### ALWAYS Do This:
- ✅ ALWAYS check common-errors.md for matching patterns BEFORE launching agents
- ✅ ALWAYS launch the MANDATORY agents for the classified bug category (no optional specialists)
- ✅ ALWAYS wait for agent results before diagnosing
- ✅ ALWAYS present a diagnostic report with "Investigation Sources" section
- ✅ ALWAYS ask user to choose a fix option before implementing
- ✅ ALWAYS cite specific file:line references from agent findings
- ✅ ALWAYS run the pattern quality gate before logging to common-errors.md
- ✅ ALWAYS determine fix tier (simple/medium/complex) from classification, not intuition

---

## MANDATORY First Action

**Before doing anything else — before reading files, before asking questions — create tasks:**

```
TaskCreate for each:
- [ ] Phase 1: Classify bug (category, severity, context)
- [ ] Phase 2: Pattern check (scan common-errors.md)
- [ ] Phase 3: Investigate (launch mandatory agents)
- [ ] Phase 4: Diagnose (structured report from agent findings)
- [ ] GATE: Present report, wait for explicit user approval
- [ ] Phase 5: Fix (delegate by complexity tier)
- [ ] Phase 6: Verify fix
- [ ] Phase 7: Close (conditional: standalone/feature-dev/production)
```

Mark each task `in_progress` when you start it, `completed` when done. **Do NOT proceed to the next phase until the current task is marked complete.**

---

## Workflow Overview

```
Phase 1: CLASSIFY
    ↓
Phase 2: PATTERN CHECK (scan common-errors.md by category)
    ↓ (match found? → ask user: apply known fix or investigate further?)
Phase 3: INVESTIGATE (mandatory agents per classification)
    ↓
Phase 4: DIAGNOSE (structured report from agent findings)
    ↓
Phase 5: GATE (mandatory stop — user chooses fix option)
    ↓
Phase 6: FIX (simple=inline, medium=subagent, complex=feature-orchestrator)
    ↓
Phase 7: VERIFY (user confirms bug is closed)
    ↓
Phase 8: CLOSE (conditional: standalone/feature-dev/production)
```

---

## Phase 1: CLASSIFY

**Goal:** Categorize the bug to determine the mandatory agent roster, fix tier, and close workflow. Everything downstream is a lookup — no judgment calls.

### Step 1: Quick Context Scan

Before asking questions, gather basic context:

1. **Parse the bug description** — identify keywords:
   - Page/component names (e.g., "marketplace", "dashboard", "booking wizard")
   - Feature areas (e.g., "filtering", "authentication", "payment")
   - Error indicators (e.g., "401", "not showing", "blank page")

2. **Light codebase check** (2-3 files max):
   ```
   Glob: **/[keyword]/** or **/[keyword]*
   Read: 1-2 file headers only
   Bash: git log --oneline -5 <relevant-files>
   ```

3. **Check conversation context** for prior errors or test results

### Step 2: Classify Bug Type

**YOU MUST classify across all three dimensions. Classification is FINAL — it determines the agent roster, fix tier, and close workflow.**

#### Dimension 1: Bug Category → determines agent roster

| Category | Mandatory Agents | Parallel? |
|----------|-----------------|-----------|
| **Simple UI** | `code-explorer` | No (1 agent) |
| **API/Backend** | `debug-specialist` + `api-designer` | Yes |
| **State** | `debug-specialist` + `react-specialist` | Yes |
| **SSR/Hydration** | `debug-specialist` + `next-js-developer` | Yes |
| **Performance** | `debug-specialist` + `performance-analyzer` | Yes |
| **TypeScript** | `debug-specialist` + `typescript-pro` | Yes |
| **Accessibility** | `code-explorer` + `accessibility-tester` | Yes |
| **Intermittent** | `debug-specialist` + `code-explorer` | Yes |
| **Unknown** | `debug-specialist` + `code-explorer` | Yes |
| **CRITICAL (any)** | Category roster + devil's advocate agent | Yes |

#### Dimension 2: Severity → modifies agent count

| Severity | Indicators | Agent Override |
|----------|-----------|----------------|
| **LOW** | Cosmetic, minor UX | 1 agent min (even if roster says 2) |
| **MEDIUM** | Feature broken for some users | Standard roster |
| **HIGH** | Feature broken for all users | Standard roster |
| **CRITICAL** | Production down, data loss, auth bypass | Category roster + devil's advocate |

#### Dimension 3: Complexity → determines fix strategy

| Tier | Indicators | Fix Strategy |
|------|-----------|-------------|
| **SIMPLE** | Single file, clear error, CSS fix, missing prop, known pattern | Fix inline |
| **MEDIUM** | 2-3 files, clear root cause from diagnosis | Delegate to domain-specific subagent |
| **COMPLEX** | 3-strikes, architectural, cross-concern (3+ domains) | Invoke `feature-orchestrator` |

#### Output the Classification Label

After classifying, output this label before proceeding:

```
🏷️ Classification: [CATEGORY] / [SEVERITY] / [COMPLEXITY] / [CONTEXT]
Example: State / HIGH / MEDIUM / Standalone
```

### Step 3: Determine Context (for CLOSE phase)

Classify the debugging context:

| Context | Indicators |
|---------|-----------|
| **Standalone bug fix** | User reported a bug, not part of feature work |
| **During feature dev** | Bug found while building a feature (not a standalone ticket) |
| **Production incident** | Something is broken in prod right now, urgency |

### Step 4: Ask Targeted Questions (If Needed)

If context scan found specific files, ask informed questions referencing what you found.

If context is unclear, ask:
1. Which page/workflow were you in?
2. What exactly did you see? (error message, behavior)
3. Logged in or out? Which user type?
4. Can you reproduce it?

### Phase 1 Checkpoint

Before proceeding, verify:
- [ ] Bug classified into category
- [ ] Mandatory agent roster determined (lookup, not judgment)
- [ ] Complexity tier estimated
- [ ] Context determined (standalone/feature-dev/production)

**STOP: Do not proceed to Phase 2 until classification is complete.**

---

## Phase 2: PATTERN CHECK

**Goal:** Scan `common-errors.md` for known patterns matching the classified category BEFORE launching agents. This catches repeat bugs instantly without burning agent context.

### Step 1: Load Category Patterns

Based on the classification from Phase 1, read the matching category section from `references/common-errors.md`:

| Classification | common-errors.md Category |
|---------------|--------------------------|
| Simple UI | "UI / Component Communication" |
| API/Backend | "API Integration" |
| State | "React Hooks / State" |
| SSR/Hydration | "Next.js App Router" + "UI / Component Communication" (Hydration Mismatch) |
| Performance | "React Hooks / State" (re-renders, memory) |
| TypeScript | "TypeScript / Build" |
| Accessibility | (no category yet — skip pattern check) |
| Intermittent | "React Hooks / State" (race conditions) |
| Authentication | "Authentication" |

**Read the entire category section.** Compare each pattern's **Symptom** and **Root Cause** against the bug description.

### Step 2: Check for Match

For each pattern in the category:
1. Does the **Symptom** match what the user described?
2. Does the **Root Cause** explain the observed behavior?
3. Do the **Files** overlap with the affected area?

### Step 3: Present Match (if found)

If a pattern matches, present it to the user:

```markdown
## Known Pattern Match

**Pattern:** [Error Name from common-errors.md]

**Symptom:** [from the pattern]

**Root Cause:** [from the pattern]

**Documented Fix:** [from the pattern]

**Prevention:** [from the pattern]

---

This matches a known pattern. Two options:

**A: Apply the documented fix** — Skip investigation, go directly to FIX phase with the known solution.

**B: Investigate further** — Launch agents anyway (the pattern may not be the actual cause).

Which would you like?
```

**If user chooses A:** Skip to Phase 6 (FIX) with the known fix as the chosen approach. Still run CLOSE phase after.

**If user chooses B:** Proceed to Phase 3 (INVESTIGATE) as normal.

### Step 4: No Match Found

If no pattern matches, state: "No known pattern matches. Proceeding to investigation."

Proceed to Phase 3.

### Phase 2 Checkpoint

- [ ] Category patterns from common-errors.md reviewed
- [ ] Match/no-match determined
- [ ] If match: user chose to apply fix or investigate further

---

## Phase 3: INVESTIGATE

**Goal:** Launch the mandatory agents determined by classification. No optional specialists — the roster is a lookup table.

### Enforcement: YOU MUST LAUNCH THE EXACT AGENTS

**This phase is MANDATORY. You are NOT allowed to:**
- Skip agent invocation and read code yourself
- Say "let me quickly check" and investigate manually
- Propose a fix based on your own code reading
- Launch fewer agents than the roster requires
- Substitute agents (e.g., using code-explorer when roster says react-specialist)

**You ARE required to:**
- Launch the exact agents from the mandatory roster for this bug category
- Launch all multi-agent rosters in a SINGLE message with multiple Task tool calls
- Wait for agent results before proceeding to Phase 4

### Agent Dispatch

**For all 2-agent categories, send ONE message with BOTH Task calls:**

```
Task tool call 1:
  subagent_type: "[first agent from roster]"
  description: "Investigate [symptom]"
  prompt: [Use template from references/agent-prompts.md]

Task tool call 2:
  subagent_type: "[second agent from roster]"
  description: "Trace/analyze [specific aspect]"
  prompt: [Use template from references/agent-prompts.md]
```

### Agent Prompt Templates

**All agent prompt templates (debug-specialist, code-explorer, domain specialists, devil's advocate) are in [references/agent-prompts.md](references/agent-prompts.md).** Copy and customize the matching template for each agent in the roster.

### Phase 3 Checkpoint

Before proceeding to Phase 4, verify:
- [ ] Exact agents from mandatory roster launched (not substituted)
- [ ] Agent results received (not just launched)
- [ ] Findings include file:line references
- [ ] Root cause hypothesis supported by evidence

**STOP: If you don't have agent findings with file:line references, go back and launch agents.**

---

## Phase 4: DIAGNOSE

**Goal:** Synthesize agent findings into a structured diagnostic report. Every claim must cite agent evidence.

### Diagnostic Report Format (REQUIRED)

**YOU MUST present findings in this exact format:**

```markdown
## Bug Report: [Issue Title]

### Classification
- **Category:** [from Phase 1]
- **Complexity:** [Simple / Medium / Complex]
- **Context:** [Standalone / Feature Dev / Production Incident]

### Symptom
[What's happening vs what should happen]

### Root Cause
[Technical explanation — MUST reference agent findings]

### Affected Files
- `path/to/file.tsx:123` — [what's wrong here]
- `path/to/other.ts:456` — [related issue]

### Investigation Sources
- **[agent-type] found:** [key findings with file:line refs]
- **[agent-type] found:** [key findings with file:line refs]

### Fix Options

**Option A: [Short Name]**
- Approach: [description]
- Files to modify: [list with line numbers]
- Complexity tier: [Simple/Medium/Complex]
- Pros: [list]
- Cons: [list]

**Option B: [Short Name]**
- Approach: [description]
- Files to modify: [list with line numbers]
- Complexity tier: [Simple/Medium/Complex]
- Pros: [list]
- Cons: [list]

### Recommendation
[Which option and why]
```

### Required Fields Validation

Before presenting the report, verify it includes:
- [ ] Classification section (category, complexity, context)
- [ ] "Investigation Sources" section with agent names
- [ ] File:line references (not just file names)
- [ ] At least 2 fix options (unless trivial single-line fix)
- [ ] Complexity tier on each option
- [ ] Clear recommendation

---

## Phase 5: GATE

**Goal:** Mandatory stop. User must explicitly choose a fix option before any implementation.

### APPROVAL GATE (MANDATORY STOP)

**After presenting the diagnostic report, YOU MUST STOP and ask:**

> "Which fix option would you like me to implement? (A, B, or suggest alternative)"

**DO NOT:**
- Proceed without explicit user selection
- Assume the user wants your recommendation
- Start implementing while asking

**WAIT for the user to respond with their choice.**

---

## Phase 6: FIX

**Goal:** Implement the user's chosen fix. Delegation strategy is determined by complexity tier from classification.

### Prerequisites Checklist

Before implementing, confirm:
- [ ] User explicitly chose an option (A, B, or described alternative)
- [ ] You have file:line references from Phase 4
- [ ] Complexity tier is determined

### Tier 1: SIMPLE (fix inline)

**Indicators:** Single file, known pattern from common-errors.md, CSS fix, missing prop, wrong import.

**Action:** Make the change directly. No delegation needed.

1. Make the changes to identified files
2. Verify the fix addresses root cause (not just symptom)
3. Summarize changes made
4. Proceed to CLOSE

### Tier 2: MEDIUM (delegate to domain-specific subagent)

**Indicators:** 2-3 files, clear root cause from diagnosis, well-scoped fix.

**Action:** Launch the domain-specific agent from the INVESTIGATE roster with the full diagnosis as context.

```
Task tool:
  subagent_type: "[same specialist from INVESTIGATE phase]"
  description: "Fix [root cause] — [chosen option]"
  prompt: |
    Implement this fix in the Thoven frontend codebase.

    DIAGNOSIS (from investigation):
    [Paste the full diagnostic report]

    CHOSEN FIX: Option [A/B]
    [Paste the chosen option details]

    REQUIREMENTS:
    1. Modify ONLY the files listed in the diagnosis
    2. Address the root cause, not just the symptom
    3. Follow existing code patterns in affected files
    4. Do NOT add comments, docstrings, or type annotations to unchanged code

    CODEBASE RULES:
    - Thoven Orange = amber-500 (NOT orange-500)
    - API calls through lib/*-api.ts only (never fetch in components)
    - font-display (Fredoka) for headers only, font-sans (Montserrat) for everything else
```

Review the agent's changes before accepting.

### Tier 3: COMPLEX (invoke feature-orchestrator)

**Indicators:** 3-strikes rule triggered, architectural issue, cross-concern bug (3+ domains interacting), requires new abstractions.

**Action:** Hand off to `feature-orchestrator` skill with the full diagnosis.

Present to user:

> "This bug is architectural — it needs a planned approach rather than a direct fix. I'm handing the diagnosis to `feature-orchestrator` to break it into a proper implementation plan."

Then invoke the `feature-orchestrator` skill with context:

```
Skill: feature-orchestrator

Context: Bug investigation produced this diagnosis that requires architectural work.

[Paste full diagnostic report]

The fix requires changes across 3+ concerns and/or new abstractions.
Please break this into a feature plan with proper task breakdown.
```

### Escalation: 3-Strikes Rule

If you've attempted 3 fixes and the bug persists, **STOP**.

> "Three failed fix attempts — likely architectural. The problem isn't where you think it is."

After 3 strikes:
1. Present all 3 attempted fixes and why each failed
2. Reclassify the bug as COMPLEX
3. Escalate to `feature-orchestrator`

### 5-Whys Analysis (for pattern bugs)

When a bug suggests a systemic pattern (not a one-off), trace to root cause:

1. **Why** did the component render wrong? → State was stale
2. **Why** was state stale? → Polling interval too long
3. **Why** was polling interval too long? → Copied from a different feature
4. **Why** was it copied? → No shared polling config
5. **Why** no shared config? → **Root: Missing abstraction for real-time data**

Flag systemic issues: "This bug points to a systemic issue: [description]. The fix addresses this instance, but consider addressing the root cause."

---

## Phase 7: VERIFY

**Goal:** Confirm the bug is actually fixed before closing. This is a mandatory phase — do NOT skip directly to CLOSE.

### Verify by Context

| Context | Verify Action |
|---------|--------------|
| **Standalone bug fix** | Invoke `verify` skill (Quick mode minimum) |
| **During feature dev** | Run `npm run type-check && npm run lint` inline |
| **Production incident** | Invoke `verify` skill (Standard mode) |
| **HIGH/CRITICAL severity** | Always invoke `verify` skill regardless of context |

### User Confirmation Gate

**STOP. After verification, present results and ask:**

> "Verification complete. [Summary of type-check/lint/verify results]. Is the bug confirmed fixed? (yes to proceed to close / no to return to investigation)"

**Do NOT proceed to CLOSE without explicit user confirmation.**

### Phase 7 Checkpoint
- [ ] Type-check and lint passed (no new errors introduced)
- [ ] Original symptom confirmed resolved (not just "code looks right")
- [ ] User explicitly confirmed: "yes, fixed"

---

## Phase 8: CLOSE

**Goal:** Conditional close workflow based on context classification from Phase 1. Pattern logging is mandatory with a quality gate.

### Close Workflow by Context

#### Standalone Bug Fix (user reported a bug, not part of feature work)

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **Commit:** Stage and commit the fix with descriptive message
3. **Summarize:** Brief summary of what was fixed and why

#### During Feature Dev (bug found while building a feature)

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **No separate commit:** Fix is part of the feature work, will be committed with the feature
3. **Summarize:** Brief note of what was fixed, reference it in feature docs if relevant

#### Production Incident (something is broken in prod)

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **Commit and push:** Stage, commit, and push immediately
3. **CHANGELOG:** Add entry to `[Unreleased]` section in `CHANGELOG.md`
4. **Deploy reminder:** Tell user: "Fix pushed to GitHub. To deploy: pull into Replit workspace and Publish."
5. **Summarize:** Full incident summary — symptom, root cause, fix, files changed

### Mandatory Pattern Logging (Quality Gate)

**This is NOT optional.** After every fix, you MUST evaluate whether to log a new pattern to `common-errors.md`.

**Quality gate — answer all three:**

1. **Is it generalizable?** Will this help with FUTURE bugs, not just document this one?
   - ❌ "Mixpanel CSP blocked at api-js.mixpanel.com" → too specific
   - ✅ "CSP Missing Required Subdomain" → applies to ANY SDK

2. **Does it have prevention guidance?** Not just "how to fix" but "how to avoid next time"?
   - ❌ "Add X to file Y"
   - ✅ "When adding any third-party SDK, check Network tab for all domains"

3. **Can you name it without mentioning specific files/services?**
   - ❌ "TeacherProfile handleSubmit bug"
   - ✅ "Stale Derived State After Partial Save"

**If all three pass:** Log to `common-errors.md` using the template below.

**If any fail:** State which criterion failed and why it's not worth logging. Example: "Not logging — this was a one-off typo in a component name, not a generalizable pattern."

### Pattern Entry Template

When logging, use this exact format:

```markdown
### Error: [Generalizable Pattern Name]
- **Symptom:** [What the user/developer sees — be specific]
- **Root Cause:** [WHY this happens — the underlying principle, not the incident]
- **Fix:** [How to resolve it]
- **Prevention:** [How to avoid this in the future — the most important field]
- **Applies to:** [What other situations this pattern covers]
- **Files:** [Common file locations, use "any X" for broad patterns]
- **Date Added:** [YYYY-MM-DD]
- **Reference:** [Brief description of the original incident that surfaced this pattern]
```

You can also use the helper script:

```bash
python .claude/skills/investigate-thoven/scripts/log_error.py \
  "Category" \
  "Generalizable Pattern Name" \
  "Symptom description" \
  "Root cause (the principle, not the incident)" \
  "Fix + Prevention guidance"
```

### Phase 8 Checkpoint

- [ ] User confirmed bug is fixed (Phase 7 gate passed)
- [ ] Pattern quality gate evaluated
- [ ] Pattern logged if it passed the gate (or reason stated for skipping)
- [ ] Commit made (standalone/production) or noted for feature commit (feature-dev)
- [ ] CHANGELOG updated (production incidents only)
- [ ] Deploy reminder given (production incidents only)

---

## Quick Reference

**First action before anything else:** `TaskCreate` for all 8 phases.

| Phase | Mandatory Action | Gate |
|-------|-----------------|------|
| **0. TASKS** | TaskCreate for all phases (MANDATORY FIRST) | Tasks created |
| 1. CLASSIFY | Category / Severity / Complexity / Context label | `🏷️` label output |
| 2. PATTERN CHECK | Scan common-errors.md by category | Match found? User decides |
| 3. INVESTIGATE | Launch MANDATORY agents (no optional) | Agent findings received |
| 4. DIAGNOSE | Present structured report with sources | Report complete |
| 5. GATE | **USER CHOOSES FIX OPTION** | Explicit selection |
| 6. FIX | Execute at correct tier (inline/subagent/orchestrator) | Fix implemented |
| 7. VERIFY | type-check + lint + user confirms fixed | **User says "yes, fixed"** |
| 8. CLOSE | Log pattern, commit (conditional) | Pattern gate evaluated |

---

## Common Mistakes

- **Fixing symptom not root cause** — The error appears in component A but the bug is in the data flowing from component B. Always trace upstream.
- **Not checking git log** — `git log --oneline -10 <file>` often reveals the change that introduced the bug.
- **Assuming the bug is where the error appears** — Stack traces point to where the error manifests, not where it originates.
- **Skipping the pattern check** — The #1 time-saver. Most repeat bugs are in common-errors.md already.
- **Substituting agents** — If the roster says `react-specialist`, don't use `code-explorer` instead. The roster exists for a reason.
- **Not logging patterns** — Every bug you fix without logging means someone (or Claude) hits the same bug again later.

---

## References

- [agent-prompts.md](references/agent-prompts.md) — Agent prompt templates for each category
- [common-errors.md](references/common-errors.md) — Known error patterns (30+ entries, 7 categories)
- [debug-workflow.md](references/debug-workflow.md) — Agent selection guide and investigation strategies
