#!/usr/bin/env bash
# Ctrl+click on a Linear THV link: park the ticket in a state file and open the picker popup.
# A popup gets no args and no pane id, so the state file is the only way to hand it data.
# Invoked from the action palette with no clicked URL, the picker asks for the ticket number.
set -euo pipefail
. "$(dirname "$0")/../lib/common.sh"

url="${HERDR_PLUGIN_CLICKED_URL:-${1:-}}"
pending="$TW_STATE/pending-dispatch.json"
rm -f "$pending"

if [[ "$url" =~ /issue/([Tt][Hh][Vv])-([0-9]+) ]]; then
  n="${BASH_REMATCH[2]}"
  python3 - "$pending" "$n" "$url" <<'PY'
import json, sys, time
path, n, url = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, "w") as f:
    json.dump({"ticket": f"THV-{n}", "n": int(n), "url": url, "created_at": int(time.time())}, f)
PY
fi

"$TW_HERDR" plugin pane open --plugin "${HERDR_PLUGIN_ID:-thoven.workflow}" --entrypoint dispatch-picker >/dev/null
