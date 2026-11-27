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

echo "== refuse random vercel.app"
set +e
"$doctor" --fe "https://random-app.vercel.app" --be "https://thoven-api-staging.onrender.com" --out "$tmp/rnd" >"$tmp/rnd.out" 2>"$tmp/rnd.err"
code=$?
set -e
if [[ "$code" -eq 0 ]] || ! grep -q 'REFUSE unknown frontend host: random-app.vercel.app' "$tmp/rnd.err"; then
  echo "FAIL  random vercel.app was allowed (exit $code)" >&2
  cat "$tmp/rnd.err" >&2
  exit 1
fi
echo "ok    random vercel.app refused"

echo "== refuse localhost"
set +e
"$doctor" --fe "https://localhost:3000" --be "https://thoven-api-staging.onrender.com" --out "$tmp/loc" >"$tmp/loc.out" 2>"$tmp/loc.err"
code=$?
set -e
if [[ "$code" -eq 0 ]] || ! grep -q 'REFUSE unknown frontend host' "$tmp/loc.err"; then
  echo "FAIL  localhost was allowed (exit $code)" >&2
  cat "$tmp/loc.err" >&2
  exit 1
fi
echo "ok    localhost refused"

echo "== refuse preview FE with non-staging API"
set +e
"$doctor" --fe "https://app-thoven-staging-git-abc.vercel.app" --be "https://api.example.com" --out "$tmp/mis" >"$tmp/mis.out" 2>"$tmp/mis.err"
code=$?
set -e
if [[ "$code" -eq 0 ]] || ! grep -q 'REFUSE unknown API host: api.example.com' "$tmp/mis.err"; then
  echo "FAIL  non-staging API was allowed (exit $code)" >&2
  cat "$tmp/mis.err" >&2
  exit 1
fi
echo "ok    preview FE requires staging API"

echo "== thoven-staging preview host is allowed (curl may still fail)"
set +e
"$doctor" --fe "https://app-thoven-staging-git-abc.vercel.app" --be "https://thoven-api-staging.onrender.com" --out "$tmp/prev" >"$tmp/prev.out" 2>"$tmp/prev.err"
code=$?
set -e
if grep -q 'REFUSE unknown frontend host' "$tmp/prev.err"; then
  echo "FAIL  thoven-staging preview host refused" >&2
  cat "$tmp/prev.err" >&2
  exit 1
fi
echo "ok    thoven-staging preview host accepted"
echo "all doctor checks passed"
