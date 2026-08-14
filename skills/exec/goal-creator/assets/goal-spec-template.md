# Goal Spec: <TITLE>

> Created <YYYY-MM-DD> by goal-creator. One goal per session; pairs with auto mode. Requires Claude Code v2.1.139+.

## Anchor
- **Builds on:** <plan/brainstorm file path, or "in-session conversation" / "cold-start (shaped via native brainstorm)">
- **Key decisions carried in:** <the settled points the goal does NOT need to re-decide>

## Fit triage (all five must pass)
- **Verifiable end state:** <objective fact that means done>
- **Autonomous to completion:** <why no user decision/input is needed mid-run>
- **Provable in the transcript:** <what Claude prints that proves it — evaluator can't read files/run cmds>
- **Side effects gated:** <none / stops at draft|paused|dry-run|PR before the irreversible step>
- **Bounded:** <turn or time cap>

## Levers
- **Guidance:** <start in <area>, use <command/tool> — or "none">
- **Skills + subagents:** <which available skills the goal drives/references + which subagents it dispatches, picked by domain — or "none">
- **Repos in scope:** <single repo / multiple — cross-repo by default>
- **Testing scope:** <live E2E? create dummy/test data? read production? — anchor on the repo's testing docs if present>
- **Progress work file:** <goal-specs/<slug>-progress.md path the run appends to after each update — or "none">
- **Finalize / quality loop:** <code goals only: run the repo's quality pass (e.g. /simplify + thermo-nuclear), resolve Critical/trivial, stop with non-trivial Major reported — else "n/a (non-code goal)">

## The goal — paste after /goal
```
/goal <directive + measurable end state>[, starting in <area> using <tool/skill>]; the goal is met only when <objective, transcript-verifiable proof> with <constraints / testing scope>[; append progress to <slug>-progress.md after each update]; otherwise stop after <N> turns and report what is blocking.
```

## Runbook
1. Turn on **auto mode** for an unattended run.
2. Paste the `/goal` block above (it starts a turn immediately — no extra prompt needed).
3. Watch the `◎ /goal active` indicator; check status with `/goal`, stop early with `/goal clear`; track a long run via `<slug>-progress.md`.
4. On completion, review the surfaced proof before trusting it.
5. **Quality follow-up (code goals):** the goal stops with non-trivial Major findings reported — re-run `/simplify` + `thermo-nuclear-code-quality-review` and loop with AskUserQuestion approval gates until Critical + non-trivial Major are cleared.
6. Multi-phase work: run this goal → review → create the next goal (this spec covers one).

## Rationale / notes
- Why goal mode fits this work: <...>
- What was deliberately left to a human step (decisions, launch, deploy, Major-finding approvals): <...>
- Known risks / what to check in the output: <...>
