#!/usr/bin/env bash
# Watch mode: polls Keychain for the 3 tokens, then auto-runs deploy.sh.
#
# Use case: you're about to step away from the keyboard to create tokens in
# Mercury / Anthropic / Notion. Run this in another terminal first. As soon
# as all 3 tokens land in Keychain (via `security add-generic-password`),
# the deploy fires automatically.
#
# Tokens must be stored under these service names:
#   - mercury-api-cfo-worker
#   - anthropic-api-cfo-worker
#   - notion-api-cfo-worker
#
# Helper one-liner to store one (replace SERVICE):
#   security add-generic-password -a thoven -s SERVICE -w
#
# Stop watching: Ctrl-C

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

check() {
  security find-generic-password -s "$1" -a thoven >/dev/null 2>&1
}

echo "═══════════════════════════════════════════════════════"
echo "  Watching Keychain for CFO Worker deploy tokens..."
echo "═══════════════════════════════════════════════════════"
echo
echo "Polling every 10s. Drop tokens into Keychain via:"
echo "  security add-generic-password -a thoven -s mercury-api-cfo-worker -w"
echo "  security add-generic-password -a thoven -s anthropic-api-cfo-worker -w"
echo "  security add-generic-password -a thoven -s notion-api-cfo-worker -w"
echo
echo "Ctrl-C to stop."
echo

while true; do
  MERCURY=0; ANTHROPIC=0; NOTION=0
  check mercury-api-cfo-worker && MERCURY=1
  check anthropic-api-cfo-worker && ANTHROPIC=1
  check notion-api-cfo-worker && NOTION=1

  TS=$(date "+%H:%M:%S")
  printf "\r[%s] Mercury:%s  Anthropic:%s  Notion:%s   " \
    "$TS" \
    "$([ "$MERCURY" = 1 ] && echo -e "${GREEN}✓${NC}" || echo "·")" \
    "$([ "$ANTHROPIC" = 1 ] && echo -e "${GREEN}✓${NC}" || echo "·")" \
    "$([ "$NOTION" = 1 ] && echo -e "${GREEN}✓${NC}" || echo "·")"

  if [ "$MERCURY" = 1 ] && [ "$ANTHROPIC" = 1 ] && [ "$NOTION" = 1 ]; then
    echo
    echo
    echo -e "${GREEN}All 3 tokens detected. Starting deploy in 3s...${NC}"
    sleep 3
    exec ./scripts/deploy.sh
  fi

  sleep 10
done
