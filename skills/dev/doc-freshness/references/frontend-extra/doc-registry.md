# Doc Registry — Source Dependencies & Update Strategies

This file maps every tracked documentation file to its source code dependencies, content verification commands, and update strategy. Read this file before updating any doc.

## Contents
- [Tier 1: Critical Context (`.claude/docs/`)](#tier-1-critical-context-claudedocs)
- [Tier 2: Reference Docs (root level)](#tier-2-reference-docs-root-level) — incl. Work-State Global Store (`~/thoven/.workspace/`)
- [Tier 3: Reference Docs (`docs/`)](#tier-3-reference-docs-docs)
- [Tier 4: Feature Docs (`docs/<Feature>/`)](#tier-4-feature-docs-docsfeature)
- [Quick Audit Commands](#quick-audit-commands)

## Tier 1: Critical Context (`.claude/docs/`)

These are loaded into Claude context regularly. Staleness here directly degrades code quality.

### ARCHITECTURE.md
- **Path**: `.claude/docs/ARCHITECTURE.md`
- **Watches**: `app/`, `components/`, `hooks/`, `contexts/`, `lib/`, `middleware.ts`
- **Content verification**:
  - Count route files: `find app -name "page.tsx" | wc -l` vs doc's route count
  - Count component dirs: `find components -maxdepth 1 -type d | tail -n +2 | wc -l` vs doc's dir count
  - Count hooks: `find hooks -name "*.ts" -o -name "*.tsx" | wc -l` vs doc's hook count
  - Count contexts: `find contexts -name "*.tsx" | wc -l` vs doc's context count
  - Verify route groups match: `ls app/` vs documented route tree
- **Update strategy**: Add new route groups, component directories, hooks, or contexts. Update counts. Preserve architectural decision records. Check if middleware behavior changed.
- **Key sections to check**: Route tree, component directory counts, hooks list, contexts list, state management approach

### API_AND_AUTH.md
- **Path**: `.claude/docs/API_AND_AUTH.md`
- **Watches**: `lib/*-api.ts`, `contexts/AuthContext.tsx` (note: parent/teacher and student auth share this single context — they're separated by localStorage keys `token` vs `student_token`, not separate context files), `lib/api-config.ts`, `lib/rails-headers.ts`, `lib/feature-flags.ts`
- **Content verification**:
  - Count API modules: `ls lib/*-api.ts | wc -l` vs doc's "N API modules" claim
  - List all API files: `ls lib/*-api.ts` vs documented modules
  - Check feature flags: `grep -c "flag" lib/feature-flags.ts` vs documented flag count
  - Verify auth token keys match: grep for `localStorage` token keys in auth contexts
- **Update strategy**: Add new API modules to the appropriate domain section. Update module count. Document new feature flags. Update WebSocket channel list if new channels added. Preserve auth system architecture docs.
- **Key sections to check**: API module count, module list by domain, feature flags table, env config, auth flow descriptions

### DESIGN.md (the design-system hub)
- **Path**: `DESIGN.md` (repo root). Deep reference in `docs/design/`; rendered view at `docs/design-system.html`.
- **Watches**: `app/globals.css`, `lib/*-tokens.ts`, `components/ui/`
- **Content verification**:
  - There is **no `tailwind.config.ts`** — Tailwind 4 is CSS-first, so read the `@theme inline` block in `app/globals.css`
  - Enforced locks: every `lib/*-tokens.ts` with a matching `.test.ts` must appear in DESIGN.md §3
  - Rendered view: run `npm run docs:design` — a non-empty diff means the doc has drifted from the tokens
  - `__tests__/design-system-doc.test.ts` enforces the button values; if it fails, the doc is wrong, not the test
- **Update strategy**: the token modules are the authority. Fix the doc to match `lib/`, never the reverse. Anything decided here should leave as a token module **plus a test**.
- **Key sections to check**: §3 enforced locks (complete?), §4 known divergence (still accurate?), the palette (amber-500 never orange-500), the heading rule (Fredoka stops at h2)

### DEBUGGING.md
- **Path**: `.claude/docs/DEBUGGING.md`
- **Watches**: `app/providers.tsx`, `next.config.mjs`, `lib/feature-flags.ts`, `TECH_DEBT.md`
- **Content verification**:
  - Check if common errors table references still-existing patterns
  - Verify tech debt cross-references: IDs in DEBUGGING.md match TECH_DEBT.md
  - Check build config (next.config.mjs) matches documented settings
- **Update strategy**: Add new error patterns when bugs are found and fixed. Update tech debt cross-references. Update build config documentation. DO NOT remove historical errors — they prevent regressions.
- **Key sections to check**: Common errors table, Alex Rodriguez bug, build config, deployment notes, tech debt cross-refs

### PLUGIN_GUIDE.md
- **Path**: `.claude/docs/PLUGIN_GUIDE.md`
- **Watches**: `.claude/plugins/`, `.mcp.json`
- **Content verification**:
  - List installed plugins: check `.claude/plugins/` or settings
  - Check MCP config: read `.mcp.json` for configured servers
- **Update strategy**: Add new plugins or MCP servers. Update configuration examples.

---

## Tier 2: Reference Docs (root level)

### CLAUDE.md
- **Path**: `CLAUDE.md`
- **Watches**: `.claude/docs/*`, `lib/*-api.ts`, `app/`, `components/`
- **Structure**: three sections only — `## How We Work`, `## The Repo`, `## Docs — Read When Triggered`. Skill/agent routing lives in `.claude/docs/SKILL_AND_AGENT_ROUTING.md`, NOT here. If skill or agent tables reappear in CLAUDE.md, flag it — they were deliberately moved out (2026-07-26) because Claude Code already injects that inventory every session.
- **Content verification**:
  - Every row in the `Docs — Read When Triggered` table points at a path that exists on disk
  - Commands in the `The Repo` bash block still exist in `package.json` scripts
  - The `~700 pre-existing errors` lint claim still holds: `npm run lint 2>&1 | grep -c error` — if it's near zero, the "can't be the gate" carve-out is stale and should be removed
  - Paths named in prose still exist: `.env.local`, `~/thoven/.workspace`, `.github/workflows/pre-publish-validation.yml`, `checkpoint.sh`
- **Update strategy**: Surgical only. Do NOT re-expand into more sections, and do NOT re-add skill/agent inventory tables.

### .claude/docs/SKILL_AND_AGENT_ROUTING.md
- **Path**: `.claude/docs/SKILL_AND_AGENT_ROUTING.md`
- **Watches**: `.claude/skills/`, `.claude/agents/`, `~/.claude/skills/workspace/SKILL.md`
- **Content verification**:
  - Every skill named in a routing table still exists (`ls .claude/skills/` + the session-injected skill list); flag rows for retired skills
  - Every agent in the Agents table still exists in `.claude/agents/`; flag stale model tiers
  - **Work-state routing**: the routing table points bare Project orientation, capture, close, and log to `workspace`; semantic reconciliation points to `feature-ledger`. Verify both installed skills and `~/.agents/skills/workspace/references/WORKFLOW.md` exist.
  - Disambiguation entries still name live skills (e.g. `skill-creator` was retired 2026-07-25 in favor of `superpowers:writing-skills`)
- **Update strategy**: Update rows to match disk. This file is allowed to grow — it is loaded on demand, not every session.
- **Key sections to check**: Disambiguating ambiguous phrases, Work-state verbs, Development / Animation / Session / Strategy / Meta tables, Agents table

### TECH_DEBT.md
- **Path**: `TECH_DEBT.md`
- **Watches**: N/A (manually maintained)
- **Content verification**: Check if any RESOLVED items can be confirmed via code. Check if OPEN items were fixed but not marked.
- **Update strategy**: Mark resolved items. Update priority if context changed.

### TODO.md
- **Path**: `TODO.md`
- **Watches**: N/A (manually maintained)
- **Content verification**: Cross-reference pending items against recent commits. Check if done items are marked.
- **Update strategy**: Mark completed items. Remove stale items with user approval.

### CHANGELOG.md
- **Path**: `CHANGELOG.md`
- **Watches**: N/A (updated by /publish)
- **Content verification**: Check version numbers match. Verify unreleased section state.
- **Update strategy**: Voice polish only. NEVER delete, replace, or regenerate entries. Use Edit, not Write.

### Work-State Global Store (`~/thoven/.workspace/`)

These files live outside the FE repo. Check them when `standard` or `full` scope is requested.

- **Paths**: `~/.agents/skills/workspace/references/WORKFLOW.md`, compatibility registers under `~/thoven/.workspace/`, and Project-local `projects/<project>/{STATE.md,CONTINUE_HERE.md}`
- **Source of truth**: the live `workspace` skill verbs (`~/.claude/skills/workspace/SKILL.md`; fallback: `find ~/.claude ~/thoven -name SKILL.md -path '*/workspace/*'`) + the actual item files in `~/thoven/.workspace/`
- **Content verification**:
  - State docs — check referenced paths and skill names. Audience-level state is a compatibility input, not the current Project authority. Snapshot correctness is OUT OF SCOPE — run bare `workspace` for the Project.
  - `TODO.md` / `TECH_DEBT.md` / `FUTURE_IMPROVEMENTS.md` — check if items marked "open" reference file paths or branches that no longer exist on disk
- **Update strategy**: `doc-freshness` only flags staleness. Do not derive or apply Project state; instruct the user to run bare `workspace`.
- **Key sections to check**: STATE.md header/preamble, item counts, any referenced file paths

---

## Tier 3: Reference Docs (`docs/`)

### docs/API_ENDPOINTS_REFERENCE.md
- **Watches**: `lib/*-api.ts`, backend API changes
- **Content verification**: Count documented endpoints vs API module exports
- **Update strategy**: Add new endpoints. Mark deprecated ones. Update response shapes.

### docs/API_FILES_REFERENCE.md
- **Watches**: `lib/*-api.ts`
- **Content verification**: `ls lib/*-api.ts` vs documented files
- **Update strategy**: Add new API files. Remove deleted ones.

### docs/DATA_MODELS.md
- **Watches**: Backend schema changes (cross-repo)
- **Update strategy**: Update when backend ships new models that frontend consumes.

### docs/BUSINESS_RULES.md
- **Watches**: Backend business logic changes
- **Update strategy**: Update when business rules change (pricing, booking, scheduling).

### docs/UI_MAP.md
- **Watches**: `app/`, `components/`
- **Content verification**: Check if new pages or major components are documented
- **Update strategy**: Add new pages/components to the visual map.

### docs/COMPONENT_ORGANIZATION.md
- **Watches**: `components/`
- **Content verification**: `find components -maxdepth 1 -type d | wc -l` vs documented dirs
- **Update strategy**: Add new component directories. Update organization patterns.

### docs/FUTURE_IMPROVEMENTS.md
- **Watches**: N/A (manually maintained)
- **Content verification**: Check if any improvements were implemented but not removed from list
- **Update strategy**: Remove implemented items. Add new deferrals.

---

## Tier 4: Feature Docs (`docs/<Feature>/`)

Feature docs are organized by domain. They drift when feature code evolves after initial documentation.

### docs/Google_Calendar_Sync/
- **Watches**: `components/teacher/ModernCalendar.tsx`, `lib/google-calendar-api.ts`, `hooks/useGoogleCalendar*`
- **Update strategy**: Update when calendar sync behavior changes. Mark completed tasks.

### docs/classroom/
- **Watches**: `components/teacher/classroom/`, `hooks/useSmartClassSwitcher.ts`, `lib/classroom-*.ts`
- **Update strategy**: Update when classroom workspace changes. Keep architecture docs current.

### docs/Thoven_Calendar/
- **Watches**: `components/teacher/ModernCalendar.tsx`, `components/parent/ParentCalendar*`
- **Update strategy**: Update calendar implementation docs when view behavior changes.

### docs/Analytics_Tracking_Fix/
- **Watches**: `app/providers.tsx`, `app/layout.tsx`, `lib/analytics*.ts`
- **Update strategy**: Update when analytics tracking changes. Mark completed pipeline phases.

### Other feature docs
- Feature docs in `docs/` are typically created by the `/dev` pipeline and may be historical.
- Check if the feature is still active before updating.
- Implementation plans and specs are historical — mark completed phases, don't rewrite.

---

## Quick Audit Commands

Use these to quickly assess staleness without reading every file:

```bash
# Count API modules
ls lib/*-api.ts | wc -l

# Count route pages
find app -name "page.tsx" | wc -l

# Count component directories
find components -maxdepth 1 -type d | tail -n +2 | wc -l

# Count hooks
find hooks -name "*.ts" -o -name "*.tsx" | wc -l

# Count contexts
find contexts -name "*.tsx" | wc -l

# Count UI components
ls components/ui/*.tsx | wc -l

# Count skills
ls .claude/skills/ | wc -l

# Count agents
ls .claude/agents/ | wc -l

# Commits since a doc was last updated
DOC_COMMIT=$(git log -1 --format=%H -- <doc_path>)
CODE_COMMIT=$(git log -1 --format=%H -- <code_paths>)
git rev-list --count $DOC_COMMIT..$CODE_COMMIT
```
