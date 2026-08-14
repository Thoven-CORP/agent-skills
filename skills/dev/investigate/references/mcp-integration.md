# MCP Integration & Agent Teams Reference

Complete examples of using MCP tools, agent teams, and communication patterns for debugging.

---

## Quick Reference

| Tool / System | Primary Use | Key Actions |
|---------------|-------------|-------------|
| **Serena MCP** | Semantic code search & analysis | `find_symbol`, `find_referencing_symbols`, `search_for_pattern` |
| **Context7 MCP** | External library documentation | `resolve-library-id`, `query-docs` |
| **Agent Teams** | Parallel investigation with coordination | `TeamCreate`, `SendMessage`, `TeamDelete` |
| **Task Management** | Shared task list for team coordination | `TaskCreate`, `TaskUpdate`, `TaskList` |

---

## Agent Teams Tools

### TeamCreate - Start an Investigation Team

Creates a team with a shared task list. The current session becomes the team lead.

```
TeamCreate:
- team_name: "investigate-booking-500"
- description: "Investigating 500 errors on booking endpoint"
```

**Naming convention:**
- COMPLEX bugs: `investigate-[short-name]`
- CRITICAL bugs: `critical-investigate-[short-name]`

**What it creates:**
- Team config: `~/.claude/teams/investigate-booking-500/config.json`
- Task list: `~/.claude/tasks/investigate-booking-500/`

---

### Task tool (Spawn Teammates)

Spawns a teammate that joins the team. Each teammate is a full independent Claude session.

```
Task tool:
- subagent_type: "bug-hunter"       # or "general-purpose"
- team_name: "investigate-booking-500"
- name: "primary-investigator"
- mode: "bypassPermissions"          # optional: skip permission prompts
- prompt: "You are investigating [description].
  YOUR HYPOTHESIS: [what to test]
  REPORT FORMAT: Hypothesis / Evidence / Verdict (CONFIRMED/DISPROVEN/INCONCLUSIVE)"
- description: "Test hypothesis: [short description]"
```

**Agent type selection:**
| Role | Best subagent_type | Why |
|------|-------------------|-----|
| Deep code investigation | `bug-hunter` | Specialized debugging methodology |
| Code search / exploration | `general-purpose` | Full tool access, versatile |
| Library documentation | `general-purpose` | Needs Context7 access |
| Devil's Advocate / review | `general-purpose` | Needs broad reasoning ability |
| Git history audit | `general-purpose` | Needs bash + git access |

**IMPORTANT: Launch ALL teammates in ONE message for maximum parallelism.**

---

### SendMessage - Coordinate Between Teammates

#### Direct Message (to one teammate)

```
SendMessage:
- type: "message"
- recipient: "devils-advocate"
- content: "primary-investigator found: [summary]. Please challenge this finding."
- summary: "Forward findings for review"
```

#### Broadcast (to ALL teammates - use sparingly)

```
SendMessage:
- type: "broadcast"
- content: "New evidence found: [summary]. All investigators should consider this."
- summary: "Critical new evidence"
```

**WARNING:** Broadcast sends to EVERY teammate. Use only for:
- Critical blocking discoveries
- Major direction changes
- Urgent stops

#### Shutdown Request

```
SendMessage:
- type: "shutdown_request"
- recipient: "primary-investigator"
- content: "Investigation complete, wrapping up"
```

---

### TeamDelete - Clean Up Team Resources

```
TeamDelete
```

**IMPORTANT:** Must shut down all teammates FIRST. TeamDelete fails if teammates are still active.

**Full cleanup sequence:**
```
1. SendMessage shutdown_request → teammate-1
2. SendMessage shutdown_request → teammate-2
3. SendMessage shutdown_request → teammate-3
4. (Wait for all to acknowledge)
5. TeamDelete
```

---

### TaskCreate - Create Investigation Tasks

```
TaskCreate:
- subject: "Hypothesis: Missing database lock on credit reservation"
- description: "Investigate whether the credit reservation code uses SELECT FOR UPDATE or row locking. Check BookingRequestService and CreditWallet for transaction boundaries."
- activeForm: "Investigating database locking"
```

### TaskUpdate - Track Progress

```
# Assign to teammate
TaskUpdate:
- taskId: "1"
- owner: "primary-investigator"
- status: "in_progress"

# Mark complete
TaskUpdate:
- taskId: "1"
- status: "completed"

# Set up dependencies
TaskUpdate:
- taskId: "5"            # synthesis task
- addBlockedBy: ["1", "2", "3"]  # blocked by all hypothesis tasks
```

### TaskList - Monitor Progress

```
TaskList
# Returns all tasks with status, owner, and blockedBy info
```

---

## Complete Agent Team Workflows

### Workflow 1: COMPLEX Bug - Auth 403 Error

```
# === STEP 1: Create Team ===
TeamCreate:
- team_name: "investigate-teacher-403"
- description: "Teachers getting 403 on booking endpoints"

# === STEP 2: Create Tasks ===
TaskCreate: "Hypothesis 1: before_action filter missing on new endpoint"
TaskCreate: "Hypothesis 2: profile_type enum integer vs string comparison"
TaskCreate: "Hypothesis 3: JWT token missing teacher scope"
TaskCreate: "Synthesize findings" → addBlockedBy: ["1", "2", "3"]

# === STEP 3: Spawn Team (ALL in ONE message) ===
Task:
- subagent_type: "bug-hunter"
- team_name: "investigate-teacher-403"
- name: "auth-flow-tracer"
- prompt: "Test hypothesis: before_action filter missing.
  1. Find the booking controller
  2. Check all before_action declarations
  3. Trace the inheritance chain for auth filters
  4. Check routes.rb for correct namespace
  Report: CONFIRMED/DISPROVEN with evidence (file paths + line numbers)"

Task:
- subagent_type: "general-purpose"
- team_name: "investigate-teacher-403"
- name: "enum-checker"
- prompt: "Test hypothesis: profile_type enum comparison bug.
  1. Search for `profile_type ==` (string comparison against integer enum)
  2. Search for `profile.teacher?` vs manual checks
  3. Check profile.rb enum definition
  4. Check authorization concern for correct helper usage
  Report: CONFIRMED/DISPROVEN with evidence"

Task:
- subagent_type: "general-purpose"
- team_name: "investigate-teacher-403"
- name: "token-investigator"
- prompt: "Test hypothesis: JWT token missing teacher scope.
  1. Check Devise JWT configuration
  2. Verify token payload includes profile_type
  3. Check if new endpoint requires specific scope
  Report: CONFIRMED/DISPROVEN with evidence"

# === STEP 4: Lead Coordinates (Delegate Mode) ===
# Wait for findings...
# If auth-flow-tracer finds missing filter:
SendMessage:
- type: "message"
- recipient: "enum-checker"
- content: "auth-flow-tracer found the before_action is missing. Can you verify
  this is the ONLY issue? Check if adding the filter would then hit the enum bug."

# === STEP 5: Synthesize + Clean Up ===
# Compile diagnostic report from all findings
# Then shut down:
SendMessage: shutdown_request → auth-flow-tracer
SendMessage: shutdown_request → enum-checker
SendMessage: shutdown_request → token-investigator
TeamDelete
```

### Workflow 2: CRITICAL Bug - Race Condition

```
# === STEP 1: Create Team ===
TeamCreate:
- team_name: "critical-investigate-credit-race"
- description: "CRITICAL: Race condition in credit reservation, 5% failure rate under load"

# === STEP 2: Create Tasks ===
TaskCreate: "Primary: Check for missing SELECT FOR UPDATE in credit reservation"
TaskCreate: "Alternative: Check if Redis cache serves stale credit balance"
TaskCreate: "Alternative: Check if retry logic double-reserves credits"
TaskCreate: "Devil's advocate: Challenge all findings"
TaskCreate: "Synthesize root cause and recommend fix"

# === STEP 3: Spawn Team with Adversarial Roles ===
Task:
- subagent_type: "bug-hunter"
- team_name: "critical-investigate-credit-race"
- name: "primary-investigator"
- prompt: "CRITICAL BUG: Race condition in booking credit reservation.
  YOUR HYPOTHESIS: Missing database lock on credit check.

  INVESTIGATE:
  1. Find BookingRequestService - look for credit reservation logic
  2. Check if SELECT FOR UPDATE or .lock! is used
  3. Check transaction boundaries - are check + reserve atomic?
  4. Look for check-then-act patterns without locking

  Report findings with file paths and line numbers.
  Be prepared to defend your conclusion against challenge."

Task:
- subagent_type: "bug-hunter"
- team_name: "critical-investigate-credit-race"
- name: "alt-investigator"
- prompt: "CRITICAL BUG: Race condition in booking credit reservation.
  YOUR HYPOTHESIS: Stale Redis cache serving old credit balance.

  INVESTIGATE:
  1. Search for credit balance caching in Redis
  2. Check cache invalidation timing after reservation
  3. Look for read-from-cache, write-to-db patterns
  4. Check if cache TTL allows stale reads during concurrent requests

  Report findings honestly. If your theory is wrong, say so with evidence."

Task:
- subagent_type: "general-purpose"
- team_name: "critical-investigate-credit-race"
- name: "devils-advocate"
- prompt: "You are the Devil's Advocate for a CRITICAL race condition investigation.

  YOUR ROLE: Wait for the primary-investigator and alt-investigator to report.
  Then challenge their findings:
  1. Could the root cause be something neither investigated?
  2. Are their code traces complete? Did they miss edge cases?
  3. Would the fix they suggest actually prevent ALL race scenarios?
  4. Check production data assumptions - is the data state what they expect?
  5. Could there be MULTIPLE interacting causes?

  Do NOT just agree. Your job is to stress-test their conclusions."

Task:
- subagent_type: "general-purpose"
- team_name: "critical-investigate-credit-race"
- name: "changes-auditor"
- prompt: "Audit recent changes that could have introduced the race condition.
  1. Run: git log --since='2 weeks ago' -- app/services/ app/models/
  2. Find commits touching credit, reservation, booking, wallet code
  3. Check if any recent change removed locking or changed transaction scope
  Report: Which commits are suspicious and why."

# === STEP 4: Facilitate Adversarial Debate ===

# After investigators report:
SendMessage:
- type: "message"
- recipient: "devils-advocate"
- content: "Findings so far:
  primary-investigator: Found that BookingRequestService#reserve_credits uses
  a transaction but NO row lock. Two concurrent requests can both pass the
  credit check before either commits the reservation.

  alt-investigator: Credit balance is NOT cached in Redis. Read directly from DB.
  Theory disproven.

  changes-auditor: Commit abc123 (3 days ago) refactored the reservation service
  and removed the .lock! call that was previously on line 45.

  Please challenge: Is the missing lock the full story? Could the fix
  reintroduce other issues?"
- summary: "All findings ready for adversarial review"

# After devil's advocate challenges:
SendMessage:
- type: "message"
- recipient: "primary-investigator"
- content: "Devil's advocate raises: Adding .lock! back could cause deadlocks
  if the lock ordering isn't consistent. Also, the transaction scope might
  need to be widened. Can you verify lock ordering is safe?"
- summary: "Devil's advocate challenge on lock safety"

# === STEP 5: Consensus → Diagnostic Report ===
# Compile all findings + debate results into Phase 2 report
# Then clean up team
```

### Workflow 3: External Library Bug

```
# === Create Team ===
TeamCreate:
- team_name: "investigate-stripe-webhook"
- description: "Stripe webhooks returning 400 Bad Request"

# === Spawn Team ===
Task:
- subagent_type: "general-purpose"
- team_name: "investigate-stripe-webhook"
- name: "code-analyst"
- prompt: "Find and analyze our Stripe webhook handler.
  1. Search for Stripe::Webhook.construct_event
  2. Read the webhook controller
  3. Check how we verify signatures
  4. Check endpoint_secret configuration
  Report: Full code path with potential issues."

Task:
- subagent_type: "general-purpose"
- team_name: "investigate-stripe-webhook"
- name: "library-researcher"
- prompt: "Research current Stripe webhook best practices.
  1. Use Context7: resolve-library-id('stripe ruby', 'webhook verification')
  2. Use Context7: query-docs for 'webhook signature verification Rails'
  3. Check for any version-specific changes in signature verification
  4. Compare current docs with our implementation
  Report: Current best practice vs what we're doing."

# === Lead synthesizes discrepancies ===
```

---

## Serena MCP

Semantic code analysis tools for understanding code structure and relationships.

### Tool 1: `mcp__plugin_serena_serena__find_symbol`

Find code symbols (classes, methods, functions) by name.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name_path_pattern` | string | Yes | - | Symbol name or path (e.g., "ClassName/method") |
| `relative_path` | string | No | "" | Limit search to directory/file |
| `include_body` | boolean | No | false | Include full source code |
| `depth` | integer | No | 0 | Include children (1 = immediate children) |
| `substring_matching` | boolean | No | false | Match partial names |

#### Examples

**Find a class:**
```
mcp__plugin_serena_serena__find_symbol
- name_path_pattern: "BookingRequestService"
- depth: 1
- include_body: false
```

**Find a specific method with implementation:**
```
mcp__plugin_serena_serena__find_symbol
- name_path_pattern: "BookingRequestService/create"
- include_body: true
```

**Find all methods containing "reserve":**
```
mcp__plugin_serena_serena__find_symbol
- name_path_pattern: "reserve"
- substring_matching: true
- relative_path: "app/services"
```

---

### Tool 2: `mcp__plugin_serena_serena__find_referencing_symbols`

Find all code that references a specific symbol.

#### Examples

**Find all callers of a method:**
```
mcp__plugin_serena_serena__find_referencing_symbols
- name_path: "BookingRequestService/create"
- relative_path: "app/services/booking_request_service.rb"
```

**Find all uses of a model:**
```
mcp__plugin_serena_serena__find_referencing_symbols
- name_path: "SimpleBookingSlot"
- relative_path: "app/models/simple_booking_slot.rb"
```

---

### Tool 3: `mcp__plugin_serena_serena__search_for_pattern`

Regex search across codebase with context.

#### Examples

**Find transaction blocks in services:**
```
mcp__plugin_serena_serena__search_for_pattern
- substring_pattern: "transaction do"
- paths_include_glob: "app/services/**/*.rb"
- context_lines_before: 2
- context_lines_after: 5
```

**Find database locking:**
```
mcp__plugin_serena_serena__search_for_pattern
- substring_pattern: "lock!|FOR UPDATE|with_lock"
- restrict_search_to_code_files: true
- context_lines_before: 3
- context_lines_after: 3
```

**Find error handling patterns:**
```
mcp__plugin_serena_serena__search_for_pattern
- substring_pattern: "rescue.*=>.*e"
- paths_include_glob: "app/**/*.rb"
- context_lines_after: 5
```

---

### Tool 4: `mcp__plugin_serena_serena__get_symbols_overview`

Get structure of a file without reading full content.

#### Examples

**See all methods in a service:**
```
mcp__plugin_serena_serena__get_symbols_overview
- relative_path: "app/services/booking_request_service.rb"
- depth: 1
```

---

## Context7 MCP

External library documentation lookup.

### Tool 1: `mcp__plugin_context7_context7__resolve-library-id`

Find the Context7 library ID for a package.

#### Examples

**Find Stripe Ruby gem:**
```
mcp__plugin_context7_context7__resolve-library-id
- libraryName: "stripe ruby"
- query: "webhook signature verification"
```

**Find Devise JWT:**
```
mcp__plugin_context7_context7__resolve-library-id
- libraryName: "devise jwt"
- query: "token refresh expiration"
```

**Find Solid Queue:**
```
mcp__plugin_context7_context7__resolve-library-id
- libraryName: "solid queue rails"
- query: "job retry configuration"
```

---

### Tool 2: `mcp__plugin_context7_context7__query-docs`

Get documentation for a specific topic.

#### Examples

**Get Stripe webhook docs:**
```
mcp__plugin_context7_context7__query-docs
- libraryId: "/stripe/stripe-ruby"
- query: "How to verify webhook signatures in Rails controller"
```

**Get Devise JWT configuration:**
```
mcp__plugin_context7_context7__query-docs
- libraryId: "/waiting-for-dev/devise-jwt"
- query: "Configure token expiration and refresh"
```

---

## Common Debugging Workflows

### Workflow 1: Unknown Error Location (MEDIUM → Explore Agent)

```
# Step 1: Search for error message
mcp__plugin_serena_serena__search_for_pattern
- substring_pattern: "Credit reservation failed"
- restrict_search_to_code_files: true
- context_lines_before: 5
- context_lines_after: 5

# Step 2: Find the method that raises it
mcp__plugin_serena_serena__find_symbol
- name_path_pattern: "reserve_credits"
- include_body: true

# Step 3: Find all callers
mcp__plugin_serena_serena__find_referencing_symbols
- name_path: "reserve_credits"
- relative_path: "app/services/credit_service.rb"
```

### Workflow 2: External Library Bug (COMPLEX → Agent Team)

```
# Use Agent Team with code-analyst + library-researcher
# See Workflow 3 in "Complete Agent Team Workflows" above
```

### Workflow 3: Race Condition Analysis (CRITICAL → Enhanced Agent Team)

```
# Use Enhanced Agent Team with adversarial review
# See Workflow 2 in "Complete Agent Team Workflows" above
```

### Workflow 4: Authorization Bug (COMPLEX → Agent Team)

```
# Step 1: Create team
TeamCreate: "investigate-auth-issue"

# Step 2: Spawn specialists
Task: auth-flow-tracer → trace before_action chain
Task: data-checker → verify profile type and permissions in DB

# Step 3: Synthesize from team findings
```

---

## Tool Selection Guide

| Scenario | Tool(s) | Why |
|----------|---------|-----|
| "Find where X is defined" | Serena `find_symbol` | Semantic search by name |
| "Who calls method X" | Serena `find_referencing_symbols` | Traces dependencies |
| "Find all occurrences of pattern" | Serena `search_for_pattern` | Regex with context |
| "What methods does class X have" | Serena `get_symbols_overview` | Structure without reading |
| "How should I use library X" | Context7 `resolve-library-id` + `query-docs` | Up-to-date docs |
| "Multiple plausible causes" | Agent Team (COMPLEX) | Parallel investigation |
| "Production incident" | Enhanced Agent Team (CRITICAL) | Adversarial review |
| "External lib + our code" | Agent Team + Context7 | Code analyst + library researcher |

---

## Performance Tips

1. **Use `relative_path` to limit search scope** - Much faster than searching entire codebase
2. **Use `include_body: false` first** - Get locations, then read specific ones
3. **Use `restrict_search_to_code_files: true`** - Skip config, logs, etc.
4. **Use `depth: 1` not higher** - Getting all children is expensive
5. **Context7: Call resolve-library-id once per library** - Cache the ID mentally
6. **Launch ALL teammates in ONE message** - Maximum parallelism
7. **Use descriptive teammate names** - Makes coordination messages clearer
8. **Keep SendMessage summaries short** - They're shown as UI previews
