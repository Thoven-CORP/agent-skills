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
- For a Codex pane write `$poteto-mode`. `dispatch spawn` sends `Invoke <first line> to start.` and
  the rest of the brief as text, and refuses a brief that opens with anything but a skill line.
- In a subagent prompt the opening skill line is text. Keep FIRST TURN intact so the builder
  explicitly loads the skill in its own harness.

```text
/poteto-mode <<playbook>> THV-<id> "<<ticket title>>"

You are {{AGENT_NAME}}. Main is the Claude session {{MAIN_SESSION}}. Project board: {{BOARD}}.
DISPATCH = ~/.agents/skills/dispatch-work/scripts/dispatch

FIRST TURN Load poteto-mode before task work. In Claude Code, invoke the Skill tool with
           skill="poteto-mode" and args containing the playbook and task from the opening line.
           If the harness already supplied its full instructions for this task, follow those.
           In Codex, read ~/.agents/skills/poteto-mode/SKILL.md in full and follow it. Load skills
           it routes to by reading their SKILL.md files in full, plus the references they require.
           If loading fails, report BLOCKED with the tool or file error before implementation.
           Open the playbook named by the opening line in ~/.agents/skills/poteto-mode/playbooks/,
           using the filename its SKILL.md specifies. Copy its steps verbatim into your task list.
           Print the list in your first message before code. Execute the native playbook as the
           parent does, including its routed skills and delegation. The snapshot's decisions bind
           the options architect weighs. Keep a skipped step as "skip: <reason>" only where the
           native playbook allows it. Done when loading is evidenced and every step is printed.

FITS       <<one line: where this ticket sits in its parent issue and what it unblocks>>
CONTEXT    <<relevant Linear brief/documents: source ids/URLs, read time, governing content and missing sources>>
           State its governing decisions before work; a link alone is not a read. Re-read live
           records when you can, and report missing context instead of using old local docs.
EXECUTION  <<mode and host; source host; browser/automation/app hosts and verified access>>
           For capture, carry the plan from qa-flow/references/flow-mapping-and-evidence.md §7:
           execution host, journey/personas, reversible branches, required criterion/parity evidence,
           and which prior evidence remains valid; use standing.md's linked capture contract.
PAIRED     <<paired repo absolute worktree, branch and base HEAD, or none with reason>>
SPEC       {{SNAPSHOT}}. Read it in full first. It holds the ticket, its comments and the parent's
           decisions as main read them. Build it as written. When the snapshot and the code
           disagree, or the snapshot needs a choice it does not make, ASK.
READ LIST  <<the sections this ticket needs beyond SPEC, each a file plus its heading or line range>>
           Read those sections, not whole documents. Find anything else as standing.md, Machine, says.
DECISIONS  <<decision ids, each with its board frame>>
DECIDED IN CHAT
           <<labelled chat rulings, one per line>>
           Build to "Andres ruled" lines. Treat the others as defaults you may overturn with a
           reason in your report.
RULES      <<binding rules for the files this pane writes, with exemptions>>
DESIGN     <<no UI; "UI, no design source: before/after line only"; or, per screen and state, async included, the Paper file, the desktop frame's node id and width, and the phone frame's node id and width or "no phone frame: ask main">>
           Paper is the build source (Andres 2026-11-08). Build each frame from its own values
           (Paper get_jsx and get_computed_styles at that width, desktop and phone frames both):
           layout, height, alignment, vertical and horizontal spacing and rhythm, lines, type,
           colour, depth, and motion where the frame shows it. The design system and
           thoven-designer are reference, not constraint: use a token where it equals the frame's
           value and the frame's value where none does; use the shared component and change it,
           or the global component, when the frame needs it; build a missing one with
           /building-components. What exists is in design/components.md (status and options),
           design/tokens.md and design/blocks.md: build on a `current` row, and after adding or
           changing a component, token module or block run `pnpm run design:catalogue` and
           commit those three files (a new block also gets its design/blocks.registry.json row). A design scan that refuses a Paper value gets one allowlist entry
           naming the Paper node and the reason; leave every count and ratchet baseline as it is.
           Make it production: widths between the frames reflow by component best practice, and
           loading, empty, error and pressed states the frame does not draw
           take `docs/design/async-states.md` and `design/buttons.md`. While you build, at each
           frame width, put the Paper screenshot beside your capture and read get_computed_styles
           for height, gaps, padding and type; a screenshot alone is an estimate. A state with no
           phone frame on a surface a phone reaches is a question: ask main for the frame before
           you build its phone layout. Every difference left goes in the REPORT's Discrepancies
           table (Parity row), and a fix to an unpolished frame such as a wrong icon or chevron is
           corrected and listed there. Name every change to a shared or global component, and how
           widths between frames reflow, in Rulings. A layout, spacing, height,
           veil or colour difference is a question: ask main before you build it. A difference
           with no row is a defect.
WHERE      Repo <<path>>, branch <<branch>>, base <<sha>>. <<parallel panes and their Paths, or none>>
KNOWN      <<interfaces, rulings and commits from earlier tickets this one builds on>>
ACCESS     <<the skill lines from skills.md this ticket reaches, each with its moment>>
           Tools: graphify for callers and impact, Context7 for vendor docs, control-cli and
           control-ui for a running app, tier-5 subagents for wide reads.
STOP WHEN  <<the ticket's Done when, by pointer>>, then REPORT and stop. Choose the smallest
           checks that prove each changed behaviour on its matching surface. Reuse valid evidence
           for unchanged claims. A unit or request spec alone does not prove visual parity or
           performance.
           Seams: <<where the tests sit>>. Proof goes red before your change and green after it.
           Verify each changed behaviour with `~/.agents/skills/verify-this/SKILL.md`: one
           falsifiable claim per behaviour, baseline and treatment on the smallest surface it
           routes to, one verdict each.
           Run the check list in `~/.agents/skills/verify/SKILL.md` once, at your first DONE: lint
           and types, the touched test files one per run, the design scan suite on any component
           or token diff (a scan that refuses a Paper value: DESIGN above),
           `__tests__/mail-link-routes.test.ts` on a diff that adds or moves a
           route, and the direct importers' test files by path.
           On a `laptop` host run the scan suite, an e2e or browser spec and any build through
           `/remote-check` on the mini, as standing.md says; on the mini, through the load gate.
           An e2e or browser test is the one spec that covers your change, never the suite. The
           full `bin/verify` runs only when Andres asks or once at the parent, before the
           integration PR into `main`. Paste each command, its host, its pass line and each
           verdict in the report.
           Load each ACCESS skill at its moment and each routed skill when the playbook reaches
           it, as FIRST TURN says; when the Skill tool refuses one, read its SKILL.md in full.
STANDING   Read ~/.agents/skills/dispatch-work/references/standing.md now and follow it.

ASK
When the spec does not decide something, post the question and message main, then keep building
every part the question does not touch:
  printf '%s\n' "QUESTION, the options you see, your default" |
    $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind question --status NEEDS_CONTEXT --from {{AGENT_NAME}}
  then SendMessage to {{MAIN_SESSION}}: "NEEDS_CONTEXT THV-<id>: ONE LINE. Entry: ENTRY_PATH"
  (ENTRY_PATH is the path the post command printed.)
Main answers by peer message. Codex: post the entry only, then stop and wait.

HANDOFF
After about 150 tool calls, or once your context has been compacted, finish the unit in hand,
commit, write a handoff to a file (what is done with commit SHAs, what is left, the exact next
step) and post it:
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
  Parity       UI tickets: the grid from your local parity run (standing.md, Parity) for every
               surface the ticket names, at each Paper frame's width, desktop and phone, with each
               state's node id. Then the Discrepancies table, one row per difference left: frame
               (node id, width), what Paper shows, what you built, and why (not built yet, a spec
               rule, a production need, a fix to an unpolished frame, or asked and ruled, citing
               the ruling). The grid shows what you built; the verifier, who did not build it,
               writes the MATCH or NO.
  Playbook     each native step verbatim: done with evidence, or "skip: <reason>" where allowed
  Skills       poteto-mode loading evidence, each routed or ACCESS skill loaded and when,
               and the work it produced; a skipped ACCESS line names why
  Rulings      what you decided and why
  Noticed      one line per problem outside this ticket's code, for main's grouped Linear issue
Label every claim measured, inferred or guess.
Then SendMessage to {{MAIN_SESSION}}: "STATUS THV-<id>: ONE LINE. Entry: ENTRY_PATH".
Codex: post the entry only; main hears when you settle.
End by printing the block in this pane.
```

## Fix-round brief

The one fix round goes to a fresh pane. Write it to `briefs/THV-x-fix.md`, post it as a
CORRECTION entry, and spawn it with `--brief <that file>`:

```text
/poteto-mode session-pickup THV-<id> "<<ticket title>>"
You are {{AGENT_NAME}}. Main is the Claude session {{MAIN_SESSION}}. Project board: {{BOARD}}.
DISPATCH = ~/.agents/skills/dispatch-work/scripts/dispatch
Read the original brief <<its path>> first: its FIRST TURN, ASK, HANDOFF, REPORT and STANDING bind.
Rulings since it: <<each labelled as in DECIDED IN CHAT, or none>>. Last REPORT: <<entry path>>.
FIX ROUND THV-<id>, the only one. Branch <<branch>>, base for this round <<sha>>.
<<each open finding, verbatim, with file:line>>
Fix these only; commit only. Re-run the tests covering each fix, one file per run, typecheck
and lint on the touched files, and /verify-this on each claim the fix changed. A UI fix runs only
the browser test or parity state it touches and recaptures each touched state at each Paper frame's
width, desktop and phone, and 390 (standing.md, Parity). No bin/verify, mutation sweep, or full e2e or browser suite. Copy
follows design/lexicon/LEXICON.md; focus and accessibility fixes use the existing Thoven
components. A change beyond the fixed element is a defect.
STOP WHEN each finding above is fixed and its covering test is green. Post a REPORT entry, message
main your status line, and stop.
```
