# Honest scope

Every formal report ends with this block. Fill every line. Do not delete a line because it is empty.

```
## Scope
Verified: <the guarantee in one sentence>
Tool: <property test | bounded test | TLA+>
Bound: <input size, step count, or "none, exhaustive on the model">
Covered files: <paths>
Covered functions: <names>
Assumptions: <what the check treats as already true>
Left out: <races, other repos, UI, data the seed lacks>
Last sync commit: <sha where you confirmed the check still describes the code>
```

A pass means the model or the bound held. It does not mean the whole system is correct.

Move `Last sync commit` forward only after you re-read the covered files and confirm the check still describes them.
