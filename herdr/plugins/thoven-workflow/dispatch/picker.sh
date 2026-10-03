#!/usr/bin/env bash
# Dispatch picker (popup). Reads the ticket link-click.sh parked in pending-dispatch.json, asks
# repo, CLI and branch area, confirms, then starts run.sh detached and exits so the popup closes.
# Esc, q or Ctrl+C at any prompt cancels.
#
# Non-interactive (tests, dry runs): set all of TW_DISPATCH_REPO, TW_DISPATCH_CLI,
# TW_DISPATCH_AREA, and TW_DISPATCH_TICKET (digits) when no pending file exists.
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

echo "  CLI    1) Claude Opus 5.5 high"
echo "         2) Codex gpt-6-sol high"
echo "         3) Devin swe-2-high"
cli=""
while [ -z "$cli" ]; do
  ask "                                          [1]: " 1 "${TW_DISPATCH_CLI:-}"
  case "$REPLY_VAL" in 1 | claude) cli=claude ;; 2 | codex) cli=codex ;; 3 | devin) cli=devin ;; *) [ -z "${TW_DISPATCH_CLI:-}" ] || exit 2 ;; esac
done

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

label="$(python3 "$HERE/compose.py" meta "$cli" | cut -f2)"
echo
printf '  %s on %s, branch %s/thv-%s\n' "$label" "$( [ "$repo" = both ] && echo 'fe and be' || echo "$repo")" "$area" "$n"

if [ "${TW_DISPATCH_DRYRUN:-0}" = 1 ]; then
  echo "  DRY RUN: printing the commands it would run"
  echo
  exec bash "$HERE/run.sh" "$n" "$repo" "$cli" "$area" "$url"
fi

if [ -z "${TW_DISPATCH_REPO:-}${TW_DISPATCH_CLI:-}${TW_DISPATCH_AREA:-}" ]; then
  ask "  Dispatch? [Y/n] " y ""
  case "$REPLY_VAL" in y | Y | yes) ;; *) cancel ;; esac
fi

# Detached in its own session, so closing the popup cannot take the dispatch down with it.
mkdir -p "$TW_STATE/dispatch"
log="$TW_STATE/dispatch/THV-$n-$(date +%Y%m%d-%H%M%S).log"
python3 - "$log" bash "$HERE/run.sh" "$n" "$repo" "$cli" "$area" "$url" <<'PY'
import subprocess, sys
log = open(sys.argv[1], "ab")
subprocess.Popen(sys.argv[2:], stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
PY
printf '  Dispatching in the background. Log:\n  %.60s\n' "$log"
sleep 1
