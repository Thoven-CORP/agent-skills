#!/usr/bin/env bash
# Create a durable evidence directory. Cleanup must not delete it.
set -euo pipefail

root="${THOVEN_VERIFY_EVIDENCE_ROOT:-$HOME/.local/state/thoven-verify/evidence}"
run_id="${THOVEN_VERIFY_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
dir="$root/$run_id"
mkdir -p "$dir"
printf '%s\n' "$run_id" >"$dir/run-id.txt"
printf '%s\n' "$dir"
