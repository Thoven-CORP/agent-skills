#!/usr/bin/env bash
set -euo pipefail
out=""
target=""
reproduced=""
evidence=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) out="$2"; shift 2 ;;
    --target) target="$2"; shift 2 ;;
    --reproduced) reproduced="$2"; shift 2 ;;
    --evidence) evidence="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$out" && -n "$target" && -n "$reproduced" && -n "$evidence" ]] || {
  echo "usage: write-repro.sh --out FILE --target URL --reproduced yes|no|partial --evidence DIR" >&2
  exit 2
}
if [[ ! "$reproduced" =~ ^(yes|no|partial)$ ]]; then
  echo "FAIL  --reproduced must be yes, no, or partial" >&2
  exit 1
fi

json_get() {
  python3 -c 'import json,sys
try:
    d=json.load(open(sys.argv[1]))
except Exception:
    print(""); raise SystemExit(0)
cur=d
for k in sys.argv[2].split("."):
    cur=cur.get(k) if isinstance(cur,dict) else None
print(cur if isinstance(cur,str) else "")' "$1" "$2"
}

fe_sha="unverified"
be_sha="unverified"
if [[ -f "$evidence/fe-version.json" ]]; then
  got="$(json_get "$evidence/fe-version.json" sha)"
  if [[ -n "$got" ]]; then fe_sha="$got"; fi
fi
if [[ -f "$evidence/be-health.json" ]]; then
  got="$(json_get "$evidence/be-health.json" revision.sha)"
  if [[ -n "$got" ]]; then be_sha="$got"; fi
fi

if [[ -f "$evidence/doctor.txt" ]]; then
  step1="1. Doctored $target"
else
  step1="1. Doctor did not run (no doctor.txt)"
fi

cat >"$out" <<EOF
## Target
$target

## Reproduced
$reproduced

## Evidence
$evidence

## Steps
$step1
2. Drove the filed user path

## Version
fe sha: $fe_sha
be sha: $be_sha
EOF
echo "wrote $out"
