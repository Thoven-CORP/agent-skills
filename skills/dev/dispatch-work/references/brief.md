# The brief

Copy the block below to the board's `briefs/THV-x.md` and replace every `<<…>>` slot, writing
`none` where nothing applies. The snapshot is the spec, so the brief adds only what the
snapshot cannot know. Process rules every pane follows live in [standing.md](standing.md); the
brief points there.

`dispatch spawn` fills the `{{…}}` fields and every `THV-<id>` with the ticket, and refuses a line
that still holds a `{{…}}` or `<<…>>`. A slot may hold any words but stays on one line. Single angle
brackets are ordinary text (`Array<string>`, `<div>`). UPPERCASE words (STATUS, ENTRY_PATH, REPORT_FILE, HANDOFF_FILE,
ONE LINE) are the pane's to fill: leave them.

- DECISIONS: each parent decision id with the board frame the parent cites for it
  (`D4 -> A3. Send moment`).
- DECIDED IN CHAT: one line per ruling that lives only in main's conversation, labelled
  `Andres ruled <date>: …`, `main recommends: …` or `guess: …`.
- RULES: every binding rule you hold, scoped to the files this pane writes, with its exemptions
  (generated files, manifests, routes.rb, files already over a limit).
- For a Codex pane write `$poteto-mode`. `dispatch spawn` sends the brief's first line as the
  pane's opening prompt, because inside the file it is only text, and refuses a brief that opens
  with anything but a skill line.

```text
/poteto-mode <<playbook>> THV-<id> "<<ticket title>>"

You are {{AGENT_NAME}}. Main is the Claude session {{MAIN_SESSION}}. Project board: {{BOARD}}.
DISPATCH = ~/.agents/skills/dispatch-work/scripts/dispatch

FIRST TURN Open the playbook your opening line names, ~/.agents/skills/poteto-mode/playbooks/<name>.md
           in kebab case (Feature is feature.md), and copy its steps verbatim into your task list
           before any other work, each skipped step kept as "skip: <reason>". Print that list as
           your first message, so main and Andres see it before any code. Done when the list
           holds every step and is printed. Build by that list, running every step as the parent
           session does, `how` and `architect` included: the snapshot's decisions bind the options
           `architect` weighs, and a step you skip names why. The REPORT's Playbook row repeats
           it with each step's outcome: done with its evidence, or the skip reason.

FITS       <<one line: where this ticket sits in its parent issue and what it unblocks>>
SPEC       {{SNAPSHOT}}. Read it in full first. It holds the ticket, its comments and the parent's
           decisions as main read them. Build it as written. When the snapshot and the code
           disagree, or the snapshot needs a choice it does not make, ASK.
DECISIONS  <<decision ids, each with its board frame>>
DECIDED IN CHAT
           <<labelled chat rulings, one per line>>
           Build to "Andres ruled" lines. Treat the others as defaults you may overturn with a
           reason in your report.
RULES      <<binding rules for the files this pane writes, with exemptions>>
DESIGN     <<no UI, or the board path, the frames above, and every screen and state they show, async included>>
           Bring each frame to life as the decisions describe it, at visual parity and full
           fidelity: layout, spacing, type, every state, and motion where the frame shows it. Values come from design-system tokens; use the shared component
           where one exists, and build a missing one with /building-components. Loading, empty,
           error and pressed states take their treatment from `docs/design/async-states.md` and
           `design/buttons.md`. A frame is one static sample at one width: it binds which
           elements show, their states, order, hierarchy and tokens. Sizing behaviour (fill or
           hug, stretch, reflow at other widths) follows component best practice; match the
           frame at its own width and give the reason in one line. A difference from a frame
           that Andres confirmed cites its ruling; any other difference is a defect you fix.
WHERE      Repo <<path>>, branch <<branch>>, base <<sha>>. <<parallel panes and their Paths, or none>>
KNOWN      <<interfaces, rulings and commits from earlier tickets this one builds on>>
ACCESS     <<the skill lines from skills.md this ticket reaches, each with its moment>>
           Tools: graphify for callers and impact, Context7 for vendor docs, control-cli and
           control-ui for a running app, tier-5 subagents for wide reads.
DONE WHEN  <<the ticket's Done when, by pointer>>. Its live lanes, perf runs and repeat parity
           run only where no unit or request spec covers the line; list the rest as SKIPPED.
           Seams: <<where the tests sit>>. Proof goes red before your change and green after it.
           Verify per `~/.agents/skills/verify/SKILL.md`: lint and types, the touched test files
           one per run, the design scan suite on any component or token diff,
           `__tests__/mail-link-routes.test.ts` on a diff that adds or moves a route, and the direct
           importers' test files by path. No `bin/verify` on a ticket: the full verify runs only
           when Andres asks or at the parent, before the integration PR into `main`. CI on your PR
           runs the affected tests. Paste each command and its pass line in the report.
           An e2e or browser test runs as the one spec that covers your change, through the load
           gate, never the whole suite.
           Skills run through the Skill tool: each ACCESS line at its moment, and every other
           skill when poteto-mode's playbook routes to it.
STANDING   Read ~/.agents/skills/dispatch-work/references/standing.md now and follow it.

ASK
When the spec does not decide something, post the question and message main, then keep building
every part the question does not touch:
  printf '%s\n' "QUESTION, the options you see, your default" |
    $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind question --status NEEDS_CONTEXT --from {{AGENT_NAME}}
  then SendMessage to {{MAIN_SESSION}}: "NEEDS_CONTEXT THV-<id>: ONE LINE. Entry: ENTRY_PATH"
  (ENTRY_PATH is the path the post command printed.)
Main answers by peer message. Codex: post the entry only, then stop and wait.

BUDGET
Near 250k tokens, write a handoff to a file (what is done with commit SHAs, what is left, the
exact next step) and post it:
  $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind handoff --status HANDOFF --from {{AGENT_NAME}} < HANDOFF_FILE
  then SendMessage to {{MAIN_SESSION}}: "HANDOFF THV-<id>: ONE LINE. Entry: ENTRY_PATH".
Codex: post the entry only, then stop.

REPORT
When you finish or need main, write the report to a file and post it:
  $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind report --status STATUS --from {{AGENT_NAME}} < REPORT_FILE
STATUS is DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT or BLOCKED. The body is the ASCII block:
  Acceptance   one row per line: ✓/✗, evidence (file:line, command → result)
  Proof        command, red before, green after
  Commits      SHAs and git diff --stat against base
  Checks       each command you ran and its pass line
  Parity       UI tickets: the Parity check's `parity-grid` link on your PR (standing.md, Parity), and each
               difference from a frame: fixed, or confirmed with its ruling
  Playbook     each playbook step verbatim: done with its evidence, or "skip: <reason>"
  Skills       each skill you invoked and when; a skipped ACCESS line names why
  Rulings      what you decided and why
  Noticed      one line per problem outside this ticket's code, for main's grouped Linear issue
Label every claim measured, inferred or guess.
Then SendMessage to {{MAIN_SESSION}}: "STATUS THV-<id>: ONE LINE. Entry: ENTRY_PATH".
Codex: post the entry only; main hears when you settle.
End by printing the block in this pane.
```

## Fix-round brief

Carry about five findings per round. Split a larger set by concern into panes whose files do not
overlap. Post it as a CORRECTION entry, then send the same text to the builder by peer message
(Codex: `dispatch send <pane> <file>` once it is idle):

```text
FIX ROUND <<n>>/3 THV-<<id>>. Base for this round: <<sha>>.
<<each open finding, verbatim, with file:line>>
Fix these only. Re-run the tests that cover each fix and name them: those files one per run,
plus typecheck and lint on the touched files. A UI fix runs only the browser test or parity state
it touches. No bin/verify, no mutation sweep, no full e2e or browser suite this round. Copy follows
design/lexicon/LEXICON.md, and focus and accessibility fixes use the existing Thoven components.
On a UI fix, push: the Parity check re-shoots each touched state at its frame's width and 390.
Compare it with the previous grid; a change beyond the fixed element is a defect. Report as before.
```
