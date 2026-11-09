# Learnings — qa-flow

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-09 — Borrow modes and evidence rules from the third-party QA playbooks

> session · 2026-11-09 · 96e39a9f · discovery · applied · seen 1

**What happened.** Andres asked which installed third-party skills hold QA playbooks worth copying. agent-browser's bundled `dogfood` playbook (`agent-browser skills get dogfood`, which Andres did not know existed), gstack's `/qa` and test-master's QA methodology did. He picked gstack's modes and the evidence-and-pacing rules.
**Why.** QA Flow's dev and production modes had no method for choosing pages, a production check had no shape, and every finding was recorded the same way.
**What changed.** Step 2 Mode: development is diff-aware (map the diff to the pages it reaches, then hunt there and next door), production is a quick read-only smoke per user type, and regression reruns the last run's flows and reports fixed, new and still failing. §7: retry once before filing; video plus before and after shots only for a finding that needs interaction, one annotated screenshot for one visible on load; type and pause at human speed while recording. Finding cards carry severity and category. Not taken: gstack's fix loop (diagnose before fixing stays), its health score as a gate, and `dogfood` as the literal-user tester's playbook (not picked).

## 2026-11-09 — Record by product flow, test like a literal user, split dev from prod, report visually

> session · 2026-11-09 · 96e39a9f, 14531ef9 · correction · applied · seen 2

**What happened.** Andres, after the reflect run: QA "will run one kind of journey and record that… we don't need four different recordings especially when things are non-destructive, like going back and forth, which is actually how people navigate." AI QA "acts like too much of a perfect human because… you read the length requirements"; "Some of the Qa-flow runs should act like a dumb user, in which they just take the UI literally." Development QA should be a wider bug hunt than production checks, and the synthesis "a little bit more visual… videos tightly (not just a bunch of screenshots)… do not show just a bunch of tables." On 2026-10-29 (14531ef9) he had asked for "the tech illiterate user… doing things even tho the UI signals the opposite".
**Why.** The real-user moves read as separate checks, so each could become its own recording. The tester always knew the code. QA had no mode, so prod checks and dev bug hunts looked alike. The report step named `visual-artifacts` but not its shape.
**What changed.** framing.md: the real-user take is one take per product flow with reversible moves woven in, and a literal-user take run by a tester given only the URL, persona and goal, working from the screen. SKILL.md Step 2 gains a Mode row (in development: wide hunt; production: read-only confirmation per user type). Step 3 Review defines the report: one page by flow, embedded videos with chapter marks, finding cards, performance as a `dataviz` chart, no test tables. §7 Journey matches.

## 2026-11-09 — A real-user take: act like a person, then check what persisted

> reflect · 2026-11-09 · 14531ef9, 39a12a43, d7e67eac · skill-gap · applied · seen 3

**What happened.** Andres typed the personas by hand on 2026-10-29 ("The impatient one… The tech illiterate user… The breaker… simulate more human behavior rather than perfect e2e testing"), asked on 2026-10-30 for "a 'let's break the application' type of QA", and on 2026-11-09 for QA "acting like a real user… If they upload multiple times do they refresh and then upload a file again? Does it get saved?". The 10-29 take found Back leaving the recording viewer, a stale-tab Send and a misclick that created an empty Session.
**Why.** framing.md's edge cases were a bug fix's data predicates; a feature got only happy paths, so every behaviour pass was rebuilt from the brief.
**What changed.** framing.md "What to test" holds the real-user take (back/forward, refresh mid-flow, leave and return, second tab, double-submit, re-upload after refresh, offline or one aborted call, two actors on one resource on the mini) with the agent-browser command for each; Step 2's "What to test" row scales depth to what the change can break.

## 2026-11-09 — One user intent makes one write, and money is counted at Stripe

> reflect · 2026-11-09 · 7c3d7896, 2133d8f0, 39a12a43, d7e67eac · skill-gap · applied · seen 4

**What happened.** A card-save retry returned 500 after the save had committed, found by a state audit, not QA (2026-10-24). The THV-1650 pane invented its own double-tap and replay count, and Andres accepted it (2026-11-05). The 10-30 break plan skipped double-submit as "covered by specs" in the same run that proved those specs stub Stripe. On 2026-11-09 Andres asked to "check that payments don't double".
**Why.** "Race" covered stale state, not a duplicated intent, and nothing said a stubbed spec proves nothing about the provider.
**What changed.** framing.md "Race and duplicate intent": under a double-click, a same-key replay and a retry, assert one POST, one row, one wallet credit, and one PaymentIntent with one capture via the Stripe plugin; a spec that stubs Stripe never excuses it on a money path.

## 2026-11-09 — Check the off-screen effects against the real service

> reflect · 2026-11-09 · 39a12a43, d7e67eac · skill-gap · applied · seen 2

**What happened.** The 2026-10-30 break run found PaymentStatusSync crashing against real Stripe on every webhook while the suite stubbed that call. Release prod/2026-11-09-1 shipped the purchase-expiry emails with no staging check that one was rendered or sent.
**Why.** framing.md sent backend-only scope to "rails/specs", the stubbed layer.
**What changed.** framing.md "Dependency checks" and an execute-and-evaluate.md line: list each off-screen effect the diff adds (job, `email_deliveries` row, Stripe object, Mixpanel event, migration or backfill) and check it on staging through publish's "Run code on staging" and the `prod-db-check.sh` queries. No new script, no production writes.

## 2026-11-09 — agent-browser's network and console log is standard evidence

> reflect · 2026-11-09 · 14531ef9, d7e67eac · conflicting-guidance · applied · seen 2

**What happened.** Andres asked on 2026-10-29 to "monitor failures, networks and other items especially when encountering errors", and on 2026-11-09 that QA "use an agent browser because that allows it to monitor all the network calls".
**Why.** Capture was advice in "Evidence, not vibes", and Step 2 called the in-app Chrome "Primary", which runs on the laptop against §7's rule that heavy capture runs on the mini.
**What changed.** agent-browser on the mini is the default on ghost, staging and production; the in-app Chrome is for a local run Andres watches. The REQUIRED Performance row became "Network and performance", filled from `network requests --status 400-599`, `--method POST`, `console`, `errors` and a HAR per flow.

## 2026-11-09 — Keep the release pass that worked

> reflect · 2026-11-09 · 2133d8f0, 39a12a43, 14531ef9 · success · applied · seen 3

**What happened.** On 2026-11-04 Andres dispatched THV-1648 (prod QA per user type) and THV-1650 (the renewal pipeline end to end on staging with Stripe test cards) by hand, and accepted both: "close THV-1648 and THV-1650 as done. Post the evaluation and videos to both first." Prod QA ran before the staging run. On 10-29 he asked that "the implemented and tester should be separated".
**Why.** No text described the pass, so it was dispatched from scratch and in the wrong order.
**What changed.** SKILL.md "Release pass": a tester pane on the mini runs a larger feature's full take on staging before publish shows `plan`, a read-only check per user type follows on production, and the verdict link goes on the changelog bullet.

## 2026-11-09 — A dispatched or release run states its picks and proceeds

> reflect · 2026-11-09 · 2133d8f0 · conflicting-guidance · applied · seen 1

**What happened.** The THV-1648 and THV-1650 panes asked nothing at the start and raised only real blockers (prod seeding, Stripe's hCaptcha); Andres accepted the result.
**Why.** Step 1 said to ask only what changes the run, but Step 2 said "confirm with the user" and framing.md said "If the answers are thin, keep asking", which stalls an unattended run.
**What changed.** Step 2 confirms only on a run Andres watches; framing.md answers the questions from the changelog bullet, PR and ticket on a dispatched run. Also: "four tracked phases" fixed to five, flow-mapping's baseline history cut, and the token and console lines in framing.md's Thoven-native list dropped, since the Design and Network rows own them.

## 2026-11-09 — Fire on release QA and "break it"

> reflect · 2026-11-09 · d7e67eac, 39a12a43 · skill-gap · applied · seen 2

**What happened.** qa-flow never loaded during release prod/2026-11-09-1, and on 2026-10-30 "break the application" left the agent to build its plan with three research agents.
**Why.** The description named bug fixes and "QA this before publish" only.
**What changed.** The description adds a release's larger features on staging before promote, "break it", "stress test" and "act like a real user".

## 2026-11-09 — A Neon branch of production carries production's password

> reflect · 2026-11-09 · 39a12a43 · discovery · applied · seen 1

**What happened.** On 2026-10-30 a break-run agent made a Neon branch of production with `neonctl` and printed its connection string, which carried the production owner password. The lesson lived only in frontend project memory.
**Why.** A branch inherits its parent's role passwords; prod-snapshot.md describes only the human `pg_dump` route.
**What changed.** Pitfalls line: a Neon branch of production is a prod-PII copy under safety gate 1; reset the branch role's password before any agent sees its connection string.

## 2026-11-09 — Destructive cases stay off the gate accounts

> reflect · 2026-11-09 · 2133d8f0 · skill-gap · applied · seen 1

**What happened.** The THV-1648 prod pane tested lockout on the dogfood teacher ("GHOST_TEACHER… is now locked", attempts 5 and 6 returned 423) and moved the household wallet. Publish's production smoke logs in with that teacher.
**Why.** Nothing separated the accounts publish's gates use from accounts QA may spend.
**What changed.** Pitfalls line: cases that lock, drain or spend an account run on staging or a seeded throwaway account.

## 2026-10-11 — Diagnose a QA bug list before fixing it

> reflect · 2026-10-11 · memory:feedback_diagnose_qa_findings_before_fixing · correction · applied · seen 1

**What happened.** After the Reserved lesson time QA pass (five agent-browser panes, 24 fails), main offered to "fix all 9 bug groups". Andres answered "run /diagnosing bugs to be accurate before".
**Why.** A QA pane's cause line is a traced guess, not proof. Fixing from it risks fixing the wrong thing.
**What changed.** Pitfall line: run `diagnosing-bugs` on the bug list (red test, confirmed cause with file:line per bug) before proposing or applying any fix. Group diagnosis by code area, run its phases 1 to 3, leave the red tests uncommitted as the future regression tests, and show Andres the diagnosis before fixing.

## 2026-09-25 — Record ghost and staging walkthroughs with agent-browser

> reflect · 2026-09-25 · memory:feedback_record_walkthroughs_agent_browser · correction · applied · seen 1

**What happened.** Andres said "start using Agent Browser to record some of these walkthroughs as you do it", and about the emails testing sent to Keri's accounts, "I don't care about getting these emails, because that's her account."
**Why.** A status report after the run is not evidence he can watch. The emails go to Keri's own test accounts, so flagging them as a side effect was noise.
**What changed.** Step 2 "Browser tool" row and `references/execute-and-evaluate.md` "Logging in": on ghost or staging, drive with `agent-browser`, record video plus screenshots while the run happens, log in by API token, and leave emails to Keri's test accounts out of the findings.

## 2026-08-15 — Token injection and agent-driven walkthroughs are allowed

> reflect · 2026-08-15 · memory:feedback_qa_token_injection_allowed · broken-rule · applied · seen 1

**What happened.** Andres retired two QA rules on 2026-08-15: "full email and password UI login, never token injection" and "walkthroughs are human-driven, never auto-run". They were removed from TESTING.md, the installed qa-flow copy and both repos' manual-qa copies, but this source kept "never token injection" in Step 2 and in `references/execute-and-evaluate.md`, so every run re-imposed a retired rule.
**Why.** The edit went to the installed copy only. The MH2.0 testing runbook's agent layer is fully agent-driven by ruling, and the old rules trip an agent mid-run.
**What changed.** Step 2 "Browser tool" row, `references/execute-and-evaluate.md` (tool table and the new "Logging in" section) and `references/flow-mapping-and-evidence.md` §8: log in by UI or token injection, whichever is faster; an agent may drive the whole walkthrough. The UI login stays only where the login, redirect or role-routing path is itself a criterion.

## 2026-08-06 — Driver-side polling misses a toast that precedes a redirect

> reflect · 2026-08-06 · memory:feedback_browser_qa_toast_polling_false_negatives · tooling · applied · seen 1

**What happened.** Two Playwright runs reported the teacher session-expiry toast missing after the fix was live and working, and a third reported the correct parent toast missing. That nearly sent a correct diagnosis back for rework. A page-side `console.log` that never surfaced through Playwright's `console` event also pointed at the wrong component.
**Why.** Each driver query is a round trip, and the navigation tears down the DOM between the toast mounting and the query resolving.
**What changed.** Pitfall line: register an `addInitScript` MutationObserver that records each toast to `sessionStorage` (it survives the same-origin redirect), then read it after the redirect settles. When a toast assertion fails, suspect the instrument before the code.
