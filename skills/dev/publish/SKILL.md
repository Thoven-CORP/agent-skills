---
name: publish
description: Use when publishing, deploying, releasing, or going live. Detects Rails backend vs Next.js frontend and runs that nested workflow. Triggers on publish, deploy, release, go live, staging, changelog.
---

# Publish

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching file:
   - Backend → `references/backend.md`
   - Frontend → `references/frontend.md`
3. Follow that workflow exactly. Do not load the other file.
