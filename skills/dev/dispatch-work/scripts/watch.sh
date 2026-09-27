#!/usr/bin/env bash
# Watch dispatched panes and exit on the first thing main must look at.
# Prints "== <pane> <REASON> status=<status>" and the pane's last lines.
#   SETTLED    idle or done, and the screen changed since arming: look for its status line
#   BLOCKED    an approval or question dialog is open
#   GONE       no agent in the pane any more
#   FROZEN     working or unknown, screen unchanged for FREEZE_MIN minutes
#   HEARTBEAT  BEAT_MIN minutes passed quietly: post a status line, then re-arm
# Run it in the background; its exit is what wakes main.
set -uo pipefail

herdr="${HERDR_BIN:-$HOME/.local/bin/herdr}"
interval="${WATCH_INTERVAL:-60}"
freeze_min="${FREEZE_MIN:-10}"
beat_min="${BEAT_MIN:-9}"
[[ $# -ge 1 ]] || { echo "usage: watch.sh <pane> [<pane>...]" >&2; exit 2; }

state="${TMPDIR:-/tmp}/dispatch/watch.$$"
mkdir -p "$state"
trap 'rm -rf "$state"' EXIT

key() { tr ':' '_' <<<"$1"; }
status_of() {
  local out
  out=$("$herdr" agent get "$1" 2>&1 | jq -r '.result.agent.agent_status // .error.code // empty' 2>/dev/null)
  echo "${out:-gone}"
}
screen_hash() { "$herdr" agent read "$1" --source recent-unwrapped --lines 40 2>/dev/null | md5; }
report() {
  echo "== $1 $2 status=$3"
  "$herdr" agent read "$1" --source recent-unwrapped --lines 30 2>/dev/null | grep -v '^[[:space:]]*$' | tail -25
  exit 0
}

now() { date +%s; }
start=$(now)
for p in "$@"; do
  k=$(key "$p")
  screen_hash "$p" >"$state/$k.armed"
  cp "$state/$k.armed" "$state/$k.last"
  now >"$state/$k.changed"
done

while true; do
  for p in "$@"; do
    k=$(key "$p")
    st=$(status_of "$p")
    case "$st" in
      agent_not_found|gone) report "$p" GONE "$st" ;;
      blocked) report "$p" BLOCKED "$st" ;;
    esac
    h=$(screen_hash "$p")
    if [[ "$h" != "$(cat "$state/$k.last")" ]]; then
      echo "$h" >"$state/$k.last"
      now >"$state/$k.changed"
    fi
    case "$st" in
      idle|done)
        [[ "$h" != "$(cat "$state/$k.armed")" ]] && report "$p" SETTLED "$st" ;;
      *)
        (( $(now) - $(cat "$state/$k.changed") >= freeze_min * 60 )) && report "$p" FROZEN "$st" ;;
    esac
  done
  if (( $(now) - start >= beat_min * 60 )); then
    echo "== HEARTBEAT after ${beat_min}m"
    for p in "$@"; do echo "$p status=$(status_of "$p")"; done
    exit 0
  fi
  sleep "$interval"
done
