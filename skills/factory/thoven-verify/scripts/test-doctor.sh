#!/usr/bin/env bash
# Local checks for doctor.sh. Does not create production data.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
doctor="$DIR/doctor.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "== refuse production host without fetching"
set +e
"$doctor" --fe "https://thoven.co" --be "https://api.thoven.co" --out "$tmp/prod" >"$tmp/prod.out" 2>"$tmp/prod.err"
code=$?
set -e
if [[ "$code" -eq 2 ]] && grep -q 'REFUSE production host' "$tmp/prod.err"; then
  echo "ok    production host refused (exit 2)"
else
  echo "FAIL  production host not refused (exit $code)" >&2
  cat "$tmp/prod.err" >&2
  exit 1
fi
if [[ -f "$tmp/prod/fe-version.json" ]]; then
  echo "FAIL  doctor fetched production version" >&2
  exit 1
fi
echo "ok    production endpoints were not fetched"

echo "== staging doctor"
set +e
"$doctor" --fe "https://staging.thoven.co" --be "https://thoven-api-staging.onrender.com" --out "$tmp/st" >"$tmp/st.out" 2>"$tmp/st.err"
code=$?
set -e
if [[ "$code" -ne 0 ]]; then
  echo "FAIL  staging doctor exit $code" >&2
  cat "$tmp/st.out" "$tmp/st.err" >&2
  exit 1
fi
python3 - "$tmp/st/fe-version.json" "$tmp/st/be-health.json" <<'PY'
import json, sys
fe = json.load(open(sys.argv[1]))
be = json.load(open(sys.argv[2]))
assert fe.get("sha"), fe
assert be.get("status"), be
print("ok    staging version and health JSON written")
PY
grep -q 'worth driving' "$tmp/st.out"
echo "ok    staging is worth driving"
echo "all doctor checks passed"
