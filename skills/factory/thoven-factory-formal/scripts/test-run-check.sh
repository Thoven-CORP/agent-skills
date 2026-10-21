#!/usr/bin/env bash
# Prove run-check.sh is red on pre-fix and green on fix.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

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

check='test "$(cat flag.txt)" = fixed'

"$DIR/run-check.sh" --repo "$tmp" --pre-fix "$pre" --fix "$fix" --cmd "$check"
echo "ok    run-check red-then-green"

# inverted check must fail the wrapper
set +e
"$DIR/run-check.sh" --repo "$tmp" --pre-fix "$pre" --fix "$fix" --cmd 'test "$(cat flag.txt)" = broken' >/dev/null
code=$?
set -e
[[ "$code" -ne 0 ]]
echo "ok    wrapper fails when the check cannot see the bug"
