# Shared helpers for thoven.workflow. Source from bash; python modules read the same files.
# State lives in HERDR_PLUGIN_STATE_DIR (falls back for manual runs).
TW_STATE="${HERDR_PLUGIN_STATE_DIR:-$HOME/.local/state/herdr/plugins/thoven.workflow}"
TW_HERDR="${HERDR_BIN_PATH:-herdr}"
TW_INBOX="${TMPDIR:-/tmp}/dispatch/out"
mkdir -p "$TW_STATE" "$TW_INBOX"

tw_main_pane() { [ -s "$TW_STATE/main-pane" ] && cat "$TW_STATE/main-pane"; }

# tw_tell_main <ticket-or-tag> <text>: prompt main, or drop the text in the inbox and toast.
tw_tell_main() {
  local tag="$1" text="$2" main
  main="$(tw_main_pane || true)"
  if [ -n "$main" ] && "$TW_HERDR" agent prompt "$main" "$text" >/dev/null 2>&1; then
    return 0
  fi
  printf '%s\n' "$text" > "$TW_INBOX/$tag.md"
  "$TW_HERDR" notification show "thoven: main unreachable" --body "Report saved to $TW_INBOX/$tag.md" --sound request >/dev/null 2>&1
}
