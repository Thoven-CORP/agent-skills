# Learnings — feature-ledger

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-08-20 — a Linear description went stale twice on one Project, and the check only covered half of it

**What happened.** `Teacher 2.0: Dashboard`'s **Project description** described a design that had
been dead for weeks — twice, five days apart.

On 2026-08-19 it still specified the open-loop notification model with a counter plus a route, after
`D68` moved to a section axis, `D70` made the panel the largest element showing everything at once,
and `D84` changed hue from age to category. That was caught and rewritten.

On 2026-08-20 it had gone stale **again**: it listed `D83`–`D87` as the ruled set while `D88`–`D104`
existed, claimed *"4 of 6 notification states have no export"* when two had landed, and still called
a component `Your Studio` after `D102` renamed it `Business Overview`. Three Milestone descriptions
were stale in the same pass, and the Project sat in `Backlog` while its own issue was `In Progress`.

**Why.** Two reasons, and the second is the one that matters.

The `milestone` row covered **Milestone** descriptions and said nothing about the **Project**
description, which is the container people actually read first.

And it gave no method. *"No description contradicts a live decision"* is a whole-file comparison a
tired reader performs by eye and skips, which is rule 9's exact failure — a rule that gets skipped
by whoever is tired. Both misses happened during a reconcile that was otherwise thorough.

**What changed.** The row is now `container`, covers Project **and** Milestone descriptions, and
carries a mechanical detection: **pull every `D#`/`A#`/`ADR#`/`E#` the description cites and check
each id's status in the ledger.** A cited id that is `SUPERSEDED`, `PARTLY SUPERSEDED` or absent is
drift, and that is a grep rather than a judgement.

It also names the tell that fires earliest: **a renamed surface.** `Your Studio` → `Business
Overview` was visible in one word, before any id needed checking.

⚠ **Still not a script, and mostly cannot become one.** Corrected 2026-08-20, same day, after
Andres pushed back on the claim below it — which said the id-status cross-reference was *"mechanical
and worth building"*. **It is not.** Statuses live in prose cells rather than a fixed column, so even
that parse is not clean, and the general form — *does this paragraph describe the current design?* —
is semantic and no check reaches it.

**Of the four things that went stale, one is a real check, one is a grep, one is a smell, one is
impossible:**

| What fired | Mechanical? |
|---|---|
| Project `Backlog` while its issue is `In Progress` | ✅ **Not prose at all.** Two enum fields |
| `Your Studio` after `D102` renamed it | ✅ Grep the description against the lexicon's retired-words table |
| Cited `D83`–`D87` as the ruled set while `D88`–`D104` existed | ⚠️ **Heuristic only.** The ledger's max `D#` far exceeds the description's max cited `D#`. Flags, never proves |
| *"4 of 6 states have no export"* | ❌ No. Verifying it means knowing which files map to which states |

## ⛔ RULED 2026-08-20: the check is NOT built, and not because it is hard

Andres, when this entry proposed one: *"it creates a test that does not allow me to be dynamic.
We're still in design mode. I don't want to create a test I then have to change, or that gives me
failures."*

**That is the reason, and it generalises past this check.** A check freezes whatever it encodes, and
**design mode is defined by things still moving.** A drift check over a Feature mid-design does not
catch mistakes — it reports every decision as a failure until the docs are rewritten to match, which
is work created by the check rather than found by it. The repo already learned this on a different
surface: *frozen tests amplify whatever they encode, and a frozen wrong contract makes every later
gate defend the wrong thing harder.*

**The corollary: a check is cheap AFTER a design closes and expensive during.** If this is ever
built, it is gated on the Feature's `Design` milestone being done — never before.

## And the second copy is the real fault

Andres: *"we intentionally don't want to port another copy to Linear."*

**The policy already existed** — this skill's own rule says documents live in the repo and Linear
links to them, because a second copy is the drift the rule exists to prevent. **The Project
description carrying decision summaries was already a violation of it**, and going stale twice is
exactly what the policy predicts.

So the finding is not *"add a check."* It is *"the rule was right and the description broke it."*

**But the line is finer than 'no decisions in Linear', which was this entry's first overcorrection.**
Andres, drawing it: *"it's fine to keep that. We can state the discussion. We just don't need two
copies."*

| In a Linear description | |
|---|---|
| The discussion — what was argued, what it cost, why the shape is what it is | ✅ **Keep.** Linear is where that conversation happens, and it is not duplicated anywhere |
| State, blockers, owners, what is gating what | ✅ **Keep.** This is Linear's actual job |
| **An enumerated registry of decision rows** — `D89` says X, `D90` says Y, the payload table | ❌ **That is the second copy.** It restates the ledger row for row, and it is the half that went stale twice |

**The test: does this paragraph exist anywhere else?** Discussion does not — it is Linear's own.
A decision row does, and the ledger's version is the one that gets updated. Point at it instead.

## 2026-08-18 — rule 13 covers surfaces, so a cross-surface RULE has no owner by construction

**What happened.** The teacher-2.0 migration gave every surface a `DESIGN_<PROJECT>.md` row with an
**Owning gate**, exactly as rule 13 asks. **D68** — *notifications are segmented by section, not by
open loop*, the axis the entire dashboard is built on — still ended up with **no owner**.

**Why.** D68 is not a surface. It is a rule spanning several, so it belongs in the template's
*Rules that span surfaces* table — and **that table has no `Owning gate` column.** The rule was
followed and the hole opened anyway.

**Why it matters.** This is the same defect rule 13 was written for, one level up. A surface with no
authority is a blocker you can see; a **rule** with no owner is invisible, because the table it sits
in never had a place to look.

**What changed.** `templates/DESIGN_PROJECT.md` needs an **Owning gate** column on the cross-surface
rules table, and `reconcile`'s `authority` check needs to read both tables, not just the surface one.

---

## 2026-08-18 — the orphan check false-greens if the decision log counts as downstream

**What happened.** First orphan run after the migration reported **0 orphans of 88**. That was
wrong. The scan had swept in the frontend repo's `wireframe/.../DECISION_LOG.md` — which is where
D1–D55 are **defined** — and both repos' full commit logs, which include the commits that *wrote the
decisions*. Every decision cites itself, so everything looked owned.

**Re-run against code and tests only: 2 orphans**, both benign and explainable.

**Why it matters.** `downstream` means *something that implements or schedules this*. A decision's
own source and its own doc commit are **upstream**. Counting them inverts the check into one that
can never fail — and a check that cannot fail reads as a pass.

**What changed.** Nothing in the skill's wording, which already says *"a plan, issue or commit"*.
Recorded because the wrong scan is the easy one to write, and it returns the number you want.

---

## 2026-08-18 — a feature that predates the prefix split cannot be renumbered

**What happened.** `teacher-2.0`'s `architecture.md` carried **D64, D66, D68, D69, D71** — minted
while one `D` series covered design and architecture both. The shape gives architecture its own
`ADR#` series.

**Renumbering was the wrong move.** Five rows, ~15 citations across two repos, and every one of them
would have shown up in the migration's own balance check as a **deletion**.

**What changed.** They keep their numbers, new rows start at `ADR1`, and the exception is stated at
the top of the file rather than left for a reader to notice. **Migrating a ledger into the shape is
not licence to renumber it** — the id is the citation, and the citation is the thing being protected.

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
refuses.

**A project label was the first fix, and it was worse.** Project labels can only be created in the
Linear UI, so `open` would have blocked on a step no agent can perform. The audience went into the
Project's **name** instead, as `<Audience>: <Feature>` — `Teacher 2.0: Dashboard`. No setup, visible
on every issue card without configuring a view, and it sorts the board into audience groups.

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
