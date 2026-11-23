## Thoven law

These rules bind every agent in every Thoven repo. This block sits in the repo `CLAUDE.md` because
that is the one file Claude, Codex, Cursor, Devin and OpenCode all read. Its source is
`~/thoven/agent-skills/enforcement/rules/thoven-law.md`, and `enforcement/sync.sh --apply` writes it
here, so change the source and let sync carry it.

**Shared worktrees.** A worktree can hold several live sessions, and any dirty or untracked file
may belong to one you cannot see. Commit is the safe path: stage the exact paths you mean and
check `git diff --cached --name-only` before committing. Product files dirty on your branch are
your branch's work, so stage them too. To untrack or delete a file, run `git rm --cached`, check
the staged list, commit with no pathspec and confirm with `git ls-files --error-unmatch`, because a
pathspec commit takes the working-tree state and restores the file. Leave scratch, probes and
screenshots unstaged. Unpack probes under `tmp/<name>/` and delete them by exact path, since a glob
`rm` after a failed `cd` expands at the worktree root. To undo,
name your own paths: `git restore <your paths>`, `git stash push -- <your paths>`. The
`thoven-guard-bash` hook refuses the whole-tree forms (`git stash push` with no paths,
`git clean`, `git reset --hard`) and a forced `git worktree remove` or `git branch -D` of work not
on origin, and says why when it fires. It allows a path-scoped undo only for files it saw this
session edit. A stash whose message is not yours
belongs to another session: leave it and name it in your hand-off. (2026-08-23: a stash before
a rebase ate a day of the onboarding prototype.)

**Branches, worktrees, PRs and merges.** Before you create a tree, push, open, review, merge or
watch a PR, read `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md` in full and follow
it. Everywhere: `main` is the only 2.0 branch; one ticket gets one branch and one PR per repo, and
every fix to it is appended there; production moves only through
`~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`; and a newly required request field
stays optional until the frontend that sends it is live on thoven.co, because a release deploys the
backend before the frontend (backend #278 made staging refuse every reschedule for six hours).

**Records and sources.** Linear holds the Project's record: decisions, status, evidence and
handoffs. Read a document's body, not only its link. A Project's spec says what is true now, its
architecture document says how it is built, and its log keeps the history: Andres's words in full
and the options rejected, with their reasons. A builder works from the ticket, the spec and the
architecture. Every fact has one home, and every other place points at it by id or path: a value a
frame shows lives in the frame, a decision lives in its row, and a local file holds no copy of a
Linear document. "Andres ruled" sits only on his quoted words and their date; any other line is
labelled as its writer's reading. A ruling edits its home in place, deletes the line it replaces,
and reaches each running build as a correction. Main and Andres edit a ticket's exit lines; a
builder builds to them as written and asks main when one looks wrong. Leaving part of a designed
surface out is a decision for Andres, never a sentence in a plan. Documents go at the path an
issue's `Writes to:` line names, and a new top-level `docs/` folder waits for Andres. Project
documents follow the workspace skill's "How to write a Project document": one page one job, a
reason on every rule, and the size limits. A standing preference goes into the skill or law that
governs it, never auto-memory, because memory is keyed per working directory. Missing local project
folders do not block startup. The handoff procedure is `skills/dev/workspace/references/handoff.md`.

**Lexicon.** Chat, tickets and documents use the product's nouns from frontend
`design/lexicon/LEXICON.md`: a "Session" is one meeting and "Lessons" is the arrangement, and a
surface goes by its component name in code. (2026-11: "lessons" for Sessions, "pop-ups" for a named
component.)

**User-facing evidence.** For every visual or user-facing change, capture the result on the surface
users actually reach. Use a screenshot for a static state or a short walkthrough for an interaction.
Before handoff or merge, attach the evidence to the PR under **Verification** and to the linked
Linear ticket. Reuse the same upload or a durable link reviewers can open. Open both records and
verify the evidence is reachable from each. If capture or upload is blocked, record the blocker and
keep the evidence pending.

**Design parity.** Apply visual parity when the task intentionally uses a named design source. Do not invent a board
or a design gate for work without one. Accepted Linear decisions govern which design applies.

- **Spec parity by decision id.** Trace every acceptance line and every behaviour in the diff to a parent decision id. Quote the parent, never a sub-issue's paraphrase.
- **Paper is the build source for static frames.** Each frame is built from its own values (Paper `get_jsx` and `get_computed_styles`) at each width, desktop and phone frames both: layout and height, alignment, vertical and horizontal spacing and rhythm, lines, type, colour and depth. The frame beats written prose, tokens, `thoven-designer` and THV-1389's rhythm rule on what it shows. The Paper frames are approved: read each frame's values and build to them (Andres 2026-11-08).
- **A multi-screen flow moves to one live lab.** Once a flow's Paper frames are final, one main lab plays the whole flow: its progressions, transitions, button states, loading and errors, and copy on real-shaped data. From then the lab is the flow's design and Paper freezes as its static record, because those states need code and real interactions. A fork to study one interaction is a static Paper frame or a side lab that folds back into the main lab. The main lab is what gets built into production, and its Spec names it. A one-screen ticket goes from Paper to code. (Andres 2026-11-20: "paper should just be the source of truth for static frames"; "just one main"; heavy projects are multi-screen flows.)
- **Desktop frames are a 1280×720 window.** That is the browser window on a 1280×800 laptop, the smallest common one, and Thoven's visitors use it as often as 1440. A signed-in frame draws what the user sees, the app at 90% (a 44 button draws 39.6), so a 1280×720 shot lays on it one to one; a public page, which has no `AppScale`, draws at 100%. 1440 is a second check. A builder divides a signed-in frame's value by 0.9 to get the code number, until THV-1971 retires the 90% shrink (Andres 2026-11-17, THV-1970).
- **The design system is reference, not hard code.** Build through the shared component and change it, or the global component, when a frame needs it; build a missing one with `building-components`. Use a token where it equals the frame's value and the frame's value where none does. A design scan or test that refuses a Paper value gets one allowlist entry naming the Paper node and the reason; a count or ratchet baseline stays where it is.
- **Production holds between frames.** Widths between the frames reflow by component best practice, and the builder says how.
- **Every difference is listed or asked.** Each difference left between the build and its frame is a row in the REPORT's Discrepancies table (brief.md, REPORT, Parity), with its why: not built yet, a spec rule, a production need, or a fix to an unpolished frame such as a wrong icon or chevron. A layout, spacing, height, veil or colour difference goes to main as a question before anyone builds it, and so does a review finding that changes a designed value without citing the frame. A difference in neither place is a defect.
- **Phone frames are build targets.** 390 is shot for every state. Where Paper has a phone frame, the phone layout is built from its values and judged against it. A state of a surface a phone reaches with no phone frame is a question to main before its phone layout is built; its 390 capture is then only a compatibility check.
- **Visual parity on the real page.** Capture every state at each of its Paper frames' widths, desktop and phone, and 390, plus a short video, on the route a user reaches. The builder makes the captures itself with the local parity run (`scripts/verify/parity-run.mjs`, the Parity row in the frontend `TESTING.md`) for every surface the ticket names, sibling rows included, and attaches the grid. A surface with no parity map entry gets a 390 capture beside the commit before the change. A `/dev` or lab route, a component without its parent panel, or a re-render of the board is not parity.
- **Parity is a looked-at verdict.** A judge who did not build the screen writes MATCH, or NO with its differences, for each state at each width against that state's own Paper frame, phone frames included. The grid proves what was built; "N/N captured" is not parity.

**A named skill always loads.** The model picks on its own only the skills in
`enforcement/config/skills-invocable.txt` and poteto-mode's routes, so their descriptions fit in
context. When a doc, brief or routing table names any other skill and the Skill tool refuses it,
read `~/.agents/skills/<name>/SKILL.md` in full and follow it.

**Hardening keeps the design.** Refactor, performance and robustness work changes what a user sees
only to fix an issue it found at another viewport, in motion or in performance. The commit or report
names that issue beside the change.

**Targeted tests.** The checks are each exit line's proof, run once, plus lint and type-check on
the files you touched, with the commands in `~/.agents/skills/verify/SKILL.md` and the repo's
`TESTING.md`. Paste each command with its pass line and name what you did not run. Wider suites run
when the branch lands or when Andres dispatches them, and the full `bin/verify --base <integration
branch>` runs once per integration branch, before it lands in `main`, or when Andres asks; nothing
reruns on push. Heavy work (e2e, builds, stacks, perf) runs on the host whose
`~/.config/thoven/host.json` says `mini`, through
`~/thoven/agent-skills/enforcement/bin/thoven-load-gate -- <cmd>`; there `bin/verify` takes its own
slot, so run it as is. On a `laptop` host the Bash guard denies verify, builds, e2e and whole
suites: run `remote-verify` for verify and the `remote-check` skill for the rest, and wait on a
mini run with remote-check's "Wait for a mini run" step. When Andres says
hold, stop the heavy jobs you started and run only single-file tests, type-check and lint until he
says go. Stop the servers you started after each step, and delete scratch you can regenerate. A
subagent runs a long command in the foreground with a timeout, because the harness blocks `sleep`.

**Platform actions run from the laptop.** Render, Vercel, Neon, Stripe, Mixpanel, Linear and Sentry
actions run on the laptop, where their CLIs and plugins are signed in. The mini runs heavy tests and
publishing checks, and nobody asks Andres to copy a key to it. (2026-11-09 and 11-17: agents asked
him to paste a Render key onto the mini.)

**Local database.** `thoven-worktree create` sets `TEST_DATABASE_URL` to `neondb_test_<slug>`, drops
a `DATABASE_URL` that names the shared `thoven_development`, and creates `thoven_dev_<slug>` when the
branch adds a migration. Every backend command, `git commit` included, names the pane's own local
database: export `DATABASE_URL` and `TEST_DATABASE_URL` in the same line.

**Own what you find.** Keep the diff lazy and the finish thorough. Make the surgical edit the
ticket asks for, then own every problem found in or touching that work: design-system drift,
spacing, hairlines, mobile clamping, DOM issues and a spec gone red while finishing are fixed on its
branch in the same round (a cheap flaky test that asserts nothing is deleted). Andres, 2026-11-23:
"part of completing a feature is fixing this test". An edge case real users will plausibly hit, and
any product call, goes to Andres as a question. An architecture change that widens the blast radius
is proposed as its own spec or ADR. Work bigger than the brief stops and reports back. A fix too big
for one round is a sub-issue of its ticket, done before the parent closes. A standalone ticket holds
only new scope, an agreed deferral or tech debt outside the feature, filed after his yes; `Follow-up`
marks only an agreed deferral, because a quiet follow-up never closes.
Done means a user can reach it: a module with no call site is not built. Before scoping a ticket or
fix for a data defect, name one real record (environment, id) that shows it; a critique line, ledger
row or fixture repeating the claim is not evidence.
