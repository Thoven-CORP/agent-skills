#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/good.md" <<'EOF'
## Sentry
org: thoven-gy
issue: 123

## Issue
button stuck

## Sha
fe: aaa
be: bbb

## Prod version
RESULT: PASS

## Approval
Andres approved resolve on 2026-10-21

## Claim lock
factory-claim-lock:bot-a
assign-if-unassigned: bot-a
EOF
"$DIR/check-claim.sh" --file "$tmp/good.md"
echo "ok    complete claim passes"

cat >"$tmp/no-prod.md" <<'EOF'
## Sentry
org: thoven-gy
issue: 123
## Issue
x
## Sha
fe: a
## Prod version
RESULT: MISMATCH
## Approval
Andres approved resolve
## Claim lock
factory-claim-lock:bot-a
EOF
set +e
"$DIR/check-claim.sh" --file "$tmp/no-prod.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'prod version-read RESULT: PASS' "$tmp/err"
echo "ok    resolve blocked without prod PASS"

cat >"$tmp/no-andres.md" <<'EOF'
## Sentry
org: thoven-gy
issue: 123
## Issue
x
## Sha
fe: a
## Prod version
RESULT: PASS
## Approval
bot self-approved
## Claim lock
factory-claim-lock:bot-a
EOF
set +e
"$DIR/check-claim.sh" --file "$tmp/no-andres.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q "Andres" "$tmp/err"
echo "ok    resolve blocked without Andres approval"

echo "all check-claim checks passed"
