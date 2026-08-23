---
name: grill-with-docs
description: >-
  Grill a plan or design against the repo, then file the rulings. Use when speccing,
  when an issue has a Writes to: line, or when Andres says grill. First action is the
  session gate. Do not ask Q1 while the issue is Todo.
---

# Grill with docs

## Session gate

Name the `THV-` issue. Fetch it. Run:

```bash
node ~/.agents/skills/workspace/tools/session-preflight.js <<'JSON'
{ "identifier": "THV-63", "state": "Todo", "assignee": null, "milestone": null, "writesTo": "…", "writesToExists": true }
JSON
```

Exit 1 → `workspace` `start` (claim Speccing, milestone, assignee, tool comment). Re-run.
**Do not ask Q1 while it is red.**

## Then

1. Call `grilling` and `domain-modeling`.
2. Each ruling, same turn: `workspace` `capture` (fast lane) into the file its prefix names.
3. Frontier empty → `feature-ledger` reconcile, file remaining rows, stop.

Shipped product code is out of scope. Protos and `app/dev/` routes are in. The issue's
`Writes to:` path is the only document this session must finish.
