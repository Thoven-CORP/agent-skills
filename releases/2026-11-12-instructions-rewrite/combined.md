# The proposal: what to change in each part of the workflow

Main session, 2026-11-12. Built from eight lever reports in this folder, each written by one agent
that opened that lever's files. Every drafted text is in the lever's report, ready to paste.
Revised 2026-11-12 after the grill. `grill-outcome.md` holds his answers and the redrafted
templates, and wins where this file is shorter.
Nothing is approved. Nothing has been changed in the skills, the rule files, the hooks or Linear.

## 1. The proposal in one view

Agents follow prompts, and ours tell them to write enormous documents, mix history into the final
answer, and rewrite the source at every hand-over. The proposal changes the prompts and the
structures that produce that. Eight levers, changed together.

| Lever | What changes | Size before | Size after |
|---|---|---|---|
| Linear templates | Three document templates (Spec, Architecture, Log) and a Build ticket template that is the brief. Each carries its size limit, and a counter checks it on every save | 0 document templates. A Passport-sized project wrote about 131,800 words | Spec 3,000 words, Architecture 3,000, Log 120 an entry, ticket 400 (limits, not yet tried on a real spec) |
| Workspace skill | One table says where each kind of writing goes, and one block says how to write it: one page one job, a reason on every rule, consolidate at the limit. A ruling edits the spec in place. The history-shaped decision entry is deleted | 9,167 words | 7,815 |
| Your working-style skill | Becomes the main session's file. Builders stop loading it. Copies of rules that live elsewhere are cut | 4,289 words, loaded by 43 of 46 builders | 2,682, loaded by main only |
| Dispatch | The brief is the ticket plus where to work and how to report. The builder finishes the whole dispatch and reports once. Corrections edit the ticket | Template 1,453. A sent brief about 2,250 | Template 454. A sent brief about 600 |
| Verify and review | Each exit line is an outcome with its one proof. The builder runs each proof once. One review at the end judges the whole work and reruns nothing by default | 4,887 words | 3,283, with no added round |
| Spec, ticket and plan skills | Four skills leave the chain. No project-level plan document. The design step is judged on reuse | 8,800 words | 2,450 |
| CLAUDE.md, AGENTS.md, law | One paragraph on records and sources. Branch and merge rules move to their own file. The feature-folder section goes | A frontend builder loads 7,615 words | 3,950 |
| Builder start-up load | A builder profile that switches off what builders never used | About 101,000 tokens before the task | About 61,000 to 71,000 (needs one test launch) |

## 2. How the pieces fit once changed

Flow, left to right:

1. You and main talk a feature through. Each answer goes into the **Log**: the question, your words
   as you said them, what was turned down, and where the chat is.
2. Main writes or edits the **Spec** (the goal, the why, what matters, what done means for the
   product, then the rules, each with its reason) and the **Architecture** (the shape, four fixed
   measures, and a table of units with what each builds on and its smallest proof). A change edits
   the line in place. At the size limit, the writer merges and cuts before adding.
3. Each **Build ticket** is cut from the units table: the outcome, what to build, what to build
   from, and exit lines that each pair an outcome with its proof.
4. **Dispatch** sends the ticket, where to work and how to report. Nothing is restated.
5. The **builder** reads the ticket and the spec and architecture sections it links. It plans its
   own steps, finishes the whole dispatch, runs each proof once, and reports once. It does not read
   the Log and does not edit exit lines.
6. A **change mid-build** edits the ticket or the spec, and the builder is told to re-read it.
7. **One review, at the end**, judges the whole work against the exit lines, the spec, the four
   measures and the code around it. It reads the builder's proofs. Wider test runs come later,
   when the branch lands or when you send them.

Which file teaches which step: the templates give the shape and the limits, the workspace skill
says where each thing goes and how to write it, the law tells every builder which documents to
read, dispatch stops copying, and verify and review define done.

## 3. The Linear templates, in full

Show these four in full, copied from `grill-outcome.md` section 3 (the same text is in `linear.md`
Changes 1 to 4). For each, one line of what it replaces and one line of what the grill added:

- **Spec.** Replaces the 25,000-word "spec and decisions" page, where 100 of 258 rows carry two or
  more dated amendments and a third of the page is not current truth. Added: it opens with the
  goal, the why, what matters and what done means for the product, and every rule carries its
  reason.
- **Architecture.** Replaces about 62,000 words across two documents. Added: four fixed measures
  the design and the build are both judged by, and a units table where each unit names the module
  it builds on, what it can be built alongside, and its smallest proof.
- **Log.** Replaces "ruling, one sentence". Today's decisions log is 22,138 words and quotes you 12
  times. Added: each entry says where the chat is.
- **Build ticket.** Replaces the 5,901-word plan section one ticket pointed at, whose acceptance
  was lists of ids. Added: "What to build" and "Build from" say what and from what, and each exit
  line pairs an outcome with its proof. The builder plans its own steps.

Then show the writing rules block from `grill-outcome.md` section 4, with its limits table, and
the size counter from section 5 as a draft with its "not verified" line.

Then one line each for the smaller template changes (`linear.md` Changes 5 to 8): the general
ticket, the bug ticket and the brainstorm ticket get exit lines that are always filled; the
project template and the setup standard point at the three documents.

**What Linear cannot do.** An agent creating a document through the connector cannot apply a
template. Linear does not limit length or require a field for agents. So the templates set the
shape and state the limit, the workspace skill tells agents to read the template and fill it, and
the counter does the counting.

## 4. Lever by lever

For each lever below: show the listed changes as cards with "What changes", "Why" and a collapsed
block holding the drafted text copied from the report heading named.

### Workspace skill (`workspace.md`)

- **C1. "Writing to Linear" replaces "Ruling".** One table gives each kind of writing its home.
  One block says how to write it: one page one job, one decision one line, a reason on every rule,
  plain sentences, the size limits, and consolidate at the limit before adding. Why: the old decision
  entry (ruling, reason, rejected options, what it replaces, status) is the shape that made the
  Passport spec 183 decision headings with 142 rejected blocks.
- **C3. One ticket shape.** Outcome, What to build, Build from, Exit criteria. Replaces two overlapping shapes. Why: the
  skill's ticket stamp and Linear's own template disagreed, and the check was optional in one.
- **C4. The hand-over file names sources and stops copying them.** Why: "carry their governing
  content" is a direct order to restate, and restating is where your answers got wider.
- **C6 and C9. Move and delete.** The 589-word block on the snapshot tool moves to a reference
  file. A milestone ladder the file already calls superseded is deleted.

### Your working-style skill (`andres-mode.md`)

- **Change 1. The file is main's.** Builders work from the ticket, the law and verify. Why: 43 of
  46 builders loaded all 4,289 words, and more than half is about main's own job.
- **Change 2 and 3. Parity and "Check your own work" shrink to pointers.** 562 and 698 words go to
  about 125. Why: every bullet already lives in a file builders read. This is where the seven
  copies of one method come down.
- **Change 4. Records and Spec writing point at the workspace skill.** Why: one home per rule.
- **Change 5. Hard rules become each rule's only home.** Their copies further down are deleted.
- **Pitfalls becomes four lines about writing for other agents.** Re-read the source after a
  reset. "Andres ruled" only on your quoted words. A ruling is exactly as wide as your words. Your
  ask goes into the exit lines the turn you say it.

### Dispatch (`dispatch.md`)

- **Change 1. The brief template, 1,453 words to 454.** It keeps who the builder is, where it
  works, and how it asks, hands over and reports. The fixed design method, the fixed verify
  method, the copy-the-playbook script and the "Andres ruled" paraphrase slot are gone. Why: sent
  briefs were 11 to 13% pointers, 18 to 31% restating and 37 to 47% method.
- **Change 2. Corrections, takeovers and fix rounds rewrite in place.** Why: "newest wins"
  layering took one brief from 3,893 to 6,995 words in a day, holding two opposite rules.
- **Change 4. The builder's snapshot holds the ticket, not the parent ticket and its comments.**
  Why: the comments are the history.
- **No check-ins, one report.** The builder finishes the whole dispatch, runs each exit line's
  proof once, and reports once with each line true or not. The 150-action hand-over goes. Why: your
  point that half-finished work gets judged as incomplete and one screen turns into thirty checks.

### Verify and review (`verify-review.md`)

- **C1. What a good exit line is, in one place, with three worked examples.** A screen with a
  design, a backend change with no screen, a refactor. Each line is an outcome first, then its one
  proof. Why:
  one ticket passed six lines like "a named spec is green" and shipped a stamp pack with no sound.
- **C2. One review, at the end, of the whole work.** It reads the builder's proofs and reruns one
  only when it looks wrong. It compares the exit lines, then the spec, then the code
  around the change (is this a second copy of something, is the replaced code gone, does the test
  follow how this repo tests that kind of thing), then the design. The checks of the builder's
  paperwork are cut. Why: your point that review looked at a narrow scope.
- **"A structural finding is minor" is deleted in three files.** Why: it contradicts the law, and
  it is why dead code found on Nov 10 was filed for later. No round is added. The one fix round
  gets bigger.
- **C5 and C6. Seven copies of the design-check method and nine copies of the test schedule
  become pointers.**

### Spec, ticket and plan skills (`spec-chain.md`)

- **C3, C4, C10. Four skills leave the chain.** The spec-writing skill that asks for "a LONG,
  numbered list… extremely extensive", the plan skill at the spec stage, the technical spec
  generator, and the local feature-folder templates. Why: Passport was already split into
  documents and still reached about 110,000 words, with a plan document between the spec and the
  tickets. No project-level plan document exists after this. A plan is the builder's scratch.
- **C5. The ticket-writing skill cuts tickets from the units table and writes exit lines as an
  outcome with its proof.**
- **C1. The design step is judged by the four fixed measures, reuse first.** It stops scoring a design on how many agents
  can build it at once. Why: one design was picked so builders could work on separate files, and
  the losing design's module move was dropped. About 50 of 119 final-review rows trace to that
  step. This is a patch through the existing hook, because the skill is third-party.
- **C6. Reconciling a feature edits the spec in place and adds a Log entry.**

### CLAUDE.md, AGENTS.md and the law (`law-claude.md`)

- **C3. One law paragraph, "Records and sources".** A project has a spec, an architecture document
  and a log. A builder works from the ticket, the spec and the architecture. Every fact has one
  home. "Andres ruled" sits only on your quoted words. The builder never edits exit lines. One line
  points at the writing rules. Why: Codex builders read only this file, so
  a rule a builder must follow has to live here.
- **C4. Branch, pull request and merge rules move to their own file.** About 1,090 words. Four
  hard rules stay loaded. Why: builders are told not to open pull requests or merge.
- **C5. The feature-folder section (1,322 words) leaves the root file, and the "superseded"
  status words are deleted.** Why: those words exist to keep dead text on a live page.
- **C6, C9, C11. The root and repo files stop restating the law.**
- **A finding.** The conditional blocks in CLAUDE.md load in full every time. Wrapping text in a
  condition saves nothing. Only moving it to another file does.

### Builder start-up load (`startup-load.md`)

- **Change 1 and 2. A builder profile.** One settings file that dispatch passes when it starts a
  builder. It switches off main's memory index, the connectors builders never called, 17 unused
  plugins, 60 unused agent types and 29 skill descriptions meant for main.
- **Change 3. The working-style hook stays quiet in a builder.**
- **Change 4. The memory-recall hook stays quiet in a builder.** Why: 44 of 46 builders were
  handed about 8 old memories each, mostly other builders' hand-over notes. That is history
  leaking into the build.
- **Needs one test launch.** Four of the switches are read from the documentation and not yet
  seen working.

## 5. Where the levers disagreed, and what I chose

| Question | The levers said | What I chose |
|---|---|---|
| Where your exact words sit | One: only in the Log, with a link from the spec rule. One: on the spec line too. One: in the ticket | The Log holds the full exchange. A spec rule that came from chat is written in your words and links its Log entry. No stamp, no date. The ticket links the spec and copies nothing |
| What the history document is called | Log, History log, log | Log |
| Who reads the four writing rules | One: every session. One: quiet the hook in builders | Main gets them from the working-style skill. Builders get the same rule from the law paragraph. One copy each side |
| Where the design-check rule lives | The working-style skill, or the law | The law, because builders will no longer load the working-style skill. The wording moves as it stands today |
| What replaces the feature-folder section | A 360-word "Project documents" section, or a move to another skill | Neither. The one law paragraph covers it, and the section goes |
| Numbered ids | Keep a few, or use links only | Two short series only, one for spec rules and one for architecture rules, cited by a link to their heading. The eight Passport series go |
| Small work | Three documents always, or not | A one-ticket fix keeps its spec in the ticket. The three documents are for work across several tickets |
| "Done when" examples that cite decision ids | Left over from today's shape | They cite the spec rule instead |

One proposed change is left out: rewording the one-parent rule to say one agent holds the shared
shape. It cuts against your Nov 9 ask to split work smaller.

## 6. Your calls, as you settled them in the grill

| Call | Your answer |
|---|---|
| Who may change an exit line | The builder never edits them. The reviewer checks against them. Main and you edit them |
| The design-check wording | Moves to the law as it stands. No rewording |
| The hand-over trigger | No in-between loops. The builder finishes the whole dispatch and reports once. The 150-action hand-over goes |
| The Sep 30 line "no document templates" | Reversed. The three document templates are the point |
| The main session's own load | Left as it is. Only builders start lighter |
| The brief's copy of the playbook | Removed. The playbook stays |
| When the review happens | Once, when everything dispatched is done |
| What the builder checks | Each exit line's proof, once, plus lint and type-check on what it touched. No check is run by two parties. Wider runs come later |
| Size limits | Spec 3,000 words, Architecture 3,000, Log 120 an entry, ticket 400 with 3 to 10 exit lines. A counter runs on every save |

## 7. What this does not settle

- No one has rewritten a real spec into the new template. The 3,000-word limit is untested.
- The size counter is a draft. Whether a save returns the whole page is not verified, and Codex
  builders do not run it.
- Nobody measured what a long dispatch costs without the 150-action hand-over, which was set for
  cost.
- One review at the end means a mistake in the first ticket of a parent is found last.
- The builder profile has not been launched once.
- Backend and API misses were never traced in either project.
- Rules against restating were already loaded in both builds and lost. This proposal bets on
  structure and on deletion, not on the rules being read better.
- Existing projects keep their old documents until someone rewrites them.
- Two contradictions were found and left alone: whether "full send" is allowed in the frontend,
  and whether a bug fix waits for approval (the two repos say opposite things).
