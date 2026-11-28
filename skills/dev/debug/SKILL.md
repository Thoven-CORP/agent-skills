---
name: debug
description: Diagnoses a bug, error, crash, regression or slow path by building a red feedback loop first, testing falsifiable hypotheses, and fixing at the cause with a regression test at the right seam. Use when something is broken, throwing, failing or slow.
---

# Debug

Build the loop first; everything after it is mechanical. Adapted from mattpocock's `diagnosing-bugs`; the Thoven parts are the known patterns, the production sources and the users.

## Pitfalls

- Before diagnosing a display bug, write down who should receive or see the item and confirm it, because a wrong label can be a routing bug. (LEARNINGS 2026-10-22)
- For a named user's failure, pull that person's records from the prod DB, Render logs, Sentry, Mixpanel and Stripe before explaining it; the IDs each tool takes are in [references/vendor-access.md](references/vendor-access.md). (LEARNINGS 2026-11-05)
- A long-running local puma serves stale code and a stale `secret_key_base` (silent 401s): restart it before trusting a repro.
- Redact every secret in what you show; build loops on env vars so the credential stays out of the output.

## 1. Check the known patterns

Read the section of [references/common-errors.md](references/common-errors.md) that matches the symptom (backend also has `.claude/docs/COMMON_ERRORS.md`). A match is a hypothesis to test in step 4, not a diagnosis.

**Done when:** you have read the matching section and noted any candidate pattern.

## 2. Build a red loop

Name one command that drives the real code path and asserts the user's exact symptom, and run it. In order of preference: a failing test at the seam that reaches the bug, a curl against the local backend, a headless Playwright script, a replayed production payload, a `git bisect run` harness, an old-versus-new differential. For a production-only bug, start from the real record (law, "Own what you find": name one environment and id). Tighten it until it runs in seconds and gives the same verdict every run; for an intermittent bug, raise the reproduction rate until it is debuggable.

When no loop is possible, stop, list what you tried, and ask for access, a captured artifact or temporary instrumentation. Reading code to build a theory before the loop exists is the failure this step prevents.

**Done when:** the command, already run, goes red on this bug and you have its output.

## 3. Minimise

Cut inputs, callers, data and steps one at a time, rerunning the loop after each cut.

**Done when:** removing any remaining element turns the loop green.

## 4. Hypothesise and probe

Write 3 to 5 ranked hypotheses, each falsifiable: "If X is the cause, changing Y makes the bug disappear." For callers and data flow, `graphify query` and `graphify path` before grep. Test one variable at a time with a debugger or targeted logs tagged `[DEBUG-<id>]`. For performance, measure a baseline and bisect before changing anything.

**Done when:** one hypothesis predicted a probe's result and the others are ruled out.

## 5. Diagnose before fixing

Confirm the finding is a product bug. A bad seed, a stale import, a stale server or code awaiting deletion is not; fix that cause instead. A fix that changes product behaviour, or one bigger than the brief, goes to Andres as a report (symptom, root cause with file:line, fix options) before the fix.

**Done when:** the root cause is stated with its evidence, and either it is yours to fix or the report is sent.

## 6. Fix with a regression test

At the correct seam (`write-tests`, step 2), turn the minimised repro into a failing test, watch it fail, fix the cause, watch it pass, then rerun the original loop. A one-off failure gets the fix at its cause, not a guard for that instance.

**Done when:** the regression test went red then green, the original loop is green, and `rg '\[DEBUG-'` finds nothing.

## 7. Record the pattern

Add the bug to `common-errors.md` only when it is generalisable, has prevention guidance, and can be named without a file or service ("Stale Derived State After Partial Save"). Use `scripts/log_error.py <category> <name> <symptom> <root cause> <fix>`. State the confirmed hypothesis in the commit message.

**Done when:** the pattern is logged, or you have said which test it failed.
