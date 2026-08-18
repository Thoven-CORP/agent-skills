---
name: workspace
description: >-
  The Linear update tool. Use whenever Andres talks about work in prose: "ok that's done",
  "wrap up", "we should cut onboarding to two steps", "where am I", "what's next", "something's
  off", "log this", "add a todo", "found a bug". Reads the evidence (commits, dirty files, the
  feature ledger, CHANGELOGs, Linear itself), works out what he is trying to do, proposes the
  writes, and on his go applies them across Linear, the STATE Log, CONTINUE_HERE and the
  ledger. Never requires him to name a verb.
---

# Workspace

**Andres speaks in prose. This skill works out what he meant.** There is no verb to remember and
no command to type; `/workspace` plus whatever he said is the whole interface.

**`~/thoven/.workspace/WORKFLOW.md` is the law.** Containers, states, the lifecycle, the feature
folder and the label set all live there. **This skill points at it and never restates it.** What
this skill owns is getting work *into* Linear, plus the two things Linear is bad at: the derived
cold-start **Map** and the appended session **Log** in `STATE.md`.

## How to read this skill

**Two kinds of instruction here, and they bind differently.**

- **Bold rules and ⚠️ blocks are exact.** Every one of them exists because getting it wrong
  fails *silently*: you get a confident answer that is not true. Do not paraphrase them.
- **Everything else, including every command, is a reference implementation.** Paths, formats
  and shell one-liners describe intent. When reality differs, adapt. You can find the newest
  date in a file without being told its regex.

**Assume the shape of the world will differ slightly from what is written here, and work it
out.** Both failures on this skill's first run were hardcoded strings rather than bad judgment
(a bare `--since` that assumed midnight, a `## Log` anchor that assumed a blank line). Reserve
exactness for the places where being wrong is invisible.

## The one rule

> **Evidence leads. His words are a tiebreak.**

"Parent dashboard" routes four different ways in this codebase:
`Parent 2.0 → The parent dashboard IS the student dashboard`, `Parent 2.0 → A parent can pull
their child's content`, `Student 2.0 → One viewer, capabilities from the server`, and
`Materials & Homework → Parent submission review`. A keyword match on "parent" is wrong three
times in four. `components/parent/homework/` on `feature/materials-homework-2.0` is wrong none.

So route from the world, not the sentence. And **when they disagree, say so**, which is the most
useful moment this skill has:

> *"You said Parent 2.0, but you're committing to `feature/materials-homework-2.0`. Which?"*

## Four intents, internal and never typed

Classify what he is trying to do. He never names one; the names below exist so the **write
permissions** differ, which is what keeps a wrong guess cheap.

| He says something like | Intent | May write |
|---|---|---|
| "ok that's done" · "wrap up" · "logging off" | **log** | comments · status moves when proven · Log · CONTINUE_HERE. **Never opens an issue** |
| "we should cut onboarding to two steps" · "found a bug in X" | **capture** | a decision row · an issue update · **the only intent that may create an issue** |
| "where am I" · "what's next" · `/workspace` bare | **orient** | **nothing** |
| "does this match reality" · "something's off" | **check** | nothing without proof |

Half-log-half-decision is common, as in *"that's done, and we should cut onboarding to two
steps."* **Do both.** Do not pick one and drop the other half.

## Two speeds

```
  cheap  (~2s, no subagents)     orient · capture
  deep   (fan out)               log · check
```

`orient` reads a Map that is already on disk. `capture` searches three specific places. Neither
needs the world read. **But cheap never means blind:** if the gate shows something big, such as
`main` moving 130 commits with nothing logged in four days, say so and offer the deep read.

---

## Step 1 · The gate (parent, ~2 seconds, no agents)

Runs on **every** invocation, both speeds. It decides which checkouts are worth reading.

**What it must determine,** for each checkout under `~/thoven`: its branch, how many commits are
its *own* since the watermark, and how many files are dirty. Anything with either is worth
reading. How you get those numbers is yours; below is one way that works today.

```bash
cd ~/thoven && for d in frontend* backend* .workspace agent-skills; do
  { [ -d "$d/.git" ] || [ -f "$d/.git" ]; } || continue
  b=$(git -C "$d" branch --show-current 2>/dev/null)
  if [ "$b" = "main" ]; then own=$(git -C "$d" log --since='<WATERMARK>T00:00:00' --oneline 2>/dev/null | wc -l | tr -d ' ')
  else own=$(git -C "$d" log main..HEAD --since='<WATERMARK>T00:00:00' --oneline 2>/dev/null | wc -l | tr -d ' '); fi
  dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  { [ "$own" != "0" ] || [ "$dirty" != "0" ]; } && printf "%-24s %-34s own:%-5s dirty:%s\n" "$d" "$b" "$own" "$dirty"
done
```

⚠️ **`main..HEAD`, never a bare `--since`.** A feature branch inherits `main`'s commits through
shared ancestry, so `--since` alone reports dormant branches as busy. Measured 2026-08-15:
`frontend-parent-2.0` showed **41 commits** under `--since=7d` and **0** under `main..HEAD`,
with both repos completely silent. The naive count would have made the quietest Project look
like the second-busiest thing on the board.

### The watermark

**When `~/thoven/.workspace/STATE.md` last had a Log entry committed,** a timestamp rather than
a date:

```bash
git -C ~/thoven/.workspace log -1 --format=%aI -- STATE.md
```

⚠️ **Use git's timestamp, not the date written in the entry.** Entries are dated to the day and
logging twice in one day is normal, so a date-only watermark re-reads everything since midnight.
On this skill's second run that meant 56 commits instead of 8, re-surfacing 29 Materials commits
logged an hour earlier.

The date in the prose is still the human-readable record; git holds the machine-readable one.
Entries are newest-first and their line format has drifted (some bold the date, some do not),
which is the other reason not to parse it. **If git gives you nothing, say so and fall back to a
wide window** rather than a narrow guess.

No second copy of state; nothing to drift or repair. If the last entry is old the window is wide,
which is the correct failure direction: over-scanning costs two seconds, under-scanning silently
loses work.

⚠️ **Always append `T00:00:00`.** Git parses a bare `--since=YYYY-MM-DD` as that date at the
**current time of day**, not midnight, so at 14:58 a bare watermark silently drops everything
committed earlier the same day, with no error and no way to notice.

```
--since=2026-08-15            →  0   ✗
--since=2026-08-15T00:00:00   →  2   ✓
```

**Two sources ignore the watermark entirely:**

| Source | Why always in scope |
|---|---|
| **dirty files** | uncommitted work has no date. `frontend-lessonspace` has 58 dirty files and 0 commits, which a date watermark would never see |
| **Linear's live lanes** | anything in `Speccing` / `In Progress` / `Ready` is live by definition, however old |

**Flexibility:** the watermark is a default, not a fence. Prose overrides it: *"since Friday"*,
*"everything"*, *"just materials"*. And the gate **always reports what it excluded**, so he can
say "also look at X".

---

## Step 2 · Fan out (deep path only)

**One read-only subagent per active checkout.** Not one per feature, not one per commit: a
checkout *is* a branch *is* a Project, which is the routing, and it is the natural isolation
boundary.

**The fan-out never writes.** Parallel writes are the partial-update failure multiplied by eight.

**Subagents return evidence. The parent does all routing and proposing.** A subagent seeing one
checkout will confidently route it wrong, because it cannot know that Materials spans
`frontend-direct-upload` *and* `backend-gcs-migration`, or that an issue was claimed elsewhere.
And eight agents proposing produces eight overlapping lists to reconcile by hand, which is the
work being handed off.

Give each agent the brief below. The parent holds all of them at once, so ask for **structured
findings, not prose essays**, roughly this shape. Fields that do not apply are said to be absent
rather than omitted silently, and an agent that learns something the shape has no slot for should
say it under `ambiguous` rather than drop it.

```yaml
checkout:   frontend-direct-upload
branch:     feature/materials-homework-2.0
project:    Materials & Homework          # or: unattributed
claimed:    THV-9                         # or: none
commits:    190                           # main..HEAD since watermark
  themes:                                 # cluster them; do not list 190 lines
    - <one line> (<sha>, <sha>)
dirty:      39                            # grouped by area, not enumerated
docs:
  STATE:    <path> · what it now claims
  IDEAS:    <path> · unresolved threads
  PRD:      <path> | absent
  DESIGN:   <path> | absent
missing:    [PRD, DESIGN]                 # roles with no doc: a ledger imbalance
ambiguous:
  - <anything it could not attribute, with why>
```

---

## Step 3 · The read-list. Named, not "look around."

`docs/thoven2.0/` is a symlink into `~/thoven/thoven2.0/` (its own git repo) and **resolves from
every worktree**, verified. Always cite that form.

### Tier 0 · the law. Once per session, never per feature.

```
~/thoven/CLAUDE.md                the nine rules · Feature Folders
.workspace/WORKFLOW.md            containers · states · lifecycle · feature folder · labels
docs/thoven2.0/00_ROUTER.md       where a doc belongs. Already law; cite, never restate
```

### Tier 1 · initiative. Once per run, **in the parent.**

```
docs/thoven2.0/00_STATE.md        the board narrative
docs/thoven2.0/ROADMAP.md         weeks · ship ladder · open decisions
docs/thoven2.0/WORKTREES.md       which branch owns which file. Two branches never own one file
```

Tier 1 lives in the parent because `WORKTREES.md`'s ownership table matters most when
*comparing* checkouts, which no subagent can do.

### Tier 2 · the feature. Each subagent, for its own checkout.

**Match by role, not filename.** The six features look nothing like each other: `materials-
homework` has 77 markdown files and its own conventions; `teacher-2.0`, `parent-2.0` and `coppa`
have exactly two each.

| Role | Typical | Also recognise |
|---|---|---|
| **STATE** | `<feature>/STATE.md` | present in 9/9, dead consistent |
| **IDEAS** | `<feature>/IDEAS.md` | `BRAINSTORM_HANDOFF.md`, `HANDOVER-*-brainstorm.md`, `*braindump*` |
| **PRD** | `<feature>/PRD.md` | `*requirement*`. Carries the user stories as `E#` |
| **DESIGN** | `<feature>/DESIGN_<PROJECT>.md` | `DESIGN_<PROJECT>.md` is the pre-2026-08-18 name and still on disk in three features · **and the REJECTED blocks inside the drawings** |

**IDEAS is the pre-PRD brainstorming doc. Read it even when a PRD exists,** because it holds the
threads that are still unresolved, which is exactly what a log or a capture needs to know.

**Resolution: role → depth → recency → report if ambiguous.**

- **Depth.** The live doc is at the **feature root**. Anything under `reference/`, `archive/`, or
  a dated subdirectory is history. This is what stops `reference/backend-sprint/PRD-v2-2026-07-08.md`
  being read as current; `materials-homework` has **three** PRD candidates.
- **Report the fork, never resolve it silently.** *"materials-homework has 3 PRD candidates; read
  `PRD.md`, ignored 2 under `reference/`."* Picking quietly is how four docs come to claim one
  surface.
- **A missing role is reported, not skipped.** *"teacher-2.0: STATE + IDEAS only, no PRD, no
  DESIGN_<PROJECT>.md."* That is a ledger imbalance surfacing for free.

### Tier 3 · the code side. Per checkout.

```
CHANGELOG.md                      half the done-check (the other half is merged-to-main)
2.0_NEXT.md                       worktree root, gitignored. Rebase state + roadmap position
docs/*/.dev/MANIFEST.md           stale-manifest detection
```

---

## Step 4 · Route

Two things get routed, and they come from different evidence.

**Branch → Project** is deterministic for four of six. Projects are Features
(`WORKFLOW.md` §6); this is the operational form:

```
feature/materials-homework-2.0   →  Materials & Homework      (frontend-direct-upload + backend-gcs-migration)
feature/student-2.0              →  Student 2.0
feature/teacher-2.0              →  Teacher 2.0
feature/parent-2.0               →  Parent 2.0 · signup · auth
main                             →  Design System, or unattributed. Needs other evidence
(no branch)                      →  COPPA Phase 2 / VPC, which has no worktree
```

**The order. First hit wins:**

1. **An issue already claimed** by him in `Speccing` / `In Progress`, which is decisive
2. **The branch**
3. **Files touched**, which separates the four "parent dashboard" cases
4. **The feature folder** he edited docs in
5. **What he said**, last and only as a tiebreak

**Kind of work → Milestone.** A Milestone is one stage of a Feature's lifecycle
(`WORKFLOW.md` §3), so the artifact the work produces names it:

```
PRD, ADR, api or database decision   →  PRD + Architecture
proto, surface row, token test       →  Design
code through both repos              →  Build
QA, walkthrough, merge               →  Review
```

A Feature that was trimmed to three milestones has no fourth to route into; check the Project
before assuming the stage exists.

### Unattributed is a first-class bucket

Measured 2026-08-15, and it is large:

```
main (frontend + backend)   203 commits   design system · docs · hotfixes. No branch by design
.workspace + agent-skills    66 commits   tooling. No Project at all
frontend-sweepstakes         18 commits   active, and it has no Project
lessonspace (FE+BE)          85 dirty     frozen, but uncommitted work is sitting there
thovie ×4                    18 dirty     parked
no trace at all                   ·       THV-1's walkthrough; a decision said out loud
```

**Unattributed work is reported, never filed.** Say *"these three commits map to no issue"* and
offer `capture`. Opening a card for each is how the board fills with forty orphans in a week.

That last row, work that left no trace, is the one only **asking** can reach. Which is why:

## Step 5 · Ask, but only where it is genuinely unclear

Confident cases do not ask. Ambiguous ones ask **one** question, with the evidence attached:

> *"Three commits on `feature/materials-homework-2.0` touch `components/student/homework/`. The
> ledge sweep, or the student write flow?"*

**His say-so is proof.** *"Yeah that's done"* is sufficient evidence for a `→ Ready` proposal.
Do not go verify the CHANGELOG first. The hard done-check belongs to `check`, which runs
unprompted.

## Step 6 · One proposal, one voice

Never eight lists. One block, showing exactly what will be written:

```
THV-9   Materials & Homework · Build · student write flow
        + comment (7 commits, 2 SHAs)
        → Ready          because: you said done · branch exists · CHANGELOG entry added

THV-4   Parent 2.0
        + comment linking the onboarding decision
        status unchanged

PRD.md                 NEW ROW E12: onboarding is two steps
                       ⚠ parent-2.0 has no PRD.md → offer `feature-ledger open`

STATE ## Log           entry
CONTINUE_HERE.md       materials-homework: what was tried, what to be careful of

NOT touched:  DESIGN_<PROJECT>.md (no surface changed) · decisions/api.md (no field moved)
UNATTRIBUTED: 203 commits on main · 18 on sweepstakes, no issue. `capture`?
```

Then wait. **Nothing is written before he says go.**

## Step 7 · Write serially, fanned across surfaces

One at a time, never in parallel. The surfaces and their owners:

| Surface | Owner |
|---|---|
| Linear issues, comments, status | this skill, via MCP |
| `.workspace/STATE.md` `## Log` | **session-memory** |
| `<feature>/CONTINUE_HERE.md` | **session-memory** |
| `PRD.md` · `decisions/*.md` · `DESIGN_<PROJECT>.md` | **feature-ledger** |

**Name every surface skipped.** *"Updated THV-4 and logged the session; did not touch the PRD
because the problem statement is unchanged"* is a complete write. Silence about a layer reads as
"it was fine", and that is how `files_count` shipped.

**Status rules:** comments always, because they are append-only and cannot contradict anything.
Status moves only with the evidence shown. **`Done` is never written by this skill**; the merge
commit (`Fixes THV-<id>`) owns that transition.

## Step 8 · Always advance

> **Every run writes a Log entry and advances the watermark, even when nothing changed.**

*"Read 8 checkouts, nothing to update"* is a valid entry. If entries were written only when
something happened, a quiet week stalls the watermark and the window grows unbounded, which is
how the Map earned its reputation for lying. The Map is derived, so every run refreshes it free.

---

## `capture` · resolve first, then write

**Not "create an issue."** Creating is one outcome of four and usually the wrong one. Sprawl is
what happens when it is the only one: 103 feature directories across six conventions.

*"Let's cut the parent onboarding flow to two steps"* is a **decision**, not a ticket. Filed as a
new issue it loses it (nothing links to it), duplicates it (an issue already covers onboarding),
and leaves the PRD saying four steps. Three failures from one reflex.

**Search before writing, three places, not optional.** Ledger rule 3: thirty seconds, and the
single step whose absence caused the worst finding of the 2026-08-14 audit.

| Where | Looking for |
|---|---|
| Linear, issues **and the Project description**, which cite work-item ids and carry the traps | something that already owns this |
| the feature's `PRD.md` and `decisions/*.md` | a ruling that already covers or contradicts it |
| `DESIGN_<PROJECT>.md` **and the REJECTED blocks** | a design that already tried this and threw it out |

**If the search finds it was already rejected, say so and stop.** That is a successful capture.

**Then classify. Four kinds, four writes:**

| It is | Goes to | Linear |
|---|---|---|
| a **decision** | the file its prefix names (`WORKFLOW.md` §5) | **no new issue.** Comment the link on the affected issue |
| a **change to tracked work** | nothing local | **update** the existing issue |
| **new work** an agent could claim and open a branch for | nothing local | **create**, with Project + Milestone + labels |
| an **artifact**, meaning a PRD, spec or design | the feature folder, at the path the issue's `Writes to:` line names | **link** it |

**The prefix names the kind. One series per kind, across the audience.**

```
E#     PRD.md                      user stories
ADR#   decisions/architecture.md   frontend and backend
A#     decisions/api.md            endpoints and payload fields
DB#    decisions/database.md       schema, migrations, indexes
D#     DESIGN_<PROJECT>.md            one row per surface
```

⚠️ **Documents live in the repo and Linear links to them.** A Linear Document holding a second
copy of a PRD, spec or design is the drift this rule exists to prevent.

⚠️ **A decision needs a folder to land in.** `teacher-2.0`, `student-2.0` and `materials-homework`
carry a `decisions/`; the rest do not. Where there is none, stop and offer `feature-ledger open`.
Invent no path, and keep the decision out of an issue body as prose, because prose describing a
decision with no source to cite is what produced `E18`.

**Fields, when creating:**

- **Project and Milestone are both required** inside Thoven 2.0. The Project is the Feature. The
  **Milestone is the lifecycle stage**, and the kind of work names it: writing a doc lands in
  `PRD + Architecture` or `Design`, wiring code lands in `Build`, QA lands in `Review`. A Project
  with no Milestone is invisible in the Shipping view, which is how work goes quiet.
- **A `Writes to:` line if and only if the output is a document.** One literal line, one path:
  `Writes to: thoven2.0/teacher-2.0/decisions/api.md`. **That line is what routes the issue to
  `Speccing`; without it the issue goes to `In Progress`.** So a `PRD + Architecture` or `Design`
  issue carries one, and a `Build` or `Review` issue carries none.
- **A `Done when:` line always,** naming something a person can check. For a spec issue that is
  "the document exists at the path above, and says X".
- **A Build issue is vertical through both repos** and demoable alone (`WORKFLOW.md` §2). Split it
  by repo and both suites pass while the product is broken.
- **Agreed?** Not yet discussed → `Triage` + `needs-triage`. Agreed and specced → `Todo` +
  `ready-for-agent`. **When in doubt, `Triage`.**
- **Labels: apply three** (`WORKFLOW.md` §6). `needs-triage` · `ready-for-agent` · `Bug`, and
  `Bug` is capitalised because that is the label that exists. Linear rejects case-variant
  duplicates and cannot rename, so a lowercase `bug` creates a second label nobody can merge away.
  `feat` is the default and carries no label; tech debt says "tech debt" in the title with the
  P-level in the body. `Improvement` and `Feature` exist from an earlier import: leave them, do
  not apply them. **Take a label from that list rather than inventing one.**

**Superseded vs rejected** (ledger rule 8): a superseded decision row is **deleted**, because a
contradictory ledger is the disease. A rejected alternative is **kept**, inside the drawing. An
issue is never deleted; `Canceled` with a comment keeps the id resolving.

## `orient` · where am I

Gate scan, then the Map, then Linear's live lanes. Writes nothing.

```bash
node -e '
const {regenerateMap}=require(process.env.HOME+"/.claude/skills/workspace/tools/regen.js");
const {findStaleManifests}=require(process.env.HOME+"/.claude/skills/workspace/tools/reconcile-manifests.js");
const fs=require("fs"), W=process.env.HOME+"/thoven/.workspace";
const registers=[{file:"TODO.md"},{file:"TECH_DEBT.md"},{file:"FUTURE_IMPROVEMENTS.md"}];
const items=regenerateMap({storeDir:W,registers});
const repos=[["frontend",process.env.HOME+"/thoven/frontend"],["backend",process.env.HOME+"/thoven/backend"]];
let manifests=[];
for(const [name,dir] of repos){ try{ for(const s of findStaleManifests({repoDir:dir})) manifests.push(`- manifest:${name} [${s.phase}] ${s.feature} (verify shipped via git+CHANGELOG)`);}catch(e){ console.error("orient: skipped "+name+" ("+e.code+")"); } }
const body=[items, manifests.join("\n")].filter(Boolean).join("\n")||"_(empty)_";
let s=fs.readFileSync(W+"/STATE.md","utf8");
s=s.replace(/## Map\n[\s\S]*?\n## Log/,"## Map\n_regenerated by `workspace` — do not hand-edit_\n\n"+body+"\n\n## Log");
fs.writeFileSync(W+"/STATE.md",s);
const log=(s.split("## Log")[1]||"").split("\n").filter(l=>l.startsWith("- ")).slice(0,3);
console.log("=== MAP (frozen archive + manifests) ===\n"+body+"\n\n=== recent log ===\n"+(log.join("\n")||"_(none)_"));
'
```

Then `list_issues` for `Speccing` · `In Progress` · `Ready` and print under `=== LINEAR ===`.

**Label the halves.** The Map's register items are a **frozen archive**, history rather than work
in flight. Linear's lanes are the live half. Letting the archive read as current is the failure
the freeze created.

## `check` · does the board match reality

Deep path. **Zero writes without proof.**

**The "done" ground truth.** A unit of work is done only when **both** hold: its branch is merged
to `main` (or its commits already are), **and** the feature appears under a *versioned* CHANGELOG
heading rather than `## [Unreleased]`. Anything failing either test is "claimed, not proven".

| Class | Detect |
|---|---|
| stale-manifest | `findStaleManifests` returns it, but the feature passes the done-check |
| lock-collision | two issues in `In Progress`, or one assigned to nobody |
| wip-breach | `In Progress` + `Ready` over 3 (**`Speccing` is outside the cap**) |
| ghost-path | an issue's `Writes to:` names a path that does not resolve in its worktree |
| orphan-decision | an issue restates a decision instead of linking one |
| milestone-drift | an issue whose work is code sitting in `PRD + Architecture` or `Design`, or a spec issue with no `Writes to:` line |
| ledger-imbalance | a Project whose feature folder has no `PRD.md`, no `DESIGN_<PROJECT>.md`, or two docs claiming one surface |
| archive-drift | an archived item is `status:open` but its branch is merged + published |

**Only stale-manifest auto-fixes**, and only when the done-check proves it:

```bash
node -e '
const fs=require("fs"), p=process.argv[1];
let s=fs.readFileSync(p,"utf8");
s=s.replace(/(\|\s*\*\*Current Phase\*\*\s*\|\s*)([^|]*?)(\s*\|)/i,"$1shipped$3");
fs.writeFileSync(p,s); console.log("shipped: "+p);
' "<manifest path>"
```

Everything else is reported and stopped. **archive-drift is never auto-closed,** because closing
an archived item is Andres's ruling, not an inference from a merged branch. Cutting WIP is his
call too.

---

## The seam with `feature-ledger`

> **Linear owns *who is doing what, right now*. The ledger owns *why the design is what it is*.**
> A Linear issue never restates a decision; it links to one.

That matters most here, because a Linear description is easier to write than a `decisions/` row,
so the path of least resistance is to paraphrase the design into the ticket. That is exactly what
produced `E18`: prose describing a layout the proto's REJECTED block had already thrown out,
which then passed every gate because each one checked the prose.

| About to | Reach for |
|---|---|
| start a large feature | `feature-ledger open`, **before** its issues exist |
| file a decision with no folder to file it in | `feature-ledger open`, then file |
| write a plan or PRD | `feature-ledger reconcile` first, because a plan on an unbalanced ledger freezes the imbalance |
| resolve a `DESIGN_<PROJECT>.md` owning gate | it must be a pasted `THV-` URL, never a prose name |

**A feature folder and a Linear Project are one thing seen twice.** The folder holds the
reasoning, the Project holds the state. A Feature with one and not the other *is* the imbalance,
so say so.

Tickets are found in Linear, with all references. Feature folders carry the hierarchy of things.
As you implement tasks, read the tickets from Linear, and update them with what shipped.

## Store layout

`~/thoven/.workspace/` is its own git repo. FE and BE sessions share one truth.

| File | Holds | State |
|---|---|---|
| `WORKFLOW.md` | the law: containers · states · lifecycle · feature folder · labels | **live** |
| `STATE.md` | derived **Map** + appended **Log** | **live.** The Log is also the watermark |
| `TODO.md` · `TECH_DEBT.md` · `FUTURE_IMPROVEMENTS.md` | legacy `td-`/`dd-`/`fi-` items | **archive: close, never add** |
| `archive/` | `CONTEXT-*.md` and `SPEC-linear-*.md`, folded into `WORKFLOW.md` on 2026-08-18 | **dead. Cite `WORKFLOW.md` instead** |

**"Close, never add" is not read-only.** `orient` derives the Map from those files, so an item
ruled dead must be closed there or it reads as in-flight forever. Closing is the one permitted
write. The four **repo** registers (`frontend/`, `backend/` `TODO.md` and `TECH_DEBT.md`) are
stricter: *do not tick*, because nothing derives from them.

⚠️ **`TD-###` ids fork per worktree and do not resolve globally.** 59 ids (`TD-157`→`TD-215`)
exist only on the materials branch; `TD-212` is cited as law in four `CLAUDE.md` files and
resolves in none; `TD-194` is a real collision, two entries and one number. A cited id that does
not resolve in your worktree is **expected**, not a broken checkout.

## Reaching Linear

Tools are deferred, so load what the task needs before the first call:

```
ToolSearch: select:list_issues,save_issue,save_comment,list_projects,list_milestones
```

That set covers most runs; fetch more as needed (`save_milestone`, `save_project`,
`list_issue_statuses`) rather than assuming this line is the whole surface.

If the MCP is not authorized, **stop and say so**, since he runs `/mcp` in an interactive
`claude`. Never fall back to writing the item into an archived register.

## Helpers (`tools/`, zero-dep, `node --test tools/*.test.js`)

| Helper | Exports | Used by |
|---|---|---|
| `regen.js` | `regenerateMap({storeDir, registers})` | `orient` |
| `reconcile-manifests.js` | `findStaleManifests({repoDir})` | `orient`, `check` |
| `item.js` | `parseLine`, `serialize` | reading the archive; closing a dead item |
| `ids.js` | `mint`, `typeOf`, `PREFIXES` | archive ids only. **New work gets a `THV-` id from Linear** |
| `register.js` | `insertItem`, `insertUnderSection` | **unused, because nothing is added to the archive** |

## Common Mistakes

| Mistake | Instead |
|---|---|
| Asking him which verb he means | He speaks prose. Classify it yourself |
| Routing on his words when git disagrees | Evidence leads. Surface the disagreement; it is a caught mistake, not a nuisance |
| A bare `git log --since` on a feature branch | `main..HEAD`. Inherited commits made a silent branch look like 41 commits of work |
| Skipping dirty checkouts because the watermark is recent | Dirty is always in scope. 85 uncommitted files in lessonspace have no date |
| Fanning out the write | Read in parallel, write serially. Parallel writes are partial updates ×8 |
| Letting a subagent propose Linear writes | It cannot see the other seven checkouts. The parent routes |
| Reading "around" a feature folder | Named roles: STATE · IDEAS · PRD · DESIGN. Root depth. Report forks |
| Reading `reference/…/PRD-v2-….md` as current | Depth rule: the live doc is at the feature root |
| Skipping a missing role silently | Report it. "No PRD, no DESIGN_<PROJECT>.md" is a ledger imbalance for free |
| Reading Milestone as a shippable slice | The Milestone is the lifecycle stage. The **Issue** is the slice |
| Picking a Milestone from the files touched | Files pick the Project. The kind of work picks the Milestone |
| A spec issue with no `Writes to:` line | That line is what sends it to `Speccing`. Name one path |
| Uploading a PRD or spec into Linear | It lives in the repo. Linear links to it |
| Opening an issue from `log` | Only `capture` creates. Report unattributed work and offer |
| Creating an issue for a thought that is a **decision** | File the decision, comment the link |
| Writing `Done` | `Ready`. The merge commit owns `Done` |
| Writing an issue and leaving the PRD or `DESIGN_<PROJECT>.md` stale | Name every surface touched, or say which you skipped |
| Skipping the Log entry because nothing changed | Always write, always advance. A stalled watermark is how the Map started lying |
| Adding to the archive registers | Capture goes to Linear. Closing a dead item there is fine; adding is not |
| Auto-closing an archived item because its branch merged | Report it. Closing is his ruling |
