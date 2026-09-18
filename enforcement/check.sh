#!/usr/bin/env bash
# Thin wrapper. Runs the predicate suite that lives with the rest of the scripts.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/../scripts/check-enforcement.sh" "$@"
