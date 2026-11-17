#!/usr/bin/env bash
# Run one check on a pre-fix ref and a fix ref in scratch worktrees.
# Fail unless pre-fix is a real test failure (exit 1) and fix is green.
set -euo pipefail

pre=""
fix=""
cmd=""
repo="."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pre-fix) pre="$2"; shift 2 ;;
    --fix) fix="$2"; shift 2 ;;
    --cmd) cmd="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$pre" || -z "$fix" || -z "$cmd" ]]; then
  echo "usage: run-check.sh --pre-fix REF --fix REF --cmd 'CHECK' [--repo DIR]" >&2
  exit 2
fi

repo="$(cd "$repo" && pwd)"
head_sha="$(git -C "$repo" rev-parse HEAD)"
head_ref="$(git -C "$repo" symbolic-ref -q --short HEAD || true)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/thoven-formal-check-XXXXXX")"
worktrees=()

restore_head() {
  local now
  now="$(git -C "$repo" rev-parse HEAD 2>/dev/null || true)"
  if [[ -n "$now" && "$now" != "$head_sha" ]]; then
    if [[ -n "$head_ref" ]]; then
      git -C "$repo" checkout --quiet "$head_ref" || git -C "$repo" checkout --quiet "$head_sha"
    else
      git -C "$repo" checkout --quiet "$head_sha"
    fi
  fi
}

cleanup() {
  local wt
  if ((${#worktrees[@]})); then
    for wt in "${worktrees[@]}"; do
      git -C "$repo" worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"
    done
  fi
  restore_head
  rm -rf "$scratch"
}
trap cleanup EXIT

run_on() {
  local ref="$1"
  local label="$2"
  local wt code
  wt="$(mktemp -d "$scratch/wt-XXXXXX")"
  if ! git -C "$repo" worktree add --detach -q "$wt" "$ref"; then
    echo "FAIL  cannot create scratch worktree for $ref" >&2
    return 2
  fi
  worktrees+=("$wt")
  set +e
  (cd "$wt" && bash -lc "$cmd")
  code=$?
  echo "$label exit=$code ref=$ref"
  printf '%s' "$code" >"$scratch/last-code"
  return 0
}

echo "Guarantee check on pre-fix must fail as a test (exit 1), not missing deps."
run_on "$pre" "pre-fix"
pre_code="$(cat "$scratch/last-code")"
if [[ "$pre_code" -eq 0 ]]; then
  echo "FAIL  pre-fix check passed. The check cannot see the bug." >&2
  exit 1
fi
if [[ "$pre_code" -eq 126 || "$pre_code" -eq 127 ]]; then
  echo "FAIL  pre-fix exit $pre_code is not a test failure (missing command or deps)" >&2
  exit 1
fi
if [[ "$pre_code" -ne 1 ]]; then
  echo "FAIL  pre-fix exit $pre_code is not a test failure" >&2
  exit 1
fi
echo "ok    pre-fix failed"

echo "Guarantee check on fix must pass."
run_on "$fix" "fix"
fix_code="$(cat "$scratch/last-code")"
if [[ "$fix_code" -ne 0 ]]; then
  echo "FAIL  fix check failed (exit $fix_code)." >&2
  exit 1
fi
echo "ok    fix passed"

now="$(git -C "$repo" rev-parse HEAD)"
if [[ "$now" != "$head_sha" ]]; then
  echo "FAIL  repo HEAD moved; restoring" >&2
  restore_head
  exit 1
fi
echo "ok    HEAD restored"
echo "red-then-green holds"
