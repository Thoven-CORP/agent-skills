#!/usr/bin/env bash
# Ctrl+click on a Linear THV link: park the ticket in a state file and open the picker popup.
# A popup gets no args and no pane id, so the state file is the only way to hand it data.
# Invoked from the action palette with no clicked URL, the picker asks for the ticket number.
set -euo pipefail
. "$(dirname "$0")/../lib/common.sh"

url="${HERDR_PLUGIN_CLICKED_URL:-${1:-}}"
pending="$TW_STATE/pending-dispatch.json"
rm -f "$pending"
# The pane you clicked in is the dispatcher (reports come back to it), and its space is where the
# new tab opens (THV-1064).
ctx="${HERDR_PLUGIN_CONTEXT_JSON:-}"
[ -n "$ctx" ] || ctx='{}'
dispatcher="${HERDR_PANE_ID:-$(jq -r '.focused_pane_id // empty' <<<"$ctx")}"
space="${HERDR_WORKSPACE_ID:-$(jq -r '.workspace_id // empty' <<<"$ctx")}"
[ -n "$space" ] || { [ -n "$dispatcher" ] && space="$(tw_pane_workspace "$dispatcher")"; }

if [[ "$url" =~ /issue/([Tt][Hh][Vv])-([0-9]+) ]]; then
  n="${BASH_REMATCH[2]}"
fi
python3 - "$pending" "${n:-}" "$url" "$dispatcher" "$space" <<'PY'
import json, sys, time
path, n, url, dispatcher, space = sys.argv[1:6]
d = {"url": url, "dispatcher": dispatcher, "workspace": space, "created_at": int(time.time())}
if n:
    d.update(ticket=f"THV-{n}", n=int(n))
with open(path, "w") as f:
    json.dump(d, f)
PY

"$TW_HERDR" plugin pane open --plugin "${HERDR_PLUGIN_ID:-thoven.workflow}" --entrypoint dispatch-picker >/dev/null
