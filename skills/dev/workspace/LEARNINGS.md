# Learnings — workspace

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-11-05 — a bundle yes is not a ruling on an unstated cost

> reflect · 2026-11-05 · 489a6eae · edbbc3cf · correction · applied · seen 2

**What happened.** A bundle "yes" or "run it" was recorded as a ruling. It covered a change to a spec-decided popup (489a6eae) and an unstated 200 ms on every sidebar click (edbbc3cf).
**Why.** #126's "the confirmation is the go" read as blanket approval for everything in the bundle, including what the proposal never stated.
**What changed.** The Ruling section now says a proposal becomes a ruling only when Andres answers it as its own question with its cost or design change stated; a bundle yes approves the disclosed write set only.

## 2026-10-31 — a grill or product brief writes in the same turn as the confirmation

> reflect · 2026-10-31 · d041edf0 · correction · applied · seen 1

**What happened.** Andres asked for the Linear update to be native on dispatch, and the same when he invokes grill-with-docs or product-fundamentals.
**Why.** Those sessions ended in chat and on the design board. Dispatch then copied the ruling into the brief, and Linear stayed behind the conversation.
**What changed.** `update THV-n grill` and `update THV-n brief` are rows in the fixed write table. The confirmation is the go. The reply is the read-back.

## 2026-10-30 — the fast lane was deleted while the learning still said applied

**What happened.** Andres, reflecting on this skill, said rulings from grills and docs were not written down, writes stayed shallow, and native Linear documents were not used. He kept asking for another mine and a real doc update.

**Why.** The 2026-08-22 fast lane and the 2026-08-23 grill triggers were removed when the snapshot was unified. Both entries below still read as applied. WORKFLOW named several homes for a decision, and the concrete examples were repo paths.

**What changed.** The description triggers on a mid-session ruling, the end of a grill or spec, and an ask to update docs or a Project Update. The Ruling section writes the decision when it is said, into the governing document in WORKFLOW §5. Recipe step 6 mines a ruling that pass missed. Completion requires a read-back of the written text.

## 2026-10-28 — Linear-only startup supersedes the local-folder prerequisite

The current migration ruling makes Linear the project record. Missing local project folders or templates no longer establish missing setup. Recipe step 2 and the shared snapshot now accept a named Linear Project without local state. Inaccessible required Linear content still needs an explicit gap. This supersedes the recommendation in the 2026-10-25 entry below; its historical evidence remains intact.

## 2026-10-25 — an unresolved Project folder means the Project was never set up

> reflect · 2026-10-25 · 0f23577b · 7c3d7896 · skill-gap · applied · seen 2

**What happened.** The snapshot reported "Project folder could not be resolved" and a missing STATE file. 7c3d7896 called this expected and went on grilling. Andres, in 0f23577b: "before we keep doing this did we ever setup the worktree using /linear-project".
**Why.** The Recipe resolved the Project but said nothing about what that finding means.
**What changed.** Recipe step 2: an unresolved Project folder or a missing template sends the session to `$linear-project` before any grill or design work, and the finding is never reported as expected.

## 2026-10-03 — A spec with no Writes to path goes into the ticket

> reflect · 2026-10-03 · memory:feedback_spec_writes_to_ticket · correction · applied · seen 1

**What happened.** On THV-1007 a brainstorm spec needed a home and the issue had no `Writes to:` line. Andres rejected a file path halfway through choosing one: "Actually writes to into the ticket".
**Why.** Brainstorming skills default to a spec file under docs/, which competes with the Linear issue as the record.
**What changed.** Pitfall line: write the spec into the Linear description below his problem statement, add `Writes to: this ticket`, use `save_issue` patch ops so his text stays, then check the embeds survived (a patch dropped a linear-embed once).

## 2026-10-03 — Close research tickets once they become build tickets

> reflect · 2026-10-03 · memory:feedback_research_tickets_close · correction · applied · seen 1

**What happened.** THV-909, a research ticket, was presented as a big ticket awaiting Andres's review, and THV-5, an August decision ticket built on dead docs, was treated as live. He was angry about both.
**Why.** A research ticket exists to inform build tickets. Carrying it, or the tickets it made stale, makes the board read as more work than exists.
**What changed.** Pitfall line: close a research ticket once its findings are build tickets, saying what it produced, and cancel the tickets the research made stale.

## 2026-09-29 — Sweep the Project's open tickets after every merge

> reflect · 2026-09-29 · memory:feedback_linear_sweep_on_merge · correction · applied · seen 1

**What happened.** About 40 open tickets in the Launch project looked stale. Andres: "I have mentioned multiple times to update linear as you move along."
**Why.** Main moved the ticket it was working on but never swept the follow-ups that verifiers and walks had filed, which later PRs fixed in passing under other ids.
**What changed.** Pitfall line: after every merge or promote, check the open tickets against the merged diff by id and file path, put each fixed one into the write set with its SHA in the same turn, and say where each verifier follow-up lives. The cockpit `merged` row already lists the candidates.

## 2026-09-29 — Group findings and close tickets; moving is not cleaning

> reflect · 2026-09-29 · memory:feedback_linear_group_not_sprawl · correction · applied · seen 1

**What happened.** Main moved about 30 tickets into a cleanup project and kept filing one ticket per verifier finding. Andres: "Having 60 issues is overwhelming... Our target for the after-cutover cleanup project should be at most 20 issues... you keep saying you update it while you're not actually writing or updating anything."
**Why.** Moving a ticket looks like progress in chat and leaves the board as long. One ticket per finding makes the board impossible to audit.
**What changed.** Pitfall line: add a finding to an existing grouped issue as a checklist line, keep a cleanup Project near 20 grouped issues by merging, and close a done or stale ticket with one evidence line (SHA, file:line or the superseding issue). Recipe step 6 now reports the before/after open-issue count per Project. Status meanings (Ready is "come look", not "merged, waiting on a promote") are already `references/WORKFLOW.md` "States".

## 2026-09-03 — File a described problem; do not investigate it

> reflect · 2026-09-03 · memory:feedback_file_it_do_not_investigate · correction · applied · seen 1

**What happened.** While Andres was assembling a backlog he described a navigation complaint. Main spawned a fact-finding agent and queued four questions. He said "I was asking you to put that on a linear ticket not to do it now".
**Why.** He was in board-building mode, closing a session and handing to the next pane. Investigating mid-flow cost him that work and pre-empted the pane that owns it.
**What changed.** Pitfall line: file it with what is known, the candidates named as candidates, and what the owning session must measure; investigate or grill only when he says so. A fact that turns up anyway goes into the ticket. Where it is filed follows the grouping line.

## 2026-08-29 — two skills shared a subject but not a snapshot

**What happened.** Workspace oriented from Linear and audience-level state while feature-ledger
re-read a different set of files. Each invocation could be locally reasonable and globally
contradictory.

**Why.** The protocol lived inside long skill prose. There was no pure snapshot value or stable
fingerprint for the main session to read.

**What changed.** Both skills now consume one disclosed Project-snapshot protocol and the same
deterministic engine. Workspace owns mechanical lifecycle work; feature-ledger owns semantic
reconciliation. Neither invokes or writes through the other.

## 2026-08-23 — an ambiguous read guessed silently, and the intent missed

**What happened.** Andres: he speaks prose and invokes the skill, and when the prose is unclear he
feels the classification gets missed rather than confirmed.

**Why.** The Common Mistakes row said *"classify it yourself"*. It was written to ban
verb-vocabulary questions (*"which intent is this?"*), but it read as a ban on all confirmation.
Step 5's ask-on-ambiguity covered routing work; nothing covered the intent classification itself.

**What changed.** The intents section now requires one outcome-shaped question before writing when
two intents would write different things. Confident reads never ask. The Common Mistakes row was
amended to the same shape.

---

## 2026-08-23 — Linear drift was a finding, so the session started anyway

**What happened.** Codex opened THV-63, a Linear subagent reported *"Todo issue, no milestones"*,
and then asked Q1. Cursor wrote `DESIGN_ONBOARDING.md` / `PRD.md` / `api.md` on a still-Todo,
unassigned issue with no milestone. The board was corrected at wrap-up, after Andres said
"commit and follow the workflow." Same shape as 2026-08-18 (Teacher 2.0 Linear went stale because
sessions reached `feature-ledger` and never this skill) and 2026-08-20 (four issues had no
Milestone and were routed after the grill).

**Why.** The 2026-08-18 fix made Linear drift a **reconcile finding**. Findings get listed.
Work continues. `grill-with-docs` is two lines (`Call grilling and domain-modeling`) and never
calls this skill. This skill's trigger list was wrap-up and mid-session rulings, not session
start. "Point at WORKFLOW.md and never restate it" hid the claim / `Writes to:` / milestone
steps from the skills that actually run. Rule 9: a rule with no script gets skipped.

**What changed.**

- A **`start` intent** and a **session gate**: `tools/session-preflight.js`. Exit 1 stops the
  session. Green is the completion criterion.
- Frontmatter now triggers on grill / speccing / "write the ledger" / "evoke feature-ledger",
  not only wrap-up.
- `feature-ledger` reconcile treats a red preflight as a **stop**, not an Imbalances row.
- `grill-with-docs` is no longer a two-line stub: gate first, then grill, then file.

---

## 2026-08-22 — `capture` was built for a request, and most rulings are not requests

**What happened.** Through the Teacher 2.0 dashboard sprint, rulings Andres made in passing kept
having to be made again. *"Wait we already made those designs for that layout. Remember we talked
about making it the accordion instead. If you check earlier decisions that excalidraw got superseded
with another design idea."* *"bro we literally just said library indigo."* And the general form:

> *"We design things, and then when I ask you to implement things, you completely ignore the prior
> implementation of things… We do designs, and I say 'hey, I want it to look like this,' and then when
> I go to implement something else, you just completely forget."*

**Why.** `capture` was correct and unreachable. Its four-kind classification and three-place search
were built for a stated intent — *"we should cut onboarding to two steps"* — and the skill's trigger
list was written from that shape. But **most rulings are a clause inside a sentence about something
else**, said mid-design, while the session is already deep in a different task. Nothing prompted
capture at that moment, so the ruling waited for a wrap-up that a compaction usually reached first.

The second-order cost is worse than forgetting: the next session does not come up blank, it
**re-decides**, often the other way, and then builds against its own answer. That is what produced the
"you completely forget" complaint — the work was not missing, it was contradicted.

**What changed.**

- The frontmatter now triggers on the shape itself: *the moment he rules on something mid-session*,
  with examples that are clauses rather than requests.
- A **fast lane** inside `capture` that skips the gate and the fan-out — neither says anything about a
  sentence just spoken — keeps the three-place search, files one row, and says the id back in one line
  so he can correct it while he still remembers what he meant.
- **`log` may not create rows for rulings it finds.** Batching them into the wrap-up is the failure
  being fixed, not a cheaper version of it.
- The fast lane makes the **reversal** case explicit: a ruling that supersedes an earlier one deletes
  the row it supersedes. The accordion complaint was not a missing row, it was **two live rows for one
  choice**, which is ledger rule 8's disease and is what forced the "audit the decisions and feature
  docs to find the updated one" that should never have been necessary.
- `check` gained **`live-proto`**, and the seam table a row about `Ready`: a designed surface reaching
  `Ready` without its proto retiring leaves the next session a second source. This skill reports it and
  never deletes it — `feature-ledger` rule 15 owns retirement.

---

## 2026-08-18 — the skill was never run on the Feature that needed it

**What happened.** `Teacher 2.0` went stale in Linear across a full design sprint: nine Milestones,
five Issues, seven Milestones empty, and `components/teacher/thoven-sidebar.tsx` with **zero**
production call sites after eleven commits. `Student 2.0` stayed current the whole time.

**Why.** The difference was not the skill. It was that sessions reached for `/feature-ledger
reconcile`, which owns the docs and has no Linear scope, and never reached for this one, which owns
Linear. Nothing in either skill handed off to the other.

**What changed.** `feature-ledger reconcile` gained `milestone` and `gate` rows that surface Linear
drift, and reports them here rather than writing Linear itself. One writer, no second
implementation to drift.

---

## 2026-08-18 — Milestone changed meaning underneath the skill

**What happened.** `Milestone` stopped meaning "a shippable slice" and became one stage of a
Feature's lifecycle. The skill carried the old meaning in fourteen places, including the `capture`
classification table that decides where new work lands.

**What changed.** Milestone is now derived from the **kind** of work: a document goes to
`PRD + Architecture` or `Design`, code to `Build`, QA to `Review`. Two Common Mistakes rows were
added, because the old reading is the intuitive one and will keep coming back.

---

## 2026-08-15 — two hardcoded strings, both silent

**What happened.** Two failures on the skill's first runs were hardcoded assumptions, not bad
judgment: a bare `--since` that assumed midnight, and a `## Log` anchor that assumed a blank line
after the heading. Both produced confident wrong answers.

**What changed.** The skill now says which of its instructions are exact and which are a reference
implementation, and reserves exactness for the places where being wrong is invisible.
