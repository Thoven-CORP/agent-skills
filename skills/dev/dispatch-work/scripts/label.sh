#!/usr/bin/env bash
# Label a herdr pane (and optionally its tab) as "<Kind> · <title> (THV-n)".
# The cockpit mod and the herdr sidebar sort work by Kind, so an unknown Kind is refused here.
#   label.sh <pane> <Kind> "<title>" [THV-n] [--tab]
#   label.sh --kinds
set -euo pipefail

herdr="${HERDR_BIN:-$HOME/.local/bin/herdr}"
KINDS=(Meta Plan Design Build Review Research Audit Fix)

usage() { echo 'usage: label.sh <pane> <Kind> "<title>" [THV-n] [--tab] | label.sh --kinds' >&2; exit 2; }

[[ ${1:-} == --kinds ]] && { printf '%s\n' "${KINDS[@]}"; exit 0; }

tab=0 args=()
for a in "$@"; do [[ $a == --tab ]] && tab=1 || args+=("$a"); done
set -- "${args[@]+"${args[@]}"}"
[[ $# -ge 3 && $# -le 4 ]] || usage
pane=$1 kind=$2 title=$3 ticket=${4:-}

[[ " ${KINDS[*]} " == *" $kind "* ]] || { echo "unknown kind '$kind'. Use one of: ${KINDS[*]}" >&2; exit 2; }
[[ -n "${title// }" ]] || { echo "title is empty" >&2; exit 2; }
if [[ -n $ticket ]]; then
  [[ $ticket =~ ^THV-[0-9]+$ ]] || { echo "ticket must look like THV-123, got '$ticket'" >&2; exit 2; }
  label="$kind · $title ($ticket)"
else
  label="$kind · $title"
fi

"$herdr" pane rename "$pane" "$label" >/dev/null
if (( tab )); then
  tab_id=$("$herdr" pane get "$pane" | jq -r '.result.pane.tab_id // empty')
  [[ -n $tab_id ]] || { echo "could not read the tab of pane $pane" >&2; exit 1; }
  "$herdr" tab rename "$tab_id" "$label" >/dev/null
fi
echo "$label"
