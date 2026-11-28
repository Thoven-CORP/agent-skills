## Thoven law

<!-- Generated from agent-skills/enforcement/rules/thoven-law.md by enforcement/sync.sh. Edit the source, written to agent-skills AGENTS.md, "How we write". -->

**Shared worktrees.** Other sessions share this tree. Stage exact paths, check `git diff --cached --name-only`, then commit. Leave scratch unstaged, undo only paths you edited, and leave a stash that is not yours and name it in your hand-off. `thoven-guard-bash` refuses whole-tree undo and says why.

**Branches and PRs.** Read `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md` before you cut a tree or touch a PR. One parent issue gets one branch and one PR per repo, and every fix is appended there. Production moves only through `publish`'s `promote.sh`. A new required request field stays optional until the frontend that sends it is live, because the backend deploys first (backend #278).

**Records.** Linear holds the record, and every fact has one home that other places point at. "Andres ruled" sits only on his quoted, dated words; any other line is labelled as its writer's reading. A ticket's exit criteria say what done is and how it is measured for that kind of task, never a list of steps to run. How a Project document is written is `workspace`.

**Lexicon.** Use the product's nouns from frontend `design/lexicon/LEXICON.md`: a "Session" is one meeting, "Lessons" is the arrangement, and a surface goes by its component name.

**Subtract before you add.** A change deletes what it replaces in the same diff. A refactor removes more code and tests than it adds. A new rule, test, doc or tool names what it replaces.

**A rule carries its check.** Enforce a rule at the earliest rung that can catch it: types, then lint or CI, then a test, then QA, then a doc. A line added to this law or a CLAUDE.md names the check that fails when it is broken, or the incident it prevents and why no check can; otherwise it goes in the skill that owns the job. Docs and skills teach how to do the work; checks live in code.

**Tests come from decisions.** Write tests first, at an agreed seam, for core mechanisms and repeated failures: scheduling, money, student privacy and COPPA, sign-in, the FE↔BE contract. One test covers the class, asserting what a user or caller sees. Never restate a product flow in a unit test; QA covers flows, and the flow may change. A one-off failure gets a fix at its cause, not a guard for that instance.

**Check once; the first failure is a finding.** Prove a change with the narrowest check that fails if it is wrong, plus lint and type-check on the files you touched (`check-build`, the repo's `TESTING.md`). Paste each command with its result and name what you skipped. A rerun to green is not a pass, and a flaky test leaves the gate with a named owner. Wider suites run once, when the branch lands. Heavy work runs on the mini, and the Bash guard routes it.

**User-facing work is checked as a user.** Before a parent lands, an agent walks the change as Thoven's real users (`journey-map` personas) on the route they reach, with production-shaped data (`qa-product`). Complete every journey: a finding that leaves the way forward open is logged and the walk goes on; only a one-way door, such as a page that will not load, stops it. Then diagnose each finding, since a bad seed, a stale import or code awaiting deletion is not a product bug, group findings by cause, and fix each cause once.

**Build the design.** A designed surface is built from its source, in this order: the Paper frame for a static screen or the main lab for a multi-screen flow, then the token module, then frontend `DESIGN.md`. A difference from the source is a question to main before anyone builds it.

**Own what you find.** Make the edit the ticket asks for, then fix every problem in or touching that work on its branch in the same round. A product call, or an edge case real users will hit, goes to Andres. Work bigger than the brief stops and reports. A fix too big for the round is a sub-issue of its ticket, and a standalone ticket waits for his yes. Before scoping a data fix, name one real record (environment, id) that shows it. Done means a user can reach it.

**Platform actions run on the laptop**, where Render, Vercel, Neon, Stripe, Mixpanel, Linear and Sentry are signed in. Keys stay on the laptop.

**A named skill always loads.** When the Skill tool refuses a skill a doc names, read `~/.agents/skills/<name>/SKILL.md` and follow it.
