---
name: linear-project
description: >-
  Set up a new Linear project or propose changes to an existing project brief, approach or
  sources of truth. Use for project organization; route daily status to workspace and
  detailed product, design or architecture exploration to their own workflows.
---

# Linear project

Read the live [Project setup standard](https://linear.app/thoven/document/project-setup-standard-62e01c7c4f53)
(document ID `28680f01-46bf-416e-a70b-2b47a1000ef8`) before framing the setup. It is the shared
policy; link it rather than copying it into projects. If unavailable, disclose that gap and keep
work at proposal level until the current standard can be verified.

## Current project authority

Linear holds current briefs, accepted decisions, status and handoffs. Read the relevant source
bodies; listing links does not establish access. Existing local runbooks, code contracts and
historical documents remain useful context. Missing local project folders or `STATE.md` files do
not require Project setup. tldraw and Paper support design/brainstorming; accepted choices belong
in Linear. Use [handoff.md](../workspace/references/handoff.md) for cross-session or host handoffs.

## Frame the project

Read relevant existing projects, accepted decisions, linked artifacts and prior work first.
Use available recall when it can recover authoritative context; verify its claims against the
sources. Do not ask Andres to repeat known facts. Separate settled facts from open questions.

Discuss only the choices needed to make the project understandable and start useful work:

- Overall goal, who benefits, initial scope and explicit non-goals.
- An approach that fits this project: useful phases or checkpoints, whether a prototype is
  needed, dependencies and real timing constraints. Milestones are project-specific; no fixed
  lifecycle or placeholder dates.
- The actual authoritative artifacts needed, what each governs and which are missing.
- First useful work. It may be a product-direction brainstorm; do not manufacture a build backlog.

Stop at organizational framing once each setup choice is settled or explicitly open. Route substantive
product, design or architecture exploration to the relevant available workflow, then use its
accepted output as a source.

## Propose, then set up

Present the brief and exact proposed native changes for Andres to confirm. Existing authorization
for that exact setup counts; otherwise obtain confirmation before external writes. For an existing
project, preserve IDs, history and authoritative links and propose a scoped diff. Setup alone does
not authorize changing existing tickets or bulk cleanup.

Inspect the connected tools and use the authorized Linear connector that answers a read.
Use the native **Thoven project** template when creating a project. Discovery anchor:
`b885e2bd-68a2-4ea8-b666-44eb6757c5bf`, team **Thoven**. Verify its live identity and current content
before use. Disclose inherited native defaults in the proposed write set; retain or override them
intentionally. Select it explicitly when the tool supports templates; do not assume a team default
applies to an API client. If template selection is unavailable, disclose the limitation and propose
an equivalent brief from the verified standard, without claiming the template was applied.

Fill the template's five sections: **Goal**, **Scope and non-goals**, **Project approach**,
**Key decisions and open questions**, **Sources of truth**. Keep summary to one outcome sentence.
Use native fields for lead, status, priority, dates and initiative where decided; native milestones
for chosen checkpoints with completion descriptions; issues for actual work. Keep native values
out of duplicate field tables or ticket-status lists.

Link actual specs, designs and decisions as Resources. A small project may need only the brief.
A project document is an actual longer artifact; a document template only seeds its shape. Keep
existing authoritative issues or files where they are. Do not clone or migrate them automatically,
or assume template edits sync projects or create documents. Do not create issue or document templates.

## Integration branch

When the Project will build code, add two items to the proposal: the integration branch name
(pattern `<project-slug>/integration`) and the repos it touches (fe, be). After Andres confirms,
write both in the Project's Sources of truth, because Linear is the source of truth. When the
confirmed name differs from the slug `thoven-worktree` derives from the Project name, run
`~/thoven/agent-skills/enforcement/bin/thoven-worktree register-project <project> <fe|be> <branch>`
for each repo. The registry is a cache of the branch name, and committing its row is a normal
agent-skills commit. Setup creates no worktree and pushes nothing. The first Build ticket cuts the
tree and pushes the branch, since a pnpm install costs about 1.5 GB and a design-only Project never
needs it.

## Hand off

Read back the applied project and report its link, confirmed setup, missing sources and first work.
Hand ongoing orientation and maintenance to `$workspace`: retrieve the current brief, relevant
linked sources, milestones, issues and latest Project Update before work. Attaching a source is
not evidence that it was read. Workspace maintains native current information and meaningful
Project Updates within authorization; `$feature-ledger` retains artifact and semantic
reconciliation ownership. Preserve useful local receipts without creating another independent status board.
