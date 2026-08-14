#!/usr/bin/env bash
# One-shot interactive deploy.
#
# Prereqs (do these in your browser BEFORE running this script):
#   1. Mercury Settings → Developer → revoke old token, create new "cfo-worker-cloudflare", copy
#   2. console.anthropic.com → API Keys → Create Key "cfo-worker-cloudflare", copy
#   3. notion.so/profile/integrations → + New integration "Thoven CFO Worker"
#      → Internal, capabilities: Read/Update/Insert. Copy Internal Integration Secret.
#   4. Open https://www.notion.so/3616c46107608132ac82df2b68ea12a8 → Share → invite "Thoven CFO Worker"
#
# Then run: ./scripts/deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
die()  { echo -e "${RED}✗${NC} $*"; exit 1; }

echo "═══════════════════════════════════════════════════════"
echo "  Notion CFO Worker — Cloudflare deploy"
echo "═══════════════════════════════════════════════════════"
echo

# ─── Step 1: Verify tests still pass ──────────────────────────────────────
echo "→ Running tests + typecheck before deploy..."
npx tsc --noEmit || die "typecheck failed"
npx vitest run > /tmp/cfo-test-output.log 2>&1 || { cat /tmp/cfo-test-output.log; die "tests failed"; }
ok "48 tests pass, typecheck clean"
echo

# ─── Step 2: Wrangler auth ────────────────────────────────────────────────
if ! npx wrangler whoami 2>/dev/null | grep -q "@"; then
  warn "wrangler not authenticated. Opening browser for login..."
  npx wrangler login || die "wrangler login failed"
fi
WHO=$(npx wrangler whoami 2>&1 | grep -oE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+" | head -1 || echo "unknown")
ok "wrangler authenticated as $WHO"
echo

# ─── Step 3: Collect secrets ──────────────────────────────────────────────
echo "─── Provide the 3 API tokens you created in your browser ───"

read_secret() {
  local var=$1 prompt=$2 keychain_name=$3
  # Try keychain first
  if security find-generic-password -s "$keychain_name" -a thoven -w >/dev/null 2>&1; then
    local val
    val=$(security find-generic-password -s "$keychain_name" -a thoven -w)
    read -p "Found '$keychain_name' in keychain. Use it? [Y/n] " yn
    if [[ "$yn" =~ ^[Nn] ]]; then val=""; fi
    if [ -n "$val" ]; then
      eval "$var=\"\$val\""
      return
    fi
  fi
  # Prompt user
  echo
  echo "$prompt"
  read -rs -p "  > " val
  echo
  [ -z "$val" ] && die "$var cannot be empty"
  # Save to keychain
  security delete-generic-password -s "$keychain_name" -a thoven >/dev/null 2>&1 || true
  security add-generic-password -s "$keychain_name" -a thoven -w "$val"
  ok "stored in keychain as '$keychain_name'"
  eval "$var=\"\$val\""
}

read_secret MERCURY_API_KEY    "Mercury API token (starts with 'secret-token:mercury_production_...')" mercury-api-cfo-worker
read_secret ANTHROPIC_API_KEY  "Anthropic API key (starts with 'sk-ant-api03-...')"                    anthropic-api-cfo-worker
read_secret NOTION_API_KEY     "Notion Internal Integration Secret (starts with 'ntn_' or 'secret_...')" notion-api-cfo-worker

echo

# ─── Step 4: Push secrets to Cloudflare ───────────────────────────────────
echo "→ Pushing secrets to Cloudflare..."
echo "$MERCURY_API_KEY"   | npx wrangler secret put MERCURY_API_KEY    >/dev/null 2>&1 && ok "MERCURY_API_KEY set"
echo "$ANTHROPIC_API_KEY" | npx wrangler secret put ANTHROPIC_API_KEY  >/dev/null 2>&1 && ok "ANTHROPIC_API_KEY set"
echo "$NOTION_API_KEY"    | npx wrangler secret put NOTION_API_KEY     >/dev/null 2>&1 && ok "NOTION_API_KEY set"
echo

# ─── Step 5: Deploy ───────────────────────────────────────────────────────
echo "→ Deploying worker..."
DEPLOY_OUTPUT=$(npx wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT" | tail -10
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.workers\.dev' | head -1)
[ -z "$WORKER_URL" ] && die "couldn't parse worker URL from deploy output"
ok "deployed to $WORKER_URL"
echo

# ─── Step 6: Smoke test ───────────────────────────────────────────────────
echo "→ Smoke test (running full pipeline once via fetch handler)..."
sleep 3  # let DNS propagate
RESPONSE=$(curl -sS --max-time 60 "$WORKER_URL" || echo '{"status":"failed","error":"curl failed"}')
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo
STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")

if [ "$STATUS" = "success" ]; then
  ok "smoke test passed — check Notion → 💰 Thoven CFO → Weekly Reports for the new page"
  PAGE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('weeklyReportPageId',''))" 2>/dev/null)
  [ -n "$PAGE_ID" ] && echo "  Report page: https://www.notion.so/${PAGE_ID//-/}"
else
  warn "smoke test status: $STATUS"
  warn "check failure stub in Notion → Weekly Reports for the reason"
  warn "OR tail logs: npx wrangler tail"
  exit 1
fi

echo
echo "═══════════════════════════════════════════════════════"
echo "  ✅ DEPLOY COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo "  • Cron registered: 0 12 * * 1 (Monday 7am ET)"
echo "  • Next auto-run:   Monday May 18, 2026 at 12:00 UTC"
echo "  • Manual trigger:  curl $WORKER_URL"
echo "  • Live logs:       npx wrangler tail"
echo "  • Failure pages:   Notion → Weekly Reports DB → Status = ❌ failed"
echo
echo "  Migration plan:"
echo "  • May 18: launchd Python + Worker run in parallel"
echo "  • May 25: parallel run #2; diff outputs"
echo "  • Jun 1+: launchctl unload ~/Library/LaunchAgents/co.thoven.cfo-weekly.plist"
echo "═══════════════════════════════════════════════════════"
