#!/usr/bin/env bash
# Run one check on a pre-fix ref and a fix ref. Fail unless pre-fix is red and fix is green.
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

run_on() {
  local ref="$1"
  local label="$2"
  git -C "$repo" checkout --quiet "$ref"
  set +e
  (cd "$repo" && bash -lc "$cmd")
  local code=$?
  set -e
  echo "$label exit=$code ref=$ref"
  return "$code"
}

head="$(git -C "$repo" rev-parse --abbrev-ref HEAD)"
trap 'git -C "$repo" checkout --quiet "$head"' EXIT

echo "Guarantee check on pre-fix must fail."
if run_on "$pre" "pre-fix"; then
  echo "FAIL  pre-fix check passed. The check cannot see the bug." >&2
  exit 1
fi
echo "ok    pre-fix failed"

echo "Guarantee check on fix must pass."
if ! run_on "$fix" "fix"; then
  echo "FAIL  fix check failed." >&2
  exit 1
fi
echo "ok    fix passed"
echo "red-then-green holds"
