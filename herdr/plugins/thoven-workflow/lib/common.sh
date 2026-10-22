# Shared helpers for thoven.workflow. Source from bash; verify/twlib.py mirrors the same files.
# State lives in HERDR_PLUGIN_STATE_DIR (falls back for manual runs).
TW_STATE="${HERDR_PLUGIN_STATE_DIR:-$HOME/.local/state/herdr/plugins/thoven.workflow}"
TW_HERDR="${HERDR_BIN_PATH:-herdr}"
TW_DISPATCH_HOME="${THOVEN_DISPATCH_HOME:-$HOME/.local/state/thoven/dispatch}"
mkdir -p "$TW_STATE" "$TW_STATE/dispatch/by-pane"

# Who hears about a pane (THV-1064): the pane that dispatched it, else its space's main, else its
# Project board. There is no global main; prefix+m marks the main of one space (main-pane.<workspace id>).
tw_key() { printf '%s' "$1" | tr ':' '_'; }
tw_pane_workspace() { "$TW_HERDR" pane get "$1" 2>/dev/null | jq -r '.result.pane.workspace_id // empty' 2>/dev/null; }
tw_space_main() { [ -n "${1:-}" ] && [ -s "$TW_STATE/main-pane.$1" ] && cat "$TW_STATE/main-pane.$1"; }
tw_dispatcher() {
  local f="$TW_STATE/dispatch/by-pane/$(tw_key "$1").json"
  [ -s "$f" ] && jq -r '.dispatcher // empty' "$f" 2>/dev/null
}
# tw_report_targets <pane> [<workspace>]: candidate panes, best first, one per line.
tw_report_targets() {
  local pane="${1:-}" ws="${2:-}"
  [ -n "$pane" ] && tw_dispatcher "$pane" || true
  [ -n "$ws" ] || { [ -n "$pane" ] && ws="$(tw_pane_workspace "$pane")"; }
  tw_space_main "$ws" || true
}

# tw_registration <pane>: the Registration file `dispatch spawn` wrote for a herdr pane (same key as
# dispatch_lib.store.pane_key), or nothing.
tw_registration() {
  local key f
  key="herdr-$(printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_')"
  for f in "$TW_DISPATCH_HOME"/*/panes/"$key.json"; do
    [ -s "$f" ] && { printf '%s\n' "$f"; return 0; }
  done
  return 1
}
# tw_dispatch_bin: `dispatch` from the checkout this plugin is linked from, else the installed skill.
tw_dispatch_bin() {
  local here f
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  for f in "${TW_DISPATCH_BIN:-}" "$here/../../../../skills/dev/dispatch-work/scripts/dispatch" \
    "$HOME/.agents/skills/dispatch-work/scripts/dispatch"; do
    [ -n "$f" ] && [ -x "$f" ] && { printf '%s\n' "$f"; return 0; }
  done
  return 1
}

# tw_tell_main <tag> <text> [<pane> [<workspace>]]: prompt the first reachable target, else post an
# ALERT to the pane's Project board when `dispatch spawn` registered it, and toast. TW_REPORT_TO,
# when set, is tried first (run.sh knows its dispatcher). verify/twlib.py tell_main is the twin.
tw_tell_main() {
  local tag="$1" text="$2" pane="${3:-}" ws="${4:-}" t reg bin project ticket entry=""
  for t in ${TW_REPORT_TO:-} $(tw_report_targets "$pane" "$ws"); do
    [ -n "$t" ] && [ "$t" != "$pane" ] || continue
    "$TW_HERDR" agent prompt "$t" "$text" >/dev/null 2>&1 && return 0
  done
  if [ -n "$pane" ] && reg="$(tw_registration "$pane")" && bin="$(tw_dispatch_bin)"; then
    project="$(jq -r '.project // empty' "$reg" 2>/dev/null)"
    ticket="$(jq -r '.ticket // empty' "$reg" 2>/dev/null)"
    [ -n "$project" ] && [ -n "$ticket" ] &&
      entry="$(printf '%s\n' "$text" | "$bin" post "$project" --ticket "$ticket" --kind alert --status ESCALATION \
        --from thoven.workflow 2>/dev/null)" || entry=""
  fi
  "$TW_HERDR" notification show "thoven: $tag: no one to report to" \
    --body "${entry:+Posted to the board: }${entry:-$text}" --sound request >/dev/null 2>&1
  [ -n "$entry" ]
}
