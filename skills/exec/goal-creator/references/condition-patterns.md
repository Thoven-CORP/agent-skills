# Condition Patterns — worked examples

Every good `/goal` condition = **directive + measurable end state · stated proof (surfaced in transcript) · constraints · turn bound.**

## Contents
- **Good conditions** — tests+lint, doc/research production, backlog drain
- **Bad → good rewrites** — subjective end state, needs-user-decisions, proof-not-in-transcript, ungated side effect, no bound
- **Lever examples** — drive-a-skill, plan-anchored, finalize/quality, testing-scoped, progress file, cross-repo, visual-done-right, measurement-tool-first

## Good conditions

**Tests + lint (the canonical case):**
```
/goal Make all tests in test/auth pass and the lint step clean; the goal is met only when `npm test` and `npm run lint` have each been run and their exit-0 output is printed into this conversation, with no test file other than test/auth/* modified; otherwise stop after 15 turns and report what is blocking.
```
Why it works: end state is objective (exit 0), proof lands in the transcript (Claude pastes output), a real constraint (don't touch other tests), bounded.

**Doc/research production (real example, this repo's OpenAI-ads Goal 1):**
```
/goal Research OpenAI's ad product and write two files in "Marketing/OpenAI Ads/" — an Overview and a Research doc that synthesizes ≥2 transcript-analyzed videos, ≥5 dated articles, and OpenAI's own docs, with a "Tooling & Tracking Feasibility" section and a "Landing Page & Asset Inventory"; the goal is met only when both files exist and their full section outlines are printed into this conversation with a source link per claim and [VERIFY] on unverified specifics; otherwise stop after 18 turns and report what is blocking.
```
Why it works: the evaluator can't open the files, so completion is proven by **printing the section outlines into chat**. The end state is coverage you can count (≥2 videos, ≥5 articles, named sections), not "the doc is good."

**Backlog drain:**
```
/goal Work through every issue labeled "good-first-bug" until the label has zero open issues; the goal is met only when `gh issue list --label good-first-bug --state open` is run and its output showing 0 issues is printed here, each fixed issue closed by a merged-or-draft PR linked in the transcript; otherwise stop after 25 turns.
```

## Bad → good rewrites

**Subjective end state (fails Test 1):**
- ✗ `/goal make the landing page better and more compelling`
- The evaluator can't judge "better." → Either make it objective, or it's **not a goal** — it's interactive design iteration.
- ✓ (if there's an objective proxy) `/goal raise the Lighthouse performance score of /pricing to ≥90; goal met only when the lighthouse CLI output showing perf ≥90 is printed here; stop after 12 turns.`

**Needs the user's decisions (fails Test 2) — the failure from this session:**
- ✗ `/goal write the ad strategy with an ICP options menu and a recommended budget for me to choose`
- A goal can't extract your choices, so it returns un-decided menus + placeholders. → Split it: do the **decision** in an interactive session first, *then* write a goal for the autonomous build that follows.
- ✓ `/goal turn the LOCKED decisions in strategy.md §"Final picks" into a runbook; goal met only when runbook.md exists and its section outline + every field is printed here; stop after 10 turns.`

**Proof not in the transcript (fails Test 3):**
- ✗ `/goal until the strategy doc is complete and correct`
- "Complete/correct" lives in a file the evaluator can't read. → `/goal …goal met only when the doc's section outline and a filled-vs-[NEEDS-INPUT] checklist are printed into this conversation…`

**Ungated irreversible side effect (fails Test 4):**
- ✗ `/goal create and launch the $25/day ChatGPT ad campaign`
- Autonomous live spend on a new platform. → stop at the gate: `/goal build the campaign in ads.openai.com in PAUSED/draft state matching runbook.md; goal met only when a field-by-field readback of the draft campaign is printed here for my review; do NOT publish or start spend; stop after 12 turns.`

**No bound (fails Test 5):** any condition without `stop after N turns` can loop indefinitely. Always add it.

**Exhaustion-branch proof clause hardcodes the target number (real failure — cost ~10 stuck turns):**
- ✗ `/goal expand X from 11 to 15 rows; met only when a count prints 15 (or the pool is genuinely exhausted below 15, whichever comes first) AND the transcript prints the full list of all 15 row names...`
- The disjunction grants "exhausted below 15" as a valid outcome, but the proof clause still demands "all 15" names — unsatisfiable by construction whenever that branch is the one actually reached (there is no 15th row to name if only 13 exist). A literal evaluator will correctly agree the exhaustion evidence is genuine every single time and still refuse to close the goal, because the printed proof can never match the fixed number. This is not a hypothetical — it happened, and produced a real multi-turn Stop-hook loop that only a human `/goal clear` could end.
- ✓ `/goal expand X from 11 toward 15 rows (target, not a floor); met only when EITHER a count prints 15, OR the pool is genuinely exhausted below 15 — proven by printing the full list of every row that IS at the target state (whatever that count turns out to be) plus what was tried-and-dropped and why; otherwise stop after N turns and report what is blocking.` — the proof clause names the state to enumerate, never a specific count, so it stays satisfiable in either branch.
- **Rule of thumb:** in any condition with a target-vs-exhaustion disjunction, grep your own draft for the target number appearing a second time inside the proof clause. If it's there, replace it with "every row/item that IS at the resulting state" before shipping.

## Lever examples — pulling the optional slots into a condition

> The skill names, subagent roles, file paths, and commands below are **illustrative** (Thoven-flavored). Substitute whatever the goal's repo and domain actually offer — discover them, don't copy these verbatim. The *pattern* is what transfers.

**Drives a skill in auto mode (Claude-only lever):**
```
/goal Build the intro-call success microanimation by driving the thoven-designer skill in auto mode — dispatch an advisor subagent to supply any design choice the skill would normally ask a human for, per the locked spec; the goal is met only when the new component path + its section outline are printed here and thoven-designer's design-system-adherence checklist (3D button, amber-500 not orange, Fredoka headers only, motion tokens) is printed all-pass; do not touch unrelated components; otherwise stop after 14 turns and report what is blocking.
```
Why: the goal drives the skill autonomously (auto mode + an advisor subagent standing in for the human input the skill would otherwise need — a goal can't ask, Test 2), and uses the skill's own checklist as transcript-verifiable proof, not "looks good."

**Anchored on a plan/brainstorm file:**
```
/goal Implement the LOCKED decisions in docs/payouts/PLAN.md §"Final picks"; the goal is met only when every locked item is implemented and a per-item DONE/[BLOCKED] table referencing each §"Final picks" line is printed here, with `npm run type-check` exit-0 output printed; otherwise stop after 18 turns.
```
Why: the file carries the decisions, so the goal needs none of its own — it just executes and proves coverage against the named section.

**Finalize / quality clause (auto-resolve Critical, stop at non-trivial Major — NO in-condition approval gate):**
```
/goal …<end state + proof>…; then run /simplify and thermo-nuclear-code-quality-review and resolve every Critical and trivial finding, printing the before/after finding list here; STOP with any non-trivial Major findings listed but unfixed for human review; otherwise stop after 20 turns.
```
Why: the approval-gated loop can't live in a goal (Test 2). The goal clears the safe findings and hands the judgment calls back.

**Testing-scoped, anchored on TESTING.md (FE+BE):**
```
/goal Fix the failing booking-flow specs, following the layer guidance in both ~/thoven/frontend/TESTING.md and the backend TESTING.md; the goal is met only when the FE suite and the BE request specs are run and their exit-0 output is printed here; you MAY create test/dummy data and run the local E2E, but must NOT read or write production; otherwise stop after 20 turns.
```
Why: testing permissions are explicit (dummy data yes, prod no) and anchored on the canonical test docs across both repos.

**Progress work file:**
```
/goal Drain every TODO marked `// FIXME(booking)` in lib/booking; the goal is met only when `rg "FIXME\(booking\)" lib/booking` is run and its 0-match output is printed here; append a one-line status (file, what changed) to goal-specs/booking-fixmes-progress.md after each fix and print that line here too; otherwise stop after 25 turns.
```
Why: the progress file makes a long autonomous run trackable; the line is also printed so the transcript-only evaluator sees it.

**Cross-repo (FE + BE in one run):**
```
/goal Align the GCal serializer contract end-to-end: rename the BE serializer fields to {connected, google_email} and drop the FE-side remap; the goal is met only when the BE serializer source and the FE type file are both shown here with matching field names and `npm run type-check` exit-0 is printed; do not change auth logic; otherwise stop after 16 turns.
```
Why: a goal can touch both repos in one run; proof shows the matching contract on both sides.

**Visual goal done right (non-pixel proxy, not pixel-perfect):**
```
/goal Build the pricing hero to match docs/design/pricing-hero.md; the goal is met only when the component path + a checklist proving each spec'd element (headline, 3-tier grid, CTA, badge) exists and uses design-system tokens is printed here all-pass — NOT pixel-matching to any screenshot; otherwise stop after 14 turns.
```
Why: a feature/adherence checklist is transcript-verifiable and avoids the pixel-perfect rabbit hole.

**Measurement-tool-first (build the gauge, then iterate):**
```
/goal Cut marketplace-search p95 latency below 200ms; first build a small bench script that prints p95 over 200 sampled queries, then optimize until it reports <200ms; the goal is met only when the bench script source and a final run printing p95<200ms are both shown here; do not change result ordering; otherwise stop after 20 turns.
```
Why: for an ambitious numeric goal, the goal builds its own measurement so progress is provable each turn.
