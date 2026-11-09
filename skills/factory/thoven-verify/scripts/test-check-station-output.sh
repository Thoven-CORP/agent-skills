#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
check="$DIR/check-station-output.sh"

cat >"$tmp/heading.md" <<'EOF'
## Guarantee
button disables

## Pre-fix
red

## Post-fix
green

## Findings
none

## Verdict
ready
EOF
"$check" --kind review --file "$tmp/heading.md"
echo "ok    headings pass"

cat >"$tmp/substr.md" <<'EOF'
The Post-fix notes mention a Guarantee in passing and some Findings.
This is not a heading for Verdict either.
EOF
set +e
"$check" --kind review --file "$tmp/substr.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'missing required heading: Guarantee' "$tmp/err"
echo "ok    substring is not a heading"

cat >"$tmp/intake-field.md" <<'EOF'
See Forbidden notes in passing and a Severity rumor.
EOF
set +e
"$check" --kind intake --file "$tmp/intake-field.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'missing required heading: Forbidden' "$tmp/err"
grep -q 'missing required heading: Severity' "$tmp/err"
echo "ok    Forbidden and Severity are headings"

echo "all check-station-output checks passed"
