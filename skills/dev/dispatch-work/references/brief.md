# The brief

The ticket is the spec. Its Outcome, What to build, Build from, Exit criteria and Leave alone say
what to build, from what, and how each exit line is proven. The brief carries only what is decided
at dispatch: who the pane is, where it works, and how it talks to main. A ruling, design source or
scope line goes into the spec or the ticket first (SKILL.md, step 2).

Copy the block to the board's `briefs/THV-x.md` and replace each `<<…>>` slot, writing `none`
where nothing applies; a slot stays on one line. `dispatch spawn` fills the `{{…}}` fields and
every `THV-<id>`, and refuses a brief with a slot left or with anything but a skill line first.
UPPERCASE words (STATUS, ENTRY_PATH, REPORT_FILE, ONE LINE) are the pane's to fill.

`<<playbook>>` is the poteto-mode playbook that matches the work: `feature`, `bug-fix` or
`refactoring`. `visual-parity` proves a refactor looks the same as its own baseline, so it fits
refactors only. A Codex pane opens with `$poteto-mode`.

```text
/poteto-mode <<playbook>> THV-<id> "<<ticket title>>"

You are {{AGENT_NAME}}. Main is the Claude session {{MAIN_SESSION}}. Project board: {{BOARD}}.
DISPATCH = ~/.agents/skills/dispatch-work/scripts/dispatch

LOAD       poteto-mode before task work: the Skill tool in Claude Code, or read
           ~/.agents/skills/poteto-mode/SKILL.md in full in Codex. If it fails, report BLOCKED.
TICKET     {{SNAPSHOT}} is THV-<id> as main read it at dispatch. Build its What to build from its
           Build from links, to its Outcome, and leave its Leave alone as it is. Main and Andres
           edit the ticket; when main says it changed, and after a compaction, run
           `$DISPATCH snapshot {{PROJECT}} THV-<id>` and build to {{SNAPSHOT}} as it stands.
WHERE      Repo <<absolute path>>, branch <<branch>>, base <<sha>>.
           Paired: <<the other repo's absolute path, branch and base, or none>>.
           Parallel panes: <<each one and the paths it owns, or none>>.
KNOWN      <<commits and interfaces from earlier tickets this one builds on, by SHA and path, or none>>
RESUME     <<a takeover or fix round line, or none>>
FINISH     Build the whole dispatch, then REPORT once. Prove each exit line once with its named
           proof, and run lint and type-check on the files you touched (commands: verify). Make
           a design capture once. Wider suites run when the branch lands.
STANDING   Read ~/.agents/skills/dispatch-work/references/standing.md now and follow it.

ASK
Ask only when you are blocked on something only main or Andres can answer, an exit line that
looks wrong included. Post the question, message main, and keep building every part it does not touch:
  printf '%s\n' "QUESTION, the options you see, your default" |
    $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind question --status NEEDS_CONTEXT --from {{AGENT_NAME}}
  then SendMessage to {{MAIN_SESSION}}: "NEEDS_CONTEXT THV-<id>: ONE LINE. Entry: ENTRY_PATH"
  (ENTRY_PATH is the path the post command printed.)
Main answers by peer message. Codex: post the entry only, then stop and wait.

REPORT
When the whole dispatch is built, or you are blocked, write the report to a file and post it:
  $DISPATCH post {{PROJECT}} --ticket THV-<id> --kind report --status STATUS --from {{AGENT_NAME}} < REPORT_FILE
STATUS is DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT or BLOCKED. The body:
  Exit criteria  one row per exit line: true or not, with its proof attached (command, host and
                 pass line; file:line; capture path)
  Checks         the lint and type-check commands and their pass lines
  Parity         a ticket with a design frame: the Discrepancies table the law's Design parity
                 names, one row per difference left between the build and its frame, with its why
  Commits        SHAs and git diff --stat against base
  Rulings        what you decided that the ticket did not, and why
  Noticed        one line per problem outside this ticket's code
Then SendMessage to {{MAIN_SESSION}}: "STATUS THV-<id>: ONE LINE. Entry: ENTRY_PATH".
Codex: post the entry only; main hears when you settle.
End by printing the block in this pane.
```

## Takeover and fix round

Both rewrite the pane's brief file in place, so no pane reads two versions of one line. Every
ruling since dispatch is already in the ticket, so nothing else changes.

- **Takeover**, after a pane exits or cannot go on. The opening line becomes
  `/poteto-mode session-pickup THV-<id> "<<ticket title>>"`. RESUME: `Pick up on <<branch>> from <<last commit>>. The earlier pane's last board entry is <<entry path>>.`
- **The fix round.** The opening line as for a takeover. RESUME: `Fix round. Base <<sha>>. The findings are <<review entry path>>, items <<ids>>. Each finding is an exit line for this round, and its proof is the check that shows it fixed.`

Name no other skill in a brief, `/takeover` included: the pane loads it instead of poteto-mode.
