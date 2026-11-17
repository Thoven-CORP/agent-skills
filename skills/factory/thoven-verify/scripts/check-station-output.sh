#!/usr/bin/env bash
# Check a factory station artifact for required headings (not substrings).
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
    intake) printf '%s\n' "Duplicate check" "Evidence" "What the user saw" "Expected" "Steps" "Severity" "Found by" "Repo" "Project" "Batch" "Forbidden" ;;
    repro) printf '%s\n' "Target" "Reproduced" "Evidence" "Steps" ;;
    card) printf '%s\n' "Decision" "Guarantee" "Batch" "Forbidden" ;;
    review) printf '%s\n' "Guarantee" "Pre-fix" "Post-fix" "Findings" "Verdict" ;;
    claim) printf '%s\n' "Sentry" "Issue" "Sha" "Prod version" "Approval" "Claim lock" ;;
    scorecard) printf '%s\n' "Week" "Tickets" "Replay" "Stations" "Reflect" "Proposed checks" ;;
    formal) printf '%s\n' "Guarantee" "Fails on pre-fix" "Passes on fix" "Scope" ;;
    classify) printf '%s\n' "Verdict" "Issue" "Reason" ;;
    ci-watch) printf '%s\n' "PR" "head" "Evidence" ;;
    version-read) printf '%s\n' "RESULT" "WORKER" ;;
    loop-eval) printf '%s\n' "Gate" "Cases" "Judge" "Live sample" "Budget" "Improve" "Verdict" ;;
    *) echo "unknown kind: $1" >&2; return 2 ;;
  esac
}

missing=0
while IFS= read -r key; do
  if ! python3 - "$file" "$key" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
field = sys.argv[2]
pat = re.compile(r"^(?:#{1,6}\s+)?" + re.escape(field) + r"(?:\s*:|\s*$)", re.I | re.M)
sys.exit(0 if pat.search(text) else 1)
PY
  then
    echo "missing required heading: $key" >&2
    missing=1
  fi
done < <(required_for "$kind")

if [[ "$missing" -ne 0 ]]; then
  echo "station output check failed ($kind $file)" >&2
  exit 1
fi
echo "station output check passed ($kind)"
exit 0
