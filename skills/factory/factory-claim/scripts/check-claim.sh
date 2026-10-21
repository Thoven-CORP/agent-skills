#!/usr/bin/env bash
set -euo pipefail
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-claim.sh --file PATH" >&2; exit 2; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind claim --file "$file"
if ! grep -q 'thoven-gy' "$file"; then
  echo "claim must name org thoven-gy" >&2
  exit 1
fi
python3 - "$file" <<'PY'
import re, sys
text = open(sys.argv[1]).read()

def section(name: str) -> str:
    heading = re.compile(
        r"^(?:#{1,6}\s+)?" + re.escape(name) + r"(?:\s*:|\s*$)",
        re.I | re.M,
    )
    m = heading.search(text)
    if not m:
        raise SystemExit(f"missing {name} field")
    rest = text[m.end():]
    nxt = re.search(r"^#{1,6}\s+\S", rest, re.M)
    body = rest[: nxt.start()] if nxt else rest
    return body

prod = section("Prod version")
if not re.search(r"\bPASS\b", prod):
    raise SystemExit("resolve requires prod version-read RESULT: PASS")
approval = section("Approval")
if not re.search(r"Andres", approval):
    raise SystemExit("resolve requires Andres's approval")
lock = section("Claim lock")
if "factory-claim-lock" not in lock:
    raise SystemExit("claim lock record is required")
print("ok    claim gates")
PY
echo "ok    claim record"
