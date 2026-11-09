#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
ev="$tmp/ev"
mkdir -p "$ev"

set +e
"$DIR/write-repro.sh" --out "$tmp/bad.md" --target https://staging.thoven.co --reproduced maybe --evidence "$ev" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  --reproduced must be yes, no, or partial' "$tmp/err"
echo "ok    reproduced must be yes/no/partial"

"$DIR/write-repro.sh" --out "$tmp/no-sha.md" --target https://staging.thoven.co --reproduced yes --evidence "$ev"
grep -q 'fe sha: unverified' "$tmp/no-sha.md"
grep -q 'be sha: unverified' "$tmp/no-sha.md"
grep -q 'Doctor did not run (no doctor.txt)' "$tmp/no-sha.md"
! grep -q 'Doctored https://staging.thoven.co' "$tmp/no-sha.md"
echo "ok    missing sha prints unverified and doctor is not claimed"

printf '{"sha":"abc123"}\n' >"$ev/fe-version.json"
printf '{"revision":{"sha":"def456"}}\n' >"$ev/be-health.json"
echo 'worth driving' >"$ev/doctor.txt"
"$DIR/write-repro.sh" --out "$tmp/full.md" --target https://staging.thoven.co --reproduced partial --evidence "$ev"
grep -q 'fe sha: abc123' "$tmp/full.md"
grep -q 'be sha: def456' "$tmp/full.md"
grep -q 'Doctored https://staging.thoven.co' "$tmp/full.md"
echo "ok    doctor ran only when doctor.txt exists"

printf '{}\n' >"$ev/fe-version.json"
"$DIR/write-repro.sh" --out "$tmp/empty-sha.md" --target https://staging.thoven.co --reproduced no --evidence "$ev"
grep -q 'fe sha: unverified' "$tmp/empty-sha.md"
echo "ok    empty sha field prints unverified"

echo "all write-repro checks passed"
