# Logging

Every run (weekly and ad-hoc; **not** `status`) writes one row to the standalone Notion **Dogfood Runs** database. The row is a thin, filterable index; the page body holds the detail.

## One-time setup

Create the standalone **Dogfood Runs** database (its own page — **not** under the OKR or Ritual page), then record its `data_source_id` here. Full creation plan: `references/notion-db-setup.md`.

`DOGFOOD_RUNS_DATABASE_ID = 4ba92554-356a-4b26-8c94-a2c2e88e4359` (the database container; retrieve/list this ID)
`DOGFOOD_RUNS_DB = b6e3a89a-febb-4acc-8227-13981b1aa4bd` (its one data source, same title "Dogfood Runs"; lives on the standalone page "Weekly 🐕 Dogfood Runs" → https://app.notion.com/p/4ba92554356a4b268c94a2c2e88e4359)

Create each run row with `API-post-page` (or `notion-create-pages`), parent
`{ "type": "database_id", "database_id": "4ba92554-356a-4b26-8c94-a2c2e88e4359" }` —
**use the DATABASE_ID above, not the data-source id.** Passing the data-source id as
`database_id` 404s with "Could not find database" even when sharing is fine (hit this
2026-07-26 and burned real time suspecting a permissions problem that didn't exist —
`API-post-search` for "Dogfood" or `API-retrieve-a-database` on the DATABASE_ID confirms
access before assuming a share is missing).

## Schema

| Property | Type | Example |
|---|---|---|
| Run | title | `Dogfood — 2026-06-22` |
| Type | select | `Weekly` · `Ad-hoc` · `Setup` |
| Versions | text | `fe 2.24.1 · be 2.24.1` |
| Buckets hit | multi-select | user-visible · integration · contract-removal |
| Result | select | `✅ GO` · `⚠️ GO-with-friction` · `❌ NO-GO` |
| Issues | relation | → linked Bug entries |
| Entering state | text | the `last_known_state` snapshot at run start (repro context) |
| Time | number | minutes |

## Page body (the actual run)

- **Scripted results** — the pass/fail table with exact values.
- **Grill notes** — "what felt bad this week."
- **Out-of-band** — the BE-only bucket items, listed (not tested in UI).

## Routing findings (Step 4)

- **Real bug** (something broken) → mint into the bug tracker (`workspace add-bug` → Notion Bug Log) and set it as an **Issues** relation on the run row. Bugs live where you already triage, not buried in run notes.
- **Soft friction** (confusing copy, slow screen, awkward flow) → a bullet in the run page body. Not every annoyance is a bug.
