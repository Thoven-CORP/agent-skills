# Learnings — feature-ledger

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-08-18 — the gate was designed on an untested assumption, and one leg of it was wrong

**What happened.** The whole lifecycle design rests on *a milestone reaching 100% is the gate,
computed by Linear.* Nobody had watched it. A throwaway Project settled three questions in ten
minutes:

| | |
|---|---|
| progress counts | **issues, not points.** 1 of 3 done = 33.33%, and the one closed was the 8-pointer |
| an empty milestone reads | **0%**, never 100% |
| a Canceled issue | **leaves the denominator.** 1 done of 2 remaining = 50% |

**And one assumption was simply false.** Sub-initiatives, which the container model used for the
audience level, are **Enterprise-only**. The API accepts `parentInitiatives` and the server
refuses. The audience became a project **label** instead, which groups the Shipping view the same
way and costs nothing.

**What changed.** Trim now means *delete the milestone*, because an empty one is a gate that cannot
open. Estimates are not required, since they do not move the bar; issue granularity is what makes it
honest. Cancel is the way to drop scope after the fact. And the container model lost a level.

**The lesson worth keeping:** every one of these was a sentence in a design doc that read as fact.
Rule 11 says an estimate in a doc is a claim, not a fact. So is a mechanism.

---

## 2026-08-18 — the scaffold check reads green on a folder it has never touched

**What happened.** First run of the new `scaffold` check against `teacher-2.0` returned zero files.
That looked like a pass. It was not: the templates had never been applied to that folder, so there
was nothing carrying a marker.

**Why it matters.** An absence proves nothing until the thing that produces the marker has run. This
is the same shape as the defect the check exists to catch, one level up.

**What changed.** The check now states its precondition: an empty result counts only after `open`
has scaffolded the folder. On an unscaffolded folder it is a finding, not a pass.

---

## 2026-08-18 — `reconcile` had no Linear scope, so a Milestone could describe a dead model

**What happened.** A reconcile ran clean over `teacher-2.0` on 2026-08-17. The next day its Linear
`Dashboard landing` Milestone was found still specifying the open-loop notification model with
counter-plus-route, which three decisions had killed: the axis (D68), the size (D70) and the hue
model (D84).

**Why it failed.** The balance table checked entries against the **code** and nothing else. Linear
appeared once in the whole skill, in `open` step 3, for owning-gate URLs. The `owner` check tested
that a link *resolves*, never that its contents are still true.

**What changed.** Three rows added: `scaffold`, `milestone`, `gate`. The `milestone` row makes a
Linear description that contradicts a live decision a finding, and names the decision file as the
winner.

---

## 2026-08-18 — "the document exists at that path" was passable by an empty scaffold

**What happened.** The Speccing gate read *"Done when the document exists at the path `Writes to:`
names."* `open` creates every file in the shape, empty, on day one. So the gate passed before anyone
wrote anything.

**What changed.** Every template gained a `## Done when` block stating a checkable test for that
file, and a `<!-- SCAFFOLD -->` marker. The gate now means the file passes its own block, and the
marker makes an untouched file fail by construction rather than by anyone remembering to look.

---

## 2026-08-18 — the `downstream` check found a live LOCKED decision on its first run

**What happened.** First real run over `teacher-2.0`: 78 D-numbers, 70 cited downstream, 8 orphans.
One was **D68** — *notifications are segmented by section, not by open loop* — the axis the entire
dashboard was built on. No plan, issue, commit or test cites it, and it has no owner.

**Why the older checks missed it.** They tested whether a decision was **built**. D68 is built; the
route implements it. What it is not is **traceable**. A decision nothing downstream names is
unowned whether or not the code happens to agree with it.

**What changed.** Nothing in the skill; the check worked. Recorded because it is the evidence that
`downstream` earns its row.
