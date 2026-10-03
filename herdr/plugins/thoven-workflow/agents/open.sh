#!/usr/bin/env bash
# Ctrl+Space g: park the pane and space you pressed it in, then open the agents menu popup. A popup
# gets no pane id, so the state file hands it over (the same pattern as dispatch/link-click.sh).
set -euo pipefail
. "$(dirname "$0")/../lib/common.sh"
ctx="${HERDR_PLUGIN_CONTEXT_JSON:-}"
[ -n "$ctx" ] || ctx='{}'
pane="${HERDR_PANE_ID:-$(jq -r '.focused_pane_id // empty' <<<"$ctx")}"
space="${HERDR_WORKSPACE_ID:-$(jq -r '.workspace_id // empty' <<<"$ctx")}"
[ -n "$space" ] || { [ -n "$pane" ] && space="$(tw_pane_workspace "$pane")"; }
jq -nc --arg p "$pane" --arg w "$space" '{pane:$p,workspace:$w,created_at:(now|floor)}' >"$TW_STATE/pending-agents.json"
"$TW_HERDR" plugin pane open --plugin "${HERDR_PLUGIN_ID:-thoven.workflow}" --entrypoint agents-menu >/dev/null
