#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git -C "$tmp" init -q
git -C "$tmp" -c user.email=a@b -c user.name=c checkout -q -b main
printf 'clean\n' >"$tmp/app.rb"
git -C "$tmp" add app.rb
git -C "$tmp" -c user.email=a@b -c user.name=c commit -qm init

printf 'planted-bug\n' >"$tmp/app.rb"
git -C "$tmp" diff >"$tmp/bug.patch"
git -C "$tmp" checkout -q -- app.rb

export THOVEN_FORMAL_SCRATCH="$tmp/scratch"
"$DIR/mutation-sample.sh" --repo "$tmp" --pr HEAD --bug-file "$tmp/bug.patch" --note "must name planted-bug" >"$tmp/out"
scratch="$(grep -E '^scratch ' "$tmp/out" | awk '{print $2}')"
[[ -n "$scratch" ]]
[[ -f "$scratch/applied.txt" ]]
grep -qx 'planted-bug' "$scratch/repo/app.rb"
grep -qx 'clean' "$tmp/app.rb"
echo "ok    planted patch applied in scratch clone only"

echo "all mutation-sample checks passed"
