#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill="$DIR/../SKILL.md"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/scorecards"

grep -q '4 PM ET' "$skill"
grep -q 'thoven-reflect' "$skill"
grep -q 'never merges' "$skill"
echo "ok    Friday cadence, thoven-reflect, and draft-PR-never-merge documented"

good="$tmp/scorecards/2026-10-16.md"
cat >"$good" <<'EOF'
## Week
2026-10-16 ending Friday around 4 PM ET

## Tickets
opened: 6
closed: 4
bounced: 1
batch PRs opened: 2 / 3
open now: 1 / 5

## Stations
| Station | Count | First-try pass |
| 1 intake | 6 | 80% |
| 2 classify | 6 | 100% |
| 4 repro | 5 | 80% |
| 5 card | 4 | 75% |
| 6 fix | 3 | 66% |
| 7 review | 3 | 100% |
| 9 ci-watch | 2 | 50% |
| 11-12 version-read | 1 | 100% |
| claim | 1 | 100% |

## Replay
due: no
result: not-run
sample:

## Reflect
thoven-reflect: none this week

## Proposed checks
Draft PR: https://github.com/Thoven-CORP/agent-skills/pull/1
For Andres. Do not merge. The bot never merges this draft.
EOF
"$DIR/check-scorecard.sh" --file "$good"
echo "ok    dated scorecard with per-station numbers passes"

mkdir -p "$tmp/evidence"
cp "$good" "$tmp/evidence/scorecard.md"
set +e
"$DIR/check-scorecard.sh" --file "$tmp/evidence/scorecard.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'scorecards/YYYY-MM-DD.md' "$tmp/err"
echo "ok    undated path is refused"

bad="$tmp/scorecards/2026-10-17.md"
sed '/11-12 version-read/d' "$good" >"$bad"
set +e
"$DIR/check-scorecard.sh" --file "$bad" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q '11-12 version-read' "$tmp/err"
echo "ok    missing station numbers fail"

sed 's/thoven-reflect: none this week/none/' "$good" >"$tmp/scorecards/2026-10-18.md"
set +e
"$DIR/check-scorecard.sh" --file "$tmp/scorecards/2026-10-18.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'thoven-reflect' "$tmp/err"
echo "ok    Reflect must name thoven-reflect"

sed 's/Do not merge. The bot never merges this draft./Andres can merge now./' "$good" >"$tmp/scorecards/2026-10-19.md"
set +e
"$DIR/check-scorecard.sh" --file "$tmp/scorecards/2026-10-19.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'never merges' "$tmp/err"
echo "ok    proposed checks must stay an unmerged draft"

baseline="$DIR/../baseline/baseline-2026-10-21.md"
[[ -f "$baseline" && -f "$DIR/../baseline/review.md" ]]
set +e
"$DIR/check-scorecard.sh" --file "$baseline" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'scorecards/YYYY-MM-DD.md' "$tmp/err"
echo "ok    DEP-10 baseline is present and is not a Friday scorecard"

echo "all check-scorecard checks passed"
