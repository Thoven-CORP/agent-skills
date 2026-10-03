#!/usr/bin/env bash
# Agents menu (popup, Ctrl+Space g): set what a tier runs, wire a CLI herdr has but agents.toml
# lacks, or check the tiers against what the CLIs offer today (THV-1078). Every change goes through
# publish.sh, so agents.toml stays versioned and the local checkout stays clean.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/../lib/common.sh"
cancel() { printf '\n  Cancelled. Nothing changed.\n'; sleep 1; exit 0; }
trap cancel INT
. "$HERE/../lib/agent-pick.sh"

pending="$TW_STATE/pending-agents.json"
from_pane="" space=""
if [ -s "$pending" ]; then
  from_pane="$(jq -r '.pane // empty' "$pending")"
  space="$(jq -r '.workspace // empty' "$pending")"
  rm -f "$pending"
fi

pause() { printf '\n  Press any key to close.'; read -r -n 1 -s _ </dev/tty || true; }

items="$(mktemp)"
printf 'tier\tSet a tier     change what tier 1-4 runs\n' >"$items"
printf 'cli\tAdd a CLI      wire one herdr has installed but agents.toml lacks\n' >>"$items"
printf 'check\tCheck          the tiers against what the CLIs offer today\n' >>"$items"
pick "Agents" "$items"

case "$PICK" in
  tier)
    items="$(mktemp)"
    ag tiers | awk -F'\t' '{printf "%s\tTier %s   %s\n", $1, $1, $5}' >"$items"
    pick "Which tier?" "$items"
    n="$PICK"
    pick_custom
    label="$(ag meta "$cli" "$model" "$effort" | cut -f2 | tr -s ' ')"
    clear
    printf '\n  Tier %s will run: %s\n\n' "$n" "$label"
    read -r -p "  Publish it? [Y/n] " yn </dev/tty || cancel
    case "${yn:-y}" in y | Y | yes) ;; *) cancel ;; esac
    echo
    bash "$HERE/publish.sh" "Tier $n runs $label" set-tier "$n" "$cli" "$model" ${effort:+"$effort"} 2>&1 | sed 's/^/  /'
    pause
    ;;
  cli)
    items="$(mktemp)"
    ag clis | awk -F'\t' '$2 == "unwired" {printf "%s\t%s\n", $1, $1}' >"$items"
    if [ ! -s "$items" ]; then
      rm -f "$items"
      printf '\n  Every CLI herdr has installed is already in agents.toml.\n'
      printf '  Install a new one in herdr first: herdr integration install <name>\n'
      pause
      exit 0
    fi
    pick "Wire which CLI?" "$items"
    bash "$HERE/add-cli.sh" "$PICK" "$from_pane" "$space" 2>&1 | sed 's/^/  /'
    pause
    ;;
  check)
    clear
    echo
    ag check 2>&1 | sed 's/^/  /'
    pause
    ;;
esac
