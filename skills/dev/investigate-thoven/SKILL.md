---
name: investigate-thoven
description: Systematic 7-phase debugging workflow with mandatory pattern checking, agent investigation, approval gates, and conditional close. Use when investigating bugs, errors, crashes, or unexpected behavior. Triggers on "debug", "bug", "error", "fix", "broken", "not working", "investigate", "issue", "problem".
---

# Investigate Skill

Systematic 7-phase debugging workflow aligned with backend architecture. Classification drives everything downstream — agent roster, fix strategy, and close workflow are all determined by the initial classification. No judgment calls mid-workflow.

Read [enforcement-rules.md](references/enforcement-rules.md) before Phase 1.

## Pitfalls

- Before diagnosing a display bug, write down who should receive or see the item and confirm it; a wrong label can be a routing bug, so the "what should happen" slot names the product rule, not the symptom. (LEARNINGS 2026-10-22)

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
Phase 6: FIX (simple=inline, medium=subagent, complex=/architect then a plan)
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

Run this before reading any dimension table. stdin is the bug report. Done when a JSON record is in context.

```bash
classify ~/thoven/agent-skills/evals/schemas/investigate-intake.json
```

If `status` is `answered`, fill the label from the binding answers. Look up the roster from `category`. Do not re-read the indicator tables to re-derive them.

If `status` is `undecided` or an answer is not binding, read [references/intake-tables.md](references/intake-tables.md) for that dimension only.

Roster from `category` (lookup, not a second classification):

| Category | Mandatory Agents | Parallel? |
|----------|-----------------|-----------|
| **simple_ui** | `code-explorer` | No (1 agent) |
| **api_backend** | `debug-specialist` + `api-designer` | Yes |
| **state** | `debug-specialist` + `react-specialist` | Yes |
| **ssr_hydration** | `debug-specialist` + `next-js-developer` | Yes |
| **performance** | `debug-specialist` + `performance-analyzer` | Yes |
| **typescript** | `debug-specialist` + `typescript-pro` | Yes |
| **accessibility** | `code-explorer` + `accessibility-tester` | Yes |
| **intermittent** | `debug-specialist` + `code-explorer` | Yes |
| **unknown** | `debug-specialist` + `code-explorer` | Yes |
| **critical** | Category roster + devil's advocate agent | Yes |

Severity 0 = LOW (1 agent min). 3 or `critical` adds devil's advocate. Complexity 0 = fix inline, 1 = domain subagent, 2 = `/architect` then a plan.

Binding `needs_repro` and `repro_method` are Dimension 4. Binding `evidence` is Dimension 5. Keep both on the label. They are consumed in Phase 3 and Phase 7. Do not re-read those indicator tables when the answers bind.

#### Output the Classification Label

After classifying, output this label before proceeding:

```
Classification: [CATEGORY] / [SEVERITY] / [COMPLEXITY] / [CONTEXT] / repro=[YES|NO]:[METHOD] / evidence=[EVIDENCE]
Example: State / HIGH / MEDIUM / Standalone / repro=YES:Browser / evidence=Browser screenshot
```

### Step 3: Determine Context (for CLOSE phase)

Binding `context` fills this. If that answer is not binding, read the Context table in [references/intake-tables.md](references/intake-tables.md).

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

**Map the blast radius first.** Before any agent greps, run `graphify query "what calls <symptom symbol>"`
and `graphify path <entry> <suspect>` to get the real call chain, and hand that map to the agents in
their prompt. Agents that start from grep re-derive the topology badly and miss indirect callers.

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

### Diagnosis Confidence Gate

Rate the diagnosis before proposing a fix, and say the level in the report.

| Level | Meaning |
|---|---|
| **0 Guess** | A symptom and a suspicion. No mechanism named |
| **1 Plausible** | A mechanism named and consistent with the symptom, never observed |
| **2 Traced** | The mechanism observed in the running system or in a failing test |
| **3 Proven** | The mechanism observed, and removing it makes the symptom go away |

**At 0 or 1, reproduce or instrument before fixing.** The 3-strikes rule in
Phase 6 catches a wrong diagnosis after three failed fixes. This catches it
before the first one.

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

### Tier 3: COMPLEX (hand to /architect)

**Indicators:** 3-strikes rule triggered, architectural issue, cross-concern bug (3+ domains interacting), requires new abstractions.

**Action:** Hand the full diagnosis to `/architect` to shape the change, then sequence it with `/superpowers:writing-plans`.

Present to user:

> "This bug is architectural. It needs a planned approach rather than a direct fix. I am handing the diagnosis to `/architect` to shape the change, then turning that into a sequenced plan."

Then invoke `/architect` with context:

```
Skill: architect

Context: Bug investigation produced this diagnosis that requires architectural work.

[Paste full diagnostic report]

The fix requires changes across 3+ concerns and/or new abstractions.
Shape the types and module boundaries first, then hand to /superpowers:writing-plans
for a sequenced plan.
```

### Escalation: 3-Strikes Rule

If you've attempted 3 fixes and the bug persists, **STOP**.

> "Three failed fix attempts — likely architectural. The problem isn't where you think it is."

After 3 strikes:
1. Present all 3 attempted fixes and why each failed
2. Reclassify the bug as COMPLEX
3. Escalate to `/architect`

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

Dimension 5 chose this at intake, where the bug's nature was known.

| Evidence | Verify action |
|---|---|
| **Type-check** | `pnpm run type-check` inline, and name the result |
| **Unit test** | Run the test that now passes, and name it |
| **Browser screenshot** | Drive the surface and attach the frame |
| **Recording** | Capture the sequence |
| **Production check** | Confirm against production and name what you looked at |
| **None** | State what changed and why no check covers it |

HIGH or CRITICAL severity invokes the `verify` skill on top of the row above.

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
4. **Deploy reminder:** Tell user: "Fix pushed. Deploy with `/publish`; the branch picks the path."
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

## References

- [enforcement-rules.md](references/enforcement-rules.md) — NEVER and ALWAYS
- [quick-reference.md](references/quick-reference.md) — phase table
- [intake-tables.md](references/intake-tables.md) — Dimension tables when classify is undecided
- [agent-prompts.md](references/agent-prompts.md) — Agent prompt templates for each category
- [common-errors.md](references/common-errors.md) — Known error patterns (30+ entries, 7 categories)
- [debug-workflow.md](references/debug-workflow.md) — Agent selection guide and investigation strategies
