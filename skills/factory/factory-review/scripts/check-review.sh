#!/usr/bin/env bash
set -euo pipefail
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-review.sh --file PATH" >&2; exit 2; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind review --file "$file"
if ! python3 - "$file" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
pat = re.compile(r"^(?:#{1,6}\s+)?Verdict:\s*(ready|fix|bounce)\s*$", re.I | re.M)
alt = re.compile(r"^(?:#{1,6}\s+)?Verdict\s*$", re.I | re.M)
val = re.compile(r"^\s*(ready|fix|bounce)\s*$", re.I | re.M)
if pat.search(text):
    raise SystemExit(0)
m = alt.search(text)
if m:
    rest = text[m.end():]
    if val.search(rest.split("\n", 2)[1] if "\n" in rest else ""):
        raise SystemExit(0)
    # next non-empty line
    for line in rest.splitlines():
        if line.strip() == "":
            continue
        if val.match(line):
            raise SystemExit(0)
        break
raise SystemExit("Verdict: must be ready, fix, or bounce")
PY
then
  echo "Verdict: must be ready, fix, or bounce" >&2
  exit 1
fi
echo "ok    review report"
