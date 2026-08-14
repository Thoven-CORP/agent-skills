---
name: investigate
description: Systematic bug investigation with mandatory agent dispatch, root cause diagnosis, and conditional close workflow. Classifies bugs by environment (production/development) and severity to drive adaptive investigation and fix delegation. Triggers on "investigate", "bug", "error", "fix", "broken", "not working", "debug", "issue", "problem", "crash", "500 error", "test failure", "flaky", "Sentry alert".
---

# Investigate — Systematic Debugging

## The Iron Law

```
NO FIXES WITHOUT CONFIRMED ROOT CAUSE
NO ROOT CAUSE WITHOUT AGENT INVESTIGATION
NO CLOSE WITHOUT VERIFICATION
```

Do NOT propose fixes based on guessing. Do NOT read code directly and propose fixes — launch agents to investigate. If you catch yourself thinking "let me quickly check" or "this is too simple for agents" — STOP. Launch at least one agent.

**Enforcement details:** See [references/enforcement-rules.md](references/enforcement-rules.md)

## MANDATORY First Action

```
TaskCreate for each:
- [ ] Phase 0: Classify bug (environment, severity, known pattern check)
- [ ] Phase 1: Launch investigation agents (adaptive to classification)
- [ ] Phase 2: Synthesize findings into diagnostic report
- [ ] GATE: Present report, wait for user approval
- [ ] Phase 3: Fix (delegate based on complexity)
- [ ] Phase 4: Verify fix
- [ ] Phase 5: Close (conditional on classification)
```

## Workflow

```
CLASSIFY → INVESTIGATE → DIAGNOSE → [GATE] → FIX → VERIFY → CLOSE
   │            │                      │         │                │
   │            │                      │         ├─ Simple: inline
   │            │                      │         ├─ Complex: /expert-team
   │            │                      │         └─ Multi-step: write plan
   │            │                      │
   │            ├─ 1 agent (simple)    └─ User approves approach
   │            ├─ 2 agents (complex)
   │            └─ team (critical)
   │
   ├─ Production → urgent, push immediately
   ├─ Development → fix as part of feature
   └─ Discovered-affects-prod → triage urgency
```

---

## Phase 0: Classify

**Two mandatory steps before any investigation.**

### Step 1: Check Known Patterns

Read `.claude/docs/COMMON_ERRORS.md`. Search for keywords matching the symptom. If a known pattern matches, present it immediately — no agents needed for known bugs.

```bash
# Quick search for matching patterns
grep -i "KEYWORD" .claude/docs/COMMON_ERRORS.md
```

If a pattern matches: "This matches Bug #X in COMMON_ERRORS.md: [description]. Want me to apply the documented fix, or investigate further?"

### Step 2: Classify the Bug

Ask the user (if not already clear from context):
1. **What is the exact error/symptom?**
2. **Where is this happening?** (production, development, tests)
3. **When did it start?** (recent deploy, always, specific change)

Then classify:

| Dimension | Options | Impact |
|-----------|---------|--------|
| **Environment** | Production / Development / Discovered-affects-prod | Drives Phase 5 (close workflow) |
| **Severity** | Critical (down) / High (broken feature) / Medium (degraded) / Low (cosmetic) | Drives Phase 1 (agent count) |
| **Complexity** | Simple (1-2 files) / Complex (multi-file) / Unknown | Drives Phase 1 (agent type) and Phase 3 (fix delegation) |

Output the classification label:

```
🏷️ Classification: [PROD|DEV|DISCOVERED] / [CRITICAL|HIGH|MEDIUM|LOW] / [SIMPLE|COMPLEX|UNKNOWN]
```

### Notion Integration (start)

After classification, create a Bug Log entry:

```
Tool: mcp__plugin_Notion_notion__notion-create-pages
Parent: 26a6c461-0760-8008-8eca-cce74e61545b (Bug Log database)
Properties:
  - Title: [concise symptom description]
  - Status: In Triage
  - Severity: [from classification]
  - Date Reported: [today, ISO format]
```

Save the returned page ID. If Notion MCP is unavailable, warn and continue.

---

## Phase 1: Investigate (Adaptive Agents)

**Minimum agents are driven by classification. Always launch in parallel.**

| Classification | Minimum Agents | Pattern |
|---------------|----------------|---------|
| LOW / SIMPLE | 1: `bug-hunter` OR `feature-dev:code-explorer` | Single |
| MEDIUM or HIGH | 2: `bug-hunter` AND `feature-dev:code-explorer` | Parallel |
| COMPLEX or UNKNOWN | 2: both agents | Parallel |
| CRITICAL | 2+ agents, consider `/expert-team` dispatch | Team |

### Agent Prompt Templates

#### bug-hunter (root cause specialist):

```
Investigate this bug in the Thoven codebase:

SYMPTOM: [exact description]
ERROR MESSAGE: [exact error text, if any]
CLASSIFICATION: [from Phase 0]

MANDATORY FIRST STEP:
Read .claude/docs/COMMON_ERRORS.md and search for patterns matching this symptom.

THEN INVESTIGATE:
1. Find the root cause (not just the symptom)
2. Identify ALL affected files with line numbers
3. Check git log for recent changes in affected area
4. Document the execution path that leads to the error
5. Propose 2-3 fix approaches with trade-offs

CODEBASE CONTEXT:
- Rails 7.2.2 API-only backend
- Dual auth: Users (parents/teachers) via Devise JWT, Students via separate Devise model
- Profile types: ADMIN=1, PARENT=2, TEACHER=3 (integers, use .teacher? helpers)
- Soft deletes via archived_at, service layer in app/services/
```

#### feature-dev:code-explorer (execution path tracer):

```
Trace this code path in the Thoven codebase:

ENTRY POINT: [controller, service, or model]
USER ACTION: [what triggered the bug]

MAP THE FOLLOWING:
1. Full execution path from entry to failure point
2. All files and components involved (with line numbers)
3. Service layer flow (which service classes are called?)
4. Database queries and their results
5. Dependencies between components

MANDATORY: Check .claude/docs/COMMON_ERRORS.md for known patterns in this area.

RELEVANT DIRECTORIES:
- Controllers: app/controllers/api/v1/
- Services: app/services/
- Models: app/models/
- Serializers: app/serializers/
```

### Generate Diagnostic Commands

If the bug is in production and you can't access the environment directly, generate a **copy-paste diagnostic block** for the user:

```markdown
## Diagnostic Commands (run on Replit)

```bash
# 1. Check the error in logs
grep -i "ERROR_KEYWORD" log/production.log | tail -20

# 2. Verify data state
rails runner "puts MODEL.find('ID').inspect"

# 3. Test the endpoint
curl -s URL -H "Authorization: Bearer TOKEN" | ruby -rjson -e 'puts JSON.pretty_generate(JSON.parse(STDIN.read))'
```
```

### Synthesize Agent Results

When agents return, do NOT proceed until all have reported:

1. **Collect findings** from each agent with file:line references
2. **Identify agreements** — where agents found the same issue
3. **Identify conflicts** — where agents disagree on root cause
4. **Note gaps** — what neither agent investigated

---

## Phase 2: Diagnose

Base diagnosis ONLY on agent findings, not your own code reading.

### Structured Bug Report

```markdown
## Diagnostic Report

### Classification
🏷️ [PROD|DEV] / [SEVERITY] / [COMPLEXITY]

### Summary
[One paragraph: what's broken, why, proposed fix]

### Known Pattern Match
[Matches Bug #X in COMMON_ERRORS.md: YES/NO — if yes, reference it]

### Investigation Sources
- **bug-hunter:** [findings with file:line citations]
- **code-explorer:** [findings with file:line citations]

### Root Cause
**Cause:** [one sentence]
**Evidence:** [specific proof from agents]
**Mechanism:** [how it causes the symptom]
**Affected scope:** [what else might be affected]

### Proposed Fix
- [Change 1: file, what to change, why]
- [Change 2: file, what to change, why]

### Fix Complexity Assessment
- **Simple** (1-2 files, clear fix) → implement inline
- **Complex** (3+ files, multiple changes) → delegate to /expert-team
- **Multi-step** (requires plan) → write plan first

### Risk Assessment
- **Blast radius:** [what could break]
- **Confidence:** [HIGH/MEDIUM/LOW]

**Awaiting approval to proceed.**
```

### 5 Whys Analysis (for systemic issues)

When a bug suggests a pattern, trace through 5 levels. If systemic, flag it:
> "This bug points to a systemic issue: [description]. Consider addressing the root cause, not just this instance."

---

## GATE: User Approval

**STOP. Present diagnostic report. DO NOT implement fixes until approved.**

The user chooses:
- **"Fix it"** → Phase 3
- **"Need more info"** → return to Phase 1 with refined scope
- **"Different approach"** → adjust the proposed fix

---

## Phase 3: Fix (Delegates Based on Complexity)

**Do NOT try to do everything inline. Route to the right tool.**

| Fix Complexity | Action |
|---------------|--------|
| **Simple** (1-2 file change, clear fix) | Implement inline. Write regression test. |
| **Complex** (3+ files, architectural) | Invoke `/expert-team` in Execution mode |
| **Multi-step** (requires ordering/waves) | Write a plan, then use subagent-driven execution |
| **Production fire** (needs immediate deploy) | Fix inline, skip test if truly urgent, push immediately |

### For inline fixes:
1. Implement the minimal fix
2. Write a regression test (RED without fix → GREEN with fix)

### For delegated fixes:
Pass the diagnostic report to the delegated skill as context. The diagnosis is done — the other skill only needs to execute.

---

## Phase 4: Verify

Invoke the `/verify` skill or verify manually:

1. **Run test suite:** `bundle exec rspec` (or affected specs)
2. **Reproduce original symptom:** confirm it no longer occurs
3. **Check for regressions:** no new failures
4. **Production bugs:** ask user to verify in production (curl, browser, etc.)

**User must confirm the bug is closed before proceeding to Phase 5.**

---

## Phase 5: Close (Conditional on Classification)

### Production Bugs

```
1. Commit the fix (descriptive message with root cause)
2. Push to GitHub: git push origin main
3. Log to COMMON_ERRORS.md if this is a NEW pattern:
   - Does this bug reveal a pattern that could recur?
   - YES → add entry to .claude/docs/COMMON_ERRORS.md
   - NO (one-off typo, config issue) → skip
4. Update CHANGELOG.md if user-facing
5. Remind: deploy via Replit UI
6. Update Notion Bug Log → Fixed
```

### Development Bugs (found during feature work)

```
1. Commit as part of the feature branch (not a separate commit)
2. Skip COMMON_ERRORS unless it reveals a new pattern
3. Skip CHANGELOG (feature changelog covers it)
4. Update Notion Bug Log → Fixed (if entry was created)
```

### Discovered-Affects-Production

```
1. Same as Production Bugs workflow
2. Additionally flag: "This was discovered during [feature] development but affects production independently"
```

### COMMON_ERRORS.md Logging

When logging a new pattern, follow the format in `.claude/docs/COMMON_ERRORS.md`:

```markdown
**Bug N: [Title]**
- [Symptom description]
- Root cause: [explanation]
- **Fix (Mon YYYY):** [what was changed]
- **Location:** [file:line]
- **Safe pattern:** [code example of correct approach]
- Lesson: [generalized learning]
```

### Notion Integration (close)

```
Tool: mcp__plugin_Notion_notion__notion-update-page
Page ID: [saved from Phase 0]
Properties:
  - Status: Fixed
  - Fixed Date: [today, ISO format]
  - Notes: [append root cause + fix summary]
```

---

## Escalation: 3-Strikes Rule

If 3 fixes fail, **STOP**. Three failed attempts = likely architectural.

1. Present all 3 attempted fixes and why each failed
2. Propose that the root cause is structural, not local
3. Ask user: **(a)** re-investigate with broader scope, **(b)** bring in `/expert-team` for architecture review, or **(c)** defer and discuss architecture

**For CRITICAL bugs:** See [references/debug-workflow.md](references/debug-workflow.md) for full team investigation pattern.

---

## When NOT to Use

- Know the exact fix (single line, obvious typo) — just implement and verify
- Feature request — use `/brainstorm`
- Code review — use `/security-review` or `/expert-team` audit mode
- Verification of completed work — use `/verify`

## Rules

- **COMMON_ERRORS.md check before agents** — mandatory in Phase 0
- **Agent investigation before diagnosis** — no exceptions
- **Root cause before fix** — evidence from agents required
- **Approval gate** — user approves before implementation
- **Fix delegates by complexity** — don't force inline fixes on complex bugs
- **Verify before close** — user confirms bug is closed
- **Log new patterns** — production bugs that reveal new patterns go to COMMON_ERRORS.md
- **3 strikes** — 3 failed fixes = stop and discuss architecture
- **Cite sources** — every claim needs file:line from agent findings
