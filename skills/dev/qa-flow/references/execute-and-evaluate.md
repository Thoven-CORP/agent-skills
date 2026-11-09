# Execute & evaluate — drive the app, prove it, verdict

The Execute + Review phases: detect the browser tool, log in, run one check at a time against exact values across both layers, then return an evidence-based verdict backed by static gates.

## Detect the browser tool and optimize

Use the best tool actually available this session — don't assume:

| Tool | Use when | Auth |
|---|---|---|
| **agent-browser** | **Default on ghost, staging and production**, on the mini. Records video plus screenshots as the run happens, and its network and console log is the evidence for the Network row (below). | Token from the API login, injected. |
| **Claude in-app Chrome** (`mcp__claude-in-chrome__*` / `mcp__Claude_Browser__*`: `navigate`, `read_page`, `computer`, `form_input`, `find`) | A local run Andres is watching. DOM-aware, reads the accessibility tree, captures network + console. | UI login or injected token, whichever is faster. |
| **Playwright** (`mcp__plugin_playwright_playwright__*`) | Terminal-only run, or scripted/headless automation. | UI login or injected token, whichever is faster. |
| **Human-driven (CEO walkthrough)** | A human must *see* the experience; ask one question at a time, wait for the answer. | The human logs in. |

Read the current page as the accessibility tree (`read_page`) to verify text and structure — prefer it over screenshots for asserting exact values; use a screenshot for visual ground truth (layout, styling, an animation frame).

## Logging in

Log in through the UI or by token injection, whichever is faster. An agent may drive a walkthrough end to end.

- **Ghost or staging.** Get the token from the API login endpoint and inject it; type no password into a form. Emails the run sends to Keri's own test accounts (`keri@thoven.co`, `kerimanerten@icloud.com`) are expected; leave them out of the findings.
- **The login path is under test.** When the change touches login, redirects, role routing or an onboarding gate, that path is a criterion, and injection skips it. Drive it through the UI on a local or harness account.
- **Multi-persona runs.** Log each account in once, capture its session in-page, and switch between the captures. Recipe: **[flow-mapping-and-evidence.md §8](flow-mapping-and-evidence.md)**.

## One check at a time, exact values, both layers

- **One at a time.** State the check, the login/persona, the exact URL, what to look for AND what should NOT be there, then read the result before moving on. Never batch.
- **Exact expected values.** `$200.00`, not "correct amount." "No Approve/Decline button present," not "looks disabled." `borderBottomWidth === 1px`, not "has a border." A negative assertion (something absent) is as load-bearing as a positive one.
- **Both layers where the change spans them.** For a UI/contract bug, verify the **API** (status code, response shape, field presence, access control — wrong role → 403, no auth → 401) *and* the **UI** (renders in the right place, right styling, right conditional-by-role-and-data, animations, currency/tz formatting, zero feature-related console errors). Skipping the API layer misses contract regressions; skipping the UI misses rendering bugs.
- **Evidence, not vibes.** Prove an action fired by reading the network request (correct endpoint + ids), not just by the UI looking right. With agent-browser, before each flow run `network requests --clear`, `console --clear`, `errors --clear` and `network har start <flow>.har`; after it, read `network requests --status 400-599`, `network requests --method POST` (one per user intent), `console` and `errors`, then `network har stop`. Put the HAR path and the counts in the step's `note`. Any unexplained 4xx, 5xx or console error is a finding. With another tool, install a console-error collector before interacting, and say that first-paint errors before it are backstopped by network + screenshot, not claimed as "0 errors."
- **Dependency checks.** After the UI step, confirm each off-screen effect the diff implies (job, `email_deliveries` row, Stripe object, Mixpanel event, migration) as `framing.md` "Dependency checks" says, and quote the count or id.

## Review — verdict + static gates

1. **Per-criterion verdict.** For each planned criterion: pass/fail with the exact observed value as evidence. For a bug fix, Criterion #1 is the triggering symptom — it must be provably dead. Overall SHIP only if every criterion passes, no error-level console/network signal, and any scope gap (e.g. an untested teacher-side twin) is resolved or explicitly accepted as out-of-scope by the user.
2. **Static gates via `verify`.** Run the **`verify`** skill (Quick: type-check / lint / contract-check) — behavioral QA doesn't cover these, and a green browser run with a red `type-check` isn't done. Flag only feature-file errors (the repo lint baseline is not green).
3. **Log follow-ups.** Out-of-scope findings → `future-improvements` / `TECH_DEBT.md` / the issue tracker. Flag any layer the diff didn't touch but the symptom could live in.
