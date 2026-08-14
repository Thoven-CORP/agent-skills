---
name: prompt-generator
description: Use when creating or improving prompts for AI agents. Detects Rails backend vs Next.js frontend, then uses that nested engine and templates.
---

# Prompt Generator

1. Detect repo:
   - Backend if `Gemfile` exists in cwd/parents, or `git remote get-url origin` contains `backend-remote`.
   - Frontend if `package.json` exists and `app/` is Next App Router, or origin contains `frontend-remote`.
   - Else ask once: backend or frontend?
2. Read **only** the matching engine:
   - Backend → `references/backend.md`
   - Frontend → `references/frontend.md`
3. Before generating, search that side's templates (and its references). Do not load the other side:
   - Backend → `references/backend-templates/` and `references/backend/`
   - Frontend → `references/frontend-templates/` and `references/frontend/`
4. Follow that workflow exactly.
