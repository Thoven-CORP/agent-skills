# Notion plumbing — DB-ID registry, board schemas, MCP recipes

This is the single home for the workspace skill's Notion layer: the DB-ID
registry, the **real** board schemas (verified live 2026-06-22), the
Notion-MCP call recipes, and the 3-way sync field partition. `SKILL.md`'s
Notion verbs stay thin and point here. **Never hardcode a DB-ID anywhere else.**

## Prerequisite — connector live (this is the real gate)

The Notion verbs require the Notion MCP tools (`mcp__claude_ai_Notion__*`) to be
**connected in an interactive session** (design §7.3). In a headless/cron run the
connector is often absent — in that case each Notion verb **skips with a printed
notice** and the local half still works. The verbs are NOT gated on mem0:
mem0-search reliability gates the *separate* memory-retirement workstream
(design §2.7), never Notion. If a verb can't reach Notion, say so and continue —
don't fail the whole flow.

> **Schemas drift.** The column names + option vocab below are a snapshot. If a
> write is rejected for an unknown property/option, re-`notion-fetch` the
> `collection://<id>` to get the current schema before retrying — don't guess.

## DB-ID registry (verified live 2026-06-22)

| Surface | Kind | ID (pass to `notion-fetch` / as parent) |
|---|---|---|
| **Product Development Hub** | page | `26a6c461-0760-801e-ad44-cc1c36ae981a` — PRD home (standalone pages live under it) |
| **Dev Tracker** (Dev Kanban) | data source | `collection://f0c5c186-7c5f-4c25-89d8-775a4426da5a` |
| **Feature Requests** | data source | `collection://f0020b2a-a064-4518-a70f-4eff80d69913` |
| **High-Level Bug Log** | data source | `collection://26a6c461-0760-8092-9c7a-000ba3008d92` |
| **Sprint List** | data source | `collection://3f437e88-0a75-477a-ba04-b47e8b86370a` |
| **Changelog** | data source | `collection://1a8a27a8-2737-435a-8755-a45dbb86c610` |
| **Product Strategy Hub** | page | `41d28e50-8f6c-4a2f-8d61-1866a4a8bbe7` — holds the PRD *template* only |

## type → board mapping

| workspace `type:` | prefix | Notion board | title column | open status | done status |
|---|---|---|---|---|---|
| `task` (promoted todo) | `tk-` | Dev Tracker | `Feature / Item` | **derived** — `lane.js` (`Backlog`/`Speccing`/`Backend dev`/`Front end dev`/pin) | `Status`=`Published` (close = merged + in a published CHANGELOG version, which is the store's own done-ground-truth) |
| `improvement` (promoted) | `fi-` | Feature Requests | `Feature / Initiative Name` | `Status`=`Not Started` | `Status`=`Shipped` |
| `bug` | `bg-` | Bug Log | `Title` | **derived** — `Reported` / `In Progress` / pin | `Status`=`Fixed` |
| `prd` | `pr-` | standalone page under the Hub (no DB) | page title | — | — |

## Board schemas (writable columns the verbs touch)

Only the columns a verb sets are listed. **Omit `Owner`** by default — Feature
Requests / Changelog `Owner` are `person` type (need a Notion user ID we don't
carry); the rest are free text. Date columns use the **expanded** form
`date:<Col>:start` (+ optional `:end`, `:is_datetime` 0/1). Checkboxes use
`__YES__` / `__NO__`. A property literally named `id` or `url` must be prefixed
`userDefined:` — none of ours are.

> **Option strings are copied verbatim from the live board — typos included**
> ("Devlopment", "Potential Design Impovments", "Deffered", "Backend Publsihing
> Checkpoint"). Do NOT "correct" them: Notion select/status writes require an
> exact match, so a fixed typo = a rejected write.

**Dev Tracker** `collection://f0c5c186-7c5f-4c25-89d8-775a4426da5a`
- `Feature / Item` (title) · `Status` (select: Speccing, Backend dev, Front end dev, Code Review/PR, Tech Debt, Manual QA, Keri testing, **Backlog**, Potential Design Impovments, Tests & Edge cases to check, Production/Published, Future Improvements, **Published**) · `Hermes Status` (status: Not started / In progress / Done) · `Priority` (select: High/Medium/Low) · `Stage` (select: MVP, Thoven 1.5/2.0/2.5) · `Epic` (select) · `Link to PRD` (url) · `PRD / Sprint` (relation → Sprint List) · `Bugs` (relation ← Bug Log) · `Notes` (text) · `Owner` (text)

> **`Hermes Status` is DELETED (2026-07-15).** It was a leftover from the retired
> Hermes agent surface. The automation writes the single `Status` ladder only.
>
> **Lane model (2026-07-16 — replaces the two-point create→Backlog / close→Published
> doctrine).** That doctrine assumed Andres drags the middle columns by hand; he
> doesn't, so every in-flight card sat stranded in `Backlog` (the staleness bug).
> The lane is now **derived** by `tools/lane.js` `laneFor(item, section)`:
>
> | Local state | Dev Tracker `Status` |
> |---|---|
> | `status:done` | `Published` |
> | `stage:` pin set (dash form, e.g. `stage:Keri-testing`) | that lane, verbatim |
> | `type:techdebt` (P0/P1) open | `Tech Debt` |
> | `## In Progress` + `repo:backend` | `Backend dev` |
> | `## In Progress` + `repo:frontend` | `Front end dev` |
> | `## In Progress`, no repo (cross-stack) | `Speccing` (pin `stage:` if wrong) |
> | otherwise (`## Backlog`, etc.) | `Backlog` |
>
> (Bug Log vocab: done → `Fixed`, in-progress → `In Progress`, else `Reported`.)
> Creates land straight in their derived lane. Updates fire on ANY local change.
> **Manual drags survive** as long as the local item doesn't change — `pendingSync`
> only marks an item dirty when *local* state diverges from `last-synced:` — but
> the next local change reasserts the derived lane; use `stage:` to pin a
> human-placed lane (Manual QA, Keri testing) the derivation can't know.

**Feature Requests** `collection://f0020b2a-a064-4518-a70f-4eff80d69913`
- `Feature / Initiative Name` (title) · `Status` (select: Not Started / In Progress / Shipped) · `Priority Score` (number) · `Impact` (select: High/Medium/Low) · `Effort` (select: High/Medium/Low) · `Stage` (select) · `Link to PRD` (url) · `Notes` (text) · `Owner` (person — omit)

**High-Level Bug Log** `collection://26a6c461-0760-8092-9c7a-000ba3008d92`
- `Title` (title) · `Status` (select: Reported / In Triage / In Progress / Verified / Fixed) · `Severity` (select: Critical/High/Medium/Low) · `Assigned To` (select: Unassigned/Andres/Hermes/Keri — default Unassigned) · `Reported By` (select: Teacher/Parent/Student/Internal/Other — default Internal) · `date:Date Reported:start` · `date:Fixed Date:start` · `Related Task` (relation → Dev Tracker) · `Linked Linear Issue` (url) · `Notes` (text) · `Owner` (text)

**Sprint List** `collection://3f437e88-0a75-477a-ba04-b47e8b86370a` — the **PRD/idea hub** (each entry = a PRD/initiative that contains its tasks)
- `Sprint` (title) · `Status` (select: Active/Completed/Upcoming/Deffered) · `date:Dates:start`/`:end` · `Focus` (text) · `Key Features` (multi_select) · `Tasks` (relation ← Dev Tracker) · `PRD / Doc` (url — the drafted PRD doc, Drive or a standalone Notion page)

**Changelog** `collection://1a8a27a8-2737-435a-8755-a45dbb86c610` (written by `publish`, not these verbs)
- `Feature / Fix Name` (title) · `Category` (select: Feature/Improvement/Bug Fix/Infra/Other) · `Status` (status: Not started / Devlopment / Published) · `Stage` (select) · `date:Date Released:start` · `Impact` (text) · `Notes` (text) · `Frontend Publishing Checkpoint` (url) · `Backend Publsihing Checkpoint` (url) · `Owner` (person — omit)

> **Relations are LIVE (2026-06-22).** Built per the solo-dev paradigm: the
> **Sprint List entry IS the PRD/idea hub** (no separate PRD database — §7.1
> stands). The graph:
> - **Dev Tracker `PRD / Sprint`** (relation → Sprint List) ↔ **Sprint List `Tasks`** — a PRD/sprint entry *contains* its tasks.
> - **Bug Log `Related Task`** (relation → Dev Tracker) ↔ **Dev Tracker `Bugs`** — a bug links to the feature it breaks.
> - **Sprint List `PRD / Doc`** (url) — the idea's drafted PRD doc.
>
> The Dev Tracker `Link to PRD` (url) still exists for a task-level doc link; the
> relation carries the structural Task↔Sprint/PRD join. Relation values are set by
> passing the related page url(s) — see "Set a relation value" below.

## MCP recipes

**Always fetch the schema first if unsure** — `notion-fetch` with `collection://<id>`
returns the current columns + option vocab.

**Create a board page** (e.g. promote → Dev Tracker, add-bug → Bug Log):
```
notion-create-pages
  parent: { type: "data_source_id", data_source_id: "<id-without-collection://>" }
  pages: [{ properties: { "<title col>": "<text>", "Status": "<valid option>", ... } }]
```
Capture the returned page `url` / id — you write it onto the local line's `notion:`
field (see "the back-ref", below).

**Create a standalone PRD page** (add-prd — no DB):
```
notion-create-pages
  parent: { type: "page_id", page_id: "26a6c461-0760-801e-ad44-cc1c36ae981a" }
  pages: [{ properties: { "title": "PRD — <name>" }, content: "<NFM body>" }]
```

**Update status / props** (close-item's Notion leg, sync push):
```
notion-update-page  page_id: "<id>"  command: "update_properties"
  properties: { "Status": "Shipped" }            // Feature Requests done
  properties: { "Status": "Published" }              // Dev Tracker done (single ladder; Hermes Status removed)
  properties: { "Status": "Fixed", "date:Fixed Date:start": "<YYYY-MM-DD>" }  // Bug done
```

**Find a page** (sync, surface-divergence, Notion-origin discovery):
- by content: `notion-search` with `data_source_url: "collection://<id>"` + a query.
- by view (filtered): `notion-query-database-view` with a `?v=` view URL (get it from `notion-fetch` of the database).

**Set a relation value** (link a Task to its Sprint/PRD, a Bug to its Task) — pass
the related page url(s) as a **JSON-array string**; the reciprocal side updates
automatically:
```
notion-update-page  page_id: "<task page id>"  command: "update_properties"
  properties: { "PRD / Sprint": "[\"https://app.notion.com/p/<sprint page id>\"]" }   // Dev Tracker task → Sprint List
  properties: { "Related Task": "[\"https://app.notion.com/p/<task page id>\"]" }      // Bug Log bug → Dev Tracker
```

## The `notion:` back-ref (local ↔ Notion identity)

After creating a Notion page, stamp its id onto the local item line so the two
stay joined by ID. Use `item.js` `parseLine`→mutate→`serialize` — never hand-edit
the comment. `serialize` round-trips arbitrary fields, so `notion:` + `last-synced:`
just work.

**Never compute the marker by hand — always `sync.js` `markFor({item, section, date})`.**
It is the same function `pendingSync` uses for its clean-check, so a stamp and the
detector cannot drift. The recipe below tracks the `## ` section as it scans, so
you don't pass the lane or the section either:

```bash
node -e '
const {parseLine,serialize}=require(process.env.HOME+"/.claude/skills/workspace/tools/item.js");
const {markFor}=require(process.env.HOME+"/.claude/skills/workspace/tools/sync.js");
const fs=require("fs"); const [file,id,notionId,date]=process.argv.slice(1);
let section="",done=false;
const lines=fs.readFileSync(file,"utf8").split("\n").map(l=>{
  const h=/^##\s+(.*)/.exec(l); if(h){ section=h[1].trim().toLowerCase(); return l; }
  const it=parseLine(l);
  if(it&&it.fields.id===id){
    it.fields.notion=notionId;
    it.fields["last-synced"]=markFor({item:it,section,date});
    done=true; return serialize(it);
  }
  return l;
});
fs.writeFileSync(file,lines.join("\n"));
console.log(done?"stamped "+id+" -> "+notionId:"NOT FOUND: "+id);
' "<register path>" "<local id>" "<notion page id>" "<YYYY-MM-DD>"
```

Verify with the flush — a correct stamp leaves **zero** pending for that id. If the
item still reports `update` right after a successful create, the marker is wrong,
not the board.

`last-synced:` is the **3-way base**: the ISO date plus a hash of
`item.text | status | derived lane`, captured at the moment local and Notion last
agreed. It lets `sync-notion` tell "neither changed" from "one changed" from
"both changed".

> ⚠️ **The marker hashes the item's FULL `text`, not `cardTitle(text)`.**
> `cardTitle` is the ≤80-char truncation used only for the Dev Tracker
> `Feature / Item` column. Stamping a marker built from `cardTitle` on any item
> whose text exceeds 80 chars produces a value that can never match, so the item
> reports `update` on *every* `sync-notion` forever and re-writes the same board
> value each time. The failure is silent — the Notion write succeeds, the dirty
> flag simply never clears. `markFor` exists so this cannot happen; use it.

## 3-way sync field partition (`sync-notion`)

Base = the item's `last-synced:` snapshot. Compare local-now and Notion-now to it.

| Field | Owner | Direction |
|---|---|---|
| existence (no Notion page yet) | local | **push** — create the page in its derived lane, stamp `notion:` |
| title / content | local | **push** → Notion title / body |
| status + lane (`open`/`done`, section, `stage:` pin) | local | **push** → board `Status` via `lane.js` (see the Lane model above) |
| `links:` | local | local-only — not mirrored |
| `Priority` / `Epic` / board `Status` drags the derivation can't know | Notion | **pull** → annotate the STATE Map; persist a drag worth keeping as a local `stage:` pin |
| `PRD / Sprint` relation (Task→Sprint/PRD), `Related Task` (Bug→Task) | Notion (structure) | **pull** → annotate the Map; `promote`/`add-bug` MAY set it when the local item links a known sprint/task (see "Set a relation value") |

Resolution: **neither side changed** since base → skip. **One side changed** →
auto-apply in its owner's direction, refresh `last-synced:`. **Both sides changed**
→ **STOP, show both values, ASK** the user which wins (never auto-merge into the
live board). Per-item, or `--all` to walk every item carrying a `notion:` ref.

**Notion-origin discovery:** query a board for pages whose id appears in **no**
register's `notion:` field (created directly on the board). For each, ASK
"log locally too?" — on yes, mint a fresh id (`ids.js`), `serialize` a local line
with the `notion:` back-ref, append to the type's register, drop a STATE pointer.
The board is a first-class entry point, not just a mirror.

## surface-divergence (audit class)

For each local item carrying a `notion:` ref: `notion-fetch` the page, compare
status/title to the local line. If they disagree **and** `last-synced:` shows the
pair was never reconciled to the current values, report
`[severity] surface-divergence — <id> ↔ <notion page> — <local vs notion>`.
`audit` is read-only; `reconcile` routes the actual fix through `sync-notion`
(one-sided auto, both-sided ask).

## Retry / health (fix-it, don't dodge — design §2.8)

- Connector **absent** (headless): skip the Notion leg, print one notice, keep going.
- Transient error (rate-limit / 5xx): **one** retry, then surface the error and
  leave the local item untouched (no half-write).
- A created Notion page but a failed back-ref stamp = an orphan on the board:
  re-run the stamp recipe with the returned page id; don't create a second page.
