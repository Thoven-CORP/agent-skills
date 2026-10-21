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
fe_sha="unverified"
be_sha="unverified"
if [[ -f "$evidence/fe-version.json" ]]; then
  fe_sha="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("sha",""))' "$evidence/fe-version.json")"
fi
if [[ -f "$evidence/be-health.json" ]]; then
  be_sha="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("revision",{}).get("sha",""))' "$evidence/be-health.json")"
fi
cat >"$out" <<EOF
## Target
$target

## Reproduced
$reproduced

## Evidence
$evidence

## Steps
1. Doctored $target
2. Drove the filed user path

## Version
fe sha: $fe_sha
be sha: $be_sha
EOF
echo "wrote $out"
