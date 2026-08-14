# Publish Skill

Handles commits, changelog updates, and the three-stage deployment pipeline.

## Deployment Pipeline

```
Local (Warp)  →  GitHub (source of truth)  →  Replit workspace (staging)  →  Publish (production)
```

| Stage | Action | Changelog State |
|-------|--------|----------------|
| **Staging** | commit + push to GitHub | `[Unreleased] - Not Published` |
| **Testing** | commit + push + pull into Replit workspace | `[Unreleased] - In Staging` |
| **Publish** | commit + push + pull + click Publish in Replit | `[X.X.X] - YYYY-MM-DD - Published` |

- **GitHub** is the source of truth for code. Multiple sessions push here frequently.
- **Replit workspace** is the staging environment. Pull from GitHub when ready to test or deploy — always pulls everything on main.
- **Replit Publish** deploys the workspace snapshot to production at thoven.co.

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

TaskCreate for each:
- [ ] Step 1: Check git status, diff, and recent commits
- [ ] Step 2: Read CHANGELOG.md — find last published version and current state
- [ ] Step 3: List all unpublished changes (unreleased section + uncommitted)
- [ ] GATE: Ask user — Staging, Testing, or Publish?
- [ ] Step 4: Update CHANGELOG.md (add entries, update state, or bump version)
- [ ] Step 5: Best-effort refresh the contract manifest from a local backend checkout (`npm run sync-manifest`), then run verify skill (type-check + lint + contract-check)
- [ ] Step 6: Create commit with proper format (HEREDOC)
- [ ] Step 7: Execute post-commit actions per decision (push / push+pull / push+pull+publish)
- [ ] Step 7.5 (Publish only): Check docs/deployment/PUBLISH_REMINDERS.md for pending post-publish actions
- [ ] Step 8 (Publish only): After the Publish click, run `npm run verify:prod` — only stamp the changelog `Published` once it exits 0
YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.

**CRITICAL - YOU MUST FOLLOW THESE RULES:**

### NEVER Do This:
- ❌ NEVER jump straight to `git commit` without updating CHANGELOG first
- ❌ NEVER skip the Staging/Testing/Publish decision gate
- ❌ NEVER commit without running verify (type-check + lint + contract-check)
- ❌ NEVER commit secrets (.env, credentials, API keys)
- ❌ NEVER create a publish commit without `Publication Status: Published`
- ❌ NEVER tell the user to pull into Replit after a staging commit — that's a separate decision
- ❌ NEVER call GitHub a "backup" — it is the source of truth

### ALWAYS Do This:
- ✅ ALWAYS create the TaskCreate checklist before any other action
- ✅ ALWAYS read CHANGELOG.md before modifying it
- ✅ ALWAYS ask user Staging, Testing, or Publish before proceeding
- ✅ ALWAYS run verify before committing
- ✅ ALWAYS include `Co-Authored-By: Claude <noreply@anthropic.com>`
- ✅ ALWAYS match post-commit actions to the chosen pipeline stage

---

## Workflow Overview

```
Phase 0: ANALYZE → Phase 1: DECIDE → Phase 2: UPDATE CHANGELOG → Phase 3: COMMIT → Phase 4: POST-COMMIT ACTIONS
```

---

## Phase 0: Analyze

**Goal:** Understand what changed and current state.

### Steps

1. **Check git status**
   ```bash
   git status
   git diff --stat
   ```

2. **Review recent commits**
   ```bash
   git log --oneline -5
   ```

3. **Read current CHANGELOG.md**
   - Check what's in `[Unreleased]` section
   - Note the current changelog state (`Not Published` or `In Staging`)
   - Note the last published version number

4. **Summarize changes** for the user

---

## Phase 1: Decide

**Goal:** Determine which pipeline stage this is.

### Ask the User

```
Which pipeline stage?

A) Staging  — commit & push to GitHub
   Changes accumulate on GitHub. Not in Replit yet.

B) Testing  — commit & push & pull into Replit workspace
   Ready to test in Replit's staging environment.

C) Publish  — commit & push & pull & Publish in Replit
   Ship to production at thoven.co.
```

### Decision Criteria

**Choose STAGING when:**
- Work in progress
- Not ready for Replit yet
- User says "commit", "save", "push", "stage"

**Choose TESTING when:**
- Want to verify in Replit workspace before going live
- User says "test", "test in replit", "pull into replit", "staging test"

**Choose PUBLISH when:**
- Feature is complete and tested
- Ready for production users
- User explicitly says "publish", "release", "deploy", "ship"

---

## Phase 2: Update Changelog

**Goal:** Update CHANGELOG.md to reflect where code lives.

### For STAGING Commits

Add entries under `## [Unreleased] - Not Published`:

```markdown
### Added
- **Feature Name** - Brief description
  - Detail 1
  - Detail 2
  - File: `path/to/file.tsx`

### Fixed
- **Bug Name** - What was fixed
  - Root cause
  - File: `path/to/file.tsx`
```

See [frontend-extra/changelog-format.md](frontend-extra/changelog-format.md) for full format.

### For TESTING Commits

1. Add any new entries under `[Unreleased]`
2. Change the state marker from `Not Published` to `In Staging`:

```markdown
## [Unreleased] - In Staging
```

This signals that everything in `[Unreleased]` has been pulled into the Replit workspace for testing.

### For PUBLISH Commits

1. **Determine next version**
   - Check last version in CHANGELOG (e.g., `1.12.2`)
   - Increment: patch (1.12.3), minor (1.13.0), or major (2.0.0)
   - Patch = bug fixes, minor changes
   - Minor = new features
   - Major = breaking changes

2. **Rename Unreleased section to versioned**
   ```markdown
   ## [1.12.3] - 2026-03-12 - Published
   ```

3. **Create new empty Unreleased**
   ```markdown
   ## [Unreleased] - Not Published

   ---

   ## [1.12.3] - 2026-03-12 - Published
   ```

---

### Contract Manifest Refresh (Step 5, before verify)

Before running the verify skill, best-effort refresh the committed contract
manifest from a local backend checkout:

```bash
npm run sync-manifest
```

- If it reports **"Backend manifest not found"** — expected when there's no
  local `~/thoven/backend` checkout. Proceed to verify anyway; nothing
  regresses (verify runs against the currently-committed manifest, same as
  always).
- If it reports **"Synced backend manifest"** — say so plainly in the publish
  summary (e.g. "contract manifest refreshed from local backend — N routes
  changed, included in this publish"). The diff to
  `contract/contract-manifest.json` is a normal uncommitted change; it rides
  in Step 6's commit like any other file.
- If it reports **"already in sync"** — nothing to do, proceed.

This exists because `/publish` is the one place that already assumes
BE-before-FE (backend deployed before frontend), which is what makes it safe
to trust a local backend checkout here — see
`docs/superpowers/specs/2026-08-08-contract-manifest-drift-detection-design.md`
for why this is scoped to `/publish` only, not general `verify` calls.

---

## Phase 3: Commit

### Conventional Commits Format

All commits MUST use a Conventional Commits prefix. This makes git history searchable and enables automated tooling.

| Prefix | When to Use | Example |
|--------|-------------|---------|
| `feat:` | New feature or page | `feat: add teacher availability calendar` |
| `fix:` | Bug fix | `fix: prevent double-fetch on marketplace navigation` |
| `docs:` | Documentation only | `docs: update API endpoints reference` |
| `style:` | Formatting, no logic change | `style: fix inconsistent button spacing` |
| `refactor:` | Code restructuring, no behavior change | `refactor: extract booking logic into custom hook` |
| `test:` | Adding or updating tests | `test: add coverage for calendar helpers` |
| `chore:` | Maintenance, deps, config | `chore: update Tailwind to v4.1` |
| `security:` | Security improvements | `security: untrack settings.local.json` |
| `perf:` | Performance improvement | `perf: lazy-load marketplace card images` |

**Scoping** (optional): `feat(calendar): add week view` — use when the change is clearly scoped to one module.

### Staging Commit Format

```
<type>: brief descriptive summary

- Bullet points for specific changes

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Testing Commit Format

```
<type>: brief descriptive summary (staging test)

- Bullet points for specific changes
- Changelog: moved to In Staging

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Publish Commit Format

```
release: Publish vX.X.X: Brief summary of major features

- Feature highlight 1
- Feature highlight 2

Publication Status: Published

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Git Tag (Publish Only)

After a publish commit, tag the release:

```bash
git tag -a vX.X.X -m "vX.X.X: Brief summary"
git push origin vX.X.X
```

This makes every production release checkpointed — you can `git checkout v1.22.0` to see exactly what was deployed.

### Use HEREDOC for commit

```bash
git add <specific-files>
git commit -m "$(cat <<'EOF'
<type>: your commit message here

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Post-Commit Actions

**Actions differ based on the pipeline stage chosen in Phase 1.**

### After STAGING

1. `git push origin main`
2. Remind: "Pushed to GitHub."
3. **Do NOT mention Replit** — pulling into Replit is a separate decision.

### After TESTING

1. `git push origin main`
2. Remind: "Pushed to GitHub. Next: pull into Replit workspace (`git pull` in Replit) to test."
3. User pulls in Replit manually and tests in the workspace environment.

### After PUBLISH

1. `git push origin main`
2. Remind: "Pushed to GitHub. Next steps:
   1. Resync the Replit workspace — **do NOT blind `git pull`** (see *Replit Workspace Divergence Trap* below): `git fetch origin main --tags` → `git log origin/main..HEAD --stat` → if local commits are only empty `Published your App` markers, `git reset --hard origin/main`
   2. Verify `git rev-parse --short HEAD` equals the release commit you just pushed
   3. Click **Publish** in the Replit Deployments tab to deploy to production
   4. Come back and confirm the click happened — then run `npm run verify:prod` (see *Post-Publish Verification* below)"
   - Cross-repo releases (FE + BE both have unreleased changes): deploy the **backend first**, confirm healthy, then publish the frontend — FE code that calls new BE contracts will 500 if FE ships first.
3. If `docs/deployment/PUBLISH_REMINDERS.md` had open items (Step 7.5), append their numbered steps to this reminder now — right after the Publish click is the moment they need to happen.

### Post-Publish Verification (MANDATORY — the `Published` stamp depends on it)

**A release is not published until production serves it.** Everything before the
Publish click — commit, tag, push, green CI — proves the release was *prepared*,
not deployed. Replit Publish snapshots the **workspace**, so a workspace behind
`origin/main` silently republishes the previous build.

**This has already happened.** v2.21.0 was committed, tagged, pushed, CI-green and
stamped `Published 2026-07-27`. The Publish click never happened. Production served
v2.20.0 for a full day while every artifact in the repo claimed otherwise. It was
found only when Andres opened the student dashboard and the feature wasn't there.

After Andres confirms the Publish click:

```bash
npm run verify:prod
```

It fetches the live production bundles and asserts that strings introduced by the
release are being served and strings deleted by it are gone.

| Exit | Meaning | Action |
|---|---|---|
| 0 | production serves the release | proceed — stamp the changelog `Published` |
| 1 | `MISSING` / `STALE` — prod is serving different code | the workspace was behind. Resync and publish again. **Do not stamp.** |
| 2 | a marker exists in no tracked source file | fix the marker in `scripts/verify-prod-release.mjs` — it proves nothing |

**Ordering rule (this is the fix for the incident above):** write the changelog
`Published` stamp **after** `verify:prod` goes green, never at commit time. If the
release commit must carry the version header, leave the date line as
`- Publishing` and correct it to the real deploy date in a follow-up commit once
verified.

**Adding a release to the check:** add a `SURFACES` entry in
`scripts/verify-prod-release.mjs` with `expectPresent` (strings the release
introduced) and `expectAbsent` (strings it deleted). Every `expectPresent` marker
is validated against tracked source first, so a typo'd or reworded marker fails
loudly instead of passing vacuously.

### Pending Post-Publish Actions (Publish only)

Some work is finished in code but needs a manual step the moment it goes
live — rotating a secret, re-running a vendor API call that only works once
the deploy is public, a one-time backfill. Those live in
`docs/deployment/PUBLISH_REMINDERS.md` — a scratch checklist, NOT tech debt,
NOT the workspace TODO store. It exists so parallel agents across worktrees
have one place to drop a transient post-publish step without polluting a
long-lived tracker or this skill file with items that go stale the moment
they're done. (Backend has the mirror of this doc + gate as publish Step 6.9.)

Read `docs/deployment/PUBLISH_REMINDERS.md`. For each item under `## Open`,
surface its numbered steps verbatim in the "After PUBLISH" reminder, in
order. Do NOT perform them yourself — they run AFTER Andres clicks Publish,
and several need Replit secrets you cannot reach. If `## Open` is empty
(or says "none currently"), say so in one line and move on.

Cross-stack note: a backend-scoped reminder (e.g. a Rails webhook secret)
lives in the **backend** repo's copy of this doc, not here — check there too
if this is a cross-stack release, since neither skill reads the other repo's
file automatically.

After Andres confirms an item's steps are done (in a later message or
session — not this run), delete that item from the doc. Don't let
confirmed-done items linger; the doc's value depends on staying short and
current.

### Sentry Observability Gate (Publish only)

Before telling Andres to click Publish, verify FE error tracking will not go dark
in production. The frontend now ships real `@sentry/nextjs` (not the old no-op
shim), so a missing DSN silently drops all production errors.

1. **Frontend DSN** — Replit **production** secrets (Deployments tab, not
   `.env.local`) must include `NEXT_PUBLIC_SENTRY_DSN` for project
   `javascript-nextjs` (org `thoven-gy`; create the Sentry project if it does not
   exist yet). Without it, FE capture is a production no-op.
2. **Source maps** — for readable stack traces, the FE build needs
   `SENTRY_AUTH_TOKEN` + `SENTRY_ORG=thoven-gy` + `SENTRY_PROJECT=javascript-nextjs`
   so `withSentryConfig` uploads maps. Absent token → build still succeeds, upload
   is skipped (traces stay minified).
3. **Post-deploy smoke** — after Publish, confirm a fresh event appears for the
   new release SHA (Sentry Issues, or Sentry MCP `search_issues`).

Do NOT hard-block Publish if these are known-missing — surface them as
**BLOCKERS TO FIX NEXT** in the reminder so they are not silent. (Backend has the
mirror of this gate as publish Step 6.75.)

### Replit Deployment Context

```
Replit Workspace (staging)          Replit Deployment (production)
──────────────────────────          ──────────────────────────────
- git pull lands code here          - Separate cloud container
- Run dev server for testing        - Serves live users at thoven.co
- Changes are instant here          - Only updates on "Publish" click
```

- Replit Publish takes a **snapshot** of the workspace and deploys it to a separate production container
- There is **no CLI deploy command** — deployment is only through the Replit UI
- All accumulated workspace changes ship together in one Publish action
- Secrets/env vars for production are configured in the Replit Deployments tab, not `.env.local`

### Replit Workspace Divergence Trap (ALWAYS check before a Replit pull)

**This happens on nearly every publish.** Each time you click Publish, Replit auto-creates a checkpoint commit in the *workspace* — `Published your App` by `Replit Agent <agent@replit.com>` (with `Replit-Commit-*` trailers). These commits are **never pushed to GitHub**, so the workspace silently diverges from `origin/main` (the source of truth). A blind `git pull` then creates yet another merge commit mixing Replit's auto-snapshots with origin — messy, and it can deploy a tree that isn't exactly what's on GitHub.

**Symptom:** `git status` in the Replit workspace says *"Your branch and 'origin/main' have diverged, and have N and M different commits each."* The local-only commits are `Published your App` (Replit Agent) + the occasional merge.

**Safe resync procedure — NEVER blind-pull:**

```bash
git fetch origin main --tags
git log origin/main..HEAD --stat     # inspect the LOCAL-only commits
git status                            # confirm working tree is clean
```

Then decide based on what `git log origin/main..HEAD --stat` shows:

| What the local-only commits contain | Action |
|---|---|
| **Only empty `Published your App` checkpoints + merges** (no `--stat` file changes) | Safe to realign to GitHub: `git reset --hard origin/main` — discards only empty Replit markers, loses no code. |
| **Real file changes** (someone built/edited directly in the Replit workspace and never pushed) | **STOP.** Preserve first — branch + push those commits to GitHub, reconcile, *then* deploy. Do not reset. |

After reset, verify the workspace matches what you're publishing: `git rev-parse --short HEAD` must equal the release commit you pushed (Publish snapshots the **workspace**, not GitHub).

**Why `reset --hard`, not `pull`:** the local commits are empty deployment markers with no tree change, so a merge gains nothing and only adds history cruft + a new workspace-only merge commit (more future divergence). Resetting to `origin/main` makes the workspace exactly equal the audited GitHub state. The one rule: **inspect with `--stat` before resetting** — never `reset --hard` without first confirming the local commits carry no real work.

---

## Changelog State Lifecycle

```
[Unreleased] - Not Published     ← staging commits accumulate here
         ↓ (testing)
[Unreleased] - In Staging        ← pulled into Replit workspace
         ↓ (publish)
[1.x.x] - YYYY-MM-DD - Published  ← live in production
[Unreleased] - Not Published     ← fresh empty section created
```

---

## Quick Reference

| Stage | Changelog Action | Commit Format | Post-Commit |
|-------|-----------------|---------------|-------------|
| **Staging** | Add to `[Unreleased] - Not Published` | Descriptive summary | Push to GitHub |
| **Testing** | Flip to `[Unreleased] - In Staging` | Summary + "staging test" | Push + pull into Replit |
| **Publish** | Version `[X.X.X] - Published` | `Publish vX.X.X: ...` | Push + pull + Publish in Replit + check PUBLISH_REMINDERS.md |

---

## Rules

- NEVER force push unless explicitly requested
- NEVER blind `git pull` in a Replit workspace — it has diverged via auto `Published your App` checkpoints. Inspect with `git log origin/main..HEAD --stat`, then `git reset --hard origin/main` ONLY if the local-only commits are empty Replit markers (see *Replit Workspace Divergence Trap*). If they carry real file changes, STOP and preserve them first.
- NEVER commit secrets (.env, credentials, API keys) — enforced by `secret-scan-on-commit.sh` hook
- NEVER skip the MANDATORY checklist — every invocation starts with TaskCreate
- NEVER mention Replit after a staging-only commit
- NEVER call GitHub a "backup" — it is the source of truth for code
- NEVER use freeform commit messages — ALL commits must use a Conventional Commits prefix (`feat:`, `fix:`, `docs:`, etc.)
- ALWAYS include `Co-Authored-By: Claude <noreply@anthropic.com>`
- ALWAYS verify git status after commit
- ALWAYS tag publish commits with `git tag -a vX.X.X`
- ALWAYS run `npm run verify:prod` after the Publish click, and NEVER write the changelog `Published` stamp until it exits 0 — a stamp written before the deploy is a lie the repo will keep telling (see *Post-Publish Verification*)
- Publish commits MUST use `release:` prefix and include `Publication Status: Published`

---

## References

- [changelog-format.md](frontend-extra/changelog-format.md) - Detailed changelog entry format
