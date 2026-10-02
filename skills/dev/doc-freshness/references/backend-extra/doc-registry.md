# Doc Registry — Source Dependencies & Update Strategies

This file maps every tracked documentation file to its source code dependencies, content verification commands, and update strategy. Read this file before updating any doc.

## Tier 1: Critical Context (`.claude/docs/`)

These are loaded into Claude context regularly. Staleness here directly degrades code quality.

### ARCHITECTURE.md
- **Path**: `.claude/docs/ARCHITECTURE.md`
- **Watches**: `db/migrate/`, `app/models/`, `db/structure.sql`
- **Content verification**:
  - Count tables in `db/structure.sql` (`grep -c '^CREATE TABLE public\.'`) vs doc's "N tables" claim
  - List all model files (`ls app/models/**/*.rb`) vs documented models
  - Check for new DB extensions in schema vs doc's extensions list
  - Verify enum definitions in models match doc
- **Update strategy**: Add new tables/models to appropriate section. Update counts. Add new architectural decisions if migration introduces significant patterns (e.g., new polymorphic association, new extension). Preserve existing decision records.
- **Key sections to check**: Table count in overview, model list, extensions list, key architectural decisions

### API_ROUTES.md
- **Path**: `.claude/docs/API_ROUTES.md`
- **Watches**: `config/routes.rb`, `app/controllers/`
- **Content verification**:
  - Run `rails routes --expanded 2>/dev/null | head -500` or `grep -r 'def ' app/controllers/api/v1/ | wc -l` to estimate endpoint count
  - Check for new controller files not mentioned in doc: `ls app/controllers/api/v1/`
  - Look for new namespaces/route groups in `config/routes.rb`
- **Update strategy**: Add new routes to appropriate domain section. Remove routes for deleted controllers. Update route count in overview. Group new routes with existing domain organization.
- **Key sections to check**: Route count, domain sections, webhook endpoints, new namespaces

### BACKGROUND_JOBS.md
- **Path**: `.claude/docs/BACKGROUND_JOBS.md`
- **Watches**: `app/jobs/`, `app/mailers/`
- **Content verification**:
  - List all job classes: `ls app/jobs/` vs documented jobs
  - List all mailer classes: `ls app/mailers/` vs documented mailers
  - Check scheduled jobs in `config/recurring.yml` (the `production:` block)
  - Check queue definitions in `config/queue.yml`
- **Update strategy**: Add new jobs/mailers to appropriate section. Document queue assignment, retry policy, and triggering conditions for new jobs. Update counts.
- **Key sections to check**: Job count, mailer count, queue assignments, scheduled job list

### COMMON_ERRORS.md
- **Path**: `.claude/docs/COMMON_ERRORS.md`
- **Watches**: `app/services/`, `app/controllers/`
- **Content verification**:
  - Harder to automate — this is narrative documentation of real bugs
  - Check if documented patterns still exist in code (grep for specific method names/patterns mentioned)
  - Check if new error-prone patterns were introduced (new payment flows, new auth paths)
- **Update strategy**: Add new error patterns when bugs are found and fixed. DO NOT remove historical errors — they're learning material. Add "Resolved" status if a pattern was eliminated. Update "DO NOT TOUCH" sections only if the protected code actually changed.
- **Key sections to check**: DO NOT TOUCH sections (verify code still matches), error pattern count

---

## Tier 2: Reference Docs

### CLAUDE.md (root)
- **Path**: `CLAUDE.md`
- **Watches**: `.claude/docs/*`, `app/models/`, `config/routes.rb`, `app/jobs/`, `app/services/`
- **Structure**: three sections only — `## Thoven law`, `## Project map`, `## How we work`. Skill/agent routing lives in `.claude/docs/SKILL_AND_AGENT_ROUTING.md`, NOT here. If skill or agent inventory tables reappear in CLAUDE.md, flag it — they were deliberately moved out (2026-07-26) because Claude Code already injects that inventory every session.
- **Content verification**:
  - Cross-reference the stack numbers in `Project map` (tables, endpoints, service classes, jobs) against the Quick Audit Commands below
  - Every row in the docs table points at a path that exists on disk
  - The hard action-gate callout at the top still names all four gates (prod deploys, Neon migrations, cohort/email sends, money/COPPA) and the `RAILS_ENV=production rails db:migrate` prohibition — **never** let these get trimmed or relocated to a loaded-on-demand doc
  - Paths named in prose still exist: `.env`, `~/thoven/.workspace`, `solid_queue_embedded.rb`, `config/initializers/cors.rb`
- **Update strategy**: Surgical only. Do NOT re-expand into more sections, and do NOT re-add skill/agent inventory tables.

### .claude/docs/SKILL_AND_AGENT_ROUTING.md
- **Path**: `.claude/docs/SKILL_AND_AGENT_ROUTING.md`
- **Watches**: `.claude/skills/`, `.claude/agents/`, `~/.claude/skills/workspace/SKILL.md`
- **Content verification**:
  - Verify the skill list matches actual skills in `.claude/skills/` plus the session-injected list
  - Verify the agent list matches actual agents in `.claude/agents/`
  - **Work-state routing**: bare Project orientation, capture, close, and log resolve to `workspace`; semantic reconciliation resolves to `feature-ledger`. Verify both installed skills and `~/.agents/skills/workspace/references/WORKFLOW.md` exist.
  - Graph node/edge counts still roughly match `index_status`
- **Update strategy**: Update rows to match disk. This file is allowed to grow — it is loaded on demand, not every session.

### docs/reference/DATA_MODEL.md
- **Path**: `docs/reference/DATA_MODEL.md`
- **Watches**: `db/structure.sql`, `db/migrate/`, `app/models/`
- **Content verification**:
  - Compare documented tables against `db/structure.sql`
  - Check for new associations in models not reflected in doc
- **Update strategy**: Add new tables with columns. Update association descriptions. Reflect new indexes.

### docs/reference/ROUTE_MAP.md
- **Path**: `docs/reference/ROUTE_MAP.md`
- **Watches**: `config/routes.rb`, `app/controllers/`
- **Content verification**: Same as API_ROUTES.md but check this doc's specific format
- **Update strategy**: Mirror changes from API_ROUTES.md in this doc's format

### docs/reference/BACKEND_SYSTEM_BIBLE.md
- **Path**: `docs/reference/BACKEND_SYSTEM_BIBLE.md`
- **Watches**: `app/models/`, `app/services/`, `app/controllers/`, `config/`
- **Content verification**: Broad — check if major new subsystems are documented
- **Update strategy**: Add new system components. Update tech stack versions.

### docs/reference/API_ERROR_RESPONSE_CONTRACT.md
- **Path**: `docs/reference/API_ERROR_RESPONSE_CONTRACT.md`
- **Watches**: `app/controllers/concerns/`, `app/controllers/api/`
- **Content verification**: Check if error response format in code matches doc
- **Update strategy**: Update if error format changed. Add new error codes.

### TECH_DEBT.md
- **Path**: `TECH_DEBT.md`
- **Watches**: N/A (manually maintained)
- **Content verification**: Check if any RESOLVED items can be confirmed via code. Check if OPEN items were fixed but not marked.
- **Update strategy**: Mark resolved items. Update priority if context changed.

### FUTURE_IMPROVEMENTS.md
- **Path**: `FUTURE_IMPROVEMENTS.md`
- **Watches**: N/A (manually maintained)
- **Content verification**: Check if any improvements were implemented but not removed from list
- **Update strategy**: Remove implemented items. Add new deferrals.

---

## Tier 3: Architecture Docs (`docs/architecture/`)

All watch: `db/structure.sql`, `app/models/`, `app/services/`, `config/`

| Doc | Focus | Key Verification |
|-----|-------|-----------------|
| `01-EXECUTIVE-SUMMARY.md` | High-level overview | Tech stack versions, system scale numbers |
| `02-SYSTEM-CHARACTERISTICS.md` | System properties | Performance characteristics, constraints |
| `03-ARCHITECTURE-DIAGRAMS.md` | Visual architecture | New subsystems reflected in diagrams |
| `04-DATA-MODEL.md` | Schema breakdown | Tables match `db/structure.sql` |
| `05-STACK-DEPENDENCIES.md` | Dependencies | Gemfile/package.json versions |
| `06-OPERATIONAL-INSIGHTS.md` | Operations | Monitoring, alerting, scaling |

**Update strategy**: These are updated less frequently. Check when major features ship (new subsystem, new external integration, new data domain). Focus on `04-DATA-MODEL.md` (most likely to drift) and `05-STACK-DEPENDENCIES.md` (version drift).

---

## Tier 4: Feature Docs

Feature docs are organized by domain. They drift when feature code evolves after initial documentation.

### docs/calendar/
- **Watches**: `app/services/scheduling/`, `app/controllers/api/v1/bookings*`, `app/models/booking.rb`, `app/models/lesson.rb`
- **Key files**: `API_CONTRACT_FRONTEND.md`, `KNOWN_ISSUES.md`, `BACKEND_IMPLEMENTATION_PLAN.md`
- **Update strategy**: Update API contracts when endpoints change. Update known issues when bugs are resolved. Implementation plans are historical — mark completed, don't rewrite.

### docs/email-system/
- **Watches**: `app/mailers/`, `app/views/mailer*`, `config/initializers/sendgrid*`
- **Key files**: `EMAILPREFERENCES.md`, `SERVICE_STATUS_EMAIL_TEMPLATES.md`
- **Update strategy**: Add new mailer templates. Update preference options. Document new SendGrid categories.

### docs/analytics/
- **Watches**: `app/models/concerns/analytics*`, `app/services/analytics/`, `db/migrate/*analytics*`
- **Key files**: `NORTH_STAR_METRICS_QUICK_REFERENCE.md`, `HOW_TO_QUERY_ANALYTICS.md`, `METRICS_IMPLEMENTATION_STATUS.md`
- **Update strategy**: Update metric definitions and query examples. Mark implemented metrics in status doc.

### docs/marketplace/
- **Watches**: `app/controllers/api/v1/marketplace*`, `app/services/marketplace/`
- **Update strategy**: Update when marketplace features change.

### docs/booking/
- **Watches**: `app/services/booking/`, `app/models/booking.rb`, `app/controllers/api/v1/bookings*`
- **Update strategy**: Update business rules, data models, and workflow docs when booking logic changes.

### docs/security/
- **Watches**: `app/controllers/concerns/authenticat*`, `config/initializers/devise*`
- **Update strategy**: Update when auth patterns change. Add new security review findings.

---

## Quick Audit Commands

Use these to quickly assess staleness without reading every file:

```bash
# Count tables in schema vs documented
grep -c '^CREATE TABLE public\.' db/structure.sql

# Count service classes
find app/services -name '*.rb' -not -name '*_spec*' | wc -l

# Count job classes
find app/jobs -name '*.rb' | wc -l

# Count mailer classes
find app/mailers -name '*.rb' | wc -l

# Count controller files
find app/controllers/api -name '*.rb' | wc -l

# List models not yet committed (new since last doc update)
git diff --name-only <DOC_COMMIT>..HEAD -- app/models/

# List new migrations since doc was last updated
git diff --name-only <DOC_COMMIT>..HEAD -- db/migrate/
```

## Hook Integration

The existing hooks only cover Tier 1. This skill extends coverage to all tiers:

- **Session hook** (`session-context.js`): Reports Tier 1 staleness at session start
- **Nudge hook** (`doc-staleness-nudge.js`): Real-time prompts when editing watched dirs
- **This skill**: Deep audit across all tiers with content verification and fix workflow
