---
name: doc-freshness
description: Audit then fix stale docs against the live codebase. Detects Rails backend vs Next.js frontend and uses that nested registry/workflow.
---

# Doc Freshness

## Pitfalls

- Run the git-distance commands under `bash -c` (zsh passes a variable holding several paths as one pathspec and every count reads 0), and before reporting an all-clean audit, check the doc with the oldest git date by hand. (LEARNINGS 2026-08-17)

## Steps

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching file:
   - Backend → `references/backend.md` (registry: `references/backend-extra/`)
   - Frontend → `references/frontend.md` (registry: `references/frontend-extra/`)
3. Follow that workflow exactly. Do not load the other file.
