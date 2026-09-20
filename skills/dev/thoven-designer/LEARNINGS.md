# Learnings — thoven-designer

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-09-20 — D# rows and the design project are not a source

**What happened.** Classify treated `feature_d_rows` as a first-class source: open the Feature's
`DESIGN_<PROJECT>.md` when a surface was named. Andres: Feature D# rows are stale, the design
project is a bad thing to do, the skill should be general about the design system.

**What changed.** Dropped `feature_d_rows` from the schema, the lookup table, and `sources.md`.
Colour, type, icons, components still open their token file. Session rulings still bind and still
go to `workspace` `capture`. `docs/design-system.html` stays Tier 3 (compiled view), not a
classify source.

---

## 2026-08-22 — the map was repo-wide, so every answer missed the Feature's own assignments

**What happened.** Three failures in the Teacher 2.0 dashboard sprint, all the same shape.

A swarm produced 5–10 design variations for one component. Andres: *"None of these follow the design
system **or** the fact that on the dashboard everything schedule oriented is using the rose hue."*
Every variation had to be thrown away, not because a value was wrong against `PALETTE`, but because
none knew which of `PALETTE`'s hues that surface had been assigned. Separately: *"bro we literally
just said library indigo"* — a ruling minutes old, in no file. And: *"we have 18 different fonts going
on here"*, because no row said which ramp step each content role in that card takes.

**Why.** The map answers *"what does the design system say?"* — repo-wide, Tiers 0–3. It had **no row
for the Feature's own `D#` decisions**, which is where nav-group hue, per-surface assignment and
Fredoka-as-emphasis actually live. So a correct, well-cited answer could still be the wrong answer for
that surface, and the skill had no way to notice. The tiers describe how strongly a value binds; they
say nothing about *where* it binds.

**What changed.**

- A new section, **the feature's own decisions bind on its own surfaces**, plus a map row and a step 2
  in the answering procedure. The formula: **the ledger assigns, the system supplies.** A `D#` picks
  which of the system's values a surface uses; it may not mint one the system lacks, and a row
  demanding a hue outside `PALETTE` is a defect in the row.
- An explicit ⚠ for the session-scoped ruling. It binds now, it is greppable nowhere, and it goes to
  `workspace` `capture` so the next session can find it.
- A **Reviewing in a browser** section, from *"stop making prototypes and then changing the viewports
  on my fucking browser and then not putting it back"* and, in the same sprint's own handoff, *"nobody
  has looked at this in a resizable browser window. Andres asked roughly eight times."*
- The `dialkit` standing check is now **phase-qualified**: token module plus test at **Build**, not
  during Design. That was already ruled on 2026-08-20 (*"I don't want to create a test I then have to
  change"*) and this skill carried the unqualified form.
- A pointer to `feature-ledger` **rule 16**, because the scope creep it forbids happens most often
  while prototyping: *"you literally redesigned the full landing page. We were prototyping literally
  just the business analytics component."*

**Deliberately not done.** No typography *role table* was added — "which ramp step for which content
role" is a real gap, but writing it here would put values in a file that states none, and it is a `D#`
decision for the Feature that owns the surface. The Montserrat pairing question Andres opened on
2026-08-22 is unresolved and belongs to a design decision, not to this index.

---

## 2026-08-16 — Split. The skill was two jobs, and described only one

**What happened.** Andres: *"that's not what the skill should be doing… we changed it to be the
mapping for the design system."* He was right, and the change had been made — just not in this
file. `design-system-guide.md`'s routing table already assigned `thoven-designer` the lookup role
("checking one component against `components/ui/` + the library tables + the lexicon"), and
`design-workflow-outline` pointed single-component work here. But `SKILL.md` still opened with
*"Designs and implements…"* and a mandatory five-phase build ceremony, and mentioned neither the
lexicon, the guide, the library tables, nor the Tier 0–3 map.

**Why it mattered more than a stale description.** `frontend/DESIGN.md:79-81` says *"that skill is
a detailed build guide, not the design system, and this file does not govern it."* So the repo's
own hub doc disowned the skill that the routing table was sending design-system questions to. A
competent agent asked such a question **correctly routes around the skill.**

**Measured, not assumed.** A baseline agent was asked one status-pill question with the old setup:

| | Old (baseline) | New (mapper) |
|---|---|---|
| Invoked the skill | **No — declined**, as "a competing voice" | **Yes**, first action, before repo access |
| Tool calls | 22 | 14 |
| Tokens | ~90k | ~77k |
| Unsourced value in the answer | **Yes** — picked a hue by judgement | **No** — named it unruled, routed to Andres |
| Citations | partial | `file:line` for every value |

**What changed.**
- The build ceremony moved out verbatim to `building-thoven-ui` (`git mv`, history and
  `references/` intact). This file became the **index**.
- **The index states no values.** Any number here becomes the sixth contradicting document — the
  frontend already survived five docs in a citation cycle with 21 contradictions. Pointers and
  procedures only.
- The map names the binding layer per question, including two the guide's own map omitted:
  `tools/build-palette.mjs` and `thovenButtonTokens` at `lib/live-lesson-tokens.ts:53`.
- "If nothing binds it, say so" earned its place immediately: the baseline invented a ruling for a
  missed-lesson hue; the mapper run refused and sent it to a decision log.
- The silent-failure checks earned theirs too — they are what made the GREEN run catch that
  `success-pill.tsx` ships `green-*`, a hue absent from `PALETTE`, silently falling through to
  stock Tailwind.
- The audit scenario moved here from the builder, because the eval itself said the standalone
  audit is *"the most common in-the-wild use of the skill"* — that is a checking job, not a
  building one. Its value-specific assertions were rewritten as sourcing assertions, for the same
  reason the skill carries no values.

**Not yet done.**
1. `frontend/DESIGN.md:79-81` still points at `.claude/skills/thoven-designer/references/`, which
   moved to `building-thoven-ui/`. The frontend repo had uncommitted work, so it was left alone.
2. `references/brand-colors.md` and `references/typography.md` went with the builder, but they
   duplicate `docs/design/color.md` and `docs/design/typography.md`. That duplication *is* the
   citation-cycle disease and wants a real cleanup, not a move.
3. The GREEN run was one scenario. The audit eval has not been run against a cold agent.

**Deployment note that caused the original loss.** `~/.agents/skills/` is a **copy**, not the
source — `npx skills update` re-copies from `Thoven-CORP/agent-skills` and overwrites it. Every
skill dir in the store shares one `Aug 15 01:12` timestamp from a single bulk re-copy. An earlier
version of this rewrite almost certainly died that way. **Edit upstream, then sync down.**
