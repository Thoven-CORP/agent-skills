---
name: doc-freshness
description: Audit then fix stale docs against the live codebase. Detects Rails backend vs Next.js frontend and uses that nested registry/workflow.
---

# Doc Freshness

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching file:
   - Backend → `references/backend.md` (registry: `references/backend-extra/`)
   - Frontend → `references/frontend.md` (registry: `references/frontend-extra/`)
3. Follow that workflow exactly. Do not load the other file.
