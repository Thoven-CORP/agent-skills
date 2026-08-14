# workspace — unified work-state skill

A Claude Code skill for tracking cross-repo work-state (todos, tech debt,
improvements, PRDs, bugs) in **one** store shared by every session and every
repo. Installed at `~/.claude/skills/workspace/`; invoked via the Skill
mechanism (`/workspace …`) or its verb triggers ("add todo", "resume", etc.).

## Core idea: the Map is *derived*, never hand-edited

The old failure mode was a hand-maintained "current phase" banner that lied as
soon as work moved. Here, `STATE.md`'s **Map** is *regenerated* from the
registers (+ `.dev/MANIFEST.md` files + git) every time you run `resume`. If the
Map is wrong, you fix the underlying item and re-run `resume` — you never edit
the Map directly.

A unit of work is **done** only when it's *both* merged to `main` **and** in a
published CHANGELOG version. Anything else is "claimed, not proven" and stays on
the human-review list.

## The store (lives outside this skill)

`~/thoven/.workspace/` — its own git repo, shared by frontend + backend sessions.

| File | Holds |
|------|-------|
| `STATE.md` | Derived **Map** (regenerated) + appended **Log** (last ~10 session notes) |
| `TODO.md` | Todos (`## In Progress`, optionally `## Backlog`) |
| `TECH_DEBT.md` | Tech-debt items (P0–P3) |
| `FUTURE_IMPROVEMENTS.md` | Deferred improvements |

Per-repo `CHANGELOG.md` and `docs/**/.dev/MANIFEST.md` stay in each app repo —
the store *reads* them, it doesn't own them.

## Type registry

Every item has an authoritative `type:` and an immutable, type-prefixed ID
minted at birth (never reused, never rewritten).

| type | prefix | Home |
|------|--------|------|
| `todo` | `td-` | `TODO.md` |
| `techdebt` | `dd-` | `TECH_DEBT.md` |
| `improvement` | `fi-` | `FUTURE_IMPROVEMENTS.md` |
| `task` | `tk-` | promoted todo (Notion Dev Tracker) |
| `bug` | `bg-` | `TECH_DEBT.md` pointer + Notion Bug Log |
| `prd` | `pr-` | spec in `docs/superpowers/specs/` + `TODO.md` tracker |

## Verbs

| Verb | Does |
|------|------|
| `resume` | Regenerate the Map (registers + manifests + git), print the honest "where am I" |
| `add-todo` / `add-techdebt` / `add-improvement` | Mint a tracked item |
| `close-item` | Flip an item to done (drops it from the Map) |
| `log` | Append a dated session note to the STATE Log |
| `audit` / `reconcile` | Read-only drift report / apply git-confirmed-safe fixes |
| `promote` / `add-bug` / `add-prd` / `sync-notion` | Notion-board integration (connector-gated) |

## Tools (`tools/`, zero-dep, `node --test`)

| Module | Exports |
|--------|---------|
| `ids.js` | `mint(type)`, `typeOf(id)`, `PREFIXES` |
| `item.js` | `parseLine(line)`, `serialize(item)` |
| `regen.js` | `regenerateMap({storeDir, registers})` |
| `reconcile-manifests.js` | `findStaleManifests({repoDir})` |
| `register.js` | `insertUnderSection(content, sectionNames, line)`, `insertItem(filePath, sectionNames, line)` — section-anchored insert with priority fallback; **throws** rather than silently dropping an item if no section matches |

Conventions are law: item lines are always written via `item.js` `serialize(...)`
(never hand-formatted), and IDs always come from `ids.js` `mint(type)` (never
invented). The capture verbs share `register.js` so "which section, fail loud if
absent" lives in exactly one place.

### Run the tests

```bash
node --test tools/*.test.js
```

## Notion layer

The `promote` / `sync-notion` / `add-bug` / `add-prd` verbs write to Notion
boards and require the Notion MCP connector in an interactive session. DB-IDs,
board schemas, and 3-way sync rules live in `references/notion.md`. Local verbs
work with or without the connector.
