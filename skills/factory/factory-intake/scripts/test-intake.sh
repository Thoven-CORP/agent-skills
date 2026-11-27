#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/good.md" <<'EOF'
## Duplicate check
none

## Evidence
https://example.test/shot.png

## What the user saw
The request button stayed on after submit.

## Expected
The button disables and the request appears in the list.

## Steps
1. Open /parent on staging
2. Submit the existing draft request

## Severity
S2

## Found by
Sentry

## Repo
frontend

## Project
Factory

## Batch
Id: booking-request-stuck
Siblings: THV-1
Surface: parent booking
PR:

## Forbidden
none
EOF

"$DIR/check-intake.sh" --file "$tmp/good.md"
echo "ok    good intake"

cat >"$tmp/bad.md" <<'EOF'
## Duplicate check
none
## Evidence
none
## What the user saw
broken
## Expected
works
## Severity
S2
EOF

set +e
"$DIR/check-intake.sh" --file "$tmp/bad.md" >/dev/null
code=$?
set -e
[[ "$code" -ne 0 ]]
echo "ok    short intake fails"

cat >"$tmp/s2-prose.md" <<'EOF'
## Duplicate check
none
## Evidence
https://example.test/shot.png
## What the user saw
Saw an S2 banner.
## Expected
No banner.
## Steps
1. Open /parent
2. Submit
## Found by
Sentry
## Repo
frontend
## Project
Factory
## Batch
Id: x
## Forbidden
none
EOF
set +e
"$DIR/check-intake.sh" --file "$tmp/s2-prose.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -qE 'Severity|severity must be a field' "$tmp/err"
echo "ok    S2 in prose is not a Severity field"

cat >"$tmp/no-forbidden.md" <<'EOF'
## Duplicate check
none
## Evidence
https://example.test/shot.png
## What the user saw
broken
## Expected
works
## Steps
1. Open /parent
2. Submit
## Severity
S2
## Found by
Sentry
## Repo
frontend
## Project
Factory
## Batch
Id: x
EOF
set +e
"$DIR/check-intake.sh" --file "$tmp/no-forbidden.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'Forbidden' "$tmp/err"
echo "ok    Forbidden field is required"
