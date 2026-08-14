# Debug Workflow Reference

Detailed procedures for systematic debugging with MCP tools, agent orchestration, and agent team coordination.

---

## Investigation Decision Tree

```
Bug Reported
    │
    ▼
┌─────────────────────────────────────┐
│  Is it a simple, single-file bug?   │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ▼                    ▼
Use Serena MCP      Classify complexity
directly            │
                    ├── MEDIUM (2-3 files) → Explore Agent
                    │
                    ├── COMPLEX (multiple causes) → Agent Team
                    │                                │
                    │                                ▼
                    │                   ┌─────────────────────────────┐
                    │                   │ 1. TeamCreate               │
                    │                   │ 2. Dynamic team composition │
                    │                   │ 3. Parallel hypothesis test │
                    │                   │ 4. Synthesize in delegate   │
                    │                   └─────────────────────────────┘
                    │
                    └── CRITICAL (production/race) → Enhanced Agent Team
                                                     │
                                                     ▼
                                        ┌─────────────────────────────┐
                                        │ 1. TeamCreate               │
                                        │ 2. Investigators + Devil's  │
                                        │    Advocate                 │
                                        │ 3. Adversarial debate       │
                                        │ 4. Consensus via challenge  │
                                        │ 5. Context7 if external lib │
                                        └─────────────────────────────┘
```

---

## Agent Team Orchestration Patterns

### Pattern 1: Simple Bug (No Agents, No Team)

```
# Direct tool use, no delegation
1. Use Serena find_symbol to locate the error
2. Use Serena get_symbols_overview to understand context
3. Read the specific code
4. Identify fix
```

### Pattern 2: Medium Bug (Single Agent)

```
# Delegate exploration, keep analysis
Task tool:
- subagent_type: "Explore"
- prompt: "Find all code related to [feature]. List files and their purposes."
- description: "Explore [feature]"

# Wait for result, then analyze yourself
```

### Pattern 3: COMPLEX Bug (Agent Team - Dynamic Composition)

**This is the primary pattern for multi-cause bugs.**

```
# Step 1: Create team
TeamCreate:
- team_name: "investigate-auth-403"
- description: "Investigating 403 errors on teacher endpoints"

# Step 2: Create tasks for each hypothesis
TaskCreate: "Hypothesis 1: before_action filter missing on new endpoint"
TaskCreate: "Hypothesis 2: profile_type enum comparison bug"
TaskCreate: "Hypothesis 3: JWT token not refreshing correctly"
TaskCreate: "Synthesize all findings" (blocked by above 3)

# Step 3: Spawn teammates (ALL in ONE message)
Task:
- subagent_type: "bug-hunter"
- team_name: "investigate-auth-403"
- name: "auth-flow-tracer"
- prompt: "Investigate hypothesis: before_action filter missing.
  Check the controller, its parent classes, and route configuration.
  Report: CONFIRMED/DISPROVEN with evidence."

Task:
- subagent_type: "general-purpose"
- team_name: "investigate-auth-403"
- name: "enum-checker"
- prompt: "Investigate hypothesis: profile_type enum comparison bug.
  Search for any integer-to-string enum comparisons.
  Report: CONFIRMED/DISPROVEN with evidence."

Task:
- subagent_type: "general-purpose"
- team_name: "investigate-auth-403"
- name: "token-investigator"
- prompt: "Investigate hypothesis: JWT token not refreshing.
  Check Devise JWT configuration, token expiration, jti revocation.
  Report: CONFIRMED/DISPROVEN with evidence."

# Step 4: Lead coordinates (delegate mode)
# - Monitor task list
# - Relay findings between teammates
# - Synthesize when all report back

# Step 5: Clean up
SendMessage: shutdown_request to each teammate
TeamDelete
```

### Pattern 4: CRITICAL Bug (Enhanced Agent Team - Adversarial Review)

**This is the full-treatment pattern for production incidents.**

```
# Step 1: Create team
TeamCreate:
- team_name: "critical-investigate-race-condition"
- description: "CRITICAL: Race condition in booking credit reservation"

# Step 2: Create tasks
TaskCreate: "Primary hypothesis: Missing database lock on credit check"
TaskCreate: "Alternative hypothesis: Stale Redis cache serving old balance"
TaskCreate: "Alternative hypothesis: Retry logic re-reserving credits"
TaskCreate: "Devil's advocate review of all findings"
TaskCreate: "Synthesize findings and determine root cause"

# Step 3: Spawn team (ALL in ONE message)
Task: primary-investigator (bug-hunter) → tests most likely hypothesis
Task: alt-investigator (bug-hunter) → tests alternative theory
Task: devils-advocate (general-purpose) → waits then challenges findings
Task: changes-auditor (general-purpose) → checks git history for recent changes

# Step 4: Lead facilitates adversarial debate
# Round 1: Investigators report findings
# Round 2: Forward findings to Devil's Advocate
# Round 3: Devil's Advocate challenges → forward back to investigators
# Round 4: Investigators address challenges
# Round 5: Consensus or lead judgment call

# Step 5: Synthesize + Clean up
```

### Pattern 5: External Library Bug (Agent Team + Context7)

```
# For bugs involving Stripe, Devise, etc.
# One teammate reads your code, another reads library docs

Task:
- name: "code-analyst"
- prompt: "Find and analyze how we use [library] in [affected area].
  Focus on: [specific API calls, configuration, error handling]."

Task:
- name: "library-researcher"
- prompt: "Use Context7 to look up current documentation for [library].
  1. resolve-library-id for '[library name]'
  2. query-docs for '[specific behavior/error]'
  Compare current best practices with our implementation.
  Report any discrepancies."
```

---

## Dynamic Team Composition Guide

The lead determines team size and roles based on bug characteristics. Here are detailed templates:

### Bug: Multiple Plausible Causes

**Team Size:** 2-3 hypothesis investigators
**Roles:**
- `hypothesis-1-tester`: Tests the most likely cause
- `hypothesis-2-tester`: Tests the second most likely cause
- `hypothesis-3-tester`: Tests a less obvious cause (optional)

**Why this works:** Each investigator focuses deeply on one theory without anchoring bias from the others. Parallel execution means 3x faster than sequential investigation.

### Bug: Spans Multiple Layers

**Team Size:** 2 layer specialists
**Roles:**
- `data-flow-tracer`: Traces data from database → model → service → controller → serializer
- `request-flow-tracer`: Traces request from route → middleware → controller → auth → response

**Why this works:** Full-stack bugs often have symptoms in one layer and root causes in another. Two specialists covering both directions find the handoff point faster.

### Bug: External Library Involvement

**Team Size:** 2: code analyst + library researcher
**Roles:**
- `code-analyst`: Reads your implementation code with Serena
- `library-researcher`: Reads library docs via Context7, checks for version-specific gotchas

**Why this works:** Many "bugs" are actually incorrect library usage. Having one teammate focused on docs prevents the common mistake of assuming your code is wrong when the API contract changed.

### Bug: Data Integrity / Aggregation

**Team Size:** 2: query analyst + data auditor
**Roles:**
- `query-analyst`: Traces SQL queries, JOINs, aggregations, finds duplication
- `data-auditor`: Checks production data state, finds records violating assumptions

**Why this works:** Data bugs are often invisible in code review because the code logic is correct but the data doesn't match assumptions. Splitting code analysis from data analysis catches both.

### Bug: Performance / N+1

**Team Size:** 2: profiler + code tracer
**Roles:**
- `profiler`: Runs queries, checks logs, measures actual performance
- `code-tracer`: Traces includes/eager_load chains, finds missing associations

**Why this works:** Performance bugs need both measurement (what's slow?) and analysis (why is it slow?). One teammate measures while the other traces.

### Bug: Race Condition / Concurrency

**Team Size:** 3: primary + alternative + devil's advocate (CRITICAL pattern)
**Roles:**
- `primary-investigator`: Tests the most likely race condition scenario
- `alt-investigator`: Tests an alternative concurrency issue
- `devils-advocate`: Challenges both theories, checks if proposed fixes are sufficient

**Why this works:** Race conditions are notoriously tricky - the first plausible explanation is often wrong or incomplete. Adversarial review catches edge cases the investigators miss.

---

## Delegate Mode: Lead Behavior Guide

When running COMPLEX or CRITICAL investigations, the lead operates in delegate mode.

### What Delegate Mode Means

```
LEAD CAN:                          LEAD CANNOT:
✅ TeamCreate / TeamDelete          ❌ Read source code files
✅ TaskCreate / TaskUpdate          ❌ Run Grep/Glob/Serena searches
✅ Spawn teammates (Task tool)      ❌ Write or edit code
✅ SendMessage to teammates         ❌ Run bash commands for investigation
✅ Synthesize findings into report  ❌ Make conclusions without team input
✅ Manage approval gate             ❌ Skip adversarial review (CRITICAL)
```

### Lead Communication Flow

```
┌────────────────┐         ┌─────────────────┐
│   Teammate A   │         │   Teammate B    │
│  (investigator)│         │  (investigator) │
└───────┬────────┘         └────────┬────────┘
        │ findings                  │ findings
        ▼                           ▼
┌──────────────────────────────────────────┐
│              LEAD (delegate)             │
│                                          │
│  1. Receives findings from A and B       │
│  2. Forwards A's findings to B (and B→A) │
│  3. Forwards both to Devil's Advocate    │
│  4. Relays challenges back               │
│  5. Synthesizes diagnostic report        │
│  6. Manages approval gate                │
└──────────────────────────────────────────┘
        │ challenges                │ challenges
        ▼                           ▼
┌──────────────────────────────────────────┐
│         Devil's Advocate (CRITICAL)      │
│                                          │
│  Reviews findings, challenges theories,  │
│  looks for evidence others missed        │
└──────────────────────────────────────────┘
```

### Message Templates for Lead

**Forwarding findings:**
```
SendMessage:
- type: "message"
- recipient: "devils-advocate"
- content: "Here are the findings so far:

  primary-investigator found: [summary with file paths and evidence]
  alt-investigator found: [summary with file paths and evidence]

  Please review and challenge these findings. Specifically:
  1. Are there weaknesses in their reasoning?
  2. Did they miss any potential causes?
  3. Could the proposed root cause be a symptom of something deeper?"
- summary: "Forward findings for adversarial review"
```

**Relaying challenges:**
```
SendMessage:
- type: "message"
- recipient: "primary-investigator"
- content: "devils-advocate has challenged your finding:

  Challenge: [specific challenge]

  Can you address this with additional evidence? If your theory doesn't hold up,
  that's valuable information too."
- summary: "Relay challenge from devil's advocate"
```

**Redirecting investigation:**
```
SendMessage:
- type: "message"
- recipient: "alt-investigator"
- content: "primary-investigator found strong evidence for [theory].
  Can you verify this from a different angle? Check [specific thing to verify]."
- summary: "Redirect investigation to verify finding"
```

---

## Serena MCP Deep Dive

Serena provides semantic code understanding. Use it when you need to understand code structure, not just text search.

### Key Serena Tools

#### 1. find_symbol - Find Code by Name

```
mcp__plugin_serena_serena__find_symbol

# Find a class
- name_path_pattern: "BookingRequestService"
- depth: 1
- include_body: false

# Find a specific method with implementation
- name_path_pattern: "BookingRequestService/create"
- include_body: true

# Find with substring matching
- name_path_pattern: "reserve"
- substring_matching: true

# Limit to specific directory
- name_path_pattern: "create"
- relative_path: "app/services"
```

#### 2. find_referencing_symbols - Find Callers

```
mcp__plugin_serena_serena__find_referencing_symbols

# Who calls this method?
- name_path: "BookingRequestService/create"
- relative_path: "app/services/booking_request_service.rb"
```

#### 3. search_for_pattern - Regex Search

```
mcp__plugin_serena_serena__search_for_pattern

# Find error handling patterns
- substring_pattern: "rescue.*StandardError"
- restrict_search_to_code_files: true

# Find SQL locking
- substring_pattern: "lock.*FOR UPDATE"
- context_lines_before: 5
- context_lines_after: 5
```

#### 4. get_symbols_overview - File Structure

```
mcp__plugin_serena_serena__get_symbols_overview

# See all methods in a file
- relative_path: "app/services/booking_request_service.rb"
- depth: 1
```

### Serena vs Grep/Glob Decision

| Need | Use |
|------|-----|
| Find method by name | Serena find_symbol |
| Find who calls a method | Serena find_referencing_symbols |
| Find text pattern anywhere | Serena search_for_pattern or Grep |
| Find file by name | Glob |
| Understand file structure | Serena get_symbols_overview |

---

## Context7 MCP for External Libraries

When bugs involve external libraries, check documentation BEFORE assuming the issue is in your code.

### Context7 Workflow

```
# Step 1: Resolve the library ID
mcp__plugin_context7_context7__resolve-library-id
- libraryName: "devise jwt"
- query: "token expiration not working"

# Step 2: Query relevant docs
mcp__plugin_context7_context7__query-docs
- libraryId: "/waiting-for-dev/devise-jwt"
- query: "JWT token expiration configuration"
```

### When to Use Context7

| Bug Symptom | Library to Check |
|-------------|------------------|
| Payment failures | stripe ruby |
| Auth 401 errors | devise, devise-jwt |
| Webhook signature invalid | stripe webhooks |
| Calendar sync issues | google-apis-calendar |
| Background job not running | solid_queue |
| Image upload failing | activestorage, google-cloud-storage |

---

## Investigation Strategies by Bug Type

### UI / Component Bugs

**Investigation Steps:**
1. **Clarify from user:** Which component, what action triggered it
2. **Context7:** Check React/Next.js docs if framework-related
3. **Explore Agent:** Find component and its dependencies
4. **Serena:** Trace props and state flow

**Common Causes:**
- Missing props or callbacks
- Incorrect state updates
- CSS/styling issues
- Hydration mismatches (SSR)

### API / Backend Integration Bugs

**Investigation Steps:**
1. **Clarify from user:** Exact endpoint, request/response
2. **Serena:** Find controller action
3. **Serena:** Trace to service layer
4. **Context7:** Check API docs if external service

**Common Causes:**
- Wrong payload format (missing wrapper key)
- Auth token not sent or expired
- CORS misconfiguration
- Wrong HTTP method

### Database / Data Bugs

**Recommended: COMPLEX classification (Agent Team)**

**Team Composition:** query-analyst + data-auditor

**Investigation Steps:**
1. query-analyst: Find all writes to affected table
2. query-analyst: Find all reads from affected table
3. data-auditor: Check production data state
4. data-auditor: Check model validations and callbacks

**Common Causes:**
- Missing validation
- Callback side effects
- N+1 queries returning stale data
- Migration not run

### Authentication Bugs

**Investigation Steps:**
1. **Clarify:** User type (Parent/Teacher/Student)
2. **Context7:** Check Devise/JWT docs
3. **Serena:** Find auth controller and middleware
4. **Serena:** Trace token validation flow

**Common Causes:**
- Dual auth confusion (User vs Student)
- Token expired
- Wrong storage key (token vs student_token)
- Missing before_action

### Race Conditions

**Recommended: CRITICAL classification (Enhanced Agent Team)**

**Team Composition:** primary-investigator + alt-investigator + devils-advocate

**Investigation Steps:**
1. primary-investigator: Find transaction boundaries, check for locks
2. alt-investigator: Search for cache invalidation issues, stale reads
3. devils-advocate: Challenge whether proposed fix actually prevents the race
4. Lead: Facilitate debate, synthesize consensus

**Common Causes:**
- Missing database lock
- Transaction too narrow
- Optimistic locking not implemented
- Check-then-act without atomic operation

---

## Team Lifecycle Management

### Starting a Team

```
# 1. Create team
TeamCreate:
- team_name: "investigate-[short-name]"
- description: "[investigation purpose]"

# 2. Create tasks (hypothesis-based)
TaskCreate for each hypothesis + synthesis task
Set up blockedBy dependencies

# 3. Spawn teammates (ALL at once)
Multiple Task tool calls in ONE message
```

### During Investigation

```
# Monitor progress
TaskList  # See task status

# Relay findings
SendMessage to forward discoveries between teammates

# Redirect if needed
SendMessage to redirect teammate to new angle
```

### Shutting Down a Team

```
# 1. Send shutdown requests to all teammates
SendMessage:
- type: "shutdown_request"
- recipient: "[teammate-name]"
- content: "Investigation complete"

# 2. Wait for all teammates to acknowledge

# 3. Delete team
TeamDelete
```

### Handling Stuck Teammates

If a teammate stops responding or gets stuck:

1. Check if they're idle (normal - just means waiting for input)
2. Send them a message to redirect or unblock:
   ```
   SendMessage:
   - type: "message"
   - recipient: "[stuck-teammate]"
   - content: "Status check - are you blocked? If so, what do you need?"
   ```
3. If truly stuck, shut them down and spawn a replacement

---

## Checklist Before Proposing Fix

- [ ] Root cause identified (not just symptom)
- [ ] For COMPLEX/CRITICAL: Team investigation completed
- [ ] For CRITICAL: Devil's Advocate review completed
- [ ] Checked Context7 for external library issues
- [ ] Used Serena to trace all affected code
- [ ] Checked .claude/docs/COMMON_ERRORS.md for known pattern
- [ ] Considered side effects of fix
- [ ] Have 2+ fix options when possible
- [ ] Can explain trade-offs of each option
- [ ] Team has been shut down before proceeding to fix
