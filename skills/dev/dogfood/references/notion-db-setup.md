# Plan: create the "Dogfood Runs" Notion database (one-time)

The canonical log every `/dogfood` run writes to (Step 5). Build it **once**, then record its id back into `logging.md`.

## Location

A **standalone** database on its own page — **not** nested under the Dogfooding OKR page or the Weekly Dogfood Ritual task. Title: `🐕 Dogfood Runs`. After creation, drop a cross-link to it from both the OKR page (`3786c461076080709ae7eadacc34bada`) and the Ritual page (`3816c46107608119af69d15915d07c27`) so it's findable, without living inside either.

## Schema

| Property | Type | Options / notes |
|---|---|---|
| **Run** | title | `Dogfood — YYYY-MM-DD` |
| **Date** | date | the run date — primary sort key |
| **Type** | select | `Weekly` · `Ad-hoc` · `Calibration` |
| **Versions** | rich_text | `fe 2.14.0 · be 2.24.0` (published versions tested) |
| **Buckets hit** | multi_select | `user-visible` · `integration` · `contract-removal` · `out-of-band` |
| **Result** | select | `✅ GO` · `⚠️ GO-with-friction` · `❌ NO-GO` |
| **Issues** | rich_text (v1) | paste bug links; upgrade to a **relation → Bug Log** once that DB id is wired |
| **Entering state** | rich_text | the `last_known_state` snapshot at run start (repro context) |
| **Time (min)** | number | minutes spent |

Run detail (scripted pass/fail table, grill notes, out-of-band list) goes in the **page body** of each row, not in properties.

## Views

- **All runs** — table, sorted `Date` descending (default).
- **By result** — board grouped by `Result` (spot the ❌/⚠️ runs at a glance). Optional.

## Build steps

1. `notion-create-database` — parent = a standalone page (top-level / a neutral parent you designate, not OKR/Ritual); title `🐕 Dogfood Runs`; properties per the schema above.
2. Capture the returned **`data_source_id`**.
3. Write it into `logging.md`: replace `DOGFOOD_RUNS_DB = <data_source_id — fill after creation>` with the real id.
4. Add a link-to-database callout on the OKR page and the Ritual page.

## Post-create

Step 5 of a run creates one row via `notion-create-pages` into `DOGFOOD_RUNS_DB` with the properties above + the body sections. Until step 1 is done, Step 5 has nowhere to write — so this setup is a prerequisite for the **first real (calibration) run**.
