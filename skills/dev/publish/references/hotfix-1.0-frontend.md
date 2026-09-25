# Publish: 1.0 frontend hotfix (Replit)

Contents: Deployment Pipeline · MANDATORY First Action · Phase 0: Analyze · Phase 1: Decide · Phase 2: Update Changelog · Phase 3: Commit · Phase 4: Post-Commit Actions · Carry the Fix into 2.0 · Changelog State Lifecycle · Rules · References

1.0 takes hotfixes only. Replit serves `release/1.0` (tag `thoven-1.0`) on thoven.co until cutover, and stays the rollback after it. Start the fix from `origin/release/1.0`:

```bash
git fetch origin release/1.0
git switch -c hotfix/<slug> origin/release/1.0
```

In this file "staging" means the Replit workspace on `release/1.0`, never staging.thoven.co.

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
- **Replit workspace** is the staging environment. Pull from GitHub when ready to test or deploy. A pull always takes everything on `release/1.0`.
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
- [ ] Step 8.5 (Publish only): Once `verify:prod` exits 0, tag the release SHA with `git tag -a vX.X.X` (see *Git Tag*)
- [ ] Step 8.6 (Publish only): Land the stamp PR that flips `Publishing` to `Published` (see *Stamp the Release*)
- [ ] Step 9: Carry the fix into 2.0 the same day (see *Carry the Fix into 2.0*)
YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.

The rules are in *Rules* at the end of this file.

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

2. **Rename Unreleased section to versioned.** The date line reads `Publishing` until `npm run verify:prod` exits 0 (see *Post-Publish Verification*):
   ```markdown
   ## [1.12.3] - 2026-03-12 - Publishing
   ```

3. **Create new empty Unreleased**
   ```markdown
   ## [Unreleased] - Not Published

   ---

   ## [1.12.3] - 2026-03-12 - Publishing
   ```

---

### Contract Manifest Refresh (Step 5, before verify)

Before running the verify skill, best-effort refresh the committed contract
manifest from a local backend checkout. Skip this step unless
`git -C ~/thoven/backend branch --show-current` prints `release/1.0`: a
backend on 2.0 code writes a 2.0 manifest into a 1.0 hotfix.

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

Publication Status: Publishing

Co-Authored-By: Claude <noreply@anthropic.com>
```

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

### Land the hotfix on `release/1.0`

CI runs on a pull request into `release/1.0`, never on a push to it. The hotfix lands through a PR:

1. `git push -u origin hotfix/<slug>`
2. `gh pr create --base release/1.0 --title "<type>: <summary>" --body "<what and why>"`
3. **CI passes on the PR.** `gh pr checks --watch`. Done when the job `CI` passes.
   **Stop: push without CI.** Only when Andres asks to push straight to `release/1.0`. Say once that a direct push gets no CI. Push directly only after Andres says "Go: push without CI" for this fix. For a Publish, add the `SURFACES` entry to the commit first. Then run `git push origin HEAD:release/1.0` and continue at the Replit steps.
4. **Stop: merge the hotfix PR.** Andres merges the PR ("merge it" for this PR). Then `git fetch origin release/1.0 && git rev-parse origin/release/1.0` is the release SHA.

### After STAGING

1. Steps 1 to 3 of *Land the hotfix*. The PR stays open.
2. **Do NOT mention Replit.** Pulling into Replit is a separate decision.

### After TESTING

1. Steps 1 to 4 of *Land the hotfix*.
2. Remind: "Merged into `release/1.0`. Next: resync the Replit workspace with the *Replit Workspace Divergence Trap* procedure below, then test there."

### After PUBLISH

1. **The release has a SURFACES entry.** Before the PR merges, add this release's `SURFACES` entry to `scripts/verify-prod-release.mjs` (see *Adding a release to the check*). Without it `verify:prod` proves nothing about this release. Done when `git diff origin/release/1.0 -- scripts/verify-prod-release.mjs` shows the new entry.
2. Steps 1 to 4 of *Land the hotfix*.
3. Remind: "Merged into `release/1.0`. Next steps:
   1. Resync the Replit workspace. **Do NOT blind `git pull`** (see *Replit Workspace Divergence Trap* below): `git fetch origin release/1.0 --tags` → `git log origin/release/1.0..HEAD --stat` → if local commits are only empty `Published your App` markers, `git reset --hard origin/release/1.0`
   2. Verify `git rev-parse HEAD` equals the release SHA
   3. Click **Publish** in the Replit Deployments tab to deploy to production
   4. Come back and confirm the click happened — then run `npm run verify:prod` (see *Post-Publish Verification* below)"
   - Cross-repo releases (FE + BE both have unreleased changes): deploy the **backend first**, confirm healthy, then publish the frontend — FE code that calls new BE contracts will 500 if FE ships first.
4. If `docs/deployment/PUBLISH_REMINDERS.md` had open items (Step 7.5), append their numbered steps to this reminder now. Right after the Publish click is the moment they need to happen.
5. **Stop: Andres clicks Publish.** Only Andres clicks Publish in Replit. Wait until Andres confirms the click.

### Post-Publish Verification (MANDATORY — the `Published` stamp depends on it)

**A release is not published until production serves it.** Three different
moments: landed on GitHub (`git push`), job `CI` green on that SHA, Replit
deployed. Push success is only the first. P7 bypass can land a red SHA.
Do not treat push as green `CI`. Do not dispatch or wait on Parent P1 quality
or Pre-publish validation. Replit Publish snapshots the **workspace**, so a
workspace behind `origin/release/1.0` silently republishes the previous build.

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

1. **Production serves the release.** Run `npm run verify:prod`. Done when it exits 0.

**Adding a release to the check:** add a `SURFACES` entry in
`scripts/verify-prod-release.mjs` with `expectPresent` (strings the release
introduced) and `expectAbsent` (strings it deleted). Every `expectPresent` marker
is validated against tracked source first, so a typo'd or reworded marker fails
loudly instead of passing vacuously.

### Git Tag (Publish Only)

1. **The release is tagged.** After `npm run verify:prod` exits 0, tag the release SHA (`git fetch origin release/1.0` first, so the tag lands on the merged commit). Done when `git ls-remote --tags origin vX.X.X` prints the tag:

   ```bash
   git tag -a vX.X.X -m "vX.X.X: Brief summary" <release-sha>
   git push origin vX.X.X
   ```

The tag checkpoints every production release: `git checkout v1.22.0` shows exactly what was deployed.

### Stamp the Release (Publish Only)

1. **The release is stamped Published.** Only after `npm run verify:prod` exits 0. On a branch from `origin/release/1.0`, change the CHANGELOG line `- Publishing` to `- Published YYYY-MM-DD`, the deploy date. Commit it with the trailer `Publication Status: Published - YYYY-MM-DD HH:MM UTC`. Land it like the hotfix: a PR into `release/1.0`, then `gh pr checks --watch`. It needs no Publish click, because it changes only `CHANGELOG.md`.

   **Stop: merge the stamp PR.** Andres merges it ("merge it" for this PR). Done when the stamp PR is merged.

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

### Sentry

`NEXT_PUBLIC_SENTRY_DSN` is set in Replit production (Andres confirmed this on 2026-09-16).
**Do not ask Andres about Sentry secrets on a publish.** Bring it up only with
evidence: no frontend events for the new release SHA after a deploy.

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

**This happens on nearly every publish.** Each time you click Publish, Replit auto-creates a checkpoint commit in the *workspace*: `Published your App` by `Replit Agent <agent@replit.com>` (with `Replit-Commit-*` trailers). These commits are **never pushed to GitHub**, so the workspace silently diverges from `origin/release/1.0` (the source of truth). A blind `git pull` then creates yet another merge commit mixing Replit's auto-snapshots with origin. That is messy, and it can deploy a tree that isn't exactly what's on GitHub.

**Symptom:** `git status` in the Replit workspace says *"Your branch and 'origin/release/1.0' have diverged, and have N and M different commits each."* The local-only commits are `Published your App` (Replit Agent) + the occasional merge.

**Safe resync procedure — NEVER blind-pull:**

```bash
git fetch origin release/1.0 --tags
git log origin/release/1.0..HEAD --stat     # inspect the LOCAL-only commits
git status                            # confirm working tree is clean
```

Then decide based on what `git log origin/release/1.0..HEAD --stat` shows:

| What the local-only commits contain | Action |
|---|---|
| **Only empty `Published your App` checkpoints + merges** (no `--stat` file changes) | Safe to realign to GitHub: `git reset --hard origin/release/1.0`. It discards only empty Replit markers, loses no code. |
| **Real file changes** (someone built/edited directly in the Replit workspace and never pushed) | **STOP.** Preserve first — branch + push those commits to GitHub, reconcile, *then* deploy. Do not reset. |

After reset, verify the workspace matches what you're publishing: `git rev-parse --short HEAD` must equal the release commit you pushed (Publish snapshots the **workspace**, not GitHub).

**Why `reset --hard`, not `pull`:** the local commits are empty deployment markers with no tree change, so a merge gains nothing and only adds history cruft + a new workspace-only merge commit (more future divergence). Resetting to `origin/release/1.0` makes the workspace exactly equal the audited GitHub state. The one rule: **inspect with `--stat` before resetting.** Never `reset --hard` without first confirming the local commits carry no real work.

---

## Carry the Fix into 2.0

A 1.0 fix that skips 2.0 comes back at cutover.

1. **Carry the fix into `feature/teacher-2.0` the same day.** Open a PR of the fix into `feature/teacher-2.0`. Done when `gh pr create` prints the PR URL:

```bash
git fetch origin feature/teacher-2.0
git switch -c port/<slug> origin/feature/teacher-2.0
git cherry-pick -x <fix-sha>...
git push -u origin port/<slug>
gh pr create --base feature/teacher-2.0 --title "<type>: port 1.0 hotfix <slug>" --body "Ports <fix-sha> from release/1.0."
```

A conflict means 2.0 changed that code. Resolve it for 2.0's code and say so in the PR body. The PR is held for Andres like any other.

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

## Rules

- NEVER force push unless explicitly requested
- ALWAYS read CHANGELOG.md, and update it, before `git commit`
- ALWAYS ask Andres "Staging, Testing, or Publish?" before Phase 2
- ALWAYS run verify (type-check, lint on the touched files, contract-check) before committing
- ALWAYS match the post-commit actions to the chosen stage
- NEVER blind `git pull` in a Replit workspace. It has diverged via auto `Published your App` checkpoints. Inspect with `git log origin/release/1.0..HEAD --stat`, then `git reset --hard origin/release/1.0` ONLY if the local-only commits are empty Replit markers (see *Replit Workspace Divergence Trap*). If they carry real file changes, STOP and preserve them first.
- NEVER commit secrets (.env, credentials, API keys) — enforced by `secret-scan-on-commit.sh` hook
- NEVER skip the MANDATORY checklist — every invocation starts with TaskCreate
- NEVER mention Replit after a staging-only commit
- NEVER call GitHub a "backup" — it is the source of truth for code
- NEVER `gh workflow run` Parent P1 quality or Pre-publish validation, and do not wait on them. Landed on GitHub is not job `CI` green is not Replit deployed.
- NEVER use freeform commit messages — ALL commits must use a Conventional Commits prefix (`feat:`, `fix:`, `docs:`, etc.)
- ALWAYS include `Co-Authored-By: Claude <noreply@anthropic.com>`
- ALWAYS verify git status after commit
- ALWAYS tag the release SHA with `git tag -a vX.X.X` once `verify:prod` exits 0
- ALWAYS run `npm run verify:prod` after the Publish click, and NEVER write the changelog `Published` stamp until it exits 0 — a stamp written before the deploy is a lie the repo will keep telling (see *Post-Publish Verification*)
- Publish commits MUST use `release:` prefix and include `Publication Status: Publishing`. The `Published` trailer rides only the stamp commit, after `verify:prod` exits 0 (see *Stamp the Release*)

---

## References

- [changelog-format.md](frontend-extra/changelog-format.md) - Detailed changelog entry format
