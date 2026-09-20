---
name: orchestrate
description: Classifies an ambiguous request and names the skill that should run. Detects Rails backend vs Next.js frontend and classifies against that routing table.
---

# Orchestrate

1. Detect the repo.
   - Backend when `Gemfile` exists in cwd or a parent, or `git remote get-url origin` contains `backend-remote`.
   - Frontend when `package.json` exists alongside an App Router `app/`, or origin contains `frontend-remote`.
   - Neither matched, ask once.
2. Classify. Done when a JSON record is in context.

   Frontend:

   ```bash
   classify ~/thoven/agent-skills/evals/schemas/orchestrate-frontend.json
   ```

   Backend:

   ```bash
   classify ~/thoven/agent-skills/evals/schemas/orchestrate-backend.json
   ```

   stdin is the user request.
3. If `status` is `answered` and `answers.destination.binding` is true, invoke that skill. Done when the named skill is running.
4. If `status` is `undecided` or binding is false, read the matching file only, then name one destination from it.
   - Backend, `references/backend.md`.
   - Frontend, `references/frontend.md`.

## Structure routes to the graph

"Who calls X", "what breaks if I change Y", "how does A reach B" are answered by
`graphify query|path|explain` in the detected repo before any skill is named.
Grep cannot trace a relationship. `/blast-radius` gives the impact of a proposed
change, `/how` walks a subsystem, `/why` gives the motivation behind one, and
`/teach` combines the last two.

## Keeping the tables honest

Every destination in the reference files carries a leading slash.
`scripts/check-skill-routes.sh` resolves each one, and also the criterion keys in
`evals/schemas/orchestrate-*.json`. The schema is the outcome list. The markdown
is the undecided fallback. A key in one that is missing from the other fails the
check. Run it after editing either.

```
scripts/check-skill-routes.sh skills/dev/orchestrate/references/*.md evals/schemas/orchestrate-frontend.json evals/schemas/orchestrate-backend.json
```
