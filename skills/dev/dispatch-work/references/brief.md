# The brief

The ticket is the spec; the brief says only where the builder works and how it reports. Fill each
`<<…>>` slot on one line, writing `none` where nothing applies. `<<playbook>>` is the
poteto-mode playbook for the work: `feature`, `bug-fix` or `refactoring`.

```text
Read ~/.claude/skills/poteto-mode/worker.md before anything else.
Load poteto-mode with the Skill tool, playbook <<playbook>>, for THV-<<id>> "<<ticket title>>".

TICKET    Read THV-<<id>> in Linear now, and again whenever main says it changed. Build its What to
          build from its Build from links, to its Outcome; leave its Leave alone as it is. Its Exit
          criteria are your eval: done is every criterion measured true as it says.
WHERE     Repo <<absolute path>>, branch <<branch>>, base <<sha>>.
          Paired: <<the other repo's path, branch and base, or none>>.
          Others in this tree: <<each builder and the paths it owns, or none>>.
KNOWN     <<commits and interfaces from earlier tickets this one builds on, by SHA and path, or none>>
RESUME    <<the fix-round line, or none>>
STANDING  Read ~/.agents/skills/dispatch-work/references/standing.md now and follow it.

ASK       Only when blocked on what only main or Andres can answer. With SendMessage, message
          <<main session name>> "NEEDS_CONTEXT THV-<<id>>: the question, the options, your default"
          and keep building what it does not touch; without it, report NEEDS_CONTEXT.

REPORT    Your final message, once the whole dispatch is built or you are blocked:
  Status    DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT or BLOCKED, then THV-<<id>> and one line
  Eval      one row per exit criterion: met or not, with its measurement (command, host and
            result line; file:line; capture path)
  Checks    each command standing.md names, with its result line and the SHA it ran at
  Commits   SHAs and git diff --stat against base
  Rulings   what you decided that the ticket did not, and why
  Noticed   one line per problem outside this ticket, with file:line
```

## Fix round

A fresh builder gets the same brief with RESUME:
`Fix round. Base <<sha>>. Items: <<each root cause, its locations, and the class-level check that fails on the old code>>.`
Each item is an exit criterion for the round, measured by its check going green.
