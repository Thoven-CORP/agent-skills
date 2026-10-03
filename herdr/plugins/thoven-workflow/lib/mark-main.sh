#!/usr/bin/env bash
# Mark the invoking pane as the main of its own space (THV-1064). Panes in this space that were not
# click-dispatched report here; click-dispatched panes report to their dispatcher first.
set -euo pipefail
. "$(dirname "$0")/common.sh"
ctx="${HERDR_PLUGIN_CONTEXT_JSON:-}"
[ -n "$ctx" ] || ctx='{}'
pane="${HERDR_PANE_ID:-$(jq -r '.focused_pane_id // empty' <<<"$ctx")}"
[ -n "$pane" ] || { echo "no pane in context" >&2; exit 1; }
ws="${HERDR_WORKSPACE_ID:-$(jq -r '.workspace_id // empty' <<<"$ctx")}"
[ -n "$ws" ] || ws="$(tw_pane_workspace "$pane")"
[ -n "$ws" ] || { echo "could not read the space of $pane" >&2; exit 1; }
label="$("$TW_HERDR" workspace get "$ws" 2>/dev/null | jq -r '.result.workspace.label // empty' 2>/dev/null)"
printf '%s\n' "$pane" > "$TW_STATE/main-pane.$ws"
"$TW_HERDR" notification show "Main set for ${label:-$ws}" --body "$pane receives this space's reports and escalations" >/dev/null
echo "main of ${label:-$ws} ($ws): $pane"
