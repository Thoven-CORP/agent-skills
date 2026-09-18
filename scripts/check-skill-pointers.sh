#!/usr/bin/env bash
# check-skill-pointers.sh — find dead file pointers named inside skills.
#
# A skill that names a file path is making a claim. This script extracts
# every path-shaped token from backticked spans and markdown links across a
# skills directory, tests whether each one resolves against a repo root (or
# its parent, or $HOME for ~/ paths, or as a glob for patterns), and prints
# one line per dead pointer.
#
# Usage:
#   check-skill-pointers.sh <skills-dir> <repo-root> [<repo-root-2> ...]
#
# A pointer counts as resolved if it resolves against ANY of the given repo
# roots (or their parents, or $HOME for ~/ paths). Exits 1 if any pointer is
# dead. Templated paths (containing <slug>-style placeholders) are reported
# separately and never counted as dead.

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <skills-dir> <repo-root> [<repo-root-2> ...]" >&2
  exit 2
fi

SKILLS_DIR="$1"
shift
REPO_ROOTS=("$@")

exec python3 "$(dirname "$0")/check-skill-pointers.py" "$SKILLS_DIR" "${REPO_ROOTS[@]}"
