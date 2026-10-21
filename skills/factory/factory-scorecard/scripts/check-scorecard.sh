#!/usr/bin/env bash
# Friday scorecard must live at scorecards/YYYY-MM-DD.md and carry per-station numbers.
set -euo pipefail

file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-scorecard.sh --file scorecards/YYYY-MM-DD.md" >&2; exit 2; }

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind scorecard --file "$file"

base="$(basename "$file")"
parent="$(basename "$(dirname "$file")")"
if [[ "$parent" != "scorecards" || ! "$base" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
  echo "FAIL  scorecard must be scorecards/YYYY-MM-DD.md (got $parent/$base)" >&2
  exit 1
fi

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

stations = {
    "1 intake": False,
    "2 classify": False,
    "4 repro": False,
    "5 card": False,
    "6 fix": False,
    "7 review": False,
    "9 ci-watch": False,
    "11-12 version-read": False,
    "claim": False,
}
aliases = {
    "1 intake": "1 intake",
    "intake": "1 intake",
    "2 classify": "2 classify",
    "classify": "2 classify",
    "4 repro": "4 repro",
    "repro": "4 repro",
    "5 card": "5 card",
    "decision-card": "5 card",
    "card": "5 card",
    "6 fix": "6 fix",
    "fix": "6 fix",
    "7 review": "7 review",
    "review": "7 review",
    "9 ci-watch": "9 ci-watch",
    "ci-watch": "9 ci-watch",
    "11-12 version-read": "11-12 version-read",
    "version-read": "11-12 version-read",
    "claim": "claim",
}

body = section("Stations")
row_re = re.compile(
    r"(?im)^(?:\|\s*)?(?P<name>[^|\n]+?)\s*[|:,]\s*(?:count\s*[=:]?\s*)?(?P<count>\d+)\s*[|,\s]+(?:first-try(?:\s+pass(?:\s+rate)?)?\s*[=:]?\s*)?(?P<rate>\d+(?:\.\d+)?%?)\s*"
)
for m in row_re.finditer(body):
    raw = re.sub(r"\s+", " ", m.group("name")).strip().strip("*").lower()
    if raw in {"station", "stations"}:
        continue
    key = None
    for alias in sorted(aliases, key=len, reverse=True):
        if raw == alias or raw.startswith(alias + " ") or raw.endswith(" " + alias):
            key = aliases[alias]
            break
    if key is None:
        continue
    stations[key] = True

missing = [k for k, ok in stations.items() if not ok]
if missing:
    raise SystemExit("Stations must include count and first-try pass rate for: " + ", ".join(missing))

reflect = section("Reflect")
if "thoven-reflect" not in reflect.lower():
    raise SystemExit("Reflect must record the thoven-reflect learnings pass")

proposed = section("Proposed checks")
low = proposed.lower()
if "draft" not in low:
    raise SystemExit("Proposed checks must be a draft PR")
if "andres" not in low:
    raise SystemExit("Proposed checks draft PR is for Andres")
if not re.search(r"do not merge|never merge", low):
    raise SystemExit("Proposed checks must say the bot never merges the draft PR")
print("ok    scorecard stations and friday gates")
PY
echo "ok    scorecard"
