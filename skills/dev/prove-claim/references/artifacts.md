# Artifact layout

Before capturing baseline or treatment, read [check-build: disk budget](../../check-build/references/disk-budget.md): budget temporary runtime space, keep it separate from evidence, and clean up owned scratch on completion or failure. The layout below holds retained evidence only.

Retained evidence goes here, unless the next rule keeps it inline:

```text
/tmp/prove-claim/<claim-slug>/
├── claim.md
├── timeline.md
├── baseline/
├── treatment/
├── diff/
└── verdict.md
```

If artifacts may contain sensitive code, prompts, screenshots, HTTP bodies, or heap data, keep only the minimal inline evidence unless the user agrees to disk storage.
