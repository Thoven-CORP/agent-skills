# Learnings — qa-flow

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

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
