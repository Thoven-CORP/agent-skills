---
name: pr-seo-pr-inbox
description: "Reviews, audits, fixes, and locally merges the Thoven SEO Content Factory's scheduled seo/* article PRs. Use for the weekly SEO PR review loop — checking generated /resources articles against hard gates (page, llms.txt, sitemap, dedup), fixing SEO surface gaps, merging reviewed branches into main, or verifying the SEO factory launchd scheduler. Triggers: review SEO branches/PRs, weekly SEO review, merge generated articles, audit SEO pages, check SEO factory scheduler."
---

# PR SEO PR Inbox

Use this skill for the weekly solo-dev review loop after the SEO Content Factory opens
`seo/*` PRs. The scheduler creates branches and PRs; this skill reviews, fixes,
locally merges, and pushes accepted article work. Replit Publish is explicitly out of
scope.

## First Reads

From `/Users/andresmartinez/thoven/frontend`, read:

- `docs/superpowers/specs/seo-factory/GRADUATION.md`
- `docs/superpowers/specs/seo-factory/SCHEDULER_PLAN.md`
- `tools/seo-factory/orchestrator.mjs`
- `lib/resource-articles.ts` — the single source of truth for `/resources` articles
- `public/llms.txt`
- `app/sitemap.ts` (derives) and `app/sitemap.test.ts` (derives)
- `CHANGELOG.md`

Preserve unrelated dirty files. Never stage broad paths.

## Weekly Workflow

1. Confirm `main` is current:
   `git fetch origin --prune && git rev-parse --short HEAD && git rev-parse --short origin/main && git status --short --branch`.
2. Inspect scheduler outputs:
   `tail -200 tools/seo-factory/logs/seo-factory-weekly.out.log`,
   `tail -200 tools/seo-factory/logs/seo-factory-weekly.err.log`,
   `git worktree list`, `git branch -r --list 'origin/seo/*'`, and
   `gh pr list --state open --json number,title,headRefName,url,mergeStateStatus`.
3. For each open `seo/*` PR, fetch the branch and review locally. Prefer local merge
   into `main` over the GitHub merge button.
4. Run the hard article gate with the bundled script for every generated slug:
   `node .agents/skills/pr-seo-pr-inbox/scripts/pr-seo-pr-inbox-check.mjs --slug <slug> --topic "<primary topic>"`.
   Before pushing `main`, require rendered sitemap evidence:
   `--require-rendered-sitemap --rendered-sitemap-url <url-or-file>`.
5. If any gate fails, create and execute a concrete fix plan in the same turn:
   update the article page, the `lib/resource-articles.ts` entry, and `public/llms.txt`
   (via `node scripts/sync-llms-resources.mjs`). The hub card, `app/sitemap.ts` and
   `app/sitemap.test.ts` derive — do not edit them. Re-run the gate.
6. Before merging locally, run focused checks for changed surfaces:
   `pnpm run type-check`, `pnpm run test:run app/sitemap.test.ts`,
   `pnpm run test:run lib/resource-articles.test.ts`, and
   `pnpm run test:run .agents/skills/pr-seo-pr-inbox/scripts/pr-seo-pr-inbox-check.test.mjs`.
   Never gate on `pnpm run lint` — it has ~700 pre-existing errors; use
   `pnpm exec eslint <changed files>` instead.
7. Merge locally only after the PR branch is reviewed and green:
   `git switch main`, `git pull --ff-only origin main`,
   `git merge --no-ff origin/seo/<slug>`, then push `main`.
8. After push, do not claim production. Report that Replit Publish remains a separate
   human gate.

## Hard Article Gates

Every accepted resource article must have:

- `app/resources/<slug>/page.tsx`.
- An entry in `lib/resource-articles.ts` — the **single source of truth**. The
  `/resources` hub card, the `app/sitemap.ts` URL (`priority 0.6`,
  `changeFrequency monthly`, `lastModified` from the entry's `dateModified`), and the
  `app/sitemap.test.ts` reachable-path registry all derive from it. **Do not hand-edit
  those three files to publish an article** — they no longer carry per-article literals.
- A `public/llms.txt` line. Regenerate with `node scripts/sync-llms-resources.mjs`;
  `lib/resource-articles.test.ts` fails if it drifts.
- A `dateModified` that is parseable and fresh (<= 45 days) for a new scheduled article.
- No exact or near-duplicate topic/title against existing `/resources/*` articles or
  other **unmerged** `seo/*` branches. If this fails, rewrite the topic angle or close
  the duplicate PR instead of merging competing articles.
- Rendered `/sitemap.xml` containing `https://thoven.co/resources/<slug>` before a
  local `main` push that claims publish readiness.

The gate emits six checks: `article-page`, `topic-dedup`, `llms-entry`, `registry-entry`,
`registry-date-fresh`, `rendered-sitemap-entry`.

## Scheduler Live Check

Use:

```bash
node .agents/skills/pr-seo-pr-inbox/scripts/pr-seo-pr-inbox-check.mjs --scheduler
```

This verifies source plist files, installed `~/Library/LaunchAgents` files,
`launchctl list` labels, log directories, visible `seo/*` worktree/branch state, and
that `tools/seo-factory/cache/competitor-crawl.json` is fresh and not the committed
fixture. File existence alone is not proof of a live scheduler.

## Failure Classification

Classify each issue as one of:

- `implementation`: generated article or SEO surface needs code/content changes.
- `scheduler`: launchd, plist, worktree, `gh`, or branch lifecycle issue.
- `environment/cache`: missing or fixture/stale competitor crawl, auth, or machine state.
- `publish-workflow`: Replit Publish or production verification, out of this skill's scope.
- `deferred-gate`: verifier not yet implemented or intentionally postponed.

For `implementation` failures, fix them before merging. For other failures, report the
exact unblock condition and avoid destructive cleanup unless explicitly requested.
