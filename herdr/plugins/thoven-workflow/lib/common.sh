# Shared helpers for thoven.workflow. Source from bash; verify/twlib.py mirrors the same files.
# State lives in HERDR_PLUGIN_STATE_DIR (falls back for manual runs).
TW_STATE="${HERDR_PLUGIN_STATE_DIR:-$HOME/.local/state/herdr/plugins/thoven.workflow}"
TW_HERDR="${HERDR_BIN_PATH:-herdr}"
TW_INBOX="${TMPDIR:-/tmp}/dispatch/out"
mkdir -p "$TW_STATE" "$TW_INBOX" "$TW_STATE/dispatch/by-pane"

# Who hears about a pane (THV-1064): the pane that dispatched it, else its space's main, else the
# inbox. There is no global main; prefix+m marks the main of one space (main-pane.<workspace id>).
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

# tw_tell_main <tag> <text> [<pane> [<workspace>]]: prompt the first reachable target, or drop the
# text in the inbox and toast. TW_REPORT_TO, when set, is tried first (run.sh knows its dispatcher).
tw_tell_main() {
  local tag="$1" text="$2" pane="${3:-}" ws="${4:-}" t
  for t in ${TW_REPORT_TO:-} $(tw_report_targets "$pane" "$ws"); do
    [ -n "$t" ] && [ "$t" != "$pane" ] || continue
    "$TW_HERDR" agent prompt "$t" "$text" >/dev/null 2>&1 && return 0
  done
  printf '%s\n' "$text" > "$TW_INBOX/$tag.md"
  "$TW_HERDR" notification show "thoven: no one to report to" --body "Saved to $TW_INBOX/$tag.md" --sound request >/dev/null 2>&1
}
