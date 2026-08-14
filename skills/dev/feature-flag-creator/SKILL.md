---
name: feature-flag-creator
description: Scaffold a new Thoven feature flag the canonical way so it always appears in the admin panel and is wired across repos. Repo-aware — does the frontend half in the Next.js repo (thoven/frontend) and the backend half in the Rails repo (thoven/backend). Use when adding or creating a feature flag, gating a feature behind a toggle, or setting up a rollout. Triggers on "feature flag", "new flag", "add a flag", "gate behind a flag", "toggle", "rollout". NOT for retiring or deleting flags, and NOT for general feature work (use /dev).
---

# Feature Flag Creator

Scaffolds ONE new Thoven feature flag correctly. The flag system spans two repos and has two competing frontend patterns, so flags routinely end up half-wired or invisible to the admin panel. This skill enforces the one right path.

## The core rule: remote by default

A **remote** flag lives in the backend `feature_flags` table. It **auto-appears in the admin panel** (`/admin/settings`) with a runtime toggle and supports per-teacher overrides for free. This is the default and almost always the right choice.

A **local** flag is a hardcoded `isXEnabled()` function in `lib/feature-flags.ts` gated on an env var. It does **NOT** appear in the admin panel and cannot be toggled at runtime. Use it ONLY for a pure build-time / SSR concern that genuinely has no need for a runtime toggle, and only with an explicit justification captured in the conversation.

If you ever think "I'll just use an env var / local flag for now" — STOP. That is exactly the drift this skill exists to prevent. Default to remote.

## Workflow

### 1. Detect the repo
- **Frontend** if `lib/feature-flags.ts` exists (Next.js). → load `references/frontend-contract.md`.
- **Backend** if `app/models/feature_flag.rb` exists (Rails). → load `references/backend-contract.md`.
- If neither or both are ambiguous, ask the operator which repo this is.

This skill only edits the repo it is invoked in. To wire both halves of a remote flag, run it once in each repo.

### 2. Gather intent
Collect and confirm before writing anything:
- **key** — `snake_case`, identical in both repos (this is the join key). e.g. `teacher_community_enabled`.
- **name** — human label shown in the admin panel. e.g. `Teacher Community`.
- **description** — one line shown in the admin panel.
- **default** — almost always `enabled: false` (ships dark). Only seed `true` with explicit reason.
- **what it gates** — UI only, or real server-side behavior? (determines whether the backend half needs a gating method + specs.)

### 3. Enforce remote-by-default
Recommend a remote flag. Only proceed with a local flag if the operator gives a concrete build-time/SSR justification. Record that justification in your summary.

### 4. Scaffold the current repo's half
Follow the matching reference file exactly — it lists the precise files to touch and the verified patterns to copy:
- Frontend → `references/frontend-contract.md`
- Backend → `references/backend-contract.md`

Make surgical edits only. Do not reformat or touch unrelated flags.

### 5. Cross-repo reconciliation reminder (ALWAYS print)
A remote flag is dead until BOTH halves exist. After scaffolding one half, always print the other half's checklist and this warning:

> ⚠️ A remote frontend flag does NOTHING until a backend `feature_flags` row with the same `key` exists. A backend row with no frontend wiring is dead weight. Run this skill in the **other** repo to finish `<key>`.

Never say a remote flag is "done" after only one repo. Do not defer the other half silently — name it explicitly as the next step.

## Anti-rationalization guardrails

| Tempting shortcut | Why it's wrong | Do instead |
|---|---|---|
| "I'll use a local env flag for now" | Never appears in admin; becomes permanent drift | Remote flag unless build-time/SSR-justified |
| "I'll add the backend row later" | FE flag silently never turns on (the exact `teacher_community_enabled` bug) | Print the BE checklist now; name it as the required next step |
| "I'll skip the test / docs entry" | The dark-default test is the production failsafe; the docs count is how drift is caught | Always add the guard test + update the flag inventory |
| "I'll register it in the admin list" | There is no registry — the admin list is data-driven | Just create the `feature_flags` row; it auto-appears |

## Out of scope
- Retiring, deleting, or auditing flags (create-only).
- Migrating existing local flags to remote.
- Changing the flag architecture (D15, admin endpoints, auto-discovery) — it already works.
