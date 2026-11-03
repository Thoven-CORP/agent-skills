# Routing requests to skills, frontend

Names a destination for a request. Every destination carries a leading slash so
`scripts/check-skill-routes.sh` can verify it resolves against the installed
skills and enabled plugins. On 2026-09-19 that check found 19 unreachable
destinations here, including `expert-team`. A name without the slash is prose,
not a destination.

The eight `gsap-*` skills are a special case worth knowing. They exist, with
`SKILL.md` files, only under
`~/.herdr/worktrees/frontend/feature-marketplace-polish/.agents/skills/`. Devin
and Claude resolve project skills relative to the working directory, so they are
reachable inside that worktree and nowhere else. A global table cannot name
them. For scroll-scrubbed or pinned motion outside it, `/motion` picks the
layer.

This file carries **when to reach for a skill**, which looking cannot tell you.
It does not carry what each skill does. The skill's own description does that,
and restating it here is what drifted.

## Reading order

Most requests match one row. Take the first match going down, and prefer a
domain row over a universal one. When two rows match equally, ask one question.

## Routing

| The request | Destination |
|---|---|
| Build or change a feature, 3+ concerns, multi-file | `/grill-with-docs` |
| Shape types and module boundaries before code | `/architect` |
| Design a flow with three or more states, or one a job, webhook, timer or another person can move | `/state-brief` |
| Audit a built flow for flag soup, hidden transitions or missing recovery | `/state-audit` |
| Turn a settled design into a written spec | `/to-spec` |
| Reconcile a large feature's PRD, design, contract and code | `/feature-ledger` |
| Write an implementation plan from requirements | `/superpowers:writing-plans` |
| Something is broken at runtime in Thoven | `/investigate-thoven` |
| A hard bug or perf regression anywhere | `/diagnosing-bugs` |
| Claiming done, pre-commit | `/verify` |
| Prove one specific claim with fresh evidence | `/verify-this` |
| Product-level evidence on a real user path | `/qa-flow` |
| This repo has no control skill or Feature Map | `/create-verification-skill` |
| An existing verify-app map is stale | `/maintain-verification-skill` |
| Commit, deploy, release | `/publish` |
| Watch a PR through CI and comments without me | `/babysit-pr` |
| Watch CI in the terminal until it passes | `/loop-on-ci` |
| CI is red on a PR | `/fix-ci` |
| An old PR or branch is behind `main`, "rebase this" | `/modernize` |
| Pick up another person's or agent's PR, branch or dead pane | `/takeover` |
| Take a ticket to ready-to-merge unattended | `/full-stop` |
| Run a heavy check on the mini against MacBook changes | `/remote-check` |
| Set up or reshape a Linear Project | `/linear-project` |
| What families are texting about, a feedback sweep | `/text-product-analysis` |
| Where does this stand, log work, move a ticket | `/workspace` |

### Design and UI

| The request | Destination |
|---|---|
| A new component, page, or redesign | `/thoven-designer` |
| Is this value locked, which token binds it | `/thoven-designer` |
| Build a component from scratch, accessible and composable | `/building-components` |
| Which library for this widget | `/pick-ui-library` |
| Try several versions of a surface and pick one | `/prototype` |
| A full quality pass across the interface | `/better-interface` |
| Grouping, alignment, reading order | `/better-layout` |
| Type sizes, weights, measure | `/better-typography` |
| Colour choices and contrast | `/better-colors` |
| Keyboard, screen reader, focus order | `/better-accessibility` |
| Radius, depth, hit areas, icon choice | `/better-ui` |
| Product copy, labels, error strings | `/better-writing` |
| Check a shipped surface against a11y rules | `/accessibility-check` |
| Critique, audit, polish, harden, distill, clarify a surface | `/impeccable <verb>` |
| Make it bolder, quieter, more delightful, animate it | `/impeccable <verb>` |
| How this behaves on a phone | `/mobile-audit` |
| Explore a UX pattern before designing | `/design-research` |
| Set up or extract a design system, run live browser iteration | `/impeccable <verb>` |
| Sketch a layout before committing | `/wireframe` |
| Build a Figma or board frame | `/build-design` |
| Work on every state of one component | `/state-machine` |
| Stress test a component under every scenario | `/break` |
| Feed a screen worst-case data | `/break-ui` |
| Iterate on variants of the component being built | `/variant` |
| Review the UI changes in a branch or PR | `/interface-review` |
| Art, stickers, icons or Thovie for a page | `/thoven-art` |
| How was this site or effect built | `/explain-interface` |
| An exploded technical illustration | `/teardown` |

### Motion

| The request | Destination |
|---|---|
| Unsure which animation approach, or describing a feel | `/motion` |
| Implement it in React | `/motion-react` |
| Open, close, swap, badge, page transition in CSS | `/transitions-dev` |
| Audit a codebase's motion and plan fixes | `/improve-animations` |
| Review a motion diff against a craft bar | `/review-animations` |
| Find where motion would help | `/find-animation-opportunities` |
| Name a feel precisely | `/animation-vocabulary` |
| Storyboard, timeline, live tuning panels | `/interface-craft` |
| Should this animate at all | `/emil-design-eng` |
| Build one new animation from scratch | `/animate` |

### React, Next and types

| The request | Destination |
|---|---|
| React patterns, hooks, component structure | `/react-expert` |
| Next App Router, routing, data fetching | `/next-best-practices` |
| Caching, `use cache`, revalidation | `/next-cache-components` |
| Upgrade Next across a major | `/next-upgrade` |
| Render cost, bundle size, re-renders | `/vercel-react-best-practices` |
| Types, generics, inference | `/typescript-best-practices` |
| Plain JS, Node, tooling | `/javascript-pro` |
| Drive or inspect a real browser | `/playwright-expert` |

### Before review

| The request | Destination |
|---|---|
| Strip AI slop from a diff | `/deslop` |
| Sharpen prose, remove AI tells | `/unslop` |
| Remove comments that restate the code | `/no-comments` |
| Review a branch against standards and spec | `/mattpocock-skills:code-review` |
| Write the test first | `/tdd` |

### Domain

| The request | Destination |
|---|---|
| A new endpoint or fetch wrapper | `/api-endpoint` |
| Write or rewrite an email | `/email-writing` |
| Pricing, growth, fundraising, board | `/thoven-boardroom` |
| Market size, competitors, investors | `/market-research-vc-intelligence` |
| Feature ideas, prioritisation, roadmap | `/product-strategy-brainstorming` |
| Pedagogy, practice design, curriculum | `/edtech-learning-science` |
| Brainstorm or grill a feature, journey or flow; what matters most | `/product-fundamentals` |

## Chains

A chain is worth naming when the order matters and the wrong order wastes work.

| Pattern | Chain |
|---|---|
| Idea to shipped feature | `/grill-with-docs` → `/architect` → `/to-spec` → `/feature-ledger` |
| Bug report | `/investigate-thoven` → `/verify` |
| New component | `/thoven-designer` → `/building-components` → `/verify` |
| New component with motion | `/thoven-designer` → `/motion` → `/motion-react` → `/verify` |
| Pre-ship quality pass | `/impeccable polish` → `/accessibility-check` → `/qa-flow` → `/publish` |
| Pre-commit | `/deslop` → `/no-comments` → `/mattpocock-skills:code-review` → `/verify` |
| Screen from a frame | `/thoven-designer` → `/build-design` → `/state-machine` → `/verify` |
| Ship | `/verify` → `/publish` → `/babysit-pr` |

## Quality work, `/impeccable` or a `better-*` skill

Both cover interface quality. Split on what the human said. A verb from
`/impeccable`'s own set goes there, since the verb is its argument surface:
`shape`, `audit`, `critique`, `animate`, `bolder`, `colorize`, `delight`,
`layout`, `overdrive`, `quieter`, `typeset`, `adapt`, `clarify`, `distill`,
`harden`, `onboard`, `optimize`, `polish`, `init`, `document`, `extract`,
`live`. A dimension named without a verb goes to the matching `better-*` row
above.

## Disambiguation

When several rows match a phrase like "audit the codebase", "write a plan" or
"review the code", the frontend repo's `.claude/docs/SKILL_AND_AGENT_ROUTING.md`
resolves it, and also carries each skill's "not for X" notes and the agent model
tiers.

## Rules

- Name one destination. A second choice is a question, not a recommendation.
- Give one sentence of reason.
- A named skill routes to itself. Run what the human typed.
- Mid-workflow, continue the current skill.
- The routing is a suggestion the human may override.
