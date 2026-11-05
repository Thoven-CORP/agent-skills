# Vendor access

How to reach each vendor's data without guessing. One line per vendor. No secret values live here.

- **Sentry:** org `thoven-gy` on `https://us.sentry.io`; projects `javascript-nextjs` (frontend) and `ruby-rails` (backend). The slug `thoven` returns 403: unverified (reflect 2026-11-05).
- **Prod database:** Neon project `dry-sound-31987419` (`thoven-prod`), queried through `mcp__plugin_neon_neon__run_sql`. The read-only `mcp__Neon__run_sql` being refused by the classifier in panes: unverified (reflect 2026-11-05).
- **Mixpanel:** the user-scope `mixpanel` MCP (`https://mcp.mixpanel.com/mcp`, tools `mcp__mixpanel__*`), project `3979777`. Reports in Pacific time and the claude.ai Mixpanel connector returning 404: unverified (reflect 2026-11-05).
- **SendGrid:** the key can send mail only and cannot read stats: unverified (reflect 2026-11-05).
- **Daily:** `DAILY_API_KEY` in backend `.env` is stored with quotes around the value; strip them before using it in a header.
