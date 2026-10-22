#!/usr/bin/env bash
# Send a brief file to a pane as one prompt, and confirm the pane started working.
# Fills {{MAIN_PANE}} with the caller's pane id so the pane knows where to report.
# The text travels from the file, so backticks and $(...) in it are never run here.
set -euo pipefail

herdr="${HERDR_BIN:-$HOME/.local/bin/herdr}"
[[ $# -eq 2 ]] || { echo "usage: send.sh <pane-or-agent> <brief-file>" >&2; exit 2; }
target=$1 brief=$2
main="${HERDR_PANE_ID:?HERDR_PANE_ID is unset. Run send.sh from main pane inside herdr.}"
[[ -s "$brief" ]] || { echo "brief is missing or empty: $brief" >&2; exit 2; }

text=$(sed "s/{{MAIN_PANE}}/$main/g" "$brief")
if grep -q '{{' <<<"$text"; then
  echo "unfilled {{...}} placeholder in $brief:" >&2
  grep -n '{{' <<<"$text" >&2
  exit 2
fi
if grep -qE '<[a-z][^<>]*>' <<<"$text"; then
  echo "unfilled <...> field in $brief:" >&2
  grep -nE '<[a-z][^<>]*>' <<<"$text" >&2
  exit 2
fi

# Preflight: a pane that is not at its input box swallows the prompt (a Codex update prompt, a
# trust dialog, an agent that exited and left a shell). Only idle and done take a brief.
status=$("$herdr" agent get "$target" 2>&1 | jq -r '.result.agent.agent_status // .error.code // "unknown"' 2>/dev/null || true)
status=${status:-unknown}
case "$status" in
  idle|done) ;;
  *)
    echo "refusing to send: $target is '$status', not idle or done. Its screen:" >&2
    "$herdr" agent read "$target" --source recent-unwrapped --lines 20 2>/dev/null | grep -v '^[[:space:]]*$' | tail -15 >&2 || true
    echo "Clear the dialog or restart the agent, then send again." >&2
    exit 3
    ;;
esac

# A prompt can land in the input box without being submitted (agent_prompt_stalled): press Enter once.
if ! "$herdr" agent prompt "$target" "$text" --wait --until working --until blocked --timeout 60000; then
  "$herdr" agent send-keys "$target" Enter
  "$herdr" agent wait "$target" --until working --until blocked --timeout 30000
fi
echo "sent $(wc -c <"$brief" | tr -d ' ') bytes to $target, reply address $main"
