#!/usr/bin/env bash
# Behaviour test for watch.sh and send.sh against a fake herdr. Run: bash watch-test.sh
set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
root=$(mktemp -d)
trap 'pkill -f "$root" 2>/dev/null; rm -rf "$root"' EXIT
export TMPDIR="$root/tmp" HERDR_BIN="$root/herdr" WATCH_INTERVAL=1 HERDR_PANE_ID=w1:p1
mkdir -p "$TMPDIR" "$root/panes"
fails=0
limit() { # seconds, command...: run it, kill it after the limit
  local t=$1; shift
  "$@" & local pid=$!
  ( sleep "$t"; kill "$pid" 2>/dev/null ) & local guard=$!
  wait "$pid" 2>/dev/null; local rc=$?
  kill "$guard" 2>/dev/null; wait "$guard" 2>/dev/null
  return $rc
}

cat >"$HERDR_BIN" <<'EOF'
#!/usr/bin/env bash
d="$(dirname "$0")/panes"
case "$1 $2" in
  "agent get")
    if [[ -f "$d/$3.status" ]]; then printf '{"result":{"agent":{"agent_status":"%s"}}}\n' "$(cat "$d/$3.status")"
    else echo '{"error":{"code":"agent_not_found"}}'; fi ;;
  "agent read") cat "$d/$3.screen" 2>/dev/null ;;
  "agent prompt") echo "$4" >"$d/$3.prompt"
    [[ -f "$d/$3.stall" ]] && { echo "agent_prompt_stalled" >&2; exit 1; }
    echo working >"$d/$3.status" ;;
  "agent send-keys") echo "$4" >>"$d/$3.keys"; rm -f "$d/$3.stall"; echo working >"$d/$3.status" ;;
  "agent wait") [[ "$(cat "$d/$3.status")" == working ]] ;;
esac
EOF
chmod +x "$HERDR_BIN"

pane() { echo "$2" >"$root/panes/$1.status"; printf '%s\n' "$3" >"$root/panes/$1.screen"; }
expect() { # name, expected first-line prefix, timeout seconds, watch args...
  local name=$1 want=$2 t=$3; shift 3
  local out; out=$(limit "$t" "$here/watch.sh" "$@" 2>&1 | head -1)
  if [[ -z "$want" && -z "$out" ]] || [[ -n "$want" && "$out" == "$want"* ]]; then echo "ok   $name"; else echo "FAIL $name: got '${out:-<no exit>}', want '$want'"; fails=$((fails + 1)); fi
}

pane a working "building"
( sleep 2; pane a done "DONE THV-1" ) &
expect "a pane that finishes is SETTLED" "== a SETTLED" 6 a

pane b working "running tests"
( for n in 1 2 3 4 5 6; do sleep 1; printf '✽ Doodling… (%dm %ds · ↓ %d.3k tokens)\nrunning tests\n' $n $n $n >"$root/panes/b.screen"; done ) &
FREEZE_SEC=3 expect "a ticking turn timer alone is FROZEN" "== b FROZEN" 8 b

pane c working "step 0"
( for n in 1 2 3 4 5 6 7; do sleep 1; echo "step $(printf '%*s' $n | tr ' ' x)" >"$root/panes/c.screen"; done ) &
FREEZE_SEC=3 expect "a pane printing new output is not FROZEN" "" 5 c

pane d working "stuck"
FREEZE_SEC=5 limit 2 "$here/watch.sh" d >/dev/null 2>&1
FREEZE_SEC=5 expect "a re-arm keeps the freeze clock of a killed watcher" "== d FROZEN" 5 d
FREEZE_SEC=5 expect "a re-arm after FROZEN starts a fresh clock" "" 3 d

pane e working "e"
"$here/watch.sh" e >/dev/null 2>&1 & first=$!
sleep 1
"$here/watch.sh" e >/dev/null 2>&1 & second=$!
sleep 2
if kill -0 "$first" 2>/dev/null; then echo "FAIL a re-arm stops the older watcher"; fails=$((fails + 1)); else echo "ok   a re-arm stops the older watcher"; fi
kill "$second" 2>/dev/null

rm -f "$root/panes/g.status"; echo x >"$root/panes/g.screen"
expect "a pane with no agent is GONE" "== g GONE" 3 g
pane h blocked "Allow?"
expect "a dialog is BLOCKED" "== h BLOCKED" 3 h

printf 'Build THV-2 for {{MAIN_PANE}}\n' >"$root/brief.md"
pane s idle ""; touch "$root/panes/s.stall"
if "$here/send.sh" s "$root/brief.md" | grep -q '^sent' && grep -q Enter "$root/panes/s.keys"; then
  echo "ok   send.sh presses Enter once when the prompt sits unsubmitted"
else echo "FAIL send.sh presses Enter once when the prompt sits unsubmitted"; fails=$((fails + 1)); fi

echo "$fails failed"
exit $((fails > 0))
