# Learnings — andres-mode

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — merge lines name the method; "where are we" walks the user's list; one-file visual explainers; keep the user's voice

> reflect · 2026-10-22 · 889d1f76 · 39a12a43 · ec30f47b · 01a151d4 · 93f7415c · broken-rule · applied · seen 3

**What happened.** Four lessons from the 10-15..10-22 window. (1) Merge go-lines named the direction but never the method; #256 (282 commits) was squashed without the method ever reaching Andres ("Are you saying merging into main or main into the integration", 889d1f76). Seen 3. (2) Status reports blurred his list: "Did we not solve the hour expiry… give me ticket numbers with what was actually done, list items that have been missed" (codex 01a151d4); the same ask in 39a12a43, 889d1f76 and ec30f47b. Seen 4. (3) Visual explainers came back as boxed prose or scattered files: "put it all in one html easy to review", "something more like… floating-surfaces.html", "highly visual not in terms of using boxes". Seen 3. (4) Polishing his launch draft cut his tone and offered several drafts: "you lost some of the context I wrote… maybe just give me one draft" (codex 01a151d4). Seen 1. On 10-22 main also ran a lighter git-history pass in place of the /reflect he named ("launch the full /reflect or /thoven-reflect"); that raises the 2026-08-28 entry.
**Why.** The merge line covered direction only. "Open with a plain report of where things stand" was too generic to produce an item-by-item map. No rule covered explainer format or draft polishing. Main sessions are not loading andres-mode at start (backlog), so the run-the-named-skill Pitfall never reached the session.
**What changed.** Delegation merge line now names source, target and method. Replies gains "Where are we walks the user's own list", the one-file visual explainer rule, and the keep-their-voice rule (a step, since Pitfalls is at its ten-line cap).

## 2026-10-20 — an understanding question gets the answer, then the turn ends

> reflect · 2026-10-20 · memory:feedback_list_before_question · correction · applied · seen 1

**What happened.** An AskUserQuestion followed an explanation in the same turn. Andres rejected it: "give me the list before asking me question I want to understand". The same day he answered several decision questions with clarifying questions, because the options came before he understood the topic.
**Why.** The question dialog covers the explanation, so he cannot read it before deciding.
**What changed.** Step in Replies, new "A question is not a work order" line: answer in full and end the turn; the decision comes in a later turn.

---

## 2026-10-20 — merge plans resolve conflicts by product intent and name the oracle first

> reflect · 2026-10-20 · memory:feedback_merge_plans_product_intent_oracle_first · correction · applied · seen 1

**What happened.** Andres rejected a merge-plan doc whose resolutions said "main's code stays" and whose verification was a walkthrough. He said ordering must follow the product, one conflict handled correctly can still have downstream impact, and tests must be coherent with what they test against, with the expected outcome deduced first.
**Why.** "Main wins" picks code by branch, not by behaviour, and a clean resolution can still break serializers, API fields, callers and components past the conflicted lines.
**What changed.** Pitfall line: resolve each conflict by product intent with its source, check blast radius past the conflict, state the oracle before the smallest test.

---

## 2026-10-19 — verification work means better skill text, not plumbing

> reflect · 2026-10-19 · memory:feedback_verification_improve_skills_not_scripts · correction · applied · seen 1

**What happened.** Asked to improve verification, the first proposal led with receipt delivery, watcher noise and merge-direction guards. Andres called it "bloat regarding trust" and "not at all what I wanted". His frustrations were work not verified, evidence not shown or not understandable, UI not checked against design or spec, a two-button change running whole-suite verify for minutes, and verify runs of 3 hours.
**Why.** The deliverable is checks matched to the change, so agents catch misimplementation, design-system misses and spec drift. Hooks and receipts address trust reporting, which he did not ask for.
**What changed.** Pitfall line: improve verification through skill text and check selection.

---

## 2026-10-16 — every decision and grill round goes through the ask tool

> reflect · 2026-10-16 · memory:feedback_decisions_via_askuserquestion · correction · applied · seen 2

**What happened.** On 10-12 three calls went on a show-me HTML page with typed reply codes ("1 C, 2 rec, 3 rec"); Andres added "Use ask question tool to ask me". On 10-16 a grill round written as Q1..Q5 markdown got "use the ask question tool".
**Why.** The tool gives him clickable options and notes; typed codes are friction.
**What changed.** Step in Replies, the "Do reversible in-scope work" line: grill rounds go through the tool too, four per call at most, previews for visual options; an HTML page is for looking.

---

## 2026-10-10 — audits are measured in sections with a harness

> reflect · 2026-10-10 · memory:feedback_audits_measured_with_harness · correction · applied · seen 1

**What happened.** Shown a read-only architecture review, Andres asked to go wider and measure: React performance, data and races, backend requests and the database, side effects and concurrency, complexity. He wanted 4-5 focus sections, quantitative metrics, high-impact small changes ranked, and the evidence shown to him.
**Why.** Reading-only reviews produce opinions. Numbers rank the work and give a way to judge each fix.
**What changed.** Step in Hardening, the "Audit with numbers" line: 4-5 sections, each with a re-runnable harness, n and percentiles, ranking by gain over size, evidence as HTML before fixes. The pane launch detail in the memory is stale and was left out.

---

## 2026-10-09 — fix what the feature owns; file only what it does not

> reflect · 2026-10-09 · memory:feedback_fix_now_no_debt_tickets · broken-rule · applied · seen 1

**What happened.** A triage audit listed items the scheduling session had noticed and left alone. Andres: "if you can handle them now and improve the architecture in the same session, or just triage or debug them instead of creating additional linear tickets and additional tech debt". PL0 had filed a run of follow-up tickets for structural cleanup and he objected. The same day two rulings narrowed this to the feature's own code, and the law's Scope rule still sent neighbouring problems to Linear, so andres-mode and the law disagreed.
**Why.** Neither text replaced the other, so agents could cite either. Andres settled the conflict with law Scope on 2026-10-21.
**What changed.** Step in Spec writing, the "Group findings" line now reads: debt, bugs and smells in code the ticket or feature owns are fixed on its branch in the same round; a problem outside it gets one line in an existing grouped Linear issue, or a new issue only when none fits; a product call goes to the user as a question.

---

## 2026-10-09 — fix rounds carry user-facing bugs only

> reflect · 2026-10-09 · memory:feedback_feature_over_polish · correction · applied · seen 1

**What happened.** A slice went through three fix rounds of reviewer findings (sibling-tab races, red-first proofs, dead assertions, type spellings) while main diagnosed CI failures the slice did not cause and 17 feature slices waited. Andres: "Tests are not the core feature. If you have differences in tests we can handle that in merge... you're trying to fix so much of the CI and everything instead of building the actual feature."
**Why.** Edge cases and test polish were treated as product bugs, and other branches' CI red was treated as the slice's.
**What changed.** Step in Check your own work, the fix-rounds line: only bugs a user hits in the normal flow; rare edge cases, test nits and CI red on untouched files are one line in the report.

---

## 2026-10-09 — research subagents run sonnet

> reflect · 2026-10-09 · memory:feedback_sonnet_research_subagents · correction · applied · seen 1

**What happened.** On an inspiration board, Andres rejected four research agents launched on the default model and said "Use sonnet subagents".
**Why.** Web research and image gathering do not need the parent model.
**What changed.** Step in Delegation, the subagent-model line: research and inspiration fan-outs run sonnet.

---

## 2026-10-09 — on his hand-edited design, change only the named property

> reflect · 2026-10-09 · memory:feedback_build_from_his_hand_edits · correction · applied · seen 1

**What happened.** Andres hand-fixed the passport ledge in Paper and said one part was off. Two proposals changed his structure, and he said it made the book "look like a deck of cards, not a passport book". The real fix was one property, the page radii, and he approved it.
**Why.** Each proposal swapped in a new geometry model instead of reading his node values.
**What changed.** Step in Replies, the "change that one thing" line: read his node values first, keep his structure, change only the named property in one side-by-side copy.

---

## 2026-10-07 — a board stays on one page with short cards

> reflect · 2026-10-07 · memory:feedback_board_one_page_short_cards · correction · applied · seen 1

**What happened.** Asked to reorganise the Private Lessons board, a session split it into 13 pages. Andres opened page 1, saw only his sketches and thought the work was lost.
**Why.** The board exists so he can read everything in one place. "Reorganise" means arrange without overlap, each screen beside its decisions.
**What changed.** Step in Records, the "one living spec" line: one page with nothing overlapping; an ADR, PRD or motion card holds 3-6 requirement lines.

---

## 2026-10-04 — design variants are never overwritten in place

> reflect · 2026-10-04 · memory:feedback_design_board_iterate_in_place · correction · applied · seen 1

**What happened.** During the Private Lessons grill, the critique loop overwrote the first A2 variant in place, and that was the one Andres liked.
**Why.** "Edit the board in place" was applied to variant iterations, which need the previous version kept for the pick.
**What changed.** Step in Records, the "one living spec" line: each design-variant refinement goes in a new row beside the last. The main rule (edit in place, change only the named layer) was already there.

---

## 2026-10-03 — internal tooling ships light

> reflect · 2026-10-03 · memory:feedback_tooling_light_process · correction · applied · seen 1

**What happened.** A Claude Code mod took most of a day: a spike, two design runners, thermo reviews, a 3-round refactor, a verifier with mutations for every slice, a final verify and a live wave. Andres: "dude what is taking so long to make this mod why do we have so many checks and evals". Later: "jsut fix it with subagents in line its so much quicker".
**Why.** The spec's evaluation layers were the model's own invention, and product-repo rigor was applied to agent-skills tooling.
**What changed.** Pitfall line: ship internal tooling with one builder and a test run, fixing in session with subagents. Product repos keep their own verification rules.

---

## 2026-10-02 — a dropped tool leaves no tombstone

> reflect · 2026-10-02 · memory:feedback_drop_means_no_tombstone · correction · applied · seen 1

**What happened.** After removing four skills, a session appended them to the Retired list in the root CLAUDE.md. Andres: "I literally just said we don't use those".
**Why.** Prose that names a dropped thing in always-loaded docs keeps it in every agent's context.
**What changed.** Step in Records: a dropped skill or tool loses every mention; no Retired list names it. A guard script that blocks reinstalling it is fine.

---

## 2026-10-01 — a stale-items list is a reconcile, not a build queue

> reflect · 2026-10-01 · memory:feedback_reconcile_not_new_work · correction · applied · seen 1

**What happened.** Four build agents were dispatched off a stale-items list. Andres: "I did not want to take on new tickets I wanted to update linear based on PRs open, merge, cleanup and make items done and ready that are done". One of the builders reached a policy fork he had not asked to face.
**Why.** Pointing at areas means bringing Linear in line with work that already exists.
**What changed.** Pitfall line: read a "work on these areas" or stale-items list as a reconcile; start a builder only on a ticket the user names for building.

---

## 2026-09-27 — build mode builds live, with no proto gates

> reflect · 2026-09-27 · memory:feedback_build_live_no_proto_gates · correction · applied · seen 1

**What happened.** In the Materials build, a plan's design gate (a proto of a copied piece) blocked two slices, and main brought its layout rounds to Andres. He said "why are you building shit on protos instead of directly live, skip the fucking ceremony" and cancelled it.
**Why.** Protos and design gates in a build wave are work that does not ship, and they pull his attention onto surfaces he did not ask about.
**What changed.** Step in Replies, the "Stay in the current mode" line: build mode creates no proto or design-gate tickets; slices build straight into the real components.

---

## 2026-09-25 — vendor docs through Context7 first

> reflect · 2026-09-25 · memory:feedback_vendor_docs_via_context7 · correction · applied · seen 1

**What happened.** Researching Render's Blueprint separation, a session left Context7 after two queries for WebSearch and WebFetch. Andres: "use context 7 next time".
**Why.** Context7 holds current vendor docs; the web is for community opinion no doc covers.
**What changed.** Step in Delegation, the subagent-model line: vendor and library questions go through Context7, up to three queries, before WebSearch or WebFetch.

---

## 2026-09-24 — "realign" means a read-only audit, not new questions

> reflect · 2026-09-24 · memory:feedback_realign_means_audit_not_reask · correction · applied · seen 1

**What happened.** After filing tickets from one answer, a session sent an AskUserQuestion reopening settled seeding and sizing choices. Andres: "We've already made decisions. We're not trying to readdress questions." In the same exchange an unchecked hosting fact was presented as true, and it was wrong.
**Why.** "Pause, realign" means stop writing and find where tickets, docs, code and live systems diverged from decisions already made.
**What changed.** Pitfall line for the audit. The unverified-fact half became a step in Check your own work, the "Check a claim before saying it" line.

---

## 2026-09-16 — delete your own scratch files

> reflect · 2026-09-16 · memory:feedback_delete_scratch_files_without_asking · correction · applied · seen 1

**What happened.** A probe script holding test login details was left as a to-do for Andres. He said "delete it, you do not need to wait for me there."
**Why.** A one-off probe is the session's own mess.
**What changed.** Step in Delegation, the "Close a pane" line: delete your own one-off probes and scratch scripts once checked, and say so.

---

## 2026-09-14 — plain product language, no ids in chat

> reflect · 2026-09-14 · memory:feedback_plain_language_reports_no_ticket_ids · broken-rule · applied · seen 2

**What happened.** On 09-07, after about 50 autonomous turns with no report, Andres could not follow references like ticket and decision ids: "You're speaking to me as if I have the full context of all of Linear". On 09-14 grill questions phrased as "settles ADR5, D1" got "Can you stop speaking to me in adr 5 and d1".
**Why.** Ids point into context he does not carry. This holds even when a skill or brief asks to cite ledger rows; they belong in the ledger write.
**What changed.** Step in Replies, the "Lead with the finding" line: a plain report after a long stretch; no ticket or decision ids in chat or a question.

---

## 2026-09-12 — finish the named edit; adjacent defects are one sentence

> reflect · 2026-09-12 · memory:feedback_do_not_widen_copy_scope · correction · applied · seen 1

**What happened.** Andres reacted sharply to a proposal to fix a duplicated label one face over from the one he ruled on ("i never mentioned this so fucking stop tryign to change it") and to re-opening a face he had just ruled on. A fake learner name in a question preview drew "why the fuck did you render maya there".
**Why.** He decides one thing at a time on purpose. A menu of adjacent changes reads as scope creep.
**What changed.** Step in Replies, the "change that one thing" line: an adjacent defect gets one sentence and a Linear line, never a question with options. Step in Spec writing, the Lexicon line: demo data uses Andres Martinez or real fixtures, never an invented name.

---

## 2026-09-04 — once he rules, act

> reflect · 2026-09-04 · memory:feedback_stop_re_asking_settled_scope · correction · applied · seen 1

**What happened.** Andres said "remove the feature flags". A scope question followed, then a question about one call site's cascade. He cut it off: "Just don't remove the fucking flag then. Just don't do it. Just do your edits." The cleanup was dropped.
**Why.** Each extra round costs him a turn and reads as stalling.
**What changed.** Step in Replies, the "Do reversible in-scope work" line: once the user rules, do the safe parts and report any hazard beside the work in one or two sentences.

---

## 2026-09-03 — a grill answer shapes the setup; nothing runs yet

> reflect · 2026-09-03 · memory:feedback_no_agents_before_ruling · correction · applied · seen 1

**What happened.** In a consolidation round, Andres said "let's parallelize" and three audit subagents were dispatched. He interrupted: "you're not supposed to run anything yet. We're supposed to have prompts and skills for this specific thing."
**Why.** Talking about parallelising is shaping the setup, not authorizing execution.
**What changed.** Pitfall line: treat a grill answer about parallelising as shaping the setup; run nothing until the user says run. The memory's "draft prompts in chat" detail is stale since dispatch-work brief files.

---

## 2026-09-03 — a question is not a work order

> reflect · 2026-09-03 · memory:feedback_questions_are_not_work_orders · correction · applied · seen 1

**What happened.** Asked "can that be a concern?" about payload and schema drift, a session started the full audit inline. Andres: "Dont run this fuckign now we are doing our own work, i was just asking you and therefore that should be added as post merge work".
**Why.** Main's context and the shared worktree are reserved for dispatching and reviewing. An investigation for a future ticket burns both.
**What changed.** Step in Replies, new "A question is not a work order" line: answer from what is known; an investigation runs only when asked, in subagents, and otherwise goes on the owning ticket.

---

## 2026-09-03 — map callers before ruling a delete

> reflect · 2026-09-03 · memory:feedback_verify_before_delete · correction · applied · seen 1

**What happened.** An audit row said a fetcher was "never wired"; it was wired on the pricing page. Andres: "if we delete shit because you think it's not wired up or dry but you haven't mapped it out, blast radius check it or actually check the dependencies well, we can get fucked on a lot of these rulings."
**Why.** Audits are claims. Two audit rows that day were wrong on liveness, and a delete ruled on a wrong claim removes live product.
**What changed.** Pitfall line: map callers before ruling anything dead or deletable, and label each ruling verified or audit claim.

---

## 2026-09-02 — no Fable subagents

> reflect · 2026-09-02 · memory:feedback_no_fable_subagents · correction · applied · seen 1

**What happened.** Mid-review, Andres said "stop launching fable subagents".
**Why.** Fable lanes kept hitting the provider session limit, and he wants parallel work off that budget.
**What changed.** Step in Delegation, the subagent-model line: subagents run opus, sonnet or haiku, never Fable.

---

## 2026-09-01 — a stale branch predates the work; it did not delete it

> reflect · 2026-09-01 · memory:feedback_merge_framing · correction · applied · seen 1

**What happened.** Merge conflicts were described as a stale branch having "deleted" work from main.
**Why.** A branch cut before the work landed never contained it. The "deleted" framing makes a routine merge sound like data loss and sends Andres hunting for a destructive change.
**What changed.** Step in Delegation, the merge-direction line: a stale branch "predates" work on main; "deleted" is for a commit that removed something.

---

## 2026-08-28 — run the skill he names

> reflect · 2026-08-28 · memory:feedback_run_the_skill_he_named · 93f7415c · correction · applied · seen 2

**What happened.** Andres asked for `/interrogate` on a build plan. A session ran three same-model reviewers instead and argued interrogate was redundant. He corrected: "What I wanted you to run was to run /interrogate on the plan as well".
**Why.** A named skill is an instruction. Interrogate's value was model diversity, which same-model reviewers on different axes do not give.
**What changed.** Pitfall line: run the skill the user names; if it seems wrong, run it and say why, or ask before substituting.

---

## 2026-08-20 — skills stay model-invocable

> reflect · 2026-08-20 · memory:project_skills_are_model_invocable · tooling · applied · seen 1

**What happened.** Andres ruled that skills should self-trigger rather than wait to be named, and `disable-model-invocation` was removed from 45 skills. He confirmed `swarm` explicitly after the fan-out cost was raised. A first count reported 4 flagged skills when the real number was 70, because `grep -r` does not follow the `~/.claude/skills` symlinks into `~/.agents/skills`. By the 10-21 review the ruling had been undone: the automate-me working copy reverted it (uncommitted, 10-05) and 47 installed skills carried the flag again.
**Why.** A mode or principle should arrive the moment it applies; waiting to be named means the rigor misses the turn that needed it. The flag returns whenever a skill-authoring text defaults to it.
**What changed.** Pitfall line: leave `disable-model-invocation` off unless the user says that skill must never self-trigger, and edit under `~/.agents/skills`.

---

## 2026-08-15 — flag a side-finding once, then stay on the task

> reflect · 2026-08-15 · memory:feedback_finish_task_before_tangents · correction · applied · seen 1

**What happened.** A memory-file contradiction was flagged in three consecutive messages while applying Linear spec patches. Andres: "do not change that backend memory item, stay focused".
**Why.** He tracks one thread. A flagged item he has not picked up is deliberately deferred, not forgotten.
**What changed.** Step in Replies, the "change that one thing" line: an adjacent defect is raised once; then return to the named deliverable.

---

## 2026-08-11 — search every worktree before calling something missing

> reflect · 2026-08-11 · memory:feedback_search_all_worktrees_before_saying_missing · correction · applied · seen 1

**What happened.** Andres was told a UI library and a segmented control were not in the repo. Both existed in the `~/thoven/frontend` main worktree; only one other worktree had been searched. Separately a doc line scoped to one settings row was cited as a repo-wide lock from a subagent's summary.
**Why.** Worktrees hold different branches with different dependencies and components. A negative from one is not a negative for the repo.
**What changed.** Step in Check your own work, new "Check a claim before saying it" line: search `~/thoven/frontend` and every sibling worktree and name which you covered; open a cited doc line's heading before calling it a lock.

---

## 2026-08-03 — "do X now" in an audit adds X to the plan

> reflect · 2026-08-03 · memory:feedback_audit_means_plan_not_build · correction · applied · seen 1

**What happened.** In a pre-build audit whose contract said "you are auditing, not building", Andres said "let's do the registry now because it's part of the 2.0 sprint". A session wrote the module, tests and six call-site conversions into the main worktree. He stopped it and had it reverted.
**Why.** The override was about what belongs in the plan, not about leaving the planning phase. Building early skipped the plan's review gates and landed in a worktree another session was editing.
**What changed.** Pitfall line: in an audit or scoping phase, a "do X now" adds X to the plan with scope and evidence; write production code once the build phase starts.
