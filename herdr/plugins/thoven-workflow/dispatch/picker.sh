#!/usr/bin/env bash
# Dispatch picker (popup). Reads the ticket link-click.sh parked in pending-dispatch.json, asks
# repo, CLI and branch area, confirms, then starts run.sh detached and exits so the popup closes.
# Esc, q or Ctrl+C at any prompt cancels.
#
# Non-interactive (tests, dry runs): set TW_DISPATCH_REPO, TW_DISPATCH_AREA, and either
# TW_DISPATCH_TIER or TW_DISPATCH_CLI + TW_DISPATCH_MODEL (+ TW_DISPATCH_EFFORT), and TW_DISPATCH_TICKET (digits) when no pending file exists.
# TW_DISPATCH_DRYRUN=1 runs run.sh in the foreground printing commands instead of running them.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/../lib/common.sh"

pending="$TW_STATE/pending-dispatch.json"
n="${TW_DISPATCH_TICKET:-}" url=""
dispatcher="${TW_DISPATCHER:-}" space="${TW_DISPATCH_WS:-}"
if [ -s "$pending" ]; then
  # Ignore a parked click older than 15 minutes: it belongs to a click that never opened a popup.
  IFS=$'\t' read -r pn url pd ps < <(python3 -c '
import json, sys, time
d = json.load(open(sys.argv[1]))
fresh = time.time() - d.get("created_at", 0) < 900
f = [str(d.get("n", "")), d.get("url", ""), d.get("dispatcher", ""), d.get("workspace", "")] if fresh else ["", "", "", ""]
print("\t".join(x or "-" for x in f))
' "$pending") || true
  rm -f "$pending"
  [ -n "$n" ] || { [ "${pn:--}" != - ] && n="$pn"; }
  [ "${url:--}" != - ] || url=""
  [ -n "$dispatcher" ] || { [ "${pd:--}" != - ] && dispatcher="$pd"; }
  [ -n "$space" ] || { [ "${ps:--}" != - ] && space="$ps"; }
fi
export TW_DISPATCHER="$dispatcher" TW_DISPATCH_WS="$space"

cancel() { printf '\n  Cancelled. Nothing was dispatched.\n'; sleep 1; exit 0; }
trap cancel INT

# ask <prompt> <default> <env override>: one line of input; Esc or q cancels.
ask() {
  local reply
  if [ -n "${3:-}" ]; then REPLY_VAL="$3"; return; fi
  read -r -p "$1" reply || cancel
  case "$reply" in *$'\e'* | q | Q) cancel ;; esac
  REPLY_VAL="${reply:-$2}"
}

[ -n "${TW_DISPATCH_REPO:-}" ] || clear 2>/dev/null || true
while ! [[ "$n" =~ ^[0-9]+$ ]]; do
  ask "  Ticket number, THV-" "" "${TW_DISPATCH_TICKET:-}"
  n="${REPLY_VAL#THV-}"
  [ -z "${TW_DISPATCH_TICKET:-}" ] || [[ "$n" =~ ^[0-9]+$ ]] || { echo "TW_DISPATCH_TICKET must be digits" >&2; exit 2; }
done
printf '  Dispatch THV-%s\n' "$n"
[ -n "$url" ] && printf '  %.58s\n' "$url"
echo

repo=""
while [ -z "$repo" ]; do
  ask "  Repo   1) fe  2) be  3) both            [1]: " 1 "${TW_DISPATCH_REPO:-}"
  case "$REPLY_VAL" in 1 | fe) repo=fe ;; 2 | be) repo=be ;; 3 | both) repo=both ;; *) [ -z "${TW_DISPATCH_REPO:-}" ] || exit 2 ;; esac
done

# Who runs it: a tier from agents.toml, or Custom (CLI, then model, then effort). Nothing here
# names a model; agents.py reads the config (THV-1077).
. "$HERE/../lib/agent-pick.sh"

cli="" model="" effort=""
if [ -n "${TW_DISPATCH_TIER:-}" ]; then
  IFS=$'\t' read -r cli model effort < <(ag resolve "$TW_DISPATCH_TIER") || exit 2
elif [ -n "${TW_DISPATCH_CLI:-}" ]; then
  cli="$TW_DISPATCH_CLI" model="${TW_DISPATCH_MODEL:?set TW_DISPATCH_MODEL with TW_DISPATCH_CLI}" effort="${TW_DISPATCH_EFFORT:-}"
else
  items="$(mktemp)"
  ag tiers | awk -F'\t' '{printf "tier:%s\tTier %s   %s\n", $1, $1, $5}' >"$items"
  printf 'custom\tCustom   pick CLI, then model, then effort\n' >>"$items"
  pick "Who runs THV-$n?" "$items"
  if [ "$PICK" = custom ]; then
    pick_custom
  else
    IFS=$'\t' read -r cli model effort < <(ag resolve "${PICK#tier:}")
  fi
fi

area=""
while [ -z "$area" ]; do
  ask "  Area   branch <area>/thv-$n         [work]: " work "${TW_DISPATCH_AREA:-}"
  if [[ "$REPLY_VAL" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    area="$REPLY_VAL"
  else
    echo "         lowercase letters, digits and hyphens only"
    [ -z "${TW_DISPATCH_AREA:-}" ] || exit 2
  fi
done

label="$(python3 "$HERE/compose.py" meta "$cli" "$model" "$effort" | cut -f2)" || exit 2
echo
printf '  %s on %s, branch %s/thv-%s\n' "$label" "$( [ "$repo" = both ] && echo 'fe and be' || echo "$repo")" "$area" "$n"

if [ "${TW_DISPATCH_DRYRUN:-0}" = 1 ]; then
  echo "  DRY RUN: printing the commands it would run"
  echo
  exec bash "$HERE/run.sh" "$n" "$repo" "$cli" "$model" "${effort:--}" "$area" "$url"
fi

if [ -z "${TW_DISPATCH_REPO:-}${TW_DISPATCH_TIER:-}${TW_DISPATCH_CLI:-}${TW_DISPATCH_AREA:-}" ]; then
  ask "  Dispatch? [Y/n] " y ""
  case "$REPLY_VAL" in y | Y | yes) ;; *) cancel ;; esac
fi

# Detached in its own session, so closing the popup cannot take the dispatch down with it.
mkdir -p "$TW_STATE/dispatch"
log="$TW_STATE/dispatch/THV-$n-$(date +%Y%m%d-%H%M%S).log"
python3 - "$log" bash "$HERE/run.sh" "$n" "$repo" "$cli" "$model" "${effort:--}" "$area" "$url" <<'PY'
import subprocess, sys
log = open(sys.argv[1], "ab")
subprocess.Popen(sys.argv[2:], stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
PY
printf '  Dispatching in the background. Log:\n  %.60s\n' "$log"
sleep 1
