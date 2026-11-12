# Learnings — agent-skills pack

Cross-skill failures. Per-skill `LEARNINGS.md` files stay the place to read before
editing that skill. This file is what to read before changing the gate, the grill
path, the always-loaded law, or where miners look for history.

New entries on top. Shape: what happened, why, what is still open.

**Corpus.** Teacher 2.0 sessions live in Claude Code, not Cursor:

`~/.claude/projects/-Users-andresmartinez-thoven-frontend-teacher-2-0/`

Eight chats (Aug 16–23). The live one is `5afdd0ee` (~38MB). `recall` and
`automate-me` only name `~/.cursor/projects/.../agent-transcripts/`. This
worktree has no such directory. A miner that follows those skills will miss
the corpus.

---

## 2026-11-12 — The instructions rewrite: three documents, the ticket as the brief, one review

**What happened.** The credential close-out and the Music Passport both missed the product with green checks. A Passport-sized project wrote about 131,800 words of documents, a sent brief ran about 2,250 words, and 43 of 46 builders loaded main's working-style skill.
**Why.** The skills told agents to write history into the final answer, restate the source at every hand-over, and run the same check in several rounds.
**What changed.** Linear has Spec, Architecture and Log document templates and a Build ticket template. workspace, andres-mode, dispatch-work, verify, the law and the rule files were rewritten to match. Full record: `releases/2026-11-12-instructions-rewrite.md`.
**Still open.** Nothing was proven before landing, by Andres's choice. The release file lists what is untried and what was left open.

---

## 2026-11-08 — Paper is the build source; the design system is reference

**What happened.** The Music Passport build invented layouts: builders took values from the nearest token, squeezed shared components into old slots, skipped phone frames, and reported "N/N captured" as parity. The production audit (`~/.thoven-artifacts/dev/music-passport-build-audit/production-audit/skills.md`, 36 rows) traced it to skill text. Andres: "Thoven Designer in our design system is a source of reference not a hard code ... you have to turn it into a production component"; "If global components need to change, they need to change"; "It wasn't 'change tokens and untokenify it.'"
**Why.** andres-mode, thoven-designer, dispatch-work, verify and qa-flow each ranked tokens over the frame, let a difference be fixed toward the token, and counted a capture as a match. Main's rewrite of brief.md DESIGN and andres-mode had no other skill behind it.
**What changed.** andres-mode Parity is the rule's one home: Paper is the build source, the design system is reference, production holds between frames, every difference is listed or asked, phone frames are build targets, parity is a looked-at verdict. brief.md carries the builder's DESIGN and the REPORT's Discrepancies table; review.md carries the judge's MATCH or NO; thoven-designer, skills.md, standing.md, verify and qa-flow point at them. A scan that refuses a Paper value gets one allowlist entry naming the node, never a raised count or baseline.
**Still open.** build-design and building-components are installed from outside this repo (audit rows 7, 8, 32-35); the parity scripts (rows 20, 28, 29) and frontend `TESTING.md` (row 27) belong to a frontend builder pane.

---

## 2026-08-29 — pane ownership needed a value, not more routing prose

**What happened.** Pane sessions independently reconstructed Project state from Linear, global
state, audience handoffs, and feature files. The session gate, Map, and ledger could each be
internally green while describing different Projects or different working trees.

**Why.** Long entrypoint prose assigned overlapping ownership, and the architecture made the
optional organizer pane the synchronization point. It offered no immutable evidence package for
the main session to inspect.

**What changed.** Workspace and feature-ledger now share a pure Project snapshot and stable
fingerprint. Meta is optional. The main session owns synthesis and approved shared writes. Agents
own bounded path sets; disjoint green units commit exact paths, same-file edits serialize through a
named integration session, and red work returns an evidence receipt instead of an ambiguous dirty
tree.

## 2026-08-23 — miners looked in Cursor; the sessions are in Claude

**What happened.** The first pass of this audit mined Codex + `STATE.md` and
said the worktree had no transcripts. Andres: the history is in Claude.
Eight teacher-2.0 chats were already on disk. The Aug 18 chat (`84868358`)
already asked *"Also how is linear still wrong, is there gaps in our
workspace and feature ledger skills still?"* Five days later THV-63 was
grilled on Todo anyway.

What he actually types: `/grill-me`. That skill's body is `Call grilling`.
`grill-with-docs` never opens. Same skip Codex hit by searching for
`grill-me` and falling back to `grilling`.

The same Claude chats repeat failures already in the per-skill LEARNINGS
(proto not deleted, slot resized, rulings captured at wrap-up) and add
ones that are not:

- Viewport left resized — *"eighth time"* (`5afdd0ee`). Measurement
  scaffolding stays in the live browser.
- DialKit left mounted after the values lock (`5afdd0ee`).
- Raw HTML when the ask was a `design-workflow-outline` proto on
  `app/dev/` (`a86cfc6e`).
- Grill questions that are UX first principles (`5afdd0ee`).
- D-numbers spoken in chat (`5afdd0ee`). IDs are for docs.
- A Speccing brief *"Do not touch app/teacher/*"* and the session built
  anyway (`a86cfc6e`).

**Why.** Two transcript stores. The skills that mine history only name
one. `/grill-me` is the human command; the gate was hung on a name he
does not type.

**Still open (added).** Point `recall` and `automate-me` at
`~/.claude/projects/<slug>/` for Claude Code sessions. `grill-me` must
run the session gate or it must not exist as a bypass. Viewport restore
and DialKit removal belong in the design/proto skills, not a personal
mode.

---

## 2026-08-23 — the session gate shipped and the next grill still starts

**What happened.** Codex grilled THV-63 while the issue was Todo, unassigned,
no milestone. A Linear subagent reported that state. Codex asked Q1.
Decisions stayed in chat. Cursor wrote the onboarding ledger and deleted
production files (`app/teacher/`). The issue was claimed at wrap-up.

`45fc301` added `session-preflight.js` and put **Session gate** first in
`workspace`, `feature-ledger`, and `grill-with-docs`. That is not enough.

Proved on disk after the ship:

- `grilling`'s description is "any grill trigger phrases"; first action
  is Q1. Codex searched for `grill-me`, fell back to `grilling`, never
  opened `grill-with-docs`.
- `grill-with-docs` step 1 is still `Call grilling`. The gated skill
  hands off to the ungated one.
- `session-preflight` / `session gate` appear in **zero** always-loaded
  files (`CLAUDE.md`, `AGENTS.md`, `WORKFLOW.md`).
- The script greens a handwritten snapshot with `state` omitted, and
  greens a `Writes to:` path when `writesToExists` is omitted.
  THV-63-as-found still exits 1.
- Fetch and judge are two steps. Skip the fetch, omit a key, proceed.
- `capture` still says "Skip the gate and the fan-out" — leftover name
  for the checkout scan.

**Why.** Rule 9: a script the starting skill never runs is the same skip
as no script. WORKFLOW.md is definitions, not a procedure. Frontend
`CLAUDE.md` compresses Speccing to "no code"; the law is `app/dev/` in,
shipped product out. That wrong bound is the one the popup-delete
session obeyed.


**Still open.**

P0 — next grill still starts:

1. `grill-me` and `grilling` run the gate, **or** they lose "grill" from
   the description. `grill-with-docs` keeps the gate and does not hand
   off before green. Andres types `/grill-me`.
2. One line in `CLAUDE.md` / `AGENTS.md`: before the first write, run
   the workspace session gate. Red is a halt.
3. Script fail-closed: missing/unknown `state` is red. Non-empty
   `writesTo` with `writesToExists !== true` is red. Tests assert exits.
4. One command: script reads a Linear payload (or exits 2).

P1 — same skip, other doors:

5. `WORKFLOW.md`: no write before green. Drift at start is a halt; the
   same condition mid-session is a finding. Claiming session creates the
   missing milestone. Delete §3's "every milestone at 0% is also
   correct."
6. Rename leftover "the gate" in `workspace` `capture` to "checkout
   scan".
7. Ungated writers: `implement`, `architect`, `qa`, `writing-plans`,
   `to-spec`, `to-tickets`, `orchestrate`.
8. Cut frontend `CLAUDE.md` restatements (board, wrong folder tree,
   "nine rules", "no code").
9. `recall` / `automate-me` read `~/.claude/projects/` on this worktree.
10. Viewport restore + DialKit removal in the proto/design skills.

P2 — tighten `45fc301`:

11. One shared gate invocation (copied in three files today).
12. Descriptions lead with **session gate**.
13. `agent-skills` done = pushed.

**Homes.** Law in `WORKFLOW.md`. Step and script in `workspace`. One-line
pointer in `CLAUDE.md` / `AGENTS.md`. Do not put the same sentence in
all three.

**Not this.** A lefthook `THV-<id>-` branch check.

---

## Catalog — everything the 2026-08-23 audit found

The two entries above were the cut. This is the rest. Sources: Codex
`rollout-2026-08-23T00-31-26-01a02ce3`, Claude chats `5afdd0ee` `84868358`
`a86cfc6e` `36e92ac6` `810f9643`, `STATE.md` Log 2026-08-14–23, the three
gated skills as shipped in `45fc301`, always-loaded `CLAUDE.md` /
`AGENTS.md` / `WORKFLOW.md`.

### The grill that started anyway (THV-63 + Codex)

1. No Linear claim. Zero update calls. Context harvest → Q1.
2. Sub-agent said *"Todo, no milestones"* and *"onboarding waits until
   dashboard design closes."* Parent treated both as FYI.
3. Sequencing conflict named, then converted into a grilling question.
4. `CONTINUE_HERE` pointed at THV-74 → THV-64. Read after sub-agents
   were already dispatched.
5. `DESIGN_ONBOARDING.md` said empty D# is *"STOP and ask."* All six
   rows empty. Grill started.
6. Feature-ledger was read, then simulated with `find` + `rg`. Reconcile
   never ran.
7. `workspace log` never ran. `STATE.md` line for this session was
   written by the next one.
8. No `Writes to:` target checked before Q1. Grill died at Q7 with
   nothing on disk. Cursor wrote the files later from chat.
9. A terse two-fragment answer was treated as five firm rulings. Two of
   those bullets were not in the answers.
10. Agent defaulted to a full route lock. Andres: notification only.
11. Mem0 down. One-sentence footnote. Continued.
12. Next session acted on oral rulings and deleted `app/teacher/`
    production files in Speccing.

### The gate we shipped still skips

13. `grilling` wins the word "grill". First action is Q1.
14. `/grill-me` is the command Andres types (`84868358` Aug 18). Body:
    call `grilling`.
15. `grill-with-docs` step 1 calls `grilling` after the gate. Hands off.
16. Always-loaded law: zero hits for `session-preflight` / `session
    gate`.
17. Missing `state` on the snapshot → exit 0. Omitted `writesToExists`
    → exit 0. THV-63-as-found → exit 1.
18. Fetch and judge are two steps. Agent authors the JSON.
19. `capture` still says *"Skip the gate and the fan-out."*
20. Helpers table in workspace lists `regen` / `reconcile-manifests` /
    `item` / `ids` / `register`. Omits `session-preflight.js`.
21. Tests assert the judgment object. No test for exit 1 / 0 / 2. Bad
    JSON throws a Node stack.
22. The bash+JSON block is copied in three skill files.
23. Descriptions lead with "The Linear update tool", not "session gate".
24. A vendor `grill-with-docs` stub still sits in the mattpocock
    marketplace pack.

### WORKFLOW.md is definitions. The step is missing.

25. "Claim only from Todo" is a permission, not "claim before the first
    write."
26. Milestone attach is assigned to Andres in §4. The claiming session
    has no step. Onboarding had zero milestones.
27. §3 says empty milestones are forbidden *and* "every milestone at 0%
    is also correct."
28. Halt vs finding: absent. Same condition is a stop at start and a
    listed row in `check`.
29. Speccing vs `app/teacher/` *is* in the law, three times. No check.
    Frontend `CLAUDE.md` restates it as "no code."
30. WIP cap excluding Speccing did not cause THV-63 to sit in Todo.
    Nobody moved it.
31. §7 is a paste-into-Linear-agents block and the only imperative
    text. It duplicates §1 / §4.

### Always-loaded law that did not fire, or fired wrong

32. Frontend `CLAUDE.md` has no claim step. "Never claim one already
    taken" is a prohibition about someone else's issue.
33. Speccing bound, three copies: "no code" / "no production code" /
    "`app/dev/` in, shipped product out." Only the third is true.
34. State machine cached in frontend `CLAUDE.md`, root `CLAUDE.md`,
    `AGENTS.md` (~35 lines).
35. "grill" appears once in frontend `CLAUDE.md`, inside a skill-rename
    paragraph. No pointer for *write a ledger* / *lock a design*.
36. Feature-folder tree in frontend `CLAUDE.md` names `product.md` and
    `design/VERSIONS.md`. Those live under
    `archive/pre-migration-2026-08-18/`. Live tree is
    `PRD.md` + `decisions/{api,architecture,database}.md` +
    `DESIGN_<PROJECT>.md` + `drawings/`.
37. "The nine rules": frontend has 11, root has 12. Frontend dropped
    rule 12 and rule 1's "One Slice is one Issue."
38. `AGENTS.md` Done when = file exists. Law = file passes its own
    `Done when` + no `SCAFFOLD` marker. 27 files still hold `SCAFFOLD`.
    The grep is in no always-loaded file.
39. `workspace log` is not a command on this machine. Three always-
    loaded files name it.
40. Branch names: `AGENTS.md` says `THV-<id>-short-slug`. Frontend
    `CLAUDE.md` says commit to `main` except large features. This
    worktree is `feature/teacher-2.0` (deleted 2026-09-30). Neither matches.
41. "Every `wireframe/<sprint>/` carries a `VERSIONS.md`" — 9 of 20 do.
    Live artifact moved to `app/dev/<feature>/page.tsx`.
42. Rules 15–16 restated in four places (two CLAUDE.md files, Design
    Locks, WORKFLOW.md §5) while also saying they live in
    `feature-ledger`.
43. Sediment still always-loaded: lint-count parenthetical, skill-rename
    map, `/feature-plan` collision note, Hermes provenance block, "the
    old never-branch rule no longer applies."

### Skills that start work with no gate

44. Gated (3): `workspace`, `feature-ledger`, `grill-with-docs`.
45. `grilling` / `grill-me` — Q1. MUST.
46. `implement` — writes and commits. 14 lines. No Linear. MUST.
47. `architect` — default is implement, no human checkpoint. MUST.
48. `qa` — fix source, commit each fix. MUST.
49. `writing-plans` — invents `docs/superpowers/plans/YYYY-MM-DD-…`.
    `AGENTS.md` says never invent a path. MUST.
50. `to-spec` / `to-tickets` — publish Linear issues, apply
    `ready-for-agent` (not in the label set). MUST.
51. `orchestrate` — front door to the ungated writers. MUST.
52. `feature-orchestrator` — writes a rival folder
    (`docs/[Feature]/00_MASTER_PLAN.md` etc.) and `CURRENT_STATUS.md`.
    MUST.
53. `design-workflow-outline`, `plan-eng-review`, `preflight` — write
    files / checked-in tests. MUST.
54. `publish` — deploys. No Linear. MUST.
55. `session-memory` — writes the Log. "Do not log while red" lives
    only in `workspace`. SHOULD.
56. `cco-audit` — still tells the agent to write `TODO.md`. Frozen
    2026-08-14. Separate bug.
57. "commit" / "push" / "ship" appear in no gated description. Those
    words route to `verify` / `qa` / `publish`.

### Claude chats (Aug 16–23) — same failures, plus these

Already in per-skill LEARNINGS, repeated in Claude:

58. Proto not deleted. Next session reads it and rebuilds. Andres:
    *"eighth time"* / *"delete prototypes post-implementation."*
    (`5afdd0ee`, `84868358`, `36e92ac6`)
59. Component resizes the slot. Upcoming Lessons, business-analytics
    proto "redesigned the full landing page", sliding pill broken
    twice. (`5afdd0ee`, `a86cfc6e`)
60. Mid-session ruling not captured. Re-decided next session.
    Accordion, library indigo. (`workspace` LEARNINGS 2026-08-22)
61. Built from the proto instead of the shipped component.
    (`84868358`, `36e92ac6`, `810f9643`)
62. Decisions ruled in chat, filed at wrap-up or not at all. D72–D86
    batch. "They exist only here." (`84868358`, `36e92ac6`)
63. Over-documented design. D84 before implementation. D80 was a table
    of eleven numbers the running route already held. Rule 12.
    (`84868358`)
64. Law cited in the same turn it was violated. (`84868358`)
65. `/to-issues` still the stock mattpocock skill. Never heard of the
    ledger. (`84868358`)
66. Aug 18: *"how is linear still wrong, is there gaps in our
    workspace and feature ledger skills still?"* (`84868358`)

Not yet in a per-skill LEARNINGS:

67. Viewport left at a test size. *"Eighth time."* Claude wrote a
    memory file. Still happens. (`5afdd0ee`)
68. DialKit left mounted after the values lock. (`5afdd0ee`)
69. Raw HTML when the ask was a `design-workflow-outline` proto on
    `app/dev/`. (`a86cfc6e`)
70. Grill questions that are UX first principles. (`5afdd0ee`)
71. D-numbers spoken in chat. IDs are for docs. (`5afdd0ee`)
72. Pending grill rows not replaced by the decision. (`5afdd0ee`)
73. Isolated token patch reverted adjacent settled CSS. (`5afdd0ee`)
74. Visual change claimed; rendered page still the old font.
    (`5afdd0ee`)
75. Work written, not mounted. Live dashboard unchanged. (`5afdd0ee`)
76. Gate invoked *against* Andres when he redirected. *"What is the
    locked milestone if I am asking for a change it is fine."*
    (`5afdd0ee`)
77. Speccing brief *"Do not touch app/teacher/*"* and the session
    built. (`a86cfc6e`)
78. PR opened for WIP. (`a86cfc6e`)
79. Ledger / Linear / CONTINUE_HERE not updated until he asks.
    (`5afdd0ee`)
80. "Good enough" not treated as converge. Kept generating
    alternatives. (`5afdd0ee`)
81. Orchestrator-only session declared; agents still execute.
    (`5afdd0ee`)

### STATE.md Log — same class, 2026-08-14–23

82. Agent records decisions about its own abstractions, not the
    drawing. ("discovery dashboard", "held code.")
83. Linear milestone / Project descriptions stay stale after decisions
    change. Andres ruled *against* a mechanical check during Design:
    *"it creates a test that does not allow me to be dynamic."*
84. Hand-built fixtures supply values production never emits. Suites
    green. (`files_count`, reviewed toast.)
85. `verify:prod` markers survive the release that supersedes them.
86. Test baseline quoted once, wrong, reaches Linear and the next
    prompt. Rule 11 applies to test output.
87. `db/structure.sql` polluted by other worktrees. Third time after
    THV-89. Per-worktree DB script still deferred.
88. `CONTINUE_HERE` carries status tables. Status lives in Linear.
89. Surface with no design row (rule 13). Closed 2026-08-23 for the
    first time on the dashboard.
90. Deleted test assertions invisible to a presence-only thermometer.
91. Cross-surface rule with no owning gate.
92. Log entries that *are* status: "THV-55 and THV-58 remain Todo",
    "Open for Andres: …", live dirty-counts of sibling worktrees.

### What not to do with this list

94. Do not add a lefthook `THV-<id>-` branch check.
95. Do not put the same sentence in WORKFLOW.md, the skill, and
    CLAUDE.md. Law / step / one-line pointer.
96. `SUPERSEDED AS A SOURCE · LIVE AS A LOCK` vs Andres 2026-08-23
    *"delete. Don't say superseded."* Flag. Do not self-resolve.
97. `agent-skills` done = pushed. The remote is the install source.

---

## 2026-08-23 — writing-for-agents wins (not a mode skill)

Filter on the catalog: only edits whose lever is a pointer, a step, a
leading word, a completion criterion, a prune, or an invocation cut.
Script fail-closed and DialKit-the-widget are out of this list.


### Pointer (description / always-loaded line)

W1. **`grilling` is model-invoked and owns the word "grill".** Description:
    *"any 'grill' trigger phrases."* First action is Q1. `grill-with-docs`
    cannot win that race. Invocation cut: make `grilling` user-invoked
    (`disable-model-invocation: true`) so only a skill that calls it can
    reach it. Or strip "grill" from the description. Same for `grill-me`:
    keep it as the typed command, change the body from `Call grilling` to
    `workspace start`, then `grilling`.

W2. **One always-loaded line, front-load the leading word.** Frontend
    `CLAUDE.md` Work-state today starts with the status chain and
    *"never claim one already taken."* Replace the restated board with:
    `Session gate first — workspace/tools/session-preflight.js. Red is
    a halt. Law: WORKFLOW.md.` "grill" today lives inside a rename
    paragraph. Dead.

W3. **`recall` / `automate-me` point at the wrong store.** They name
    `~/.cursor/projects/.../agent-transcripts/`. This worktree's chats
    are `~/.claude/projects/-Users-andresmartinez-thoven-frontend-teacher-2-0/`.
    One new branch on those pointers: Claude Code sessions.

W4. **Writer-skill descriptions have no `Writes to:` / session-gate
    branch.** `implement`, `architect`, `writing-plans`, `to-spec` fire
    on "commit", "design this", "before touching code." Add the branch
    or they keep starting on Todo.

### Step and completion criterion

W5. **Name it Step 0.** `## Session gate` reads as orientation. `## Step
    0 · Session gate` + done when = exit 0. Same in `grill-with-docs`
    and `feature-ledger`.

W6. **Split by sequence.** `grill-with-docs` currently: gate, then
    "Call grilling" in the same file. Q1 is visible while the gate is
    still running — premature completion. The next step after green is
    a handoff to `grilling`, not an inline call in the same body.

W7. **`AGENTS.md` Done when = "the document exists."** Satisfied by an
    untouched `SCAFFOLD`. Point at WORKFLOW.md §5: `grep -rl "SCAFFOLD"`
    empty, and the file's own `Done when` block.

W8. **`CONTINUE_HERE` is not a step.** Codex read it after dispatch.
    First step of `start` / grill: open it. Done when = you can say
    whether this issue is the one it points at.

W9. **A STOP line in a design file is a completion criterion.**
    `DESIGN_ONBOARDING.md` already said it. `grill-with-docs` never
    makes "no STOP remaining" the bound of the harvest step.

W10. **`grilling` frontier = what looking cannot tell you.** Rule 12 as
     the demand on the step. Drops UX-101 questions (catalog 70).

### Leading word / negation

W11. **"The gate" means two things.** Session gate vs checkout scan.
     `capture` still says *"Skip the gate."* One word, one meaning.

W12. **Positive claim line.** *"Never claim one already taken"* is a
     prohibition about someone else's issue. Target: *"Claim from Todo
     before the first write."*

W13. **Positive Speccing bound.** Delete "no code" / "no production
     code." Keep the law's sentence: protos and `app/dev/` in; shipped
     product out. One copy, in WORKFLOW.md. Pointers quote or link.

W14. **Green before the first question.** Retire *"Do not ask Q1 while
     red"* in `grill-with-docs` description and body.

W15. **In chat, name the surface.** D-numbers are for docs (catalog 71).
     One line in `grilling` / `workspace` `capture`.

### Prune / single source

W16. **Cut the frontend restatements.** Status chain, folder tree
     (`product.md` / `VERSIONS.md` are archive-only), "the nine rules"
     (11, missing rule 12), rules 15–16 inlined next to "they live in
     feature-ledger", `VERSIONS.md` "every sprint" (9 of 20), lint-count
     parenthetical, skill-rename map, `/feature-plan` note, Hermes
     block, "old never-branch rule."

W17. **One Speccing bound.** Three copies, three wordings. Keep
     WORKFLOW.md §1. Delete the other two.

W18. **One gate invocation.** The bash+JSON block is in three files.
     Pointer: `workspace` owns it. The others say "run Step 0 there."

W19. **`workspace log` is a no-op.** Named in three always-loaded
     files. Not a command. Cut or point at the skill.

W20. **`writing-plans` invented path** is a second source against
     `Writes to:`. Description and body: the issue names the path.

Not this list: script fail-closed (17), DialKit-the-widget (68),
lefthook branch names (94). Those are code,
not writing-for-agents.
