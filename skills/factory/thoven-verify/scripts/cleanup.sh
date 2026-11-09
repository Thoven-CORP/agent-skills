#!/usr/bin/env bash
# Tear down scratch this run created. Never delete the evidence dir.
set -euo pipefail

run_id="${THOVEN_VERIFY_RUN_ID:-}"
scratch_root="${THOVEN_VERIFY_SCRATCH:-${TMPDIR:-/tmp}/thoven-verify-scratch}"

if [[ -n "$run_id" && -d "$scratch_root/$run_id" ]]; then
  rm -rf "$scratch_root/$run_id"
  echo "removed scratch $scratch_root/$run_id"
else
  echo "no run-owned scratch to remove"
fi

if [[ -n "${THOVEN_VERIFY_EVIDENCE_DIR:-}" && -d "$THOVEN_VERIFY_EVIDENCE_DIR" ]]; then
  echo "kept evidence $THOVEN_VERIFY_EVIDENCE_DIR"
else
  echo "no evidence dir set; nothing to keep or delete"
fi
