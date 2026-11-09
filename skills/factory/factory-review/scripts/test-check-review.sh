#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/postfix-only.md" <<'EOF'
## Guarantee
x
## Pre-fix
red
## Post-fix
green
## Findings
none
EOF
set +e
"$DIR/check-review.sh" --file "$tmp/postfix-only.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'Verdict' "$tmp/err"
echo "ok    Post-fix is not a Verdict"

cat >"$tmp/good.md" <<'EOF'
## Guarantee
x
## Pre-fix
red
## Post-fix
green
## Findings
none
## Verdict
fix
EOF
"$DIR/check-review.sh" --file "$tmp/good.md"
echo "ok    Verdict fix accepted"

cat >"$tmp/inline.md" <<'EOF'
## Guarantee
x
## Pre-fix
red
## Post-fix
green
## Findings
none
Verdict: ready
EOF
"$DIR/check-review.sh" --file "$tmp/inline.md"
echo "ok    Verdict: ready accepted"

echo "all check-review checks passed"
