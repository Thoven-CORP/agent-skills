# Execute & evaluate — drive the app, prove it, verdict

The Execute + Review phases: detect the browser tool, log in through the real UI, run one check at a time against exact values across both layers, then return an evidence-based verdict backed by static gates.

## Detect the browser tool and optimize

Use the best tool actually available this session — don't assume:

| Tool | Use when | Auth |
|---|---|---|
| **Claude in-app Chrome** (`mcp__claude-in-chrome__*` / `mcp__Claude_Browser__*`: `navigate`, `read_page`, `computer`, `form_input`, `find`) | **Primary.** DOM-aware, reads the accessibility tree, drives clicks/typing, captures network + console. | Real email + password through the login UI. |
| **Playwright** (`mcp__plugin_playwright_playwright__*`) | Terminal-only run, or scripted/headless automation. | Real UI login for QA; token injection allowed only in pure automation specs, never in a QA walkthrough. |
| **Human-driven (CEO walkthrough)** | A human must *see* the experience; ask one question at a time, wait for the answer. | Human types real email + password. Never auto-driven. |

Read the current page as the accessibility tree (`read_page`) to verify text and structure — prefer it over screenshots for asserting exact values; use a screenshot for visual ground truth (layout, styling, an animation frame).

## Full-UI login, never token injection

QA and walkthroughs use the **real email + password login flow**. Never inject `localStorage.token` / `localStorage.student_token` to skip auth. The whole point is to exercise what the user sees end-to-end — injection bypasses the login-flow bugs, redirect/role-routing regressions, cold-start races, and onboarding gates that this QA exists to catch. If a run bounces to login, **pause and log in through the UI** (or ask the user to) — don't inject.

A correct setup step: *"Open `localhost:3000` → click Login → enter `qa+...@qatest.thoven.test` / `QAtestPass123!` → land on dashboard."* If your L0 is "paste this into DevTools Console" or contains an `eyJhbGciOi...` JWT literal, the plan is wrong — rewrite it.

Token injection is fine **only** in automation layers with no UI (Playwright specs, Vitest, curl smoke). Those are robots verifying contracts; QA is a human simulating a real user.

**One refinement for multi-persona runs.** The rule above governs *first authentication of each account* — that is what exercises the login flow. It does not govern *switching between accounts a human has already logged in through the real UI*. In a four-persona run, capture each session in-page after its real login and switch between the captures; the login flow is still exercised once per account, and no password enters the agent's context. Recipe: **[flow-mapping-and-evidence.md §8](flow-mapping-and-evidence.md)**. What stays forbidden is what this section is about: injecting a token to *reach a surface without logging in at all*.

## One check at a time, exact values, both layers

- **One at a time.** State the check, the login/persona, the exact URL, what to look for AND what should NOT be there, then read the result before moving on. Never batch.
- **Exact expected values.** `$200.00`, not "correct amount." "No Approve/Decline button present," not "looks disabled." `borderBottomWidth === 1px`, not "has a border." A negative assertion (something absent) is as load-bearing as a positive one.
- **Both layers where the change spans them.** For a UI/contract bug, verify the **API** (status code, response shape, field presence, access control — wrong role → 403, no auth → 401) *and* the **UI** (renders in the right place, right styling, right conditional-by-role-and-data, animations, currency/tz formatting, zero feature-related console errors). Skipping the API layer misses contract regressions; skipping the UI misses rendering bugs.
- **Evidence, not vibes.** Prove an action fired by reading the network request (correct endpoint + ids), not just by the UI looking right. Install a console-error collector before interacting if the tool has no console reader; be honest that first-paint errors before the collector are backstopped by network + screenshot, not claimed as "0 errors."

## Review — verdict + static gates

1. **Per-criterion verdict.** For each planned criterion: pass/fail with the exact observed value as evidence. For a bug fix, Criterion #1 is the triggering symptom — it must be provably dead. Overall SHIP only if every criterion passes, no error-level console/network signal, and any scope gap (e.g. an untested teacher-side twin) is resolved or explicitly accepted as out-of-scope by the user.
2. **Static gates via `verify`.** Run the **`verify`** skill (Quick: type-check / lint / contract-check) — behavioral QA doesn't cover these, and a green browser run with a red `type-check` isn't done. Flag only feature-file errors (the repo lint baseline is not green).
3. **Log follow-ups.** Out-of-scope findings → `future-improvements` / `TECH_DEBT.md` / the issue tracker. Flag any layer the diff didn't touch but the symptom could live in.
