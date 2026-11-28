#!/usr/bin/env bash
# Runs the always-loaded word budget, then the predicate suite that lives with the rest of the scripts.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/bin/doc-budget-test" >/dev/null || { echo "FAIL  doc-budget-test"; exit 1; }
"$DIR/bin/doc-budget"; budget=$?
"$DIR/../scripts/check-enforcement.sh" "$@"; suite=$?
[ "$budget" -eq 0 ] && [ "$suite" -eq 0 ]
