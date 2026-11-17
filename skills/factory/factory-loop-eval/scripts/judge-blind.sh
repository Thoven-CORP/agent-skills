#!/usr/bin/env bash
# Judge must be a different model family and must not see the config id.
set -euo pipefail

runner=""
judge=""
prompt=""
config=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runner-family) runner="$2"; shift 2 ;;
    --judge-family) judge="$2"; shift 2 ;;
    --prompt) prompt="$2"; shift 2 ;;
    --config) config="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$runner" && -n "$judge" && -n "$prompt" ]] || {
  echo "usage: judge-blind.sh --runner-family FAM --judge-family FAM --prompt FILE [--config ID]" >&2
  exit 2
}
[[ -f "$prompt" ]] || { echo "FAIL  missing prompt $prompt" >&2; exit 1; }

if [[ "$runner" == "$judge" ]]; then
  echo "FAIL  judge family $judge matches runner (need a different family; PENDING ANDRES open decision 3)" >&2
  exit 1
fi
if [[ -n "$config" ]] && grep -F -q -- "$config" "$prompt"; then
  echo "FAIL  judge prompt contains config id $config" >&2
  exit 1
fi
echo "ok    judge blind runner=$runner judge=$judge"
