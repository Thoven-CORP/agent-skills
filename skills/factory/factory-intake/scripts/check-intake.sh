#!/usr/bin/env bash
# Fail unless the ticket artifact has every required heading and at least two steps.
set -euo pipefail

file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-intake.sh --file PATH" >&2; exit 2; }

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind intake --file "$file"

python3 - "$file" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
steps = re.findall(r"(?im)^\s*\d+\.\s+\S+", text)
if len(steps) < 2:
    raise SystemExit(f"need at least 2 steps, found {len(steps)}")
if not re.search(r"(?i)\bS[123]\b", text):
    raise SystemExit("severity must be S1, S2, or S3")
print("ok    intake shape")
PY
