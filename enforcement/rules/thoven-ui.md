---
paths:
  - "**/components/**"
  - "**/app/**/*.tsx"
---

Before changing a component, run the `thoven-designer` skill to find the binding token file for the value in question.
The surface named in the task is the only one in scope.
Prove the change with `pnpm exec playwright test <spec>` so `test-results/results.json` and a trace exist.
