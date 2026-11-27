#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/go-anywhere.md" <<'EOF'
## Guarantee
we should go now
## Batch
THV-1
## Forbidden
none
EOF
set +e
"$DIR/check-card.sh" --file "$tmp/go-anywhere.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -qE 'Decision|missing required heading: Decision' "$tmp/err"
echo "ok    go anywhere is not a Decision"

cat >"$tmp/good.md" <<'EOF'
## Decision
go
## Guarantee
button disables
## Batch
THV-1
## Forbidden
none
EOF
"$DIR/check-card.sh" --file "$tmp/good.md"
echo "ok    Decision go accepted"

cat >"$tmp/inline.md" <<'EOF'
Decision: bounce
## Guarantee
x
## Batch
y
## Forbidden
none
EOF
"$DIR/check-card.sh" --file "$tmp/inline.md"
echo "ok    Decision: bounce accepted"

echo "all check-card checks passed"
