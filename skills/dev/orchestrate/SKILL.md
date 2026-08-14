---
name: orchestrate
description: Classifies an ambiguous request and routes to the correct skill. Detects Rails backend vs Next.js frontend and uses that nested routing table.
---

# Orchestrate

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching file:
   - Backend → `references/backend.md`
   - Frontend → `references/frontend.md`
3. Follow that workflow exactly. Do not load the other file.
