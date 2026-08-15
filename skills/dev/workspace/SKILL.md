---
name: workspace
description: >-
  Use when the user says "add todo", "add tech debt", "add improvement", "add bug",
  "log work", "resume", "where am I", "what am I working on", "start item",
  "close item", "audit state", or "reconcile". Resolves each against Linear (workspace `thoven`,
  team `THV`) and the feature ledger BEFORE writing — searching first, then updating, creating,
  filing a decision or placing an artifact — and owns the derived cold-start Map and the appended
  session Log in ~/thoven/.workspace/STATE.md.
---

# Workspace — Unified Work-State

**Linear is the board.** Issues, ownership and status live there — spec at
`~/thoven/.workspace/SPEC-linear.md`, vocabulary at `CONTEXT.md`. This skill owns the two
things Linear is bad at: the derived cold-start **Map** and the appended session **Log** in
`STATE.md`. Everything else it does is a thin path into Linear.

The Map is derived, so it cannot drift the way a hand-maintained banner does. Never hand-edit it.

> **Migration complete, 2026-08-15.** Capture resolves into Linear and the ledger. The three registers
> are **an archive** — 208 legacy items, nothing new ever captured there, though an item Andres
> rules dead is still closed there, because `resume` derives the Map from them.
> The Notion layer (`promote`, `sync-notion`, `add-prd`, the `notion:` and
> `last-synced:` fields, `references/notion.md`, `tools/sync.js`, `tools/lane.js`,
> `tools/board.js`) is **deleted**, not deprecated. There is no sync, because Linear is the
> store — there is no second copy to reconcile.

## Store layout

`~/thoven/.workspace/` is its own git repo. FE and BE sessions share one truth.

| File | Holds | State |
|---|---|---|
| `STATE.md` | Derived **Map** + appended **Log** (last ~10) | **live** |
| `TODO.md` · `TECH_DEBT.md` · `FUTURE_IMPROVEMENTS.md` | Legacy items, `td-`/`dd-`/`fi-` ids | **archive — close, never add** |

**"Close, never add" is not the same as read-only.** `resume` derives the Map from these files, so
an item Andres rules dead has to be closed here or it reads as in-flight forever. Closing is the one
permitted write; capture is not. The four **repo** registers (`frontend/`, `backend/` `TODO.md` and
`TECH_DEBT.md`) are stricter — those are *do not tick*, because nothing derives from them.

**Per-repo, do NOT move into the store:** `CHANGELOG.md` and `docs/*/.dev/MANIFEST.md` stay
in each app repo — the store *reads* them, it does not own them.

## Linear, in one screen

Workspace `thoven`, team `THV`.

`Triage → Backlog → Todo → Speccing | In Progress → Ready → Done`

- **`Speccing` and `In Progress` are sibling lanes, never steps.** An issue carrying a
  `Writes to:` line goes to `Speccing` (brainstormed with Andres, no code); one without goes
  to `In Progress`.
- **`In Progress` is the lock** — one issue, one agent session. Never claim one already taken.
- **No PRs.** Finish at `Ready`. Andres merges locally, and the merge commit (`Fixes THV-<id>`)
  moves it to `Done` by itself. **A verb in this skill never writes `Done`.**
- **Labels:** `needs-triage`, `ready-for-agent`, `Bug`, `Improvement`, `Feature`.
  Full mapping: `frontend/docs/agents/triage-labels.md`. **Do not invent labels** — Linear
  rejects case-variant duplicates and cannot rename.

### Reaching Linear

The Linear MCP tools are deferred. Load them before the first call:

```
ToolSearch: select:list_issues,save_issue,list_issue_statuses,save_comment
```

If the MCP is not authorized, **stop and say so** — tell Andres to run `/mcp` in an
interactive `claude`. Do not fall back to writing the item into a frozen register.

## Verb index

| Verb | Triggers on | Behavior |
|---|---|---|
| `capture` | "add todo", "add tech debt", "add improvement", "add bug" | **resolve first** — search, classify, then update / create / file a decision / place an artifact |
| `start-item` | "start item", "starting on", "working on THV-\<n\>" | move to `Speccing` or `In Progress` |
| `close-item` | "close item", "done" | move to `Ready` — **never** `Done` |
| `log` | "log work" | delegate to session-memory: append to STATE `## Log` |
| `resume` | "resume", "where am I" | regenerate the Map, print it + Linear's live lanes |
| `audit` | "audit state" | read-only drift report, zero writes |
| `reconcile` | "reconcile" | apply the fixes `audit` proves safe; ask on judgment calls |

---

## `capture` — resolve first, then write

**This verb is not "create an issue."** Creating is one of four outcomes, and usually the wrong
one. Sprawl is what happens when it is the only one — 103 feature directories across six
conventions, and a 150-row decision list that contradicts itself.

The input is a thought, mid-work: *"let's cut the parent onboarding flow to two steps."* That
sentence is a **decision**, not a ticket. Filing it as a new issue loses it (nothing links to
it), duplicates it (a Milestone already covers onboarding), and leaves the PRD saying four
steps. Three failures from one reflex.

### Step 1 — Locate

Which of the six Features? Which Milestone inside it? Ask if you cannot tell. **Never invent a
Project or a Milestone.**

### Step 2 — Search before you write. Not optional.

Ledger rule 3: *thirty seconds, and the single step whose absence caused the worst finding of
the 2026-08-14 audit.* Three places:

| Where | How | Looking for |
|---|---|---|
| Linear | `list_issues` with `query` + `project`, and read the **Milestone descriptions** — they cite work-item ids and carry the traps | an issue or Milestone that already owns this |
| `decisions/*.md` | grep the feature folder | a decision that already rules this, or contradicts it |
| `design/VERSIONS.md` + `drawings/` | read the rows, **and the REJECTED blocks** | a design that already tried this and threw it out |

**A REJECTED block inside a superseded drawing is the thing that caught the worst defect.** Read
those before proposing a layout. If the search finds the thought was already rejected, say so and
stop — that is a successful capture.

### Step 3 — Classify. Four kinds, four different writes.

| It is | Write it to | Linear |
|---|---|---|
| a **decision** — a ruling about how something should be | a row in `decisions/product.md` · `architecture.md` · `api.md` · `design.md` | **no new issue.** Comment on the affected issue linking the row |
| a **change to tracked work** | — | `save_issue` **update** the existing issue |
| **new work** — an agent could claim it and open a branch | — | `save_issue` **create**, with Project + Milestone + labels |
| an **artifact** — PRD, spec, design doc | agent reads it *during* work → local feature folder · human reads it to *orient* → **Linear Document** on the Project (SPEC §6) | link it from the issue |

**The test for "new work" is SPEC §7.4's:** would an agent claim this and open a branch? If no,
it is not an issue. A dogfood observation is not an issue; the bug it turns into is.

⚠️ **No Feature has a `decisions/` folder today** — verified 2026-08-15, all six are empty of it,
and only `materials-homework` and `student-2.0` have even a `PRD.md` + `VERSIONS.md`. So a
decision usually has **nowhere to land**. When that happens: **stop and offer
`feature-ledger open`.** Do not invent a path, do not drop the decision into the issue body as
prose. Prose describing a decision with no source to cite is exactly what produced `E18`.

### Step 4 — Write every layer it touches

The other failure mode is the partial update: the issue moves, the PRD still says the old thing.
Before you finish, name every layer the change touches and either write it or report the gap:

```
decision row      decisions/<file>.md
the issue         title · body · labels · Project · Milestone
the Milestone     its description, if scope moved
the PRD           if the problem statement changed
the design        VERSIONS.md, if a proto is now superseded
```

**Superseded and rejected are handled differently** (ledger rule 8): a superseded decision row is
**deleted** — a contradictory ledger is the disease. A rejected alternative is **kept**, inside
the drawing. And an issue is never deleted — set it `Canceled` with a comment saying why, so the
id keeps resolving.

### Step 5 — Report both halves

Say what you wrote **and what you deliberately did not.** "Updated THV-4 and the Milestone;
did not touch the PRD because the problem statement is unchanged" is a complete capture. Silence
about a layer reads as "it was fine", and that is how `files_count` shipped.

### Setting the fields, when you do create

- **Kind → label.** Broken → `Bug`. Existing thing improved → `Improvement`. New capability →
  `Feature`. Tech debt → **no kind label**; say "tech debt" in the title, P-level in the body.
  There is no `tech-debt` label and you may not create one.
- **Agreed, or not?** Not yet discussed with Andres → `Triage` + `needs-triage`. Already agreed
  and specced → `Todo` + `ready-for-agent`. **When in doubt, `Triage`.**
- **Project and Milestone are both required** on anything inside Thoven 2.0. An issue with a
  Project and no Milestone is invisible in the Shipping view — that is how work goes quiet.

**The body:**

```markdown
## Why
<the reason, one short paragraph>

## Done when
<observable — assert the compiled CSS, the real payload, the presence of the key, the mount>

## Writes to
<path>          ← include ONLY for Speccing-lane work. Its presence decides the lane.

## Decisions
<links to decisions/*.md — a Linear issue POINTS at a decision, it never restates one>
```

**Never invent a document path.** If an issue needs a `Writes to:` and you do not know it,
ask in a comment rather than guessing.

## The seam with `feature-ledger`

Written after this skill was, so the boundary was never stated. It is one line:

> **Linear owns *who is doing what, right now*. The ledger owns *why the design is what it is*.**
> A Linear issue never restates a decision — it links to one.

That rule matters more here than anywhere else, because a Linear description is easier to write
than a `decisions/` row. The path of least resistance is to paraphrase the design into the ticket,
and that is precisely what produced `E18`: prose describing a layout the proto's REJECTED block
had already thrown out, which then passed every downstream gate because each one checked the prose.

| You are about to | Reach for |
|---|---|
| start a large feature | `feature-ledger open` — **before** creating its issues |
| file a decision and the folder does not exist | `feature-ledger open`, then file it |
| write a plan or a PRD | `feature-ledger reconcile` first — a plan written against an unbalanced ledger freezes the imbalance |
| find a doc and the code disagreeing | `feature-ledger reconcile` |
| resolve a `VERSIONS.md` owning gate | it must be a pasted `THV-` URL, never a prose name |

**A feature folder and a Linear Project are one thing seen twice.** The folder holds the
reasoning; the Project holds the state. If a Feature has one and not the other, that is the
imbalance — say so.

## `start-item`

Marks "work on this begins now", so the lane moves when the work moves.
Triggers implicitly too: when a session starts executing a tracked issue, run this — don't
wait to be asked.

1. **Check the lock first.** `list_issues` with `state: "In Progress"`. If the issue is
   already there, another session owns it — **stop**, do not claim it.
2. Read the issue. **Has a `Writes to:` line → `Speccing`. No `Writes to:` → `In Progress`.**
3. `save_issue` with the new `state`, and `assignee: "me"`.
4. Branch `THV-<id>-short-slug`. Linear's copy-branch button produces `andres/thv-1-slug` —
   ignore it, our convention has no name prefix.

## `close-item`

**Move to `Ready`. Never `Done`.** `Ready` means the work is finished and unmerged; Andres
merges locally and the merge commit moves it to `Done` through the GitHub integration. A verb
that writes `Done` steals a step the human owns.

**Not sure it really shipped?** Don't close — run `audit`/`reconcile`, which apply the
done-check below.

`save_issue` with `state: "Ready"`. If anything was learned that the next person needs, put
it in a comment before moving it.

## `log`

Invoke the **session-memory** skill — it summarizes the session, does the conditional
clarify-first, and appends the entry to STATE `## Log` (newest-first, trimmed to ~10). Do not
append here directly.

There is no flush step. Linear is already current, because the verbs wrote to it directly.

---

## Verbs — read & integrity

### The "done" ground truth

A unit of work is **done** only when BOTH hold:

1. **Merged to `main`** — `git -C <repo> branch --merged main` lists its branch, OR its
   commits are already on `main`.
2. **In a published CHANGELOG version** — the feature appears under a *versioned* heading
   (e.g. `## [2.13.0]`), NOT under `## [Unreleased]`.

Anything failing either test is "claimed, not proven" — it stays as-is and goes on the
human-review list. **Never guess** a feature shipped.

### `resume` — the honest banner

Two halves: the derived Map (legacy archive + stale manifests) and Linear's live lanes.

**Half 1 — regenerate the Map:**

```bash
node -e '
const {regenerateMap}=require(process.env.HOME+"/.claude/skills/workspace/tools/regen.js");
const {findStaleManifests}=require(process.env.HOME+"/.claude/skills/workspace/tools/reconcile-manifests.js");
const fs=require("fs"), W=process.env.HOME+"/thoven/.workspace";
const registers=[{file:"TODO.md"},{file:"TECH_DEBT.md"},{file:"FUTURE_IMPROVEMENTS.md"}];
const items=regenerateMap({storeDir:W,registers});
const repos=[["frontend",process.env.HOME+"/thoven/frontend"],["backend",process.env.HOME+"/thoven/backend"]];
let manifests=[];
for(const [name,dir] of repos){ try{ for(const s of findStaleManifests({repoDir:dir})) manifests.push(`- manifest:${name} [${s.phase}] ${s.feature} (verify shipped via git+CHANGELOG)`);}catch(e){ console.error("resume: skipped "+name+" ("+e.code+")"); } }
const body=[items, manifests.join("\n")].filter(Boolean).join("\n")||"_(empty)_";
let s=fs.readFileSync(W+"/STATE.md","utf8");
s=s.replace(/## Map\n[\s\S]*?\n## Log/,"## Map\n_regenerated by `workspace resume` — do not hand-edit_\n\n"+body+"\n\n## Log");
fs.writeFileSync(W+"/STATE.md",s);
const log=(s.split("## Log")[1]||"").split("\n").filter(l=>l.startsWith("- ")).slice(0,3);
console.log("=== MAP (legacy archive + manifests) ===\n"+body+"\n\n=== recent log ===\n"+(log.join("\n")||"_(none)_"));
'
```

**Half 2 — the live lanes.** `list_issues` for team `THV` in `Speccing`, `In Progress` and
`Ready`, and print them under `=== LINEAR ===`. **This half is the one that matters** — the
Map's register items are a frozen archive, so a Map entry is history, not work in flight.
Say which is which when you print them; never let the archive read as current.

Then apply the **done ground truth** to each manifest line before trusting it as in-flight.
A manifest still showing `ship`/`validate` whose feature is merged + published is **stale**,
and that is `reconcile`'s job.

### `audit` — read-only drift report

**Zero writes.** Report drift in severity order. **To APPLY fixes, run `reconcile`.**

| Class | Detect |
|---|---|
| stale-manifest | `findStaleManifests` returns it, but its feature passes the done-check |
| lock-collision | two issues in `In Progress`, or one assigned to nobody |
| wip-breach | `In Progress` + `Ready` exceeds 3 (`Speccing` is **outside** the cap) |
| ghost-path | an issue's `Writes to:` names a path that does not resolve in its worktree |
| orphan-decision | an issue restates a decision instead of linking one in `decisions/*.md` |
| archive-drift | a frozen-register item is `status:open` but its `git:` branch is merged + published |

Output a ranked list: `[severity] <class> — <issue/manifest> — <suggested fix>`.
Do not change any file.

### `reconcile` — apply what's provable

Take `audit`'s findings. **Auto-apply** only fixes the done-check proves safe; **ask** on
every judgment call.

- **stale-manifest** → set `Current Phase → shipped` ONLY when the feature is merged to
  `main` AND in a published CHANGELOG version:

  ```bash
  node -e '
  const fs=require("fs"), p=process.argv[1];
  let s=fs.readFileSync(p,"utf8");
  s=s.replace(/(\|\s*\*\*Current Phase\*\*\s*\|\s*)([^|]*?)(\s*\|)/i,"$1shipped$3");
  fs.writeFileSync(p,s); console.log("shipped: "+p);
  ' "<manifest path>"
  ```

- **archive-drift** → report it and stop. Closing an archived item is **Andres’s ruling**, never an
  inference from a merged branch. Ask; do not auto-close.
- **lock-collision · wip-breach · ghost-path · orphan-decision** → Andres's call, every time.
  Report and stop. Cutting WIP is a human decision, not a cleanup.

**Run `audit` first — `reconcile` consumes its findings.**

---

## Reading the frozen archive

Only needed when tracing a legacy `td-`/`dd-`/`fi-` id cited somewhere. An archived item is a
markdown line plus a trailing HTML comment:

```
- [ ] Fix X race <!-- id:td-a1b2 type:todo status:open links: git:fix/x repo:frontend -->
```

Parse with `item.js` `parseLine`. `[x]` means `status:done`. `git:` is the branch it lived on,
`repo:` is `frontend` | `backend` | empty. **Only ever `serialize` back to flip a `status:` to done.** Never to add a line.

⚠️ **`TD-###` ids fork per worktree and do not resolve globally.** 59 ids (`TD-157`→`TD-215`)
exist only on the materials branch, `TD-212` is cited as law in four `CLAUDE.md` files and
resolves in none of them, and `TD-194` is a genuine collision — two different entries, one
number. **A cited id that does not resolve in your worktree is expected, not a bug in your
checkout.** Say so rather than hunting.

## Helpers (`tools/`, zero-dep, `node --test`)

| Helper | Exports | Used by |
|---|---|---|
| `item.js` | `parseLine(line)`, `serialize(item)` | reading the archive |
| `ids.js` | `mint(type)`, `typeOf(id)`, `PREFIXES` | archive ids only — **new work gets a `THV-` id from Linear** |
| `regen.js` | `regenerateMap({storeDir, registers})` | `resume` |
| `reconcile-manifests.js` | `findStaleManifests({repoDir})` | `resume`, `audit`, `reconcile` |
| `register.js` | `insertItem`, `insertUnderSection` | **unused — registers are frozen** |

## Common Mistakes

| Mistake | Instead |
|---|---|
| Writing a *new* item into `TODO.md` / `TECH_DEBT.md` / `FUTURE_IMPROVEMENTS.md` | Archive. Capture creates a Linear issue. Closing a dead one there is fine — adding is not |
| `close-item` writing `Done` | `Ready`. The merge commit writes `Done` |
| Claiming an issue already in `In Progress` | That is the lock. Check first, pick another |
| Guessing a `Writes to:` path | Ask in a comment. An invented path is how `docs/` sprawled to 103 dirs |
| Restating a decision in an issue body | Link it in `decisions/*.md`. A restated decision is what `E18` did |
| Creating an issue for a thought that is a **decision** | File the decision. Comment the link on the issue it affects |
| Creating without searching Linear, `decisions/` and the REJECTED blocks first | Step 2. It is thirty seconds and it is the step whose absence caused the worst 2026-08-14 finding |
| Filing a decision as prose because the feature has no `decisions/` folder | Stop, offer `feature-ledger open`. None of the six Features has one yet |
| Updating the issue and leaving the PRD, Milestone or `VERSIONS.md` stale | Step 4 — write every layer it touches, or say which you skipped and why |
| Creating an issue with a Project but no Milestone | Invisible in the Shipping view. Both, or ask |
| Deleting an issue | `Canceled` + a comment. The id must keep resolving |
| Deleting a REJECTED block while tidying | Ledger rule 8 — delete **superseded** rows, keep **rejected** alternatives |
| Creating a label that "should" exist | Linear can't rename and rejects case-variants. Ask first |
| Hand-editing the `## Map` zone | It's derived — fix the source, re-run `resume` |
| Reading a Map entry as work in flight | The Map's register half is a **frozen archive**. Linear's lanes are the live half |
| Treating an unresolvable `TD-###` as a broken checkout | The register forked per worktree. Expected |
| Falling back to a local file when the Linear MCP is unauthorized | Stop and say so. A local write nobody reads is worse than no write |
