#!/usr/bin/env bash
set -euo pipefail
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-card.sh --file PATH" >&2; exit 2; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind card --file "$file"
if ! python3 - "$file" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
pat = re.compile(r"^(?:#{1,6}\s+)?Decision:\s*(go|bounce|ask Andres)\s*$", re.I | re.M)
alt = re.compile(r"^(?:#{1,6}\s+)?Decision\s*$", re.I | re.M)
val = re.compile(r"^\s*(go|bounce|ask Andres)\s*$", re.I | re.M)
if pat.search(text):
    raise SystemExit(0)
m = alt.search(text)
if m:
    rest = text[m.end():]
    for line in rest.splitlines():
        if line.strip() == "":
            continue
        if val.match(line):
            raise SystemExit(0)
        break
raise SystemExit("Decision: must be go, bounce, or ask Andres")
PY
then
  echo "Decision: must be go, bounce, or ask Andres" >&2
  exit 1
fi
echo "ok    decision card"
