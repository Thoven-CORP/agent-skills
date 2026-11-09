#!/usr/bin/env bash
# Replay one fixed bug on the parent of the fix. Hidden test is the pass.
set -euo pipefail

repo="."
fix_ref=""
ticket=""
hidden_cmd=""
apply=""
allow_ungated=0
scratch_parent="${THOVEN_EVAL_SCRATCH:-${TMPDIR:-/tmp}/thoven-loop-eval}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --fix-ref) fix_ref="$2"; shift 2 ;;
    --ticket) ticket="$2"; shift 2 ;;
    --hidden-cmd) hidden_cmd="$2"; shift 2 ;;
    --apply) apply="$2"; shift 2 ;;
    --allow-ungated) allow_ungated=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$fix_ref" || -z "$ticket" || -z "$hidden_cmd" ]]; then
  echo "usage: replay-case.sh --fix-ref SHA --ticket FILE --hidden-cmd 'TEST' [--repo DIR] [--apply PATCH]" >&2
  exit 2
fi
[[ -f "$ticket" ]] || { echo "FAIL  missing ticket $ticket" >&2; exit 1; }
if [[ -n "$apply" && ! -f "$apply" ]]; then
  echo "FAIL  missing apply patch $apply" >&2
  exit 1
fi

if [[ "$allow_ungated" -ne 1 && "${FACTORY_EVAL_GATED:-}" != "1" ]]; then
  echo "FAIL  replay-case requires gate.sh or run-eval.sh first" >&2
  exit 1
fi

repo="$(cd "$repo" && pwd)"
head_sha="$(git -C "$repo" rev-parse HEAD)"
if ! parent="$(git -C "$repo" rev-parse "${fix_ref}^")"; then
  echo "FAIL  cannot resolve parent of $fix_ref" >&2
  exit 1
fi
fix_sha="$(git -C "$repo" rev-parse "$fix_ref")"
if [[ "$parent" == "$fix_sha" ]]; then
  echo "FAIL  parent equals fix ref" >&2
  exit 1
fi

mkdir -p "$scratch_parent"
wt="$(mktemp -d "$scratch_parent/case-XXXXXX")"
cleanup() {
  git -C "$repo" worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"
  now="$(git -C "$repo" rev-parse HEAD 2>/dev/null || true)"
  if [[ -n "$now" && "$now" != "$head_sha" ]]; then
    git -C "$repo" checkout --quiet "$head_sha"
  fi
}
trap cleanup EXIT

if ! git -C "$repo" worktree add --detach -q "$wt" "$parent"; then
  echo "FAIL  cannot create scratch worktree for parent $parent" >&2
  exit 1
fi
wt_head="$(git -C "$wt" rev-parse HEAD)"
if [[ "$wt_head" != "$parent" ]]; then
  echo "FAIL  scratch is not on parent $parent (got $wt_head)" >&2
  exit 1
fi

cp "$ticket" "$wt/TICKET_PROMPT.md"
if [[ -n "$apply" ]]; then
  if ! git -C "$wt" apply --index --whitespace=nowarn "$apply"; then
    echo "FAIL  candidate patch did not apply on parent" >&2
    exit 1
  fi
fi

set +e
(cd "$wt" && bash -lc "$hidden_cmd")
code=$?
set -e

echo "prompt: $wt/TICKET_PROMPT.md"
echo "parent: $parent"
echo "fix: $fix_sha"
echo "hidden exit=$code"
now="$(git -C "$repo" rev-parse HEAD)"
if [[ "$now" != "$head_sha" ]]; then
  echo "FAIL  repo HEAD moved" >&2
  exit 1
fi
echo "ok    HEAD restored"

if [[ "$code" -eq 126 || "$code" -eq 127 ]]; then
  echo "FAIL  hidden exit $code is not a test result (missing command or deps)" >&2
  exit 2
fi
if [[ "$code" -eq 0 ]]; then
  echo "hidden: pass"
  exit 0
fi
echo "hidden: fail"
exit 1
