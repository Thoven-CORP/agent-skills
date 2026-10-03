#!/usr/bin/env bash
# Store the invoking pane as the orchestrator that receives reports and escalations.
set -euo pipefail
. "$(dirname "$0")/common.sh"
pane="${HERDR_PANE_ID:-$(python3 -c 'import json,os;print(json.loads(os.environ.get("HERDR_PLUGIN_CONTEXT_JSON","{}")).get("focused_pane_id",""))')}"
[ -n "$pane" ] || { echo "no pane in context" >&2; exit 1; }
printf '%s\n' "$pane" > "$TW_STATE/main-pane"
"$TW_HERDR" notification show "Main pane set" --body "$pane receives reports and escalations" >/dev/null
echo "main pane: $pane"
