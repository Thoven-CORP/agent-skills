---
name: preflight
description: Pre-publish verification suite — compile a deterministic Playwright spine + judgment manifest from a feature's spec + diff, run it against local dev, and emit a SHIP/HOLD report proving the bug is dead and the spec's intent is satisfied. Use before /publish for any feature ship ("preflight", "pre-publish check", "prove the fix before shipping").
---

# /preflight — Pre-Publish Verification Suite

Proves two things in a real browser BEFORE Publish: **the triggering bug is dead** and **the spec's intent is satisfied** — plus design judgment on the rendered UI, a responsive sweep, and a cross-role regression ring. Design doc: `docs/superpowers/specs/2026-07-16-preflight-suite-design.md`.

**Position in the pipeline:** pre-publish gate for feature ships. `/qa` stays the multi-bug fix-loop tool; `manual-qa` Release mode stays the post-publish prod-config smoke. Preflight is neither — it is the "this feature is provably done" gate.

## Invocation

`/preflight <feature-slug>` — two phases, both default-on:

1. **compile** — author or update `tests/preflight/<slug>/{spine.mjs,manifest.json}` from the feature's spec + diff.
2. **run** — execute the spine, then the judgment pass, then emit the verdict report.

Before anything else, verify both dev servers respond (FE :3000, BE :3001). If either is down, stop and say so — never point at prod instead.

## Phase 1 — compile

Inputs (auto-detect, confirm if ambiguous):
- **Spec:** the feature's decision/spec doc under `docs/plans/` or `docs/superpowers/specs/` — the source of acceptance criteria.
- **Diff:** `git diff origin/main...HEAD` (or last release tag when on main) — the blast radius for the regression ring.

Suite-wide files (already exist — never duplicate their contents per feature):
- **`tests/preflight/lib/harness.mjs`** — generic infrastructure: config/manifest loading, browser lifecycle, collectors, `checkpoint()`, role logins, verdict + exit codes, and verdict-time contract enforcement (every `spine-assert` criterion must have a recorded check, else harness error). A spine calls `runSpine(import.meta.url, flow)` and writes only its criterion flow.
- **`tests/preflight/config.json`** — suite constants: servers, viewports, network allowlist, role logins (real API logins only — never runner-minted JWTs).
- **`tests/preflight/RUBRIC.md`** — the design-judgment rubric addendum.

Author into `tests/preflight/<feature-slug>/`:
- **`manifest.json`** — the feature contract. Each spec criterion carries `id`, a plain-language statement, and a verification method ∈ `spine-assert` | `screenshot-judge` | `live-judge`. **Criterion #1 is always the triggering bug phrased as the customer's symptom.** Also: fixture identifiers + `seed` (pointing at `seed.rb`), `ring` routes from the diff's blast radius (each with `mustKeepUrl` + `mustSeeText`), and `liveJudge` steps.
- **`seed.rb`** — the idempotent fixture program (rails-runner, `find_or_create_by!`); write it so the seed IS the restore.
- **Checkpoint coverage is STATE coverage, not page coverage** (pilot lesson, 2026-07-16): spec-relevant elements often render only in specific states — completed views, redo/feedback views, error and empty states. Enumerate the UI states the diff touches and seed a fixture per state; a gallery of default states judges almost nothing.
- **`spine.mjs`** — the feature's criterion flow via `runSpine(import.meta.url, flow)`. The harness already provides logins, collectors, checkpoints, verdict, and exit codes (0 green / 1 red / 2 harness error; artifacts to gitignored `.preflight-runs/<timestamp>/`). Flow requirements:
  - Screenshot checkpoints × all config viewports — the responsive sweep is the same spine at each viewport, not separate authoring. Resizing mid-state can create layout artifacts (fixed overlays position on open) — before reporting a responsive Critical/Major, VERIFY it by opening that surface fresh at the failing viewport; exclude artifacts explicitly in the report.
  - Cross-role ring from the manifest: no auth bounce (`mustKeepUrl`) AND key element rendered (`mustSeeText`).
  - Prefer non-mutating checks (open the panel, don't submit) so consecutive runs need no restore.
  - A sanity check on the unaffected channel/state first — it distinguishes "bug fixed" from "testing the wrong thing".

The spine + manifest + seed are **checked in** — every shipped feature accretes into the regression library.

## Phase 2 — run

1. Seed fixtures via the manifest recipe (idempotent).
2. Run the spine: `node tests/preflight/<slug>/spine.mjs`. One auto-retry for a flaky step, then red honestly.
3. **Judgment pass** over manifest + `spine-results.json` + the screenshot gallery:
   - **Spec-intent verdict** per criterion: CONFIRMED / NOT MET / NEEDS HUMAN, each with pointed evidence (a named screenshot or spine assert id).
   - **Design judgment** on every screenshot against the full rubric: `DESIGN.md` + `.claude/skills/thoven-designer/SKILL.md` + `tests/preflight/RUBRIC.md` (the suite addendum carrying the impeccable anti-pattern rules the docs don't spell out — a judge can only flag what its rubric names, pilot lesson 2026-07-16). Judge the RENDERED page. Dispatch a fresh-context subagent with the rubric and the gallery — do NOT feed it prior findings or target elements, or the pass can't rediscover anything independently.
   - **Live-judge steps** (manifest-flagged only): drive with Claude-in-Chrome when attended; mark NEEDS HUMAN when unattended.
4. Emit `.preflight-runs/<timestamp>/report.md`:
   - **SHIP / HOLD** verdict at the top.
   - Bug-dead proof (criterion #1 evidence).
   - Criteria table (1:1 with the spec's decisions), design findings by severity, tech signals, responsive results.
   - **HOLD triggers:** any criterion NOT MET · any error-level console/network signal on a core flow · any Critical design finding.
5. Print the verdict line, criteria table, and findings in chat.

## Known limits

- Local-only: prod-config drift (env vars, CDN, Vercel and Render for 2.0, Replit for 1.0) stays uncovered. That is `manual-qa` Release mode's job post-publish.
- Judgment cost scales with the gallery (~15–25 screenshots/feature); keep checkpoints purposeful.
- Design verdicts are model judgment anchored on the anti-pattern list; pilot ground truth: the pass rediscovered known findings unprompted (2026-07-16).
