# Learnings — thoven-designer

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-12 — lookups start at the generated catalogue

**What happened.** The frontend gained a catalogue written from the code (`design/components.md`, `design/tokens.md`, `design/blocks.md`, THV-1735). The lookup references still sent an agent to list `components/ui/` and `lib/*-tokens.ts`, and four paths named `docs/design/` files that live in `design/`.

**Why.** A folder listing shows files. It cannot show that a component is deprecated, what replaces it, or which composite owns a loading, empty or error state, so new work could land on a deprecated component: 121 imports of one were counted on 2026-11-12.

**What changed.** `references/sources.md` and `references/implementation.md` open the three generated files first, name the scans that hold the rules (`ui-boundary-scan`, `library-use-scan`), and tell a builder to rerun `pnpm run design:catalogue` after adding or changing a component, token module or block. The `docs/design/` paths now read `design/`. The dated hand-rolled counts stay as history; `pnpm run design:audit` prints today's.

## 2026-11-08 — compare Paper with the rendered implementation and explain the result

**What happened.** Andres approved clearer task routing, composition criteria and output, then asked for a connection between a Paper reference and visual parity on the implemented surface. He wants discrepancies in visual language and composition explained alongside design-system compliance.

**Why.** The critique path had no explicit Paper comparison procedure or concise output contract. A live classifier probe also selected both `design_here` and a binding typography source, while the lookup reference told the agent to follow both answers.

**What changed.** Task routing now precedes source selection, with source suggestions used only for lookups. The main critique path states the intended reading order, points to visual references, and specifies an outcome-focused answer. A conditional visual-parity reference compares the approved frame with the real route, separates fidelity from design quality, and explains approved changes, drift, responsive proposals and system conflicts. This is a user-directed revision; instruction and classifier checks do not establish visual quality or live Paper-to-product parity.

## 2026-11-08 — design the composition in context

**What happened.** Andres said the skill finds components well, but its token and colour checking does not sufficiently address visual language, typography, layout and polish. Those checks are useful at different times.

**What changed.** The main design and critique path now evaluates the rendered composition and typography in context, explains observations through their effect and a concrete change, and inspects the result. System lookup and implementation compliance remain a separate, pointed path. This is a user-directed revision; its design outcomes have not yet been independently evaluated.

## 2026-11-05 — a first-time screen gets a Paper round before code

> reflect · 2026-11-05 · e55ecd26 · aa149f6a · skill-gap · applied · seen 2

**What happened.** First-time screens went straight to a lab or to code. In e55ecd26 Andres said it "should have been on paper"; in aa149f6a the agent edited three shipped files for a screen still being designed.
**Why.** The skill said nothing about which medium a new screen starts in, so "build" read as code.
**What changed.** Added a step under the scope paragraph: a screen designed for the first time gets one Paper polish round before any lab or code, only the moving part gets a storyboard proto, and while designing "build" means Paper unless the turn names code.

## 2026-10-31 — a variant of a shipped surface starts from the real route

> reflect · 2026-10-31 · 0f23577b · 389b9590 · aa149f6a · e3582b3d · 01a19d39 · broken-rule · applied · seen 5

**What happened.** Andres: "when you're doing these prototypes on already real things, you actually look at the code." A later pass was told to change only the middle section.
**Why.** Rule 16 said the slot is locked, and the skill never said to open the shipped page first.
**What changed.** Before drawing a variant of a shipped surface or an attached mockup, open the real route, start from its shipped code, and state in two lines what stays and what changes.
2026-11-05: the same miss outside drawing. Landing boxes did not match the live page (aa149f6a), a global component already existed (e3582b3d), and the concentric radius had already shipped (01a19d39). The step now also fires before a ticket fix, a design-system audit, or a token or shared-component proposal: open the live route and the global component, list what shipped, propose only the gap.

## 2026-10-25 — the skill never fired on drawings and protos

> reflect · 2026-10-25 · 7c3d7896 · 389b9590 · 39a12a43 · broken-rule · applied · seen 3

**What happened.** Protos and board variants reached Andres with design-system misses that this skill already covers. In 7c3d7896 he said "the button fro approve is on the wrong side according to /thoven-designer" and "it should use or gloabal radio box". In 389b9590 a drawing subagent's claim that the sort "uses the design system's own select" was passed on unchecked, and he said "the dropwdown is still nto correct /thoven-designer". He typed /thoven-designer himself in more than eight prompts that week. The skill loaded last in those sessions was better-interface.
**Why.** The description fired on design-system questions and on hand-rolling, not on drawing or presenting a frame, so the popup-footer and component checks in the body never loaded before the drawing went out.
**What changed.** The description now also fires when drawing, critiquing or presenting a proto, board frame, Paper screen or design variant, so it is checked against the shipped component before Andres sees it. Backlog: a design-run `RULES.md` reportedly sends critique to interface-craft and the pick to better-ui; it was not found.

## 2026-10-22 — rhythm, popup footers, button states and icon tiles had no pointer

> grill · 2026-10-22 · 39a12a43 · missing-pointer · applied · seen 1

**What happened.** The homework wizard grill ran a rhythm audit and found off-grid vertical gaps
that no check had caught. The drawers on the same surfaces hand-rolled their saving and error
states, and set duo glyphs on white tiles. Andres ruled the craft rules belong in this skill, not
in `interface-craft`: *"interface craft is not our skill; if anything we need to apply it to thoven
designer, the edits."* He also ruled on Oct 22 that icons sit straight on their row or panel, a
row's open action is a neutral 3D button rather than "Open ›" text, and the row highlight alone
marks what is currently showing.
**Why.** The rhythm and type rules (THV-1389) and the popup footer and overflow-edge rules
(THV-1353) were settled in Linear but sat in no file this skill points at, so nothing sent a
builder or critic to them. ThovenButton v2's state machine already had a canonical caller in
the Send notes button, but nothing here named it, so each drawer drew its own spinner and error.
**What changed.** A "Rulings held in Linear" section points at THV-1389 and THV-1353 with the files
each lands in, and states that values reach code only through `rem()`. The `layout` row routes
rhythm there and now names the real path, `design/layout.md`. Standing checks gained the save or
send state machine and the icon and open-action rule. Pitfalls stay at ten: the rhythm line merged
into the middle-dot line, the icon rule into the duo-glyph line, the open action into the ledge
line, and the button caller into the visual-pass line.

---

## 2026-10-22 — meet the tap minimum invisibly

> reflect · 2026-10-22 · 39a12a43 · broken-rule · applied · seen 1

**What happened.** An agent proposed enlarging a component to reach the 44px touch target. Andres: "can we not just augment the touch target invisibly instead of the full component."
**Why.** The rule exists in frontend `design/buttons.md` (Hit target: a transparent pseudo-element, visual height unchanged) and is browser-tested on SaveToggle, but nothing in this skill surfaced it before a resize was proposed.
**What changed.** Standing checks: the tap minimum comes from the hit-area pseudo-element, never a larger visible size. (A step, since Pitfalls is at its ten-line cap.)

## 2026-10-14 — an option the user cannot take is unselectable, not refused

> reflect · 2026-10-14 · memory:feedback_unselectable_not_refused · correction · applied · seen 1

**What happened.** On the reschedule panel a fix proposed refusal copy ("reserved for another
learner") for a time the client already knew was off-limits. Andres: *"that time should not even be
selectable... It is better UX to have it as a date that is not selectable similar to how we handle
other unavailable times."* Recorded as THV-1187 ruling 59.
**Why.** The fix reached for error handling and new copy instead of the picker's existing
unavailable state. Copy that names another learner is also a privacy smell.
**What changed.** A Pitfall line shows such an option as unselectable, like other unavailable
options. A race the UI cannot prevent reads as an ordinary "just taken" and the options reload.

---

## 2026-10-10 — retrofit into the version he liked

> reflect · 2026-10-10 · memory:feedback_retrofit_into_clean_version · correction · applied · seen 1

**What happened.** The passport data page layouts were clean. Asked to add a goal and a stage name,
the next version added a hero-sized name, an inline amber word that read as the logo, a large goal
quote and orphan sticker boxes. Andres: it went *"from very clean to very messy… doesn't follow my
typography sizing… you're missing the retrofitting part."*
**Why.** The new items got new sizes, weights and treatments instead of the styles already on the
page.
**What changed.** A Pitfall line gives a new element one of the liked version's existing text
styles and spacing. Read the computed styles of that version and list its text styles before
adding, and stress-test growth (many stickers, long text). The passport surface itself may use
other palette ramps and duotone icons beyond amber.

---

## 2026-10-09 — motion findings are checked against the press spec

> reflect · 2026-10-09 · memory:feedback_motion_findings_check_button_spec · correction · applied · seen 1

**What happened.** A verifier flagged two ThovenButton motion findings from generic animation
rules, the press animating box-shadow and ghost and link presses using the release curve. They were
relayed to Andres with a recommended Design System ticket. Andres: *"since when are those wrong, who
said they are wrong"*. `design/buttons.md`, from the 2026-07-16 bake-off, animates the ledge shadow
on purpose. He ruled the ghost press timing stays as built, with no ticket.
**Why.** A general rule ("only animate transform and opacity") is not a Thoven decision. The house
press grammar overrides it.
**What changed.** A Pitfall line checks every motion finding against `design/buttons.md` and
`lib/press-tokens.ts` before it is relayed, names who decided what, and puts the same read in every
verifier brief's MOTION section.

---

## 2026-10-09 — design-system tokens beat proto values

> reflect · 2026-10-09 · memory:feedback_design_system_beats_proto_values · correction · applied · seen 2

**What happened.** In the Live Lesson Portal visual pass a subagent matched the timer panel to the
proto with an arbitrary rem size that has no ramp role, slate gradients (slate is not a generated
hue) and a raw rgb shadow. Asked whether to add a ramp role, Andres said *"fix it to follow the
design system"*. The next day, on THV-1216, he asked *"why did you build the prototype… the built
does not even follow the thoven design system for async states"* and named the practice room header.
The briefs had said "match the prototype's layout and states", which sent builders to the proto for
states.
**Why.** The proto's exact values are a sketch. Token modules, the `--text-*` ramp, the generated
palette and the elevation and icon tiers bind. The rem value had also slipped past the px scan.
**What changed.** A Pitfall line takes layout, copy and flow from the proto, every state from
`docs/design/async-states.md` and the shipped primitives, and every value from the nearest token.
Adding a ramp role or hue to fit a proto value is a question for Andres.

---

## 2026-09-30 — stateful icons are duotone, ratings use StarRating

> reflect · 2026-09-30 · memory:feedback_icons_duotone_and_starrating · correction · applied · seen 2

**What happened.** On the marketplace card's second round a builder swapped the StarRating star for
an outline Jelly star and used flat check and X glyphs. Andres: *"why did you change the star… idk
why you keep not using duotone"*. `lib/icon-tokens.ts` already gave stars to StarRating. He ruled
the match badge, check and X duotone, since each shows a state the parent set. On 2026-10-03
THV-1069 made the star half a lint rule that refuses `faStar` and `faStarHalf` outside
`components/reviews/StarRating.tsx`.
**Why.** No import ban was precise enough to enforce the duotone half, so it lived in memory only.
**What changed.** A Pitfall line renders every stateful icon as a duo glyph through
`components/ui/icon.tsx` with a hue and counts two paths in the rendered SVG before the UI is called
done. The star half gets no line, because the lint performs it.

---

## 2026-09-28 — one screen means no scroll

> reflect · 2026-09-28 · memory:feedback_one_screen_means_no_scroll · correction · applied · seen 1

**What happened.** On the THV-903 parent dashboard the agent wrote "at a short desktop window the
right column scrolls" into the acceptance, the pane passed it, and Andres rejected it. *"This does
not pass because your space is now clamped and needs to scroll."*
**Why.** A one-screen layout shows every section whole. An inner scroll hides content just as
clipping does, and the scroll clause was invented in the acceptance.
**What changed.** A Pitfall line writes one-screen acceptance as "fits without scrolling at every
desktop viewport" and shrinks the content (tiles shrink or go horizontal, padding tightens) until it
fits. Phones scrolling the page is fine.

---

## 2026-09-25 — no middle-dot separators

> reflect · 2026-09-25 · memory:feedback_no_middle_dot_separators · correction · applied · seen 1

**What happened.** Reviewing the Materials v3 detail pane, metadata ran as one string joined by
middle dots (composer, opus, duration). Andres: *"Do not do dots. I hate fucking dots."* He asked
for it to go into the design system.
**Why.** Each fact wants its own place. A joined string hides which fact is which.
**What changed.** A Pitfall line puts metadata in labelled rows or separate lines. Pane metadata
becomes one label and value table. A card subline carries one fact or goes to two lines. The shipped
app already carries many middle-dot strings. Leave them unless asked, and add none.

---

## 2026-08-28 — enforced standards versus emergent primitives

> reflect · 2026-08-28 · memory:feedback_design_system_enforced_vs_emergent · skill-gap · applied · seen 1

**What happened.** Fork D205. A decision said resting destructive buttons are outline rose. The
proto drew solid rose and AccountPanel shipped the proto's version. Andres ruled the proto stands.
*"There is a difference between standards that exist and we can enforce (fredoka and figtree), vs
things that can be created and changed as we implement... some primitives may shift. But in general
we find and start consolidating into a system over time, and don't let sprawl happen for no
reason."*
**Why.** "The proto is the contract" and "a lock is only real if a test enforces it" read as if
every value were equally frozen. Treating an emergent primitive's drift as a defect causes churn and
blocks slices on rulings that were always provisional.
**What changed.** A Pitfall line names the tier first. An enforced standard (the typefaces, the
focus-ring lock, anything with a token module and test) is a code defect. An emergent primitive (a
variant that does not exist yet, a rung, a radius on a surface still being designed) means amend the
decision. Andres rules either way, and the outcome goes into the row so no one re-litigates it.

---

## 2026-08-17 — a newly created file can stay uncompiled through a restart

> reflect · 2026-08-17 · memory:restart-before-concluding-no-css · tooling · applied · seen 1

**What happened.** Three novel arbitrary values showed no CSS against a running server and appeared
after a restart. The misread had already spread into this skill's silent-failure list, a design
guide, an `app/globals.css` comment and a token module header, all retracted that day. The same day
found a third level. Classes in a newly created source file emitted nothing through a full restart
and a `touch`, the sheet byte-identical, and appeared only after `.next` was removed.
**Why.** Next's webpack cache keys the Tailwind compile on the content of `app/globals.css`. A new
file does not change that hash, so a restart and a `touch` reuse the stale compile.
**What changed.** Step edit in Silent failures. The restart rule now reads "conclude no CSS only
after a cold start with `.next` removed" and names the cache. A skill's silent-failure list gets
read as measurement, so it has to be one.

---

## 2026-08-17 — the colour system is settled

> reflect · 2026-08-17 · memory:design-system-colors-are-settled · correction · applied · seen 1

**What happened.** During a sidebar component task, five turns went to colour tangents nobody asked
for. They converted oklch to sRGB, compared with stock Tailwind, measured contrast, argued one step
darker and built an audit route. Andres: *"This is the fifth time you go on this tangent."*
**Why.** The palette was finished in oklch and generates from `tools/build-palette.mjs`. The ramps
override the framework's, so a stock comparison measures nothing, and every step is already
assigned.
**What changed.** A Pitfall line uses the assigned colour step as is, without converting,
re-measuring or comparing it to stock Tailwind. A real inconsistency in the system is its own ticket.

---

## 2026-08-16 — build or take, filed at the height it governs

> reflect · 2026-08-16 · memory:build-or-take-could-a-user-name-it · correction · applied · seen 1

**What happened.** Andres's "could a user name it?" rule arrived scoped to one library. He said at
once that it extrapolates to every layer. It decides base-ui versus hand-rolled and a job library
versus hand-rolled the same way. Locked in `design/STACK.md` rule 7.
**Why.** A rule filed inside one decision gets re-derived at every other one. He also wanted two
counterweights kept. Taking buys edge cases not yet hit, not hours. Copy-in code has no upstream, so
the purchase covers past bugs only.
**What changed.** No Pitfall line. Already performed by SKILL.md "After `components_ui` binds" and
by "Does it already exist?" in `references/sources.md`.

---

## 2026-08-11 — depth marks what is actionable

> reflect · 2026-08-11 · memory:feedback_depth_means_actionable_not_decorative · correction · applied · seen 1

**What happened.** On the Student L4 homework list every row carried the ledge. Andres: "everything seems pressable when everything is not actionable, this competes with the messaging and makes animation and the component more decorative than actually functional."
**Why.** The 3D press is Thoven's scarcest signal, and spending it on every row spends it on nothing. Sky means "act on this", so a waiting row must not wear it either.
**What changed.** Pitfall line: the ledge goes only on rows that need action; every other row is flat, and a row shows the verb or the state pill, not both.

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
