#!/usr/bin/env bash
# Send a brief file to a pane as one prompt, and confirm the pane started working.
# Fills {{MAIN_PANE}} with the caller's pane id so the pane knows where to report.
# The text travels from the file, so backticks and $(...) in it are never run here.
set -euo pipefail

herdr="${HERDR_BIN:-$HOME/.local/bin/herdr}"
[[ $# -eq 2 ]] || { echo "usage: send.sh <pane-or-agent> <brief-file>" >&2; exit 2; }
target=$1 brief=$2
main="${HERDR_PANE_ID:?HERDR_PANE_ID is unset. Run send.sh from main pane inside herdr.}"
[[ -s "$brief" ]] || { echo "brief is missing or empty: $brief" >&2; exit 2; }

text=$(sed "s/{{MAIN_PANE}}/$main/g" "$brief")
if grep -q '{{' <<<"$text"; then
  echo "unfilled {{...}} placeholder in $brief:" >&2
  grep -n '{{' <<<"$text" >&2
  exit 2
fi
if grep -qE '<[a-z][^<>]*>' <<<"$text"; then
  echo "unfilled <...> field in $brief:" >&2
  grep -nE '<[a-z][^<>]*>' <<<"$text" >&2
  exit 2
fi

"$herdr" agent prompt "$target" "$text" --wait --until working --until blocked --timeout 60000
echo "sent $(wc -c <"$brief" | tr -d ' ') bytes to $target, reply address $main"
