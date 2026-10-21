#!/usr/bin/env bash
# Fixture checks for DEP-11 loop eval. Does not replay production data.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Gate: synthetic tickets do not count.
: >"$tmp/nine.jsonl"
for i in $(seq 1 9); do echo "{\"id\":\"THV-$i\",\"real\":true}" >>"$tmp/nine.jsonl"; done
for i in $(seq 1 5); do echo "{\"id\":\"SYN-$i\",\"real\":false}" >>"$tmp/nine.jsonl"; done
set +e
"$DIR/gate.sh" --ledger "$tmp/nine.jsonl" --min 10 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'held: need 10 real loop tickets, have 9' "$tmp/err"
echo "ok    gate holds below 10 real tickets"

echo '{"id":"THV-10","real":true}' >>"$tmp/nine.jsonl"
"$DIR/gate.sh" --ledger "$tmp/nine.jsonl" --min 10
echo "ok    gate opens at 10 real tickets"

set +e
"$DIR/run-eval.sh" --ledger "$tmp/nine.jsonl" --min 99 --repo "$tmp" --fix-ref HEAD \
  --ticket "$tmp/ticket.md" --hidden-cmd 'true' >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'held:' "$tmp/err"
echo "ok    run-eval refuses before the gate"

# Replay on parent of fix, hidden test is the pass, HEAD restored.
git -C "$tmp" init -q
git -C "$tmp" -c user.email=a@b -c user.name=c checkout -q -b main
printf 'broken\n' >"$tmp/flag.txt"
git -C "$tmp" add flag.txt
git -C "$tmp" -c user.email=a@b -c user.name=c commit -qm pre
pre="$(git -C "$tmp" rev-parse HEAD)"
printf 'fixed\n' >"$tmp/flag.txt"
git -C "$tmp" add flag.txt
git -C "$tmp" -c user.email=a@b -c user.name=c commit -qm fix
fix="$(git -C "$tmp" rev-parse HEAD)"
printf 'ticket text only\n' >"$tmp/ticket.md"
git -C "$tmp" diff "$pre" "$fix" >"$tmp/fix.patch"
before="$(git -C "$tmp" rev-parse HEAD)"

set +e
"$DIR/replay-case.sh" --repo "$tmp" --fix-ref "$fix" --ticket "$tmp/ticket.md" \
  --hidden-cmd 'test "$(cat flag.txt)" = fixed' >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'requires gate.sh or run-eval.sh first' "$tmp/err"
echo "ok    replay-case refuses without a gate"

set +e
"$DIR/replay-case.sh" --allow-ungated --repo "$tmp" --fix-ref "$fix" --ticket "$tmp/ticket.md" \
  --hidden-cmd 'test "$(cat flag.txt)" = fixed' >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q "parent: $pre" "$tmp/out"
grep -q 'hidden: fail' "$tmp/out"
[[ "$(git -C "$tmp" rev-parse HEAD)" == "$before" ]]
echo "ok    parent replay fails without a candidate fix"

"$DIR/replay-case.sh" --allow-ungated --repo "$tmp" --fix-ref "$fix" --ticket "$tmp/ticket.md" \
  --hidden-cmd 'test "$(cat flag.txt)" = fixed' --apply "$tmp/fix.patch" >"$tmp/out"
grep -q 'hidden: pass' "$tmp/out"
grep -q "parent: $pre" "$tmp/out"
[[ "$(git -C "$tmp" rev-parse HEAD)" == "$before" ]]
echo "ok    hidden test pass is the case pass and HEAD restored"

set +e
"$DIR/replay-case.sh" --allow-ungated --repo "$tmp" --fix-ref "$fix" --ticket "$tmp/ticket.md" \
  --hidden-cmd 'command-that-does-not-exist-xyz' >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -eq 2 ]]
grep -q 'not a test result' "$tmp/err"
echo "ok    hidden exit 127 is not a scored miss"

# 25% sample is deterministic.
"$DIR/should-score.sh" --id THV-stable --pct 25 >"$tmp/a" || true
"$DIR/should-score.sh" --id THV-stable --pct 25 >"$tmp/b" || true
cmp -s "$tmp/a" "$tmp/b"
scored=0
for i in $(seq 0 99); do
  if "$DIR/should-score.sh" --id "id-$i" --pct 25 >/dev/null; then
    scored=$((scored + 1))
  fi
done
[[ "$scored" -ge 15 && "$scored" -le 35 ]]
echo "ok    25% sample is deterministic (scored $scored / 100)"

# Judge blindness.
printf 'ticket only\n' >"$tmp/prompt.md"
set +e
"$DIR/judge-blind.sh" --runner-family anthropic --judge-family anthropic --prompt "$tmp/prompt.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'matches runner' "$tmp/err"
echo "ok    same-family judge refused"

"$DIR/judge-blind.sh" --runner-family anthropic --judge-family openai --prompt "$tmp/prompt.md" --config cfg-a
echo "ok    different-family judge accepted"

printf 'cfg-a leaked\n' >"$tmp/leaky.md"
set +e
"$DIR/judge-blind.sh" --runner-family anthropic --judge-family openai --prompt "$tmp/leaky.md" --config cfg-a >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'contains config id' "$tmp/err"
echo "ok    judge prompt cannot see config id"

# Budget fail closed.
printf '{"month":"2026-10","used":20}\n' >"$tmp/spend.json"
set +e
"$DIR/budget.sh" --spend "$tmp/spend.json" --cap 20 --month 2026-10 --add 1 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'monthly eval budget' "$tmp/err"
echo "ok    budget fail closed at cap"

printf '{"month":"2026-10","used":19}\n' >"$tmp/spend.json"
"$DIR/budget.sh" --spend "$tmp/spend.json" --cap 20 --month 2026-10 --add 1
echo "ok    budget allows a run under the cap"

# K failures open a draft-only action.
"$DIR/improve-pr.sh" --station "4 repro" --failures 2 --k 3 >"$tmp/out"
grep -q 'no improvement PR' "$tmp/out"
echo "ok    below K does not open a PR"

"$DIR/improve-pr.sh" --station "4 repro" --failures 3 --k 3 >"$tmp/out"
grep -q 'draft PR for Andres' "$tmp/out"
grep -q 'Do not merge' "$tmp/out"
echo "ok    K failures request a draft PR"

set +e
"$DIR/improve-pr.sh" --station "4 repro" --failures 3 --k 3 --merge yes >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'must not merge' "$tmp/err"
echo "ok    improvement PR cannot be merged by the bot"

# Artifact checker.
cat >"$tmp/eval.md" <<'EOF'
## Gate
real tickets: 10 / 10
verdict: run

## Cases
THV-1 parent: aaa hidden: pass

## Judge
runner family: anthropic
judge family: openai
blind: yes
status: PENDING ANDRES open decision 3

## Live sample
pct: 25
scored: THV-1
skipped: THV-2

## Budget
used: 1 / 20
status: PENDING ANDRES open decision 6

## Improve
station: none
failures: 0 / 3
action: none
status: PENDING ANDRES open decision 4

## Verdict
inconclusive
EOF
"$DIR/check-eval.sh" --file "$tmp/eval.md"
echo "ok    eval record accepted"

# PENDING ANDRES defaults unchanged.
python3 "$DIR/../../factory-rules/scripts/parse-caps.py" --rules "$DIR/../../factory-rules/RULES.md" \
  --print open_pr_cap weekly_pr_cap max_lines max_files >"$tmp/caps"
grep -qx 'open_pr_cap=5' "$tmp/caps"
grep -qx 'weekly_pr_cap=3' "$tmp/caps"
grep -qx 'max_lines=400' "$tmp/caps"
grep -qx 'max_files=15' "$tmp/caps"
grep -q 'PENDING ANDRES' "$DIR/../../factory-rules/RULES.md"
echo "ok    PENDING ANDRES caps stay 5 / 3 / 400 / 15"

echo "all factory-loop-eval checks passed"
