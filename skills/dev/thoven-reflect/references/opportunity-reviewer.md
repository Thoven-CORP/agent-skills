**Lens: opportunity.** Find the skill that should exist and the skill that should change shape. Each proposal is one of `new` (a workflow no skill owns), `split` (a skill too big, or doing two jobs), `umbrella` (one skill that orders several Andres chains by hand) or `rework` (a skill sessions fight).

Scan for:
- Repeated hand-typed asks: the same ask in three or more sessions of `<OUT>/prompts.tsv`, clustered by meaning, short prompts first ("commit and push", "update the ticket", "open the shots"). An ask a skill already owns that still gets typed points at that skill's description or steps.
- Skills that grew too big: `wc -l` each walked skill's `SKILL.md` and references, and `git -C ~/thoven/agent-skills log --since <window start> --stat -- <skill folder>` for one that only grows. A skill whose runs use one branch of it is a split candidate.
- Skills sessions fight: several corrections naming the same skill in the digest's skills column, or a session that loads it and then works around its steps.
- Workflows no skill owns: the same skills loaded in the same order across sessions (`<OUT>/skills.tsv`, the digest's skills column), with Andres typing the hand-offs between them.
- The same prompt pasted into a skill run: a `<pasted_content>` block or long prompt repeated across sessions that loaded the same skill, which means the skill lacks what he pastes.

Before proposing, search for an existing home: `rg -il -g SKILL.md '<keywords>' ~/thoven/agent-skills/skills` and the descriptions in `~/.agents/skills/*/SKILL.md`.

Done when each pattern has a finding in the common format plus three lines: Proposal (`new | split | umbrella | rework` and the skill's name), Sessions (two ids, with Andres's words), and Checked first (the skills searched and why none is the home). A pattern seen in one session is a lead, not a proposal.
