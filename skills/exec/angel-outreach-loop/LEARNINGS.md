# Learnings — angel-outreach-loop

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — vault refresh: current Notion tool names, Exa fallback, new vault path

> reflect · 2026-10-22 · vault-refresh · tooling · applied · seen 1

**What happened.** The skill named `notion-query-database-view`, which no longer exists, and relied on `mcp__exa__*` for the mandatory LinkedIn current-role check and the email hunt. Exa is not connected, and the vault path in `references/standard-template.md` still had a space.
**Why.** The Notion connector replaced the view tool with `mcp__claude_ai_Notion__notion-query-data-sources` (rows mode caps at 100 with no cursor; view mode paginates). With Exa disconnected, a mandatory step had no working tool.
**What changed.** The Phase A query now uses the paginated `mcp__notion__API-query-data-source`, with `notion-query-data-sources` view mode as the fallback. The warnings name the current tool. Exa stays optional, with an explicit WebSearch/WebFetch fallback for the role check and email hunt. The vault path is now `Vaults/Executive-Assistant`.
