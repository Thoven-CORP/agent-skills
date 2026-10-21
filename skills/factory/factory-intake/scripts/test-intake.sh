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
