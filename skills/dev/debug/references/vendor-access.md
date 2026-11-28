# Vendor access

How to reach each vendor's data without guessing. One line per vendor. No secret values live here.

- **Sentry:** org `thoven-gy` on `https://us.sentry.io`; projects `javascript-nextjs` (frontend) and `ruby-rails` (backend). The slug `thoven` returns 403: unverified (reflect 2026-11-05).
- **Prod database:** Neon project `dry-sound-31987419` (`thoven-prod`), queried through `mcp__plugin_neon_neon__run_sql`. The read-only `mcp__Neon__run_sql` being refused by the classifier in panes: unverified (reflect 2026-11-05).
- **Mixpanel:** the user-scope `mixpanel` MCP (`https://mcp.mixpanel.com/mcp`, tools `mcp__mixpanel__*`), organization `3073149` (Thoven), project `3979777`. Pass `organization_id: 3073149` or `project_id: 3979777` to every call, `Get-Business-Context` first among them; with neither it fails "organization_id is required". Reports in Pacific time and the claude.ai Mixpanel connector returning 404: unverified (reflect 2026-11-05).
- **Render:** workspace `tea-dao3d9qjnfac73aebo90` ("Andres's workspace", the only one, from `render workspaces --output json` on 2026-11-23). The render MCP needs `mcp__plugin_render_render__select_workspace` with it before any other call, which otherwise fails "no workspace selected"; the CLI uses `render workspace set tea-dao3d9qjnfac73aebo90`. Run both from the laptop, where they are signed in.
- **SendGrid:** the key can send mail only and cannot read stats: unverified (reflect 2026-11-05).
- **Daily:** `DAILY_API_KEY` in backend `.env` is stored with quotes around the value; strip them before using it in a header.
