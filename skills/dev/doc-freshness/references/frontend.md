# Doc Freshness — Audit Then Fix

## Critical Guidelines

You MUST audit before fixing. You MUST get approval before changing any doc. You MUST verify changes against live code, not memory.

## Overview

Detect stale documentation across all tiers, report findings with severity and evidence, then update approved docs by reading current source code. Never guess what changed — always diff against the actual codebase.

## Workflow

```
SCOPE → AUDIT → REPORT → APPROVE → FIX → VERIFY
```

### Phase 0: Scope

When invoked, ask the user which scope to run:

| Scope | What it covers |
|-------|---------------|
| **quick** | Tier 1 only (5 critical docs in `.claude/docs/`) |
| **standard** | Tier 1 + Tier 2 (+ CLAUDE.md, TECH_DEBT.md, TODO.md, CHANGELOG.md) |
| **full** | All 4 tiers including feature docs in `docs/` and architecture diagrams |
| **targeted** | Specific doc or directory the user names |

Default to **standard** unless user specifies otherwise.

### Phase 1: Audit

Run detection across selected tiers. Read `references/doc-registry.md` for the complete mapping of docs to source code dependencies.

**Detection strategies (combine all three):**

1. **Git distance** — count commits between doc's last update and its watched code dirs:
   ```bash
   DOC_COMMIT=$(git log -1 --format=%H -- <doc_path>)
   CODE_COMMIT=$(git log -1 --format=%H -- <code_paths>)
   git rev-list --count $DOC_COMMIT..$CODE_COMMIT
   ```

2. **Content verification** — for critical docs, cross-check doc content against live code:
   - ARCHITECTURE.md: count route pages, component dirs, hooks, contexts vs documented numbers
   - API_AND_AUTH.md: count `lib/*-api.ts` files vs documented "N API modules"
   - DESIGN.md: check colour tokens, the enforced-lock table, and `npm run docs:design` for a clean diff
   - DEBUGGING.md: verify tech debt cross-references still exist
   - CLAUDE.md: verify Docs table paths exist, bash commands match `package.json` scripts, three-section structure intact (skill/agent tables must NOT reappear here)
   - `.claude/docs/SKILL_AND_AGENT_ROUTING.md`: verify every skill/agent row still exists on disk

   **Work-state docs (audit the docs *about* the system — never derive a snapshot; that is bare `workspace`):**
   - `.claude/docs/SKILL_AND_AGENT_ROUTING.md` work-state section — flag stale if Project orientation/lifecycle does not route to `workspace`, or semantic reconciliation does not route to `feature-ledger`. Verify the skills and `~/thoven/.workspace/WORKFLOW.md` exist.
   - Workflow law and compatibility store docs (`~/thoven/.workspace/WORKFLOW.md`, `STATE.md`, `TODO.md`, `TECH_DEBT.md`, `FUTURE_IMPROVEMENTS.md`) — flag stale paths or skill names. Project `STATE.md` and `CONTINUE_HERE.md` live under `projects/<project>/`; audience-level copies are compatibility inputs. Snapshot correctness is OUT OF SCOPE — run bare `workspace` for that Project.

3. **Semantic check** — read recent git log for the watched dirs and check if changes are doc-worthy:
   ```bash
   git log --oneline <DOC_COMMIT>..HEAD -- <code_paths>
   ```
   Filter out pure refactors, test-only changes, and whitespace commits.

**Severity levels:**

| Severity | Criteria | Action |
|----------|----------|--------|
| **CRITICAL** | 10+ commits behind OR content verification finds missing items | Must fix now |
| **WARNING** | 3-9 commits behind OR minor content gaps | Should fix |
| **INFO** | 1-2 commits behind, changes are cosmetic/refactor | Note only |

### Phase 2: Report

Present findings as a structured report. Group by severity, show evidence.

```
## Doc Freshness Audit — YYYY-MM-DD

### CRITICAL (must fix)
- API_AND_AUTH.md — 12 commits behind (lib/*-api.ts changed)
  Evidence: 3 new API modules not documented

### WARNING (should fix)
- ARCHITECTURE.md — 5 commits behind (app/ changed)
  Evidence: component dir count says 23, actual is 25

### INFO (note only)
- DESIGN_SYSTEM.md — 1 commit behind (globals.css whitespace change)

### Up to date
- DEBUGGING.md, CLAUDE.md
```

**STOP HERE. Wait for user to select which docs to update.**

### Phase 3: Fix (with approval)

For each approved doc:

1. **Read the current doc** — full content, understand structure and voice
2. **Read the source code** that changed — the actual files, not git summaries
3. **Draft updates** — match existing doc style, voice, and structure
4. **Show diff to user** — present what will change before applying
5. **Apply on approval** — use Edit tool for surgical updates, not full rewrites

**Per-doc update strategies** are in `references/doc-registry.md` — read that file before updating any doc.

**Rules for updates:**
- Match the existing doc's formatting, heading style, and level of detail
- Add new content near related existing content (don't append everything at the bottom)
- Remove documented items that no longer exist in code
- Update counts, table sizes, and summary numbers for code-tracked docs (e.g., "61 API modules" -> "63 API modules") — never derive Project snapshot claims; that belongs to bare `workspace`
- Never remove historical context or architectural decision records unless the decision was reversed
- Use Edit tool for surgical updates — NEVER rewrite entire docs with Write tool
- For CHANGELOG.md: voice polish only. NEVER delete, replace, or regenerate entries.

### Phase 4: Verify

After all updates:
1. Re-run the git distance check — doc should now be at HEAD
2. Re-run content verification for any critical-tier doc that was updated
3. Report final status as a health summary:

```
Documentation health:
  ARCHITECTURE.md     Updated (route count 98→102, added new component dir)
  API_AND_AUTH.md     Updated (module count 61→63, added google-calendar-api)
  DESIGN_SYSTEM.md    Current — no changes needed
  DEBUGGING.md        Current — no changes needed
  CLAUDE.md           Updated (skills count 46→47)
  TECH_DEBT.md        Current — no changes needed
  TODO.md             Updated (marked 3 items complete)
  CHANGELOG.md        Current — no changes needed
```

## After /publish or /ship

When this skill runs post-release, also:
- Check if CLAUDE.md Quick Reference numbers are still accurate (skill count, agent count, API module count)
- Verify the Context Files table paths in CLAUDE.md still exist
- Cross-reference CHANGELOG unreleased section state

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Updating docs from memory instead of reading code | Always `Read` the source files before writing doc updates |
| Rewriting entire doc when only a section changed | Use `Edit` for surgical updates to specific sections |
| Missing new files added since last doc update | Use `Glob` to find all files in watched dirs, not just changed ones |
| Forgetting to update summary counts | After content changes, search for "N tables", "N routes", etc. and update |
| Not checking CLAUDE.md after updating .claude/docs/ | CLAUDE.md references these docs — verify cross-references still hold |
| Clobbering CHANGELOG entries | Voice polish only. Never delete, replace, or regenerate CHANGELOG content |

## Boundary vs the Project snapshot

This skill audits **documentation about** the work-state system — it does NOT re-derive the Map.

| Job | Tool |
|-----|------|
| Derive Project state from Linear, Project files, and git | bare `workspace` |
| Check that docs *describing* the state system are current | **this skill** (`docs-freshness`) |

Concretely: if the `## Work-state verbs` table in `.claude/docs/SKILL_AND_AGENT_ROUTING.md` lists a verb that was deleted from the `workspace` skill, `docs-freshness` flags it as stale. Fixing it means updating that table to match the current `workspace` skill verbs — not re-deriving the Map itself. For Map correctness, run the `workspace` skill.

## Resources

- **Doc Registry**: `references/doc-registry.md` — complete mapping of all tracked docs to source dependencies and update strategies
