# Grill outcome, 2026-11-12: what Andres decided, and the redrafted texts

This file wins over `combined.md` and the eight lever reports wherever they differ. Nothing here is
applied. Skills, rule files, hooks and Linear are unchanged until Andres approves.

## 1. His decisions (his words where he typed them)

| # | Question | His answer |
|---|---|---|
| 1 | How a spec opens | Goal, Why, What matters (a short list, not ranked), Done for the product. "when i mean whats important its more about we just need to attach a why to things not just the what" |
| 2 | How a spec rule carries its why | A "because" on each rule. A reason several rules share is written once under the area heading |
| 3 | Architecture: how to evaluate | "A bit of both, but some of them already exist in our claude md, but we can parse out best practices like DRY, deep modules, simplicity of clever code but most importantly i think its all about clarity in writing not overly verbose. for the guidance its going to change depending on whats built so its much more of a overall framework, separate units, parallelize (even though the dispatch brief will carry those skills), test the minimum unit that you can prove indisputably that it works and follows the build" |
| 4 | Architecture: the middle | A table of units (builds on, alongside, smallest proof), under four fixed measures |
| 5 | What the build ticket holds | Scope and sources. The builder plans its own steps |
| 6 | Exit lines | Each line is an outcome with its one proof |
| 7 | Who edits exit lines | "Let's just not overthink it… we just make the verifier check against it, the builder shouldn't touch it." |
| 8 | A document at its size limit | Consolidate first, then add |
| 9 | Size check | A counter runs on every save and stops an over-limit document |
| 10 | Limits | Spec 3,000 words. Architecture 3,000. Log entry 120. Build ticket 400, with 3 to 10 exit lines |
| 11 | Hand-over and check-ins | "we shouldn't have all these in-between loops. Like just dispatch the work finish it upload it and then done… it shouldn't text back every commit everything handed over it should just complete the work… we review against the whole work… if I see half of the work or it's verifying half of the work it might think it's incomplete and then it causes more issues just wait at the end of the unit of work" |
| 12 | When the review happens | Once, when everything dispatched is done |
| 13 | What the builder checks | "the proofs, and then if it catches anything during review, then it has the ability. But what we don't want is four different rounds. Like, what we don't want is the builder to run parity and then the verifier to run parity again… There has to be less redundancy and verification… just do the named proofs and then do code checks and then wider suites run later… and then I can dispatch the wider runs… what we don't want is that every dispatch becomes… one screen turns into thirty checks back and forth" |
| 14 | The main session's own start-up load | Leave main as it is |
| 15 | Polish | "use /technical-writing, /to-spec, and /writing-for-agents for some inspiration on how to polish and improve these" |

Settled by what he had already chosen, and stated to him without objection:

- Document templates replace the Sep 30 line "no document templates".
- The design-check wording moves to the law as it stands today. No rewording.
- The brief stops carrying its own copy of the playbook. The playbook stays.
- A log entry points at the AI chat it came from.
- The writing rules have one home in the workspace skill. The law carries one line that points
  there, because Codex builders read only the repo file.

## 2. What the three skills gave the redraft

- **technical-writing.** One document, one mode. The spec and the architecture are reference: they
  describe, in the present tense, with no argument. The log is explanation: the why, the options,
  his words. The ticket is a how-to: a goal and when it is reached. This is the reason the split
  holds. Also: one thought per sentence, say who does what, write the real file or screen name,
  one name per thing.
- **to-spec.** The problem and the solution are written from the user's side. "So that" is the
  why. File paths stay out of the spec because they go stale, so paths live only in the
  architecture. A test sits at the highest point that proves the behaviour, which is the "smallest
  proof".
- **writing-for-agents.** A completion criterion is checkable and exhaustive. Say the target, not
  the ban. One home per meaning. Write down only what looking cannot tell you.

## 3. The four templates

### Spec

```
Title: Spec · [Project]

[This page states what is true now, in the present tense. Replace every bracketed line. A section with nothing in it says "None". 3,000 words at most. At the limit, merge the lines that state one decision and cut what a screen already shows, then add.]

## Goal

[One or two sentences, from the user's side: what changes, and for whom. 50 words at most.]

## Why

[What the problem costs that person today, and why it is worth building now. 80 words at most.]

## What matters

[The few things this feature must get right, one line each, each with its reason after "because". Five lines at most. A builder who must choose between two ways to build reads these lines first.]

## Done for the product

[What each person can do once this ships, one line per person or moment: "A parent can …". Three to six lines. Every build ticket's outcome links one of these lines. The Project is done when a person can do every line on the real product.]

## Rules

[The behaviour a builder cannot see by opening the design: who may do what, limits, timing, what happens when something fails, what is kept. One rule per line, numbered S1, S2 …, 40 words at most. Each rule ends with its reason after "because". When the rules in one area share a reason, write it once as the area's "Why" line. A rule that came from Andres uses his words and links its Log entry. To change a rule, edit its line. Version history keeps the old text. Name people and screens here. File paths belong to the Architecture page.]

### [Area]

Why: [The reason these rules share, in one sentence.]

- **S1** [Rule], because [reason]. ([Log entry])

## Screens

[One line per screen or state: its name and a link to its design frame or lab route. The frame carries copy, layout, colour, spacing and motion.]

## Not in this version

[What a builder could reasonably build and must leave out, one line each with its reason.]

## Open questions

[Each question only Andres can answer: the question, and the default a builder builds until he answers. An answer becomes a rule above, and its line here is deleted.]
```

### Architecture

```
Title: Architecture · [Project]

[This page states how the code is shaped to deliver the spec. The spec says what and why. This page says where in the code. Fill it after reading the code. 3,000 words at most. At the limit, merge and cut, then add.]

## Shape

[One paragraph: how this feature fits the code that exists today, and the one or two choices that shape everything else, each with its reason. 150 words at most.]

## Judged by

- Builds on what exists before adding.
- One job per module, behind a small interface.
- Simple over clever.
- Each unit provable on its own.

[These four lines are fixed. Design options are judged by them before one is chosen, and the review judges the build by the same four. A choice on this page that breaks one says so beside it, with its reason.]

## Units

[One row per unit a builder can finish and prove alone. A build ticket covers one row, or a few rows that share a proof. A unit other units build on is listed first and built first.
Builds on: the module that does this job today, by path, or "none", with what was searched.
Alongside: the units that can be built at the same time because they share no file.
Smallest proof: the one check, at the highest point a person or caller reaches, that cannot pass while the unit is broken.]

| Unit | What it does | Builds on | Alongside | Smallest proof |
|---|---|---|---|---|
| [Name] | [One line] | [`path` or "none"] | [Units] | [Check] |

## Data and contract

[Each field a screen reads: endpoint, field, type, and whether the backend sends it today. Each schema change. Link `contract/openapi.yaml` for the full shape.]

## State rules

[Only the rules that neither the code nor the spec shows: ordering, concurrency, what happens on a retry. Numbered A1, A2 …, each with its reason after "because".]

## Open technical questions

[Each with the default to build until it is answered.]
```

### Log

```
Title: Log · [Project]

[This page keeps the reasoning behind the spec and the architecture. Builders build from those two pages, and a rule there links its entry here. Add each new entry at the top. 120 words at most per entry. An entry is final once written. A later answer is a new entry.]

## [YYYY-MM-DD] [Subject, five words]

**Asked:** [The question as it was put to Andres, with its options, or "unprompted".]
**Andres:** "[His words, verbatim.]"
**Changed:** [Links to the lines this produced: S12 edited, A4 added.]
**Turned down:** [Each option not taken, one line with its reason.]
**Reading:** [Only when a line in Changed says more or less than his words: one line, written as the writer's reading.]
**Chat:** [Where the full exchange is: the tool (Claude Code, Codex, claude.ai), the machine (laptop or mini), the session id or transcript path, and the time of his message. For an answer given as a Linear comment or on a board, that link instead.]
```

### Build ticket

```
Title: Build: [what a person can do when this ships]

Writes to: [frontend, backend or both] on `[branch]`

## Outcome

[One or two sentences: what a person can do when this ships, and why it matters to them. Link the "Done for the product" line in the spec that this serves.]

## What to build

[The pieces, one line each, each linked to its row in the architecture's Units table. State an order only where one piece needs another first. The builder plans its own steps.]

## Build from

[Links only, each to its exact heading: the spec rules, the screens (design frame or lab route), the architecture units, and the existing modules to extend, by path.]

## Exit criteria

[Every line is true before this ticket is done. Each line is one outcome a person can see or a caller can observe, then "Proof:" and the one check that cannot pass while the outcome is false. Three to ten lines. More means two tickets. The builder runs each proof once and attaches it. The reviewer judges the build against these lines. Main and Andres edit them. A builder who thinks a line is wrong asks main.]

- [Outcome.] Proof: [check].

## Leave alone

[Optional. Neighbouring screens or code a builder could touch and must leave as they are.]
```

The whole ticket is 400 words at most.

## 4. The writing rules (home: the workspace skill, "Writing to Linear")

```
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
```

The law's one line: `Project documents follow the workspace skill's "How to write a Project document": one page one job, a reason on every rule, and the size limits.`

## 5. The size counter (draft, not built)

- One hook script in `~/thoven/agent-skills/enforcement/hooks/`, fired on the Linear connector's
  `save_document` and `save_issue`.
- It finds the page kind from the title prefix (`Spec · `, `Architecture · `, `Log · `, `Build: `)
  and counts words. For a Log it counts each entry. For a Build ticket it also counts the lines
  under "Exit criteria".
- Under the limit it prints one line, for example `Spec · Passport: 2,640 of 3,000 words`.
- Over the limit it stops the agent with the consolidate instruction from section 4.
- A page with another title passes in silence. Empty input is refused, and the script ships with a
  test for that.
- **Not verified.** Whether `save_document` returns the saved body, and whether a partial edit
  returns the whole page. If it does not, a partial edit is counted just after the save, so a page
  can sit over its limit for one step. Codex panes do not run Claude Code hooks and get the written
  limit only. One probe settles the first two before any of this enters a skill.

## 6. Build and review, after the grill

- **The builder finishes the whole dispatch.** No check-in per commit, no mid-work review, no
  hand-over at 150 actions. It asks only when it is blocked on something only main or Andres can
  answer.
- **The builder's checks** are each exit line's proof, run once, plus lint and type-check on the
  files it touched. Where a proof is the design capture, the builder makes it once.
- **One report at the end**: each exit line, true or not, with its proof attached.
- **One review, when everything dispatched is done.** The reviewer judges the build against the
  exit lines, the spec rules they link, the architecture's four measures and the code around the
  change. It reads the builder's proofs. It reruns a proof only when that proof looks wrong or a
  finding needs it. The design capture is made once, by the builder, and judged by the reviewer.
- **The builder never edits exit lines.** Main and Andres do.
- **Wider suites** run when the branch lands, or when Andres dispatches them.
- **Not measured.** What a long dispatch costs without the 150-action hand-over. The 150 rule was
  set for cost.

## 7. What changes in the lever drafts

| Lever report | Blocks to redraft |
|---|---|
| `linear.md` | Changes 1 to 4 take the templates in section 3. Changes 5 to 7 use the name "Exit criteria" with an outcome and proof per line |
| `workspace.md` | C1 gains the rules and limits in section 4. C3's ticket shape becomes Outcome, What to build, Build from, Exit criteria |
| `dispatch.md` | The brief template points at Exit criteria, drops check-ins and the 150-action hand-over, and tells the builder to run each proof once and report once |
| `verify-review.md` | C1 teaches exit lines as outcome plus proof. C2 is one review of the whole dispatch that reads proofs and reruns none by default |
| `spec-chain.md` | C1's design rubric is the four measures. C5 cuts tickets from the Units rows |
| `law-claude.md` | C3 says the builder never edits exit lines, and carries the one pointing line from section 4 |
| `andres-mode.md` | The pitfall "your ask goes into Done when" says "Exit criteria" |
| `startup-load.md` | No change. Main's own load stays as it is |
