# Sourced by the dispatch picker and the agents menu (THV-1077, THV-1078). The caller defines
# cancel() and sets HERE to its own directory. Nothing here names a model: agents.py reads
# config/agents.toml.
TW_PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS="$TW_PLUGIN/../../../skills/dev/dispatch-work/scripts/agents.py"
[ -f "$AGENTS" ] || AGENTS="$HOME/.agents/skills/dispatch-work/scripts/agents.py"
ag() { python3 "$AGENTS" "$@"; }

# pick <title> <items-file>: the arrow-key menu; the value lands in PICK, and Esc cancels.
pick() {
  local out; out="$(mktemp)"
  python3 "$TW_PLUGIN/dispatch/choose.py" "$1" "$2" "$out" </dev/tty >/dev/tty || { rm -f "$2" "$out"; cancel; }
  PICK="$(cat "$out")"; rm -f "$2" "$out"
}

# pick_custom: CLI, then model, then effort, all from lists. Sets cli, model and effort.
pick_custom() {
  local items
  items="$(mktemp)"
  ag clis | awk -F'\t' '{
    if ($2 == "ready") printf "%s\t%s\n", $1, $3
    else if ($2 == "unwired") printf "%s\t%s   installed in herdr; wire it from Ctrl+Space g\t0\n", $1, $1
    else printf "%s\t%s   not on PATH\t0\n", $1, $3 }' >"$items"
  pick "CLI" "$items"; cli="$PICK"
  echo "  loading $cli models..."
  items="$(mktemp)"
  ag models "$cli" | awk -F'\t' '{ print $1 "\t" $1 ($2 == $1 ? "" : "   " $2) }' >"$items"
  pick "$cli model" "$items"; model="$PICK"
  items="$(mktemp)"
  ag efforts "$cli" "$model" | awk -F'\t' '{ print $1 "\t" $1 "  " $2 }' >"$items"
  effort=""
  if [ "$(wc -l <"$items" | tr -d ' ')" -gt 1 ]; then
    pick "$model effort (1 is the lowest)" "$items"; effort="$PICK"
  else
    # One level (Droid's auto: none) or none at all: nothing to choose.
    [ -s "$items" ] && effort=1
    rm -f "$items"
  fi
}
