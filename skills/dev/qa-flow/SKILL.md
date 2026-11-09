---
name: qa-flow
description: Use after a feature or bug fix, or to reproduce a production report, when product-level evidence is needed. Drive the realistic user path, verify exact criteria, and leave a durable evidence record. Triggers on "verify a bug fix", "reproduce a production bug", "thorough QA", "edge-case testing", "prod snapshot reproduction", or "QA this before publish".
---

# /qa-flow — Product verification loop

**Invocation intent:** *"I finished a feature or bug fix — run the most real, thorough QA, reproducing from production settings."*

This is ONE workflow you reason through, not a menu of modes. You clarify what you're testing, pick a data + scope + tooling strategy (opinionated defaults below), then execute in four tracked phases and return an evidence-based verdict. The goal is QA against **realistic state** — a prod snapshot when the bug came from real users, driven through the **real UI** with **exact expected values** — so the fix is proven dead where it actually lived.

`qa-flow` is Thoven's product-testing counterpart to Pstack's verification skill. It defines the customer-visible criteria and evidence loop; a project verification skill or control CLI drives the app. Reuse the smallest reliable control surface already present (`/control-app`, a QA harness, or the native browser tool). Do not create a throwaway driver when a maintained control surface can perform the check.

## Pitfalls

- Assert a toast that precedes a redirect with an `addInitScript` MutationObserver that records each toast to `sessionStorage`, and read it after the redirect settles; driver-side polling races the navigation. (LEARNINGS 2026-08-06)
- Run `diagnosing-bugs` on a QA bug list, a red test and a confirmed cause with file:line per bug, before proposing or applying any fix. (LEARNINGS 2026-10-11)

## Step 1 — Ground, then clarify only what changes the run

First read the current change, issue/report, and relevant flow. Restate the customer-visible problem and the proposed verification target in plain language. Then ask only the questions whose answer changes data, scope, risk, or the criterion; use the platform's native question tool when it has one. Do not ask for facts the code or issue already resolves. Cover when still unknown:

- **What did you build or fix?** One feature, or multiple parts?
- **Bug fix or net-new feature?** (drives data strategy — see below)
- **Where did it come from?** A real teacher/parent report → prod data reproduces the exact state and is available. A greenfield feature → there may be no prod signal.
- **What matters most to verify?** The one symptom that must be dead, or the happy paths that must all work.

Full question set + how to phrase them: **[references/framing.md](references/framing.md)**.

## Step 2 — Reason about the approach (skill-guided, you decide, then confirm)

Four decisions. Lead with the default, state your pick, confirm with the user.

| Decision | Default heuristic |
|---|---|
| **Data** | **Bug fix → prod snapshot** (real rows reproduce the exact broken state, and sidestep fighting backend validations to fabricate an edge state — e.g. a `pending` reschedule past its `expires_at`, which a check constraint won't let you hand-craft). **Net-new feature with no prod signal → seed.** |
| **Scope** | Decide which layers the change actually *touches* — don't mechanically follow the diff. A pure data/logic bug can be **BE-only** (rails/specs against the snapshot). A UI or contract bug is **BE+FE** (full harness). A diff can be one-sided in code yet span both sides in the product — a parent-side fix may have a teacher-side twin the diff never names. Make the human scope call and flag gaps. |
| **What to test** | **Bug fix →** reproduce the bug condition, confirm it's dead, then edge cases (boundary / expiry / race / id-mismatch / fetch-failure). **Multi-part →** happy paths across each part. Derive exact criteria from the diff + evidence (see Phase 2). |
| **Browser tool** | **Detect what's available and optimize.** Primary target = the Claude in-app Chrome (`mcp__claude-in-chrome__*` / `mcp__Claude_Browser__*`: navigate, read_page, computer, form_input, find). Terminal-only run → Playwright may fit. On ghost or staging, drive with `agent-browser`; for video or screenshot capture, read [the capture contract](references/flow-mapping-and-evidence.md#7-capture-screenshots-and-recorded-flows) before starting. Log in through the UI or by token injection, whichever is faster, and let an agent drive the whole walkthrough. |

Detail + the reschedule worked example: **[references/execute-and-evaluate.md](references/execute-and-evaluate.md)**.

## Step 3 — Execute in five phases (track with TaskCreate)

Any run of this size is 3+ steps — track it.

0. **Map** — before the first assertion, reuse or update a compact Feature Map for the tested flow: user entry point, route, persona, hard gates, visible controls, recovery path, and the control commands that reach it. Read selectors from a worktree at the **deployed SHA**, find gates that dictate test order, and note surfaces with two implementations. Keep reusable facts in the product verification skill's Feature Map; keep run-specific evidence beside this run. Separate this from proving the release is deployed — both matter. See **[references/flow-mapping-and-evidence.md](references/flow-mapping-and-evidence.md)**.
1. **Setup** — get realistic data (prod snapshot → neutralize outbound contact → isolated `thoven_qa` harness → creds), or seed for a greenfield feature. Recipe + gotchas: **[references/prod-snapshot.md](references/prod-snapshot.md)**. For a multi-persona run, capture each session once after its login: **[flow-mapping-and-evidence.md §8](references/flow-mapping-and-evidence.md)**.
2. **Plan** — derive exact pass/fail criteria from the diff/spec, pull evidence (mem0, `investigate-thoven` common-errors, the issue tracker, Gmail customer reports), generate edge cases, pick which personas exercise them. See **[references/framing.md](references/framing.md)**.
3. **Execute** — drive the app through the available browser tool, **one check at a time, exact expected values** (`$200.00` not "correct amount"; "no Approve/Decline button present" not "looks disabled"), verifying both layers where the change spans them. See **[references/execute-and-evaluate.md](references/execute-and-evaluate.md)**. **Append one record per step to `steps.jsonl` as you observe it** — not in batches, not at the end.
4. **Review** — evidence-based verdict (per-criterion pass/fail, or SHIP/HOLD), run the static gates via the **`verify`** skill (type-check / lint / contract-check), log follow-ups, flag any scope gap you found. Generate the HTML map with `node references/build-map.cjs`. When presenting the result to Andres, use `visual-artifacts` to compose the user journey and link this technical map; the two have different reading jobs.

If the control surface or Feature Map required an avoidable recovery, leave one concrete maintenance follow-up. A verification loop stays useful only when its controls and map match the live product.

**The verdict table has a REQUIRED Design row and a REQUIRED Performance row.** Not optional sections, not a separate pass — you are already on the page. Design: first the Paper frame at the width under test, desktop and phone, with MATCH or NO per region from looking at both and each difference listed (`andres-mode`, Parity); then design-system primitives vs hand-rolled controls, empty states that contradict loaded content, pluralisation, the same value formatted two ways. Performance: duplicate requests, poll cadence, cold refetches, fetches the parent already had — measured with the Resource Timing API. An empty row means you did not look. What to check: **[flow-mapping-and-evidence.md §4–5](references/flow-mapping-and-evidence.md)**.

Verdicts are `pass` / `fail` / `design` / `partial` / `blocked` / `info`. `design` keeps the fail count meaning "broken"; `partial` is what stops an environment limitation being filed as a defect.

## Two hard safety gates (part of the workflow, not optional)

1. **The live prod-PII read is human-triggered.** You build and validate the extractor, do the graph-scoping, the neutralization, the load, the harness, the creds — all autonomously. The one step you do **not** run yourself is the actual `pg_dump` from production; a human authorizes and runs that read. (Full rationale + the localhost guard in `prod-snapshot.md`.)
2. **Ambiguous data picks STOP and ask.** Real accounts collide on name — the seed data has four parents sharing one display name, and one name held by both a teacher and a parent. Never guess which real person; surface the candidates and ask.

And on every load: **neutralize all outbound contact** (emails → `qa+<hash>@qatest.thoven.test` aliases, phones → `+15555550100`, tokens nulled) so an automated run physically cannot email or SMS a real user; load through the **localhost-only guard**; **destroy the full-PII scratch DB** once the scoped neutralized seed is extracted.
