---
name: factory-scorecard
description: Write the Friday factory scorecard and run a replay eval after every tenth ticket. Use on Friday, for /factory-scorecard, or when Andres asks how the loop is doing. Uses thoven-reflect for the week's agent corrections.
---

# Factory scorecard

Friday rollup. Counts are from Linear and git. Lessons are from `skills/dev/thoven-reflect/SKILL.md`. Do not restate that skill.

## Steps

1. Count loop PRs opened and merged this week vs `weekly_pr_cap` (pending Andres).
2. Count open loop PRs vs `open_pr_cap`.
3. Count tickets closed by batch PRs, bounces, and planted-bug hits from `thoven-factory-formal`.
4. Run thoven-reflect over the same week. Put broken factory rules in the scorecard.
5. After every tenth ticket closed by the factory, run the replay eval in [references/replay.md](references/replay.md).
6. Write the scorecard from [references/scorecard.md](references/scorecard.md).

```bash
scripts/check-scorecard.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/scorecard.md"
../thoven-verify/scripts/check-station-output.sh --kind scorecard --file "$THOVEN_VERIFY_EVIDENCE_DIR/scorecard.md"
```

No production writes. No "the loop is fine" without the numbers.
