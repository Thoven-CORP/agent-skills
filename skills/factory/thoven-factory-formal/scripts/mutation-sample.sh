#!/usr/bin/env bash
# Copy a PR branch into a scratch clone and apply a known-bug patch.
# Does not push. Does not run the reviewer.
set -euo pipefail

pr=""
bug_file=""
note=""
repo="."
scratch_parent="${THOVEN_FORMAL_SCRATCH:-${TMPDIR:-/tmp}/thoven-formal-scratch}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) pr="$2"; shift 2 ;;
    --bug-file) bug_file="$2"; shift 2 ;;
    --note) note="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$pr" || -z "$bug_file" || -z "$note" ]]; then
  echo "usage: mutation-sample.sh --pr URL_OR_REF --bug-file PATCH --note TEXT [--repo DIR]" >&2
  exit 2
fi
if [[ ! -f "$bug_file" ]]; then
  echo "missing bug file: $bug_file" >&2
  exit 1
fi

repo="$(cd "$repo" && pwd)"
bug_file="$(cd "$(dirname "$bug_file")" && pwd)/$(basename "$bug_file")"
mkdir -p "$scratch_parent"
dir="$(mktemp -d "$scratch_parent/pr-XXXXXX")"
echo "$pr" >"$dir/pr.txt"
printf '%s\n' "$note" >"$dir/must-catch.txt"

if ! git clone --quiet "$repo" "$dir/repo"; then
  echo "FAIL  scratch clone failed" >&2
  exit 1
fi

if [[ "$pr" == http://* || "$pr" == https://* ]]; then
  if command -v gh >/dev/null 2>&1; then
    (cd "$dir/repo" && gh pr checkout "$pr" --force) || true
  fi
elif git -C "$dir/repo" rev-parse --verify "$pr" >/dev/null 2>&1; then
  git -C "$dir/repo" checkout --quiet "$pr"
fi

if ! git -C "$dir/repo" apply --index --whitespace=nowarn "$bug_file"; then
  echo "FAIL  planted patch did not apply" >&2
  exit 1
fi
echo "applied $bug_file" >"$dir/applied.txt"

echo "scratch $dir"
echo "Planted bug is local only. Do not push. Hand this tree to a fresh reviewer."
echo "They must catch: $note"
