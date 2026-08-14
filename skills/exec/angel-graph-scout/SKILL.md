---
name: angel-graph-scout
description: Discover non-obvious angel prospects for Thoven by graph traversal from anchor companies, persisting to the local SQLite graph. Use when the user says "scout angels", "find new angels", "run angel-graph-scout", "graph traversal prospecting", or wants net-new angel prospects beyond what query-seeded prospect-finder reaches. Drives the code loop scout_round.py and emits a paste-ready /goal for the unattended run.
---

# Angel Graph Scout

Graph-traversal angel discovery. A qualified person's orbit (companies they worked at / founded / invested in / advised) is harvested, ICP-gated, and the survivors become new anchors — so the frontier descends instead of staying one shallow wave. The loop writes ONLY to SQLite; it never touches Notion or contacts anyone.

**The loop is code.** `scout_round.py` owns all control flow — what to expand next, when to descend, when to stop. You never decide those in prose. You are the **manager**: you hold *all* judgment (is this person already known? does this person qualify? is this harvested company on-ICP?). Subagent fetchers are **interns**: they fetch raw facts and report, and make *no* judgment. Control flow belongs to the driver; judgment belongs to you; fetching belongs to the interns.

**Substrate:** two CLIs in `Fundraising/automation-playbook/angel-graph/`, run with `python3`:
- `angel_graph.py` — your judgment slots: `dedup-check`, `icp-check`, `import-known`, `add-association`, `review-queue` (plus the Plan-A primitives `add-company`, `push-frontier`, `stats`, `export-notion-queue`).
- `scout_round.py` — the driver: `pull` (next descent-ordered nodes to fetch) and `ingest --decisions FILE` (applies your decisions deterministically + prints the stop verdict).

Set `ANGEL_GRAPH_DB` to an absolute DB path, or run from the angel-graph dir. Per-run id is env `ANGEL_GRAPH_RUN` (stamped on each qualified person; `ingest` counts `novel` per run).

**Two surfaces, one source of truth.** The Notion **Angel CRM** — database `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`, whose single data source is `170c7a68-da78-46be-bf70-9ba05ed47334` (same table, two ids) — is where Andres tracks the pipeline; `angel_graph.db` is its searchable graph/dedup mirror. The pipeline keeps them in sync: **PULL** at kickoff (CRM → graph dedup surface via `import-known`) and **PUSH** after the run (approved finds → the SAME CRM via `export-notion-queue` + `create-pages`, stamping `notion_page_id` so each find lives in BOTH surfaces). Never let pull and push target different tables.

> **INTAKE FREEZE (2026-08-10):** Do **not** PUSH approved finds into Notion until Identified backlog is drained. Graph SQLite work (pull/ingest/qualify) is fine; CRM create-pages is blocked. See `Fundraising/automation-playbook/crm-contract.md`.

## Kickoff (the skill's front door — REQUIRED, cannot be in the goal)

Invoking the skill starts HERE. A goal can't ask, so anchors are settled with Andres now; the run is unattended after.

1. **Refresh the dedup surface (PULL, automatic).** Export the live Angel CRM (data source `170c7a68…`, all rows: Name, LinkedIn, Company/Background, Stage) to a JSON file, convert `Fundraising/prospect-finder-seen.json` (the 849-entry history) to rows, then `angel_graph.py import-known --crm-json <crm.json> --history-json <history.json>` — loads CRM ∪ history as the unified "already known / already passed on" surface (catches name-keyed priors a URL query alone misses). Do this every run (the CRM drifts). Print the loaded counts.
2. **Ask ONE opening question — "What are we hunting this run?"** — and take whichever path Andres gives:
   - **PROPOSE (overlap-aware, the default):** suggest 3–4 anchors whose ORBITS are *least* saturated in the just-loaded surface — skew away from the verticals/companies already heavily represented, because that overlap is exactly what produces dupes. Each must `icp-check` → `yes` and be NON-mega-cap. One-line "why this anchor / why its alumni are non-obvious operator-angels" each.
   - **INTENT-DRIVEN:** if Andres names a target profile ("marketplace operators who exited", "creator-education founders", "academic / super-professor angels", a named person's network…), ask **1–2 clarifying questions only if genuinely needed**, then map the profile to 3–4 ICP-fit, non-mega-cap anchors whose alumni match it, and show them with rationale.
   Either way, Andres confirms or edits the final 2–4.
   - **Hard exclusion (both paths):** never the already-drained mega-caps — Airbnb / Uber / Instacart / DoorDash / Outschool. Re-mining them caused the v1 dup rate.
3. **Seed.** `add-company` + `push-frontier` each confirmed anchor.
4. **Empty-frontier guard.** The loop hard-refuses to start on an empty frontier — if `scout_round.py pull` returns no tasks, kickoff didn't seed; do NOT improvise anchors inside the run.
5. Emit the paste-ready runtime goal below (you CANNOT run /goal yourself — Andres pastes it).

> /goal Run angel-graph-scout via scout_round.py until `ingest` reports stop, or stop after 30 turns. Each round: `python3 scout_round.py pull --batch 3` → for each task dispatch a dumb-intern fetcher (raw facts + candidate company-associations, NO judgment) → as manager run `angel_graph.py dedup-check` per candidate (borderline → set dedup_override) and the qualify-gate, and `icp-check` each association → write the decisions JSON → `python3 scout_round.py ingest --decisions FILE` → read its `stop` verdict and print `stats`. Write ONLY to SQLite via the CLI; never Notion, never contact anyone, never modify the real DB outside the CLI. Stop at qualified-in-graph for review. Proof: paste the final ingest `stop` + `stats`.

## Per round (goal-mode — the manager's turn)

1. **Pull.** `python3 scout_round.py pull --batch 3` → `{tasks:[{frontier_id, company_name, edge_type}], surface_size}`. The driver picks descent-first; you don't.
2. **Dispatch interns.** One fetcher subagent per task. They search Exa/web for that `edge_type` off that anchor (see `edge-taxonomy.md`) and return raw candidate facts (name, linkedin, role, location, signals) **plus** the companies in each candidate's orbit (`worked_at`/`founded`/`invested_in`/`advised`, with any liquidity signal) — and nothing else. No dedup, no qualify, no ICP calls. That is your job.
3. **Judge each candidate (manager).**
   - **dedup-check:** `angel_graph.py dedup-check --name N [--linkedin U] [--company C] [--role R]` → `dup` / `new` / `ambiguous`. `dup` → record it (the driver writes the audit and notes you already saw them). `ambiguous` → leave it; the driver parks it for async review (only set `dedup_override:"new"` if you're certain it's a different person). `new` → continue.
   - **qualify-gate:** apply `qualify-gate.md` (deterministic boolean). Sets `qualify` true/false. Two filters do most of the rejecting on graph-sourced nodes and must fire HERE, not defer to the post-loop scorer: (1) **founder/investor gate** — reject employees/ICs who aren't founders / execs-with-exit / known angels (`not-checkwriter`); a roster full of ICs is exactly what traversal surfaces. (2) **mission-fit gate** — reject/flag nodes whose only tie is generic marketplace-structural overlap with no education/family/mission adjacency (`marketplace-only`).
   - **icp-check each association:** `angel_graph.py icp-check --name Co [--vertical V] [--signals S]` → `yes` becomes a new anchor on ingest; `uncertain` only descends if you set `icp_override:"yes"`.
4. **Write the decisions file** — `{"node":{company,edge_type}, "candidates":[{name, linkedin, company, role, signals, angle, background, hook, qualify, associations:[{company, assoc, vertical, signals}], dedup_override?, icp_override?}]}` — one file per pulled node (or batch them per the node they belong to).
5. **Ingest.** `python3 scout_round.py ingest --decisions FILE` applies everything deterministically (dedup → mark_dup/park/qualify, harvest ICP-fit associations into new anchors, mark the node expanded) and prints `{novel, new_this_round, stop, reason, stats}`.
6. **Read the stop verdict.** If `stop` is true, stop — the driver computed it (novel-target or runaway backstop). Do not second-guess it or keep going. Print `stats`.

## Async review (never blocks the loop)

`ambiguous` candidates are parked in-graph, not resolved mid-run (a goal can't ask). After the run, `angel_graph.py review-queue` lists them for Andres to adjudicate. Never stall the loop waiting on a borderline identity call — park and move on.

## Post-loop (PUSH — review gate, then stage to Notion)

1. **Show Andres the finds; he approves before ANY Notion write.** `angel_graph.py export-notion-queue` → present the qualified finds (name + provenance + hook) as a list for Andres to approve/cut. Only approved rows are pushed.
2. **Push approved → the SAME Angel CRM** (`170c7a68…`): for each approved row, `mcp__claude_ai_Notion__notion-create-pages` with the CRM contract (Name, LinkedIn, Company/Background, Angle, Personalization Hook, Stage=Identified, Intro Path=Cold, Notes=`Source: angel-graph-scout | Provenance: ... | Signals: ...`). Verified writes (re-fetch and confirm). Then patch `people.notion_page_id` so the find lives in BOTH surfaces and isn't re-exported.
   - **Date-stamp contract (do not set here):** the CRM has two date columns — `Drafted At` (draft stamp, owned by the drafter, `angel-outreach-loop`) and `Last Contact` (send stamp, owned by the sender, `angel-outreach-loop` / `linkedin-assisted-send`). Scout creates prospects at Stage=Identified only; it never sets `Drafted At`, `Last Contact`, or advances `Stage` past Identified.
3. Run `prospect-scorer` to set Priority — THIS is where narrowing happens.
4. `review-queue` → Andres adjudicates the ambiguous parks.
5. Approved prospects flow into `angel-outreach-loop`.
