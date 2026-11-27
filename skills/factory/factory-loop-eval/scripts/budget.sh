#!/usr/bin/env bash
# Monthly eval run cap. Fail closed at the cap. Default PENDING ANDRES.
set -euo pipefail

spend=""
cap="${FACTORY_MONTHLY_EVAL_BUDGET:-20}"
month=""
add=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spend) spend="$2"; shift 2 ;;
    --cap) cap="$2"; shift 2 ;;
    --month) month="$2"; shift 2 ;;
    --add) add="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$spend" ]] || { echo "usage: budget.sh --spend FILE [--cap N] [--month YYYY-MM] [--add N]" >&2; exit 2; }
if ! [[ "$cap" =~ ^[0-9]+$ && "$add" =~ ^[0-9]+$ ]]; then
  echo "FAIL  cap and add must be integers" >&2
  exit 1
fi
month="${month:-$(date -u +%Y-%m)}"

python3 - "$spend" "$cap" "$month" "$add" <<'PY'
import json, os, sys
path, cap, month, add = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4])
data = {"month": month, "used": 0}
if os.path.exists(path):
    try:
        data = json.load(open(path))
    except Exception:
        raise SystemExit("FAIL  spend file is not JSON")
if data.get("month") != month:
    data = {"month": month, "used": 0}
used = int(data.get("used") or 0)
if used + add > cap:
    print(f"FAIL  monthly eval budget {used}+{add} > {cap} (PENDING ANDRES open decision 6)", file=sys.stderr)
    raise SystemExit(1)
data["used"] = used + add
json.dump(data, open(path, "w"))
print(f"ok    budget used={data['used']} / {cap} month={month}")
PY
