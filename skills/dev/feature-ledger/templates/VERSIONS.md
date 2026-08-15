# VERSIONS — <feature>

What is authoritative and what is superseded. **Read this before building against any proto,
and before resolving any decision about a surface it covers.**

## Status vocabulary

`SUPERSEDED` alone hid a live lock for six weeks. Use one of:

- **`LOCKED`** — build from it.
- **`AT THE GATE`** — drafted, awaiting a ruling.
- **`SUPERSEDED`** — dead outright. Nothing in it binds.
- **`SUPERSEDED AS A SOURCE · LIVE AS A LOCK`** — build from the successor, but its decisions
  and its REJECTED block still bind. Say in the row *what* still binds.
- **`PARTLY SUPERSEDED`** — say which half died and which half survives.

## Where the final design lives

| Level | Path | Format |
|---|---|---|
| L1–L3 | `design/drawings/*.html` | HTML + CSS, runnable |
| L4 | `app/dev/<feature>/page.tsx` | running React, **the app repo** |
| L5 | the shipped components | code |

## The protos

| Proto | Level | Status | Superseded by | Owning gate |
|---|---|---|---|---|
| | | | | must open |
