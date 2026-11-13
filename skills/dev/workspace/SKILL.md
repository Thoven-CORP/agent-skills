---
name: workspace
description: >-
  Linear lifecycle for a Thoven Project. Use when Andres rules mid-session
  ("make it the accordion", "library indigo", "max 5"), when a grill or spec
  session ends, when he asks to update the docs, the Project description, the
  Project status, or a Project Update, or when he asks where work stands, what
  is next, to capture or close work, to log a session, or to reconcile the
  board. Read the Project snapshot before proposing a lifecycle write.
---

# Workspace

`$workspace` is a pure reader until the user approves a disclosed write set. A dispatch event, a
confirmed grill ruling, or a confirmed product brief approves its row under Fixed writes. It owns Project
orientation, Linear lifecycle, capture, close, and the derived Map. Its Activity is Project Updates
and issue comments. It does not perform semantic feature reconciliation.

## Pitfalls

- When Andres describes a problem while building a backlog, file it with what is known and the candidates named as candidates; investigate or grill only when he asks. (LEARNINGS 2026-09-03)
- Add a finding to an existing grouped issue as a checklist line, keep a cleanup Project near 20 grouped issues by merging, and close a done or stale ticket with one evidence line instead of moving it. (LEARNINGS 2026-09-29)
- After every merge or promote, check the Project's open tickets against the merged diff by id and file path, and put each one it fixed into the write set with its SHA in the same turn; say where each verifier follow-up lives. (LEARNINGS 2026-09-29)
- Close a research ticket once its findings are build tickets, and cancel the tickets the research made stale. (LEARNINGS 2026-10-03)
- When an issue has no `Writes to:` line, write the spec into its Linear description below Andres's text with `Writes to: this ticket`, through `save_issue` patch ops, then check its embeds survived. (LEARNINGS 2026-10-03)

## Project setup and live context

For a new Project or a proposed change to its brief, approach or sources, use `$linear-project`.
Read the live [Project setup standard](https://linear.app/thoven/document/project-setup-standard-62e01c7c4f53)
for those choices; it supersedes older setup assumptions in `references/WORKFLOW.md`.

Before ongoing work, retrieve the current Project brief, relevant linked authoritative sources,
native milestones and issues, and latest Project Update. Read the sources themselves; a snapshot
of issues alone does not establish their content. Surface unavailable context explicitly. Maintain
current Project purpose, scope and approach in the brief, field values and work status natively,
and meaningful progress, risks and handoffs in Project Updates within the approved write set.
When posting an Update, supply its health indicator. If the connected tool requires the lead
to post the first Update, use a known resolved lead or report the gap; do not invent an owner.
Local receipts retain their distinct evidence role; `$feature-ledger` keeps artifact and semantic
reconciliation ownership.

## Writing to Linear

Each kind of writing has one home. Write it there; everywhere else links to it.

| Kind | Home | Read by |
|---|---|---|
| Current truth: the goal and why, what each screen shows and does, its rules and design source | The Project's Spec document, from the Spec template | Builders, reviewers, Andres |
| How it is built: shape, units, data, payload fields, modules by path, the seam between the repos | The Project's Architecture document, from the Architecture template | Builders, reviewers |
| History: the question asked, his answer verbatim, options turned down and why, the chat it came from | The Project's Log document, from the Log template | Main and grills, before asking or ruling |
| One unit of work | The issue, from the Build ticket template (Work item for other work). It is the builder's brief | The builder |
| Purpose, scope, approach, sources of truth | The Project description, through `$linear-project` | Everyone |
| Progress, risk, handoff, next step | A Project Update with health | Andres |
| A status event | An issue comment | |
| Design exploration | tldraw or Paper. The accepted choice becomes a Spec edit | |

The connector cannot apply a template. To make a Spec, Architecture or Log, read its template with `get_template`, save the content as the new document's first text, and fill every bracketed line. A template edit never changes a document already made.

### How to write a Project document

- **One page, one job.** The Spec states what is true now. The Architecture states where it lives in the code. The Log explains why, in his words. A ticket says what to build and when it is done. A sentence of another kind moves to its own page.
- **One decision, one line, one home.** Every other page links to that line.
- **Every rule carries its reason** after "because". A reason several rules share is written once, on the area's "Why" line.
- **Write what looking cannot tell.** The frame carries copy, layout, colour and motion. The code carries what it already does.
- **Plain sentences.** Present tense. One thought per sentence. Say who does what. Write the real screen, file or field name, and keep one name per thing.

| Page | Limit |
|---|---|
| Spec | 3,000 words |
| Architecture | 3,000 words |
| Log | 120 words an entry |
| Build ticket | 400 words, 3 to 10 exit lines |

- **At the limit, consolidate, then add.** Merge the lines that state one decision. Cut what a frame or the code shows. Move reasoning to the Log. Then write the new line, and say in one line what you merged. A page that still cannot fit is two Projects or two milestones, and that is a question for Andres.
- The size counter reports each page's count after a save.

## Ruling

When Andres rules, or a grill or spec session ends, write the ruling before the next task. This pass does not wait for capture, close, or log.

1. Edit the Spec or Architecture line the ruling changes, in place, so it states the new current truth. Delete the sentences it replaces; Linear's version history keeps the old text. A rule that came from chat uses his words and links its Log entry. His name sits only on his quoted words, as the law's "Records and sources" has it.
2. Add one Log entry in the Log template's shape: Asked, Andres (verbatim), Changed, Turned down, Reading only when needed, and Chat, which says where the exchange is. An entry you write on your own says Asked "unprompted" and has no Andres line.
3. Write no more than his words cover. A part of the question his answer skipped stays open: it goes under the page's Open questions with its default, and the next question asks it.
4. Read back the edited line and the Log entry, with the size counter's line for each page when the counter prints one. Say the edited heading in one line.
5. A ruling that a listed item is not a defect strikes it in the same pass, wherever it is listed: an issue's checklist, and its title when the title names it. The struck line reads `~~item~~ Struck <date>: not an issue (Andres). Do not reopen.` A struck item is settled; a status or remaining-work list leaves it out. (2026-11-12: THV-1469 kept two ruled contrast items as open boxes, and a session read them back as open work.)

## Recipe

1. Read [`references/PROJECT_SNAPSHOT.md`](references/PROJECT_SNAPSHOT.md). Its source order,
   evidence states, and ownership rules are binding.
2. Resolve the current Linear Project from the named issue, session context, or cwd. If those
   disagree, report `CONTRADICTED`; do not guess. A local folder, `STATE.md`, `PRD.md`, or
   `CONTINUE_HERE.md` is optional. Resolve the Project and read its governing Linear content even
   when none of those files exists. Use `$linear-project` for genuinely missing or changed Project
   setup, not to manufacture local prerequisites. An inaccessible required Linear source is
   `UNKNOWN`; name that source and continue only work that does not depend on it.
3. Fetch the Project's issues through the Linear MCP connector that answers a read, save the
   response, and run `map.js` on it. The command, the input shape and the parser rules are in
   [`references/map-input.md`](references/map-input.md); read it before the first run in a session.
4. Account for every `BLOCKED`, `CONTRADICTED`, and `UNKNOWN` finding. Linear data that was never
   supplied is `ADVISORY linear-input` — fetch it through the MCP connector and re-run. A Linear
   fetch that was attempted and failed is `UNKNOWN`. Neither is ever inferred from local prose.
5. For `orient` or bare invocation, print the snapshot unchanged: Project and fingerprint, ticket
   ledger including Done and Canceled history, mechanical findings, completion claim, and next
   issue or skill invocation. Then run one mem0 search (`search_memories`, query: the Project name
   and the next issue id). Print what comes back under **Recalled**, after the snapshot. It is
   recall, not record: it never changes the fingerprint or a finding. A recalled ruling with no
   Log entry is missing. Step 6 puts it in the write set.
6. For capture, close, or log, mine first, then show one exact Project-scoped write set. List every
   ruling and status change in this session, including a recalled ruling from step 5. Mark each one
   written, amended, missing, or contradicted against the Spec and the Log. Each missing one
   is a write-set entry. A ruling already written by the Ruling section stays marked written. Apply
   only after approval, serially. Re-run the snapshot and report its new fingerprint and the
   before/after open-issue count per Project.

## Fixed writes

`update THV-n <event> [THV-m <event> ...]` is the write. The event approves its row. Apply it in the same turn. The reply is the read-back. A write outside this table goes through the Recipe.

| Event | Write |
|---|---|
| `started` | `node tools/set-status.js "In Progress" THV-n`, plus its parent when the parent reads Todo or Backlog. Fires for main-session work with Andres too, not only a dispatched pane |
| `pr <number>` | `set-status.js "Ready" THV-n`, then one comment: `PR #<number> opened` |
| `report <STATUS>` | One comment: the report's status line and its Exit criteria rows, nothing else. Take them from the newest REPORT entry that `~/.agents/skills/dispatch-work/scripts/dispatch board <project> --ticket THV-n` prints |
| `merged <number>` | `set-status.js "Done" THV-n`, then one comment: `Merged #<number>`. List the open tickets the merge may close; moving them needs the Recipe |
| `grill` | Ruling, steps 1–4. Comment on THV-n with links to the edited headings. |
| `brief` | Ruling, steps 1–4, for each settled choice. A Project Update links the edited headings. The slot map stays on the design board the Spec section links. |

A `started`, `pr`, `report`, or `merged` row that also carries a ruling runs Ruling steps 1–4 and posts a Project Update that links the edited headings.

When the issue is already at or past the target state, report that state and leave it. Reply with one line per issue, the state `set-status.js` read back, and stop.

## Completion

The main session has read the snapshot fingerprint and can account for every mechanical blocker
and unknown. A write operation is complete only when the approved writes are applied and the
post-write snapshot has been read. A dispatch update is complete when every issue in it has its
read-back line. A content write is complete when a read-back shows each mined ruling stated in its Spec or Architecture section and its Log entry holding his words. End the reply with one line naming the surfaces touched and the surfaces
checked and left unchanged. A new snapshot fingerprint does not prove the text of a document, a
description, a comment, or a Project Update.

## Compatibility

Linear holds current briefs, accepted decisions, status and handoffs. Existing local state,
runbooks, plans and historical documents remain useful linked context; preserve them. Do not
scaffold, bulk-migrate or delete them to orient a session. tldraw and Paper support design and
brainstorming; record accepted decisions in Linear. A design file becomes relevant when the
Linear task names it, not because every machine must have every board.

For a cross-machine handoff, use [handoff.md](references/handoff.md). For a requested check on the
mini from saved MacBook changes, use [remote-check](../remote-check/SKILL.md).

For a reviewed remote-development release, read [remote-install.md](references/remote-install.md)
before publishing or installing the selected skills.
