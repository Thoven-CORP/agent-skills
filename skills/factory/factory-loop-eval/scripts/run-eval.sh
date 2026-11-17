#!/usr/bin/env bash
# One replay case with the DEP-11 gates applied. Hidden test is the pass.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ledger=""
min="${FACTORY_REPLAY_MIN_TICKETS:-10}"
spend=""
cap="${FACTORY_MONTHLY_EVAL_BUDGET:-20}"
month=""
repo="."
fix_ref=""
ticket=""
hidden_cmd=""
apply=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ledger) ledger="$2"; shift 2 ;;
    --min) min="$2"; shift 2 ;;
    --spend) spend="$2"; shift 2 ;;
    --cap) cap="$2"; shift 2 ;;
    --month) month="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    --fix-ref) fix_ref="$2"; shift 2 ;;
    --ticket) ticket="$2"; shift 2 ;;
    --hidden-cmd) hidden_cmd="$2"; shift 2 ;;
    --apply) apply="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$ledger" && -n "$fix_ref" && -n "$ticket" && -n "$hidden_cmd" ]] || {
  echo "usage: run-eval.sh --ledger FILE --fix-ref SHA --ticket FILE --hidden-cmd 'TEST' [--spend FILE]" >&2
  exit 2
}

"$DIR/gate.sh" --ledger "$ledger" --min "$min"
export FACTORY_EVAL_GATED=1
if [[ -n "$spend" ]]; then
  args=(--spend "$spend" --cap "$cap")
  [[ -n "$month" ]] && args+=(--month "$month")
  "$DIR/budget.sh" "${args[@]}"
fi
replay=(--repo "$repo" --fix-ref "$fix_ref" --ticket "$ticket" --hidden-cmd "$hidden_cmd")
[[ -n "$apply" ]] && replay+=(--apply "$apply")
"$DIR/replay-case.sh" "${replay[@]}"
