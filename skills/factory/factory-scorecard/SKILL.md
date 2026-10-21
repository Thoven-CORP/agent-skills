---
name: factory-scorecard
description: Write the Friday factory scorecard around 4 PM ET and run a replay eval after every tenth ticket. Use on Friday, for /factory-scorecard, or when Andres asks how the loop is doing. Uses thoven-reflect for the week's agent corrections.
---

# Factory scorecard

Friday rollup, around 4 PM ET. Counts are from Linear and git. The learnings pass is `skills/dev/thoven-reflect/SKILL.md`. Do not restate that skill. Proposed new checks go out as a draft PR for Andres. The bot never merges that PR.

## Cadence

Run once on Friday around 4 PM ET. Write `scorecards/YYYY-MM-DD.md` for that Friday. Do not overwrite an older dated file.

## Steps

1. Count loop PRs opened and merged this week vs `weekly_pr_cap` (pending Andres).
2. Count open loop PRs vs `open_pr_cap`.
3. Count tickets closed by batch PRs, bounces, and planted-bug hits from `thoven-factory-formal`.
4. Fill per-station counts and first-try pass rate for intake, classify, repro, card, fix, review, ci-watch, version-read, and claim.
5. Invoke `skills/dev/thoven-reflect/SKILL.md` for the learnings pass. Put broken factory rules in the Reflect section. Name thoven-reflect as the source.
6. After every tenth ticket closed by the factory, run the replay eval in [references/replay.md](references/replay.md).
7. Write the scorecard from [references/scorecard.md](references/scorecard.md) to `scorecards/YYYY-MM-DD.md`.
8. If the week produced proposed new checks, open a **draft PR** for Andres. Leave it draft. Do not mark ready. Do not merge. The bot never merges that PR.

```bash
scripts/check-scorecard.sh --file scorecards/YYYY-MM-DD.md
../thoven-verify/scripts/check-station-output.sh --kind scorecard --file scorecards/YYYY-MM-DD.md
```

No production writes. No "the loop is fine" without the numbers.
