---
name: grill-with-docs
description: >-
  Grill a plan or design against the repo. Use when an issue has a Writes to: line, or when Andres says grill. First action is the
  session gate. Green session gate, then hand off to grilling.
---

# Grill with docs

## Pitfalls

- Derive the item list only from the Linear Project description and what Andres pasted; add nothing from your own research, and leave items he called resolved closed. Your own findings go in a separate list labelled as yours, never into a grill question. (LEARNINGS 2026-10-08)
- Before putting a fork to Andres, read the Linear Project description and parent decisions, grep prior session transcripts and Mem0 for a ruling, quote it with its date, and ask only what it leaves open. (LEARNINGS 2026-09-14)

## Session gate

Name the `THV-` issue. Fetch it. Run:

```bash
node ~/.agents/skills/workspace/tools/session-preflight.js <<'JSON'
{ "identifier": "THV-63", "state": "Todo", "assignee": null, "milestone": null, "writesTo": "…", "writesToExists": true }
JSON
```

Exit 1 → `workspace` `start` (claim In Progress, milestone, assignee, tool comment). Re-run.
When the gate is green, invoke the `grilling` skill.

Shipped product code is out of scope. Protos and `app/dev/` routes are in. The issue's
`Writes to:` path is the only document this session must finish.
