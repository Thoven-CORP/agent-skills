#!/usr/bin/env bash
# Start the loop eval only after enough real tickets.
set -euo pipefail

ledger=""
min="${FACTORY_REPLAY_MIN_TICKETS:-10}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ledger) ledger="$2"; shift 2 ;;
    --min) min="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$ledger" && -f "$ledger" ]] || { echo "usage: gate.sh --ledger tickets.jsonl [--min N]" >&2; exit 2; }
if ! [[ "$min" =~ ^[0-9]+$ ]]; then
  echo "FAIL  --min must be an integer" >&2
  exit 1
fi

count="$(python3 - "$ledger" <<'PY'
import json, sys
n = 0
for line in open(sys.argv[1]):
    line = line.strip()
    if not line:
        continue
    row = json.loads(line)
    if row.get("real") is True:
        n += 1
print(n)
PY
)"

echo "real tickets: $count / $min"
if [[ "$count" -lt "$min" ]]; then
  echo "FAIL  held: need $min real loop tickets, have $count" >&2
  exit 1
fi
echo "ok    gate open"
