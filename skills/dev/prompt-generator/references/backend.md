# Prompt Generator — Backend (Rails API)

Generate precise, codebase-aware prompts for backend development tasks in this Rails 7.2 API-only application (Thoven — music education platform).

## Two Entry Modes

Detect which mode based on user input:
- **Generate mode**: User describes what they want prompted → start at Phase 1
- **Enhance mode**: User pastes an existing prompt to improve → skip to Enhance Mode section

---

## GENERATE MODE

### Phase 1: Search Templates & History

Before generating anything, search for existing prompts:

```
.claude/skills/prompt-generator/templates/   <- Type-specific templates
.claude/skills/prompt-generator/history/     <- Saved past prompts
```

Also search:
```
/home/runner/.claude/projects/-home-runner-workspace/memory/  <- Memory files
.claude/docs/                                                  <- Architecture, common errors, API routes
docs/plans/                                                    <- Feature planning documents
```

**If a good match exists:** Adapt it and skip to Phase 3 (Draft).
**If partial match:** Use as scaffold, layer on missing checklist items, run Medium-tier research.
**If no match:** Continue to classification.

### Phase 2: Classify

Detect **type** and **complexity tier** from the user's request.

**Prompt Types:**

| Type | Signals | Backend Focus |
|------|---------|---------------|
| Implementation | "build", "implement", "add endpoint", "fix", "refactor" | Controllers, services, models, serializers, jobs |
| Architecture | "design", "architect", "schema", "system design" | DB schema, service layer, API design, caching |
| Research | "research", "investigate", "compare", "evaluate" | Library evaluation, pattern comparison, tradeoff analysis |
| Audit | "audit", "review", "N+1", "security", "performance" | Query performance, N+1, auth holes, race conditions |
| PRD/Spec | "PRD", "spec", "requirements", "API contract" | Endpoint specs, data contracts, business rules |
| Testing | "write tests", "test strategy", "coverage", "specs" | Model specs, request specs, service specs, factories |
| Migration | "migration", "schema change", "add column", "index" | DB migrations with rollback safety, zero-downtime |
| Cross-Codebase Handoff | "handover to frontend", "frontend prompt", "API contract for frontend" | Backend-to-frontend endpoint/contract handoffs |
| General | Doesn't fit above | Flexible structure |

**Complexity Tiers:**

| Tier | Signals | Research Level |
|------|---------|---------------|
| Light | Short, single-focus, well-defined (e.g. "add an index") | None — checklist only |
| Medium | Moderate scope, needs codebase context (e.g. "add booking cancellation") | Codebase search |
| Heavy | Multi-concern, novel domain, architecture-level (e.g. "design practice tracking system") | Orchestrated multi-agent |

**Dry run confirmation:** Before committing to research, confirm:
> "I classified this as **[type]**, **[tier]** complexity. Will use **[framework]**. Proceed, or adjust?"

### Phase 2b: Research (skip for Light tier)

**Medium tier — Codebase search (direct Grep/Glob/Read, no agents):**
1. Search `templates/` and `history/` for related prompts
2. Search memory files at `/home/runner/.claude/projects/-home-runner-workspace/memory/` for related past work
3. Search codebase for related patterns:
   - `app/models/` — existing model validations, associations, scopes
   - `app/controllers/api/v1/` — controller patterns, before_actions, error handling
   - `app/services/` — service object patterns (initialize → call/create → result hash)
   - `app/serializers/` — JSONAPI::Serializer patterns
   - `app/jobs/` — Solid Queue job patterns
   - `spec/` — test patterns for the domain
   - `db/migrate/` — recent migration patterns
4. Pull relevant context files:
   - `.claude/docs/ARCHITECTURE.md` — schema, tables, constraints
   - `.claude/docs/COMMON_ERRORS.md` — known pitfalls and DO NOT TOUCH sections
   - `.claude/docs/API_ROUTES.md` — existing routes to avoid conflicts
   - `.claude/docs/BACKGROUND_JOBS.md` — job patterns and queues
   - `.claude/docs/DEPLOYMENT.md` — dual DB migration requirements

**Heavy tier — Orchestrated multi-agent research (3 parallel agents):**

| Agent | Task |
|-------|------|
| Codebase Scout | Search templates, history, memory, codebase patterns for related code and prior art |
| Domain Expert | Use `rails-expert` or `master-backend-ai-rails` agent to gather domain-specific patterns, edge cases, existing conventions |
| Architecture Analyst | Use `architecture-reviewer` agent to evaluate design implications, identify constraints, schema relationships |

### Phase 2c: Framework Selection

| Type | Framework | Embed How |
|------|-----------|-----------|
| Implementation | Structured step-by-step + constraints | Sequential steps: model → service → controller → serializer → spec |
| Architecture | Tree of Thoughts | "Evaluate 3 approaches: A) Normalized relational B) Denormalized C) Hybrid..." |
| Research | ReAct | Search-reason-search loops with explicit tool usage |
| Audit | Checklist-driven + few-shot | Criteria table + example findings with severity ratings |
| PRD/Spec | Structured sections + JTBD | Endpoint contract → business rules → edge cases → data shapes |
| Testing | Least-to-Most | Build from model spec → service spec → request spec → integration |
| Migration | Structured step-by-step + safety gates | Pre-check → schema change → index → backfill → verify → rollback plan |
| Cross-Codebase Handoff | Requirements-only + debate-first | Receiver (frontend) owns architecture; backend specifies contract only |
| General | Chain of Thought | Safe default |

See `references/prompting-frameworks.md` for full framework catalog.

### Phase 2d: Skill & Agent Mapping

After classification, identify which existing skills AND agents the generated prompt should invoke as part of its workflow. This turns static prompts into orchestrated workflows.

**How to map:** For the classified prompt type, consult the tables below to determine what should run BEFORE the work begins and what should VALIDATE the work after completion. Embed these as explicit instructions in the generated prompt.

**Skills** (`/skill-name`) are user-invocable workflows — embed when the prompt executor should trigger them directly.
**Agents** (`subagent_type`) are specialized workers launched via the Agent tool — embed when the prompt needs deep analysis, review, or parallel research.

#### Prompt Type → Skill Mapping

| Prompt Type | Pre-Work Skills | Post-Work Skills | Conditional Skills |
|---|---|---|---|
| Implementation | `/grill-with-docs` (if Heavy tier), `/production-data-audit` (if touching existing models) | `/verify` (always), `/publish` (if deploying) | `/safe-migrate` (if migration needed), `/email` (if mailer work), `/security-review` (if touches auth/payments/student data) |
| Architecture | `/grill-with-docs` → `/architect` (always — design before build) | `/verify` (validate design meets requirements) | `/security-review` (if COPPA/auth/payment implications) |
| Research | — | `/future-improvements` (to log deferred ideas found during research) | `/tech-debt` (if research reveals existing debt) |
| Audit | `/production-data-audit` (audit real data first) | `/tech-debt` (to log findings), `/manage-todos` (to track remediation) | `/security-review` (if security audit), `/investigate-thoven` (if audit reveals bugs) |
| PRD/Spec | `/grill-with-docs` (validate design before specifying) | `/feature-ledger` (break spec into executable tasks) | — |
| Testing | `/production-data-audit` (understand real data shapes) | `/verify` (confirm tests actually pass) | — |
| Migration | `/safe-migrate` (always — pre-flight safety checks) | `/verify` (confirm migration succeeded in both envs), `/publish` (if deploying) | — |
| Cross-Codebase Handoff | — | `/frontend-handover` (orchestrates the full handoff) | — |
| General | — | `/verify` (always) | Route through `/orchestrate` if type is ambiguous |

#### Prompt Type → Agent Mapping

| Prompt Type | Pre-Work Agents | Post-Work Agents | Conditional Agents |
|---|---|---|---|
| Implementation | `rails-expert` (gather patterns, conventions) | `code-reviewer` (review implementation) | `security-engineer` (if auth/payment/student data), `master-backend-ai-rails` (if complex DB work) |
| Architecture | `architecture-reviewer` (evaluate design options) | `code-reviewer` (review final design) | `postgres-pro` (if heavy DB design), `performance-engineer` (if scale concerns) |
| Research | `rails-expert` (codebase patterns), `architecture-reviewer` (tradeoff analysis) | — | `security-engineer` (if security research), `database-administrator` (if DB research) |
| Audit | `security-engineer` (security audit), `performance-engineer` (perf audit) | `code-reviewer` (validate findings) | `postgres-pro` (N+1/query audit), `sql-pro` (complex query analysis) |
| PRD/Spec | `api-designer` (API contract design) | `architecture-reviewer` (validate spec feasibility) | `rails-expert` (check existing patterns) |
| Testing | `qa-expert` (test strategy), `test-automator` (test generation) | `code-reviewer` (review test quality) | `rails-expert` (Rails testing conventions) |
| Migration | `master-backend-ai-rails` (migration safety), `postgres-pro` (PostgreSQL specifics) | `database-administrator` (verify migration) | `performance-engineer` (if large table migration) |
| Cross-Codebase Handoff | `api-designer` (contract clarity) | — | `frontend-developer` (validate frontend can consume) |
| General | `rails-expert` (default codebase expert) | `code-reviewer` (general review) | — |

#### Domain-Conditional Agents (apply to ANY prompt type)

These agents activate when the prompt touches specific domains, regardless of type:

| Domain Trigger | Agent | When to Embed |
|---|---|---|
| Auth/authorization logic | `security-engineer` | Prompt mentions `authenticate_user!`, roles, permissions, JWT, Devise |
| Payment/Stripe/credits | `security-engineer` + `backend-service-developer` | Prompt involves credit transactions, Stripe, wallet entries |
| Student-facing features | `security-engineer` | COPPA compliance — any feature students interact with |
| Database schema changes | `postgres-pro` + `master-backend-ai-rails` | New tables, columns, indexes, constraints |
| Background jobs | `rails-expert` | Solid Queue jobs, async processing, retry logic |
| Email/SMS notifications | Use `/email` skill instead | Mailer creation, SendGrid, Twilio |
| Real-time features | `websocket-engineer` | Action Cable channels, live updates |
| External API integration | `backend-service-developer` | Google Calendar, Daily.co, Stripe webhooks |
| Performance-critical paths | `performance-engineer` + `postgres-pro` | Dashboard endpoints, list endpoints, aggregation queries |
| Complex multi-step workflows | `workflow-orchestrator` | Booking flows, payment authorization, scheduling |

#### Mapping Rules

1. **Only use what exists** — all skills and agents listed above are verified to exist in `.claude/skills/` and `.claude/agents/`
2. **Pre-work** goes at the TOP of the generated prompt: "Before implementing, invoke `/grill-with-docs`" or "Launch the `rails-expert` agent to analyze existing patterns"
3. **Post-work** goes at the BOTTOM of the generated prompt: "After completing, run `/verify`" or "Use the `code-reviewer` agent to review changes"
4. **Max 2 pre + 2 post per category** (skills and agents each) — don't overwhelm the prompt
5. **Conditional mappings** are included only when the domain trigger applies — add as "If this touches [domain], also invoke..."
6. **Heavy tier gets more agents** — Light tier may only get post-work `/verify`; Heavy tier gets full pre/post orchestration
7. **Update this table** as new skills and agents are added to the codebase

#### How to Embed in the Generated Prompt

```
## Workflow Integration

### Before Starting
- Invoke `/grill-with-docs` to validate design approach
- Launch `rails-expert` agent to gather existing patterns for [domain]

### After Completing
- Run `/verify` to confirm all tests pass and implementation is correct
- Launch `code-reviewer` agent to review changes before committing

### Conditional
- If this touches auth: invoke `/security-review` and launch `security-engineer` agent
- If migration needed: invoke `/safe-migrate` for pre-flight safety checks
```

### Phase 2e: Clarifying Questions

- Light: 0 questions
- Medium: 1–2 questions (multiple choice preferred)
- Heavy: 3–4 questions (multiple choice preferred)

Focus on:
- Authorization model (who can access this?)
- Transaction boundaries (what's atomic?)
- Sync vs async (inline vs Solid Queue job?)
- Existing data to account for (production data is messy — see `.claude/docs/COMMON_ERRORS.md`)

### Phase 3: Draft

Assemble the prompt using the type-specific template from `templates/`. Adaptive length:
- Light: 5–15 lines
- Medium: 20–50 lines
- Heavy: 50–150+ lines

**Every prompt MUST include:**
1. Goal statement (what, not how)
2. Scope boundaries (in/out)
3. Technical context (patterns to follow, files to reference)
4. Success criteria (how to verify it works)
5. Relevant type-specific checklist items

**Codebase-specific rules to embed (when relevant):**
- Dual auth: Users (Devise + JWT) vs Students (separate Devise model) — NEVER mix
- Profile types: `Profile::ADMIN = 1, PARENT = 2, TEACHER = 3` — use helper methods (`profile.teacher?`), NOT string comparison
- Soft deletes: Filter with `where(archived_at: nil)` or `.active` scope
- UUIDs: All tables use `id: :uuid`
- Safe navigation: Always use `&.` and `|| default` — production data has nils
- Service result pattern: `{ success: true, data: ... }` or `{ success: false, error: "...", code: "..." }`
- Serializers: `include JSONAPI::Serializer` with `attributes` and computed `attribute` blocks
- Error format: `render json: { error: "..." }, status: :unprocessable_entity`
- Tests: RSpec + FactoryBot, `type: :request` for API specs, `sign_in(user)` helper for auth

### Phase 4: Save Decision

**Auto-save (no prompt):** Heavy-tier prompts — always save to `history/`.
**Offer to save:** Medium-tier or when a new category is detected.
**Don't save:** Light-tier (unless user requests).

Save format: `history/YYYY-MM-DD-<slug>.md` with YAML frontmatter:
```yaml
---
type: implementation
tier: medium
domain: bookings
created: 2026-03-10
---
```

---

## ENHANCE MODE

When user pastes an existing prompt to improve:

1. **Classify** type from prompt content (same type table as Generate mode)
2. **Gap analysis** — compare against type-specific checklist + check framework fit + check for missing skill/agent invocations (Phase 2d mapping)
3. **Present gaps** as numbered list — user picks which to fix
4. **Redraft** preserving original voice, adding only selected improvements
5. **Present** enhanced version with diff summary

Enhancement focus areas:
- Missing scope boundaries
- Vague success criteria
- No pattern file references (should reference actual codebase files)
- Missing authorization/transaction/idempotency considerations
- Generic examples instead of codebase-native examples
- Missing skill/agent invocations (no pre-work or post-work workflow integration from Phase 2d mapping)
- No "Workflow Integration" section embedding relevant skills and agents

---

## Quality Checklists

### Universal (ALL prompts)
- [ ] Clear goal statement (what, not how)
- [ ] Scope boundaries (in/out)
- [ ] Success criteria (how to know it's done)
- [ ] Output format specified
- [ ] Context sufficient to avoid ambiguity
- [ ] References actual files from this codebase as pattern files
- [ ] Relevant skills/agents embedded (pre-work and/or post-work from Phase 2d), or explicitly noted as "none applicable"

### Implementation
- [ ] Database transaction boundaries identified
- [ ] N+1 query prevention (`includes`/`joins` specified)
- [ ] Authorization checks (who can access this? `authenticate_user!` + role checks)
- [ ] Idempotency considerations (duplicate request handling)
- [ ] Background job vs synchronous decision (Solid Queue for async)
- [ ] Serializer/response shape defined (JSONAPI::Serializer pattern)
- [ ] Error response format consistent (`{ error: "..." }` with HTTP status)
- [ ] Migration needed? (separate task or included?)
- [ ] Soft delete awareness (`archived_at` filtering)
- [ ] Safe navigation for nullable associations (`&.` operator)
- [ ] Pattern files: controller, service, serializer, spec from this codebase

### Architecture
- [ ] Schema design with indexes and constraints (UUIDs, `null: false`, CHECK constraints)
- [ ] Query performance at scale (EXPLAIN ANALYZE expectations)
- [ ] Transaction isolation level considerations
- [ ] Cache invalidation strategy (Redis with graceful degradation)
- [ ] Background job failure/retry handling (Solid Queue retry policy)
- [ ] API versioning impact (all routes under `/api/v1/`)
- [ ] Rollback/migration reversal plan
- [ ] Dual auth system impact (Users vs Students)
- [ ] COPPA compliance for student-facing features

### Audit
- [ ] N+1 query detection scope (Bullet gem or manual EXPLAIN)
- [ ] Missing index identification
- [ ] Authorization bypass vectors (role escalation, cross-tenant access)
- [ ] Race condition analysis (concurrent writes, credit holds)
- [ ] SQL injection surface area (raw SQL, `where` with string interpolation)
- [ ] Mass assignment protection (strong params, `permit`)
- [ ] Sensitive data exposure in responses (student PII, payment data)
- [ ] Soft-deleted records leaking into queries

### Testing
- [ ] Factory definitions needed (FactoryBot with traits)
- [ ] Database cleaner strategy (transaction for unit, truncation for integration)
- [ ] Shared examples to reuse (check `spec/support/`)
- [ ] Request spec vs model spec vs service spec distribution
- [ ] Time-dependent test handling (`freeze_time` / `travel_to`)
- [ ] Auth helper usage (`sign_in(user)` from `spec/support/auth_helpers.rb`)
- [ ] Mailer stub pattern (`allow(Mailer).to receive_message_chain(...)`)
- [ ] `expect { ... }.to change(Model, :count).by(n)` for creation tests

### Migration
- [ ] Reversible migration (`change` method or explicit `up`/`down`)
- [ ] Zero-downtime compatibility (no column renames, add before remove)
- [ ] Index creation strategy (`algorithm: :concurrently` for large tables)
- [ ] Data migration vs schema migration separation
- [ ] Backfill strategy for new NOT NULL columns (add nullable → backfill → add constraint)
- [ ] Foreign key constraint safety (with `id: :uuid`)
- [ ] CHECK constraints via raw SQL (`execute <<-SQL`)
- [ ] Run in BOTH environments (`rails db:migrate` + `RAILS_ENV=production rails db:migrate`)

### PRD/Spec
- [ ] Endpoint URL, HTTP method, and namespace (`/api/v1/...`)
- [ ] Request params (required vs optional, nested structure)
- [ ] Response JSON shape (JSONAPI format or custom)
- [ ] Auth requirements (which role? User or Student auth?)
- [ ] Error response shapes for each failure mode
- [ ] Rate limiting considerations (Rack::Attack)
- [ ] Pagination (Kaminari) for list endpoints

### Cross-Codebase Handoff (Backend → Frontend)
- [ ] Endpoint spec (URL, method, params, response JSON)
- [ ] Auth requirements (JWT Bearer token, role needed)
- [ ] Error response shapes (status codes + JSON body for each error)
- [ ] Pagination details (Kaminari cursor/page format)
- [ ] Rate limits if applicable
- [ ] "What we don't care about" (how frontend renders, state management, component structure)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Generating a prompt without searching templates/history first | Always run Phase 1 — existing prompts save 80% of work |
| Skipping the dry run confirmation | Misclassified type = wrong framework = bad prompt. Confirm before researching |
| Embedding generic Rails examples instead of this codebase's patterns | Every pattern file reference must point to a real file in THIS repo |
| Forgetting dual auth | If the prompt touches users OR students, specify WHICH auth system |
| No skill/agent mapping in output | Every prompt should have a Workflow Integration section (Phase 2d) |
| Over-mapping agents for Light tier | Light prompts need at most `/verify` post-work. Don't overwhelm |
| Copying the frontend prompt generator's structure literally | Backend has different types (Migration, Audit) and different concerns (N+1, transactions) |
| Generating migration prompts without referencing `/safe-migrate` | Migration prompts ALWAYS need `/safe-migrate` as pre-work |

---

## Context File Quick Reference

Read these before generating prompts in their domain:

| Domain | Read First |
|--------|-----------|
| Any feature | `CLAUDE.md` (project rules) |
| Database/models | `.claude/docs/ARCHITECTURE.md` |
| API endpoints | `.claude/docs/API_ROUTES.md` |
| Debugging/errors | `.claude/docs/COMMON_ERRORS.md` |
| Async/jobs/email | `.claude/docs/BACKGROUND_JOBS.md` |
| Deploy/migrations | `.claude/docs/DEPLOYMENT.md` |
| Feature planning | `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` |
| Business rules | `docs/booking/`, `docs/marketplace/`, `docs/calendar/` |
