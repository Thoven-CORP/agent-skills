# Intake tables (fallback)

Read this file only when `classify` on `evals/schemas/investigate-intake.json` returns `undecided` or a non-binding answer. Binding answers already fill the classification label.

#### Dimension 1: Bug Category → determines agent roster

| Category | Mandatory Agents | Parallel? |
|----------|-----------------|-----------|
| **Simple UI** | `code-explorer` | No (1 agent) |
| **API/Backend** | `debug-specialist` + `api-designer` | Yes |
| **State** | `debug-specialist` + `react-specialist` | Yes |
| **SSR/Hydration** | `debug-specialist` + `next-js-developer` | Yes |
| **Performance** | `debug-specialist` + `performance-analyzer` | Yes |
| **TypeScript** | `debug-specialist` + `typescript-pro` | Yes |
| **Accessibility** | `code-explorer` + `accessibility-tester` | Yes |
| **Intermittent** | `debug-specialist` + `code-explorer` | Yes |
| **Unknown** | `debug-specialist` + `code-explorer` | Yes |
| **CRITICAL (any)** | Category roster + devil's advocate agent | Yes |

#### Dimension 2: Severity → modifies agent count

| Severity | Indicators | Agent Override |
|----------|-----------|----------------|
| **LOW** | Cosmetic, minor UX | 1 agent min (even if roster says 2) |
| **MEDIUM** | Feature broken for some users | Standard roster |
| **HIGH** | Feature broken for all users | Standard roster |
| **CRITICAL** | Production down, data loss, auth bypass | Category roster + devil's advocate |

#### Dimension 3: Complexity → determines fix strategy

| Tier | Indicators | Fix Strategy |
|------|-----------|-------------|
| **SIMPLE** | Single file, clear error, CSS fix, missing prop, known pattern | Fix inline |
| **MEDIUM** | 2-3 files, clear root cause from diagnosis | Delegate to domain-specific subagent |
| **COMPLEX** | 3-strikes, architectural, cross-concern (3+ domains) | Hand to `/architect`, then plan |

#### Dimension 4: Reproduction → determines what happens before diagnosing

First, whether it needs reproducing at all.

| Reproduce first | Indicators |
|---|---|
| **YES** | Intermittent, state-dependent, environment-specific, no error text, or the reported behaviour contradicts what the code says should happen |
| **NO** | An explicit error with a stack trace, a named file with a visible defect, or a static surface whose cause is readable in the source |

Then how.

| Method | Use when |
|---|---|
| **Browser** | A user-visible behaviour, layout, interaction or hydration issue |
| **Failing test** | Deterministic logic with a known input, worth keeping as a regression |
| **HTTP call** | A contract question. Status, payload shape, auth |
| **Logs or trace** | It already happened in production. Sentry, logs, a trace id |
| **Data snapshot** | It depends on specific production data |
| **Not locally** | It cannot be reproduced here. Read and instrument instead, and say so in the report |

#### Dimension 5: Evidence → determines what proves the fix in Phase 7

Decided here, where the bug's nature is known, and consumed in Phase 7. Context
alone cannot decide it. A CSS fix and an auth bypass are both standalone bug
fixes.

| Evidence | Use when |
|---|---|
| **Type-check** | Types, a rename, or a signature changed, and nothing runtime did |
| **Unit test** | Pure logic changed and a test can assert the literal result |
| **Browser screenshot** | A visible surface changed and one frame shows it |
| **Recording** | A sequence or timing changed and one frame cannot show it |
| **Production check** | The fix is only confirmable against production |
| **None** | Nothing exercised here changed. Name what you changed and why no check covers it |

Choose the cheapest one that covers the change. A type-check finishes in seconds
and is a real answer.

#### Context → determines CLOSE phase

| Context | Indicators |
|---------|-----------|
| **Standalone bug fix** | User reported a bug, not part of feature work |
| **During feature dev** | Bug found while building a feature (not a standalone ticket) |
| **Production incident** | Something is broken in prod right now, urgency |

