#!/usr/bin/env bash
set -euo pipefail
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-eval.sh --file PATH" >&2; exit 2; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind loop-eval --file "$file"
python3 - "$file" <<'PY'
import re, sys
text = open(sys.argv[1]).read()

def section(name):
    heading = re.compile(
        r"^(?:#{1,6}\s+)?" + re.escape(name) + r"(?:\s*:|\s*$)",
        re.I | re.M,
    )
    m = heading.search(text)
    if not m:
        raise SystemExit(f"missing {name} field")
    rest = text[m.end():]
    nxt = re.search(r"^#{1,6}\s+\S", rest, re.M)
    return rest[: nxt.start()] if nxt else rest

gate = section("Gate")
if not re.search(r"\b(run|held)\b", gate, re.I):
    raise SystemExit("Gate must say run or held")
judge = section("Judge")
if "PENDING ANDRES" not in judge and "pending-andres" not in judge.lower():
    raise SystemExit("Judge must mark open decision 3 PENDING ANDRES")
if re.search(r"runner family:\s*(\S+)", judge, re.I) and re.search(r"judge family:\s*(\S+)", judge, re.I):
    runner = re.search(r"runner family:\s*(\S+)", judge, re.I).group(1)
    jfam = re.search(r"judge family:\s*(\S+)", judge, re.I).group(1)
    if runner == jfam and runner.lower() not in {"pending", "unspecified", "held"}:
        raise SystemExit("Judge family must differ from runner")
improve = section("Improve")
if re.search(r"\bmerged\b", improve, re.I) and not re.search(r"do not merge|never merge", improve, re.I):
    raise SystemExit("Improve PR must stay unmerged")
print("ok    loop-eval gates")
PY
echo "ok    loop-eval record"
