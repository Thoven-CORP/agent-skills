---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.rb"
---

Before renaming, moving, or deleting an exported symbol, run `graphify affected <Symbol>` from the repo root and list what it returns in your reply.
The graph lags the tree, so run `graphify update .` first if `graphify-out/` is older than the last commit.
