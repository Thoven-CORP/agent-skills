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

def field(name):
    inline = re.compile(
        r"^(?:#{1,6}\s+)?" + re.escape(name) + r":\s*(.+)\s*$",
        re.I | re.M,
    )
    m = inline.search(text)
    if m:
        return m.group(1).strip()
    heading = re.compile(
        r"^(?:#{1,6}\s+)?" + re.escape(name) + r"\s*$",
        re.I | re.M,
    )
    m = heading.search(text)
    if not m:
        return None
    for line in text[m.end():].splitlines():
        if line.strip() == "":
            continue
        if re.match(r"^#{1,6}\s+\S", line):
            return None
        return line.strip()
    return None

steps = re.findall(r"(?im)^\s*\d+\.\s+\S+", text)
if len(steps) < 2:
    raise SystemExit(f"need at least 2 steps, found {len(steps)}")
sev = field("Severity")
if sev not in {"S1", "S2", "S3"}:
    raise SystemExit("severity must be a field with value S1, S2, or S3")
if field("Forbidden") is None:
    raise SystemExit("Forbidden field is required")
print("ok    intake shape")
PY
