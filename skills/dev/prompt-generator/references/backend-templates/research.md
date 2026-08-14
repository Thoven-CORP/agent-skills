# Research Prompt Template

Use for: "research", "investigate", "compare", "evaluate"

## Template Structure

```
Research Goal: [What question to answer — precise and bounded]

Context:
- Current stack: Rails 7.2 API-only, PostgreSQL, Redis, Solid Queue, Devise + JWT
- Relevant codebase areas: [files/dirs that relate]
- Why this matters: [business/technical driver]

Research Scope:
- In scope: [specific technologies/patterns/approaches to evaluate]
- Out of scope: [what NOT to research]

Evaluation Criteria:
1. [Criterion 1 — e.g. performance impact]
2. [Criterion 2 — e.g. migration effort]
3. [Criterion 3 — e.g. maintenance burden]
4. [Criterion 4 — e.g. community support/gem maturity]

Output Format:
- Comparison table (options × criteria)
- Recommendation with rationale
- Migration/adoption path if switching
- Risks and mitigations

Sources to Check:
- This codebase: [specific dirs/files]
- Memory files: /home/runner/.claude/projects/-home-runner-workspace/memory/
- Docs: .claude/docs/, docs/
- External: [gem docs, Rails guides, etc.]
```

## Example: Evaluate Background Job Alternatives

```
Research Goal: Should we stay with Solid Queue or migrate to Sidekiq for background jobs?

Context:
- Current: Solid Queue (database-backed, 52 jobs, 9 scheduled, 4 queues)
- Config: config/solid_queue.yml, app/jobs/
- Hosting: Replit (no dedicated Redis worker process currently)
- Pain points: [describe if any — e.g. job visibility, retry complexity]

Research Scope:
- In scope: Solid Queue vs Sidekiq vs GoodJob
- Out of scope: Cloud-managed queues (SQS, Cloud Tasks), non-Ruby solutions

Evaluation Criteria:
1. Performance at 1000+ jobs/hour
2. Migration effort from current Solid Queue setup
3. Monitoring/visibility (admin dashboard, failed job inspection)
4. Retry/dead letter queue handling
5. Scheduled job support (cron-like)
6. Infrastructure requirements (Redis dependency vs DB-only)
7. Replit deployment compatibility

Output Format:
- Comparison table: Solid Queue vs Sidekiq vs GoodJob on all criteria
- Recommendation with clear rationale
- If migrating: step-by-step migration plan
- Risk assessment for each option

Sources to Check:
- Codebase: app/jobs/, config/solid_queue.yml, .claude/docs/BACKGROUND_JOBS.md
- Gem docs (Context7 lookup for latest API)
- Rails guides on Active Job backends
```
