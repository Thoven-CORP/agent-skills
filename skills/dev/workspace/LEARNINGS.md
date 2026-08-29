# Learnings — workspace

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

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
