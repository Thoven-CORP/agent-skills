#!/usr/bin/env bash
# Deterministic 25% live-run sample. Same id always gets the same answer.
set -euo pipefail

id=""
pct=25

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) id="$2"; shift 2 ;;
    --pct) pct="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$id" ]] || { echo "usage: should-score.sh --id ID [--pct 25]" >&2; exit 2; }
if ! [[ "$pct" =~ ^[0-9]+$ ]] || [[ "$pct" -gt 100 ]]; then
  echo "FAIL  --pct must be 0-100" >&2
  exit 1
fi

python3 - "$id" "$pct" <<'PY'
import sys, zlib
ident, pct = sys.argv[1], int(sys.argv[2])
n = zlib.crc32(ident.encode()) % 100
if n < pct:
    print("score")
    raise SystemExit(0)
print("skip")
raise SystemExit(1)
PY
