---
name: verify
description: Use when claiming work is done, before committing, after fixing bugs, or when asked to verify. Detects Rails backend (rspec/evidence) vs Next.js frontend (type-check/lint/contract-check) and runs that nested workflow.
---

# Verify

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching file:
   - Backend → `references/backend.md`
   - Frontend → `references/frontend.md`
3. Follow that workflow exactly. Do not load the other file.
