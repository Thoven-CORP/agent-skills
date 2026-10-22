#!/usr/bin/env bash
# Watch dispatched panes and exit on the first thing main must look at.
# Prints "== <pane> <REASON> status=<status>" and the pane's last lines.
#   SETTLED  idle or done, and the screen changed since arming: look for its status line
#   BLOCKED  an approval or question dialog is open
#   GONE     no agent in the pane any more
#   FROZEN   working or unknown, screen unchanged for FREEZE_MIN minutes
# Run it in the background; its exit is what wakes main. It never exits on a quiet pane.
# Re-arming is safe: it stops any older watcher on the same panes and keeps each pane's
# freeze clock, so a watcher the harness killed loses no time.
set -uo pipefail

herdr="${HERDR_BIN:-$HOME/.local/bin/herdr}"
interval="${WATCH_INTERVAL:-60}"
freeze_sec="${FREEZE_SEC:-$(( ${FREEZE_MIN:-10} * 60 ))}"
[[ $# -ge 1 ]] || { echo "usage: watch.sh <pane> [<pane>...]" >&2; exit 2; }

state="${TMPDIR:-/tmp}/dispatch/watch"
mkdir -p "$state"

key() { tr ':' '_' <<<"$1"; }
now() { date +%s; }
status_of() {
  local out
  out=$("$herdr" agent get "$1" 2>&1 | jq -r '.result.agent.agent_status // .error.code // empty' 2>/dev/null)
  echo "${out:-gone}"
}
# The agent's own turn timer ("✽ Doodling… (4m 8s · ↓ 16.3k tokens)") changes while a pane is
# stuck, so the hash drops that line and every digit.
screen_hash() {
  "$herdr" agent read "$1" --source recent-unwrapped --lines 40 2>/dev/null |
    sed -E '/…[[:space:]]*\(/d' | tr -d '0-9' | md5
}
report() {
  echo "== $1 $2 status=$3"
  "$herdr" agent read "$1" --source recent-unwrapped --lines 30 2>/dev/null | grep -v '^[[:space:]]*$' | tail -25
  exit 0
}

declare -a armed=()
i=0
for p in "$@"; do
  k=$(key "$p")
  old=$(cat "$state/$k.pid" 2>/dev/null || true)
  if [[ -n "$old" && "$old" != $$ ]] && ps -o command= -p "$old" 2>/dev/null | grep -q 'watch\.sh'; then
    kill "$old" 2>/dev/null || true
  fi
  echo $$ >"$state/$k.pid"
  h=$(screen_hash "$p")
  armed[i]=$h
  if [[ -f "$state/$k.frozen" || "$h" != "$(cat "$state/$k.last" 2>/dev/null)" ]]; then
    echo "$h" >"$state/$k.last"
    now >"$state/$k.changed"
    rm -f "$state/$k.frozen"
  fi
  i=$((i + 1))
done

while true; do
  i=0
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
        [[ "$h" != "${armed[i]}" ]] && report "$p" SETTLED "$st" ;;
      *)
        if (( $(now) - $(cat "$state/$k.changed") >= freeze_sec )); then
          touch "$state/$k.frozen"
          report "$p" FROZEN "$st"
        fi ;;
    esac
    i=$((i + 1))
  done
  sleep "$interval"
done
