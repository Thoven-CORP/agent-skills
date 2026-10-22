# Notion CFO Worker — Live Deploy Runbook (Cloudflare Workers)

Last updated: 2026-05-15

> **2026-10-22:** the local launchd job (`co.thoven.cfo-weekly`) was retired with the rest of the EA launchd automation. The launchd rows below are history. Mercury **CLI** auth failures are an expired OAuth session (`mercury login`), not a rotated key; the API-key steps here apply only to this Worker's `MERCURY_API_KEY` secret.

## Status

| Step | Done? |
|---|---|
| Code built + 48 tests passing + 89% coverage | ✅ |
| Cloudflare Workers config (wrangler.toml) + cron trigger | ✅ |
| Worktree merged to main | ✅ |
| Notion: parent page "💰 Thoven CFO" created (under Thoven COO) | ✅ |
| Notion: Budget / Transactions / Weekly Reports DBs created | ✅ |
| Notion: Budget DB seeded with 26 vendor rows | ✅ |
| Mercury API key rotated | ⏳ **YOU** |
| Notion integration token (for Worker writes) created + DBs shared | ⏳ **YOU** |
| `wrangler login` | ⏳ **YOU** |
| `wrangler secret put` for 3 keys | ⏳ **YOU** |
| `wrangler deploy` | ⏳ **YOU** |
| Manual `curl` smoke test | ⏳ **YOU** |
| Disable launchd June 1+ | ⏳ **YOU** (after May 18 + May 25 parallel runs) |

---

## Notion workspace IDs (already created — for reference)

```
Parent page: https://www.notion.so/3616c46107608132ac82df2b68ea12a8

BUDGET_DB_ID = a0aa84a9-332e-4361-b4d1-f0f82edd4a54
TRANSACTIONS_DB_ID = 1afdaaaa-63b8-489b-ac26-e63b049e8d24
REPORTS_DB_ID = 5308e11d-de63-49cc-a784-6f20474c786a
```

These are already baked into `wrangler.toml`. No edits needed.

---

## Step 1 — Rotate Mercury API key (≈ 2 min)

The previous key was pasted in a chat transcript. **Revoke it before anything else.**

1. Go to https://app.mercury.com → Settings → Developer → API Tokens
2. Click the existing token → **Revoke**
3. Click **+ New token** → name it `cfo-worker-cloudflare`
4. Copy the new token (starts with `secret-token:mercury_production_...`)
5. Store in macOS Keychain immediately (do not paste anywhere else):

```bash
security add-generic-password -a thoven -s mercury-api-cfo-worker -w
# paste new token at prompt
```

To read it back later: `security find-generic-password -s mercury-api-cfo-worker -a thoven -w`

---

## Step 2 — Anthropic API key (≈ 1 min)

If you don't already have a project key for the CFO Worker:

1. Go to https://console.anthropic.com → API Keys → **Create Key**
2. Name: `cfo-worker-cloudflare`
3. Workspace: Thoven (or create one)
4. Copy the key (starts with `sk-ant-api03-...`)
5. Store in Keychain:

```bash
security add-generic-password -a thoven -s anthropic-api-cfo-worker -w
# paste at prompt
```

---

## Step 3 — Notion integration token (≈ 3 min)

The Notion *MCP* token I used to create the DBs is **not** what the Worker uses. Workers need an Internal Integration token.

1. Go to https://www.notion.so/profile/integrations → **+ New integration**
2. Name: `Thoven CFO Worker`
3. Associated workspace: pick your workspace
4. Type: **Internal**
5. Capabilities: ✅ Read content, ✅ Update content, ✅ Insert content. Leave Comment + User capabilities off.
6. Submit → copy the **Internal Integration Secret** (starts with `ntn_...` or `secret_...`)
7. Store in Keychain:

```bash
security add-generic-password -a thoven -s notion-api-cfo-worker -w
```

8. **Share the 3 DBs with the integration** (one-time):
   - Open the parent page: https://www.notion.so/3616c46107608132ac82df2b68ea12a8
   - Click **Share** (top right) → search "Thoven CFO Worker" → **Invite**
   - Sharing the parent grants access to all 3 child DBs automatically

---

## Step 4 — Wrangler login (≈ 1 min)

```bash
cd ~/.claude/skills/thoven-financials/notion-cfo-worker
npx wrangler login
```

Browser opens → authorize Cloudflare account. Returns to terminal when done.

Verify:
```bash
npx wrangler whoami
```

Expected: your Cloudflare account email + account ID.

---

## Step 5 — Push secrets (≈ 1 min)

```bash
cd ~/.claude/skills/thoven-financials/notion-cfo-worker

# pull from Keychain → push to Wrangler in one line each
security find-generic-password -s mercury-api-cfo-worker -a thoven -w | npx wrangler secret put MERCURY_API_KEY
security find-generic-password -s anthropic-api-cfo-worker -a thoven -w | npx wrangler secret put ANTHROPIC_API_KEY
security find-generic-password -s notion-api-cfo-worker -a thoven -w | npx wrangler secret put NOTION_API_KEY
```

Verify all 3 are set:
```bash
npx wrangler secret list
```

Expected output: three entries — `MERCURY_API_KEY`, `ANTHROPIC_API_KEY`, `NOTION_API_KEY`.

---

## Step 6 — Deploy (≈ 30 sec)

```bash
cd ~/.claude/skills/thoven-financials/notion-cfo-worker
npx wrangler deploy
```

Expected output (last lines):
```
Uploaded notion-cfo-worker (X.XX sec)
Deployed notion-cfo-worker triggers (X.XX sec)
  schedule: 0 12 * * 1
  https://notion-cfo-worker.<your-subdomain>.workers.dev
```

**Copy the `.workers.dev` URL** — you'll use it for the smoke test.

---

## Step 7 — Manual smoke test (≈ 1 min)

Hit the fetch handler once with curl. This runs the full pipeline end-to-end:

```bash
curl -s https://notion-cfo-worker.<your-subdomain>.workers.dev | jq
```

Expected response shape on success:
```json
{
  "status": "success",
  "weeklyReportPageId": "<notion-page-id>",
  "transactionsWritten": <N>,
  "flagsRaised": <M>
}
```

**Verify in Notion:**
1. Open https://www.notion.so/3616c46107608132ac82df2b68ea12a8 (parent page)
2. Click into **Weekly Reports** → confirm a new row appears (`CFO Weekly — 2026-05-08 → 2026-05-15`)
3. Click into **Transactions** → confirm last week's Mercury charges appear with vendor + flag

If response is `"status": "failed"`, check the error field. Then tail the Worker logs in real-time:

```bash
npx wrangler tail
# in another shell, hit the URL again
```

---

## Step 8 — Schedule kicks in automatically

Next scheduled run: **Monday May 18, 2026 at 12:00 UTC (≈ 7am EST / 8am EDT)**

To verify the cron registered:
```bash
npx wrangler triggers
```

Expected: `schedule: 0 12 * * 1`

---

## Step 9 — Parallel run period (May 18 → June 1)

The launchd Python job runs Monday May 18 + May 25 alongside the Worker.

Manually diff outputs after each Monday:
- Python output: `Daily Work/` Obsidian notes (the old format)
- Worker output: Notion → Weekly Reports DB

If diffs are clean for 2 consecutive Mondays, disable launchd:

```bash
launchctl unload ~/Library/LaunchAgents/co.thoven.cfo-weekly.plist
mv ~/Library/LaunchAgents/co.thoven.cfo-weekly.plist ~/Library/LaunchAgents/disabled.co.thoven.cfo-weekly.plist
```

---

## Failure recovery

The Worker writes a `❌ failed` page to the Weekly Reports DB on any error,
including the reason in the page body. Common causes:

| Failure mode | Fix |
|---|---|
| Mercury 5xx transient | Manually re-trigger: `curl <worker-url>` |
| Claude JSON parse fail | Inspect failure stub body, adjust prompt in `src/claude.ts`, redeploy |
| Notion 429 rate limit | Unlikely at our volume (~75 charges/mo). If catch-up after outage, add delay between `pages.create` calls in `notion.ts` |
| Invalid Mercury key | Rotate per Step 1; re-push secret per Step 5 |

To re-trigger a run on demand any time: `curl <worker-url>`

---

## Cost estimate

| Item | Monthly cost |
|---|---|
| Cloudflare Workers (free tier: 100K req/day, plenty for 4 cron runs) | $0 |
| Anthropic API (~$0.01 per run × 4 runs/mo) | ~$0.04 |
| Notion API (free for integrations) | $0 |
| Mercury REST API (included with account) | $0 |
| **Total** | **~$0.05/mo** |

---

## Future: External Agents API (Phase 2)

When Notion's External Agents API exits waitlist:
- Connect Claude as an agent on the 💰 Thoven CFO page
- Read access to Transactions + Budget DBs
- Ad-hoc queries inside Notion: "What's my runway if I cancel Replit?"
- Worker stays — Phase 2 is additive, not replacement

Action now: Join waitlist at https://app.notion.com/developers
