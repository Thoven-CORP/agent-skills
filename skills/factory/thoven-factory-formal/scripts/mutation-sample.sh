#!/usr/bin/env bash
# Copy a PR branch into a scratch worktree and apply a known-bug patch.
# Does not push. Does not run the reviewer.
set -euo pipefail

pr=""
bug_file=""
note=""
scratch_parent="${THOVEN_FORMAL_SCRATCH:-${TMPDIR:-/tmp}/thoven-formal-scratch}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) pr="$2"; shift 2 ;;
    --bug-file) bug_file="$2"; shift 2 ;;
    --note) note="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$pr" || -z "$bug_file" || -z "$note" ]]; then
  echo "usage: mutation-sample.sh --pr URL --bug-file PATCH --note TEXT" >&2
  exit 2
fi
if [[ ! -f "$bug_file" ]]; then
  echo "missing bug file: $bug_file" >&2
  exit 1
fi

mkdir -p "$scratch_parent"
dir="$(mktemp -d "$scratch_parent/pr-XXXXXX")"
echo "$pr" >"$dir/pr.txt"
printf '%s\n' "$note" >"$dir/must-catch.txt"
git clone --quiet --no-checkout . "$dir/repo" 2>/dev/null || git clone --quiet . "$dir/repo"

# Best-effort checkout of the PR head when gh can see it.
if command -v gh >/dev/null 2>&1; then
  gh pr checkout "$pr" --repo "$(git remote get-url origin)" --force 2>/dev/null || true
fi

cp "$bug_file" "$dir/planted.patch"
echo "scratch $dir"
echo "Planted bug is local only. Do not push. Hand this tree to a fresh reviewer."
echo "They must catch: $note"
