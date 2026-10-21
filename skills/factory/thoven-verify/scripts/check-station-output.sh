#!/usr/bin/env bash
# Check a factory station artifact for required keys.
# Usage: check-station-output.sh --kind KIND --file PATH
set -euo pipefail

kind=""
file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kind) kind="$2"; shift 2 ;;
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$kind" || -z "$file" ]]; then
  echo "usage: check-station-output.sh --kind KIND --file PATH" >&2
  exit 2
fi
if [[ ! -f "$file" ]]; then
  echo "missing artifact: $file" >&2
  exit 1
fi

required_for() {
  case "$1" in
    intake) printf '%s\n' "Duplicate check" "Evidence" "What the user saw" "Expected" "Steps" "Severity" "Found by" "Repo" "Project" "Batch" ;;
    repro) printf '%s\n' "Target" "Reproduced" "Evidence" "Steps" ;;
    card) printf '%s\n' "Decision" "Guarantee" "Batch" "Forbidden" ;;
    review) printf '%s\n' "Guarantee" "Pre-fix" "Post-fix" "Findings" ;;
    claim) printf '%s\n' "Sentry" "Issue" "Sha" ;;
    scorecard) printf '%s\n' "Week" "Tickets" "Replay" ;;
    formal) printf '%s\n' "Guarantee" "Fails on pre-fix" "Passes on fix" "Scope" ;;
    *) echo "unknown kind: $1" >&2; return 2 ;;
  esac
}

missing=0
while IFS= read -r key; do
  if ! grep -qiE "$key" "$file"; then
    echo "missing required field: $key" >&2
    missing=1
  fi
done < <(required_for "$kind")

if [[ "$missing" -ne 0 ]]; then
  echo "station output check failed ($kind $file)" >&2
  exit 1
fi
echo "station output check passed ($kind)"
exit 0
