# Field notes — LinkedIn Assisted Send

Constants, fallback chains, recovery steps, and hard-won gotchas. Load when running the skill.

## Notion CRM constants

- Data source: `170c7a68-da78-46be-bf70-9ba05ed47334` · DB: `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`
- Use `mcp__notion__API-query-data-source` (paginated) — NOT the claude_ai_Notion query tool (silently caps at 100).
- Property IDs (for `filter_properties` + patches): Name `title` · Stage `YXlc` · Outreach Draft `Da%7BT` · LinkedIn (url) `%40w%3Ab` · Email `%40M%3DC` · Notes `gqYc` · Next Action `%3B%3EAy` · Hold Until `K_CC`
- Stage option names: `Ready to Send`, `Outreach Sent`, `On Hold`, `Replied`, `Passed`, `Researched`, `Identified`, `Meeting Booked`, `Committed`. (Priority field is misspelled `Prioirty`.)
- Big `Outreach Draft` queries blow the token cap → output spills to a tool-results file; parse with `scripts/parse_crm_drafts.py`.

## The paste transform

CRM `Outreach Draft` = a full email: `Subject: …` line, blank line, `Hi {First},` … `Best,\nAndres Martinez`, then a `[Sources: linkedin.com/in/… | Contact: …]` footer.
- **InMail:** Subject field = the canonical subject; body = greeting → sign-off. Drop the `Subject:` line and the footer.
- **Connected DM:** no Subject field exists; body only.
- **Email fallback:** keep the whole email (with Subject), send via Gmail draft.

## Browser gotchas

- **`shift+Return` for every line break.** A bare Enter sends the message in LinkedIn's composer. Type each paragraph as one `type` action, separated by `shift+Return` (×2 for a blank line). Never embed `\n`.
- **Window resize mid-batch (1439↔1568 px) shifts all coordinates.** Symptom: the Subject click misses and the typed subject vanishes. Always re-screenshot after staging; if Subject is empty, click it again (at the current layout's coords) and retype before sending.
- **Screenshot freeze = Chrome throttled in background.** `captureScreenshot` times out (30s) when Chrome isn't foreground. `read_page` (a11y tree) still works, but it can't drive the React composer — only real coordinate clicks open/send it. Recovery: ask Andres to bring Chrome to the foreground; if a tab's renderer is stuck, create a fresh tab (`tabs_create_mcp`) and re-navigate. Stop after ~3 failed screenshots and ask, rather than thrashing.
- **Dedup = composer check, never inbox scroll.** Open the profile's Message composer; an existing thread (with prior message + timestamp) means already-sent. The inbox lazy-loads ~10 threads and hid 4 already-sent people on 2026-05-19 — nearly a double-send.
- **Send corroboration:** the sent thread jumps to the top of the right-side messaging panel with a fresh timestamp. That's the proof for flipping Stage.

## Stale-URL fallback chain

The footer `linkedin.com/in/<slug>` is sometimes a stale/partial vanity slug that 404s. When a profile 404s:
1. LinkedIn people-search: `linkedin.com/search/results/people/?keywords=%22Full Name%22` (+ company).
2. If that fails, `mcp__exa__linkedin_search_exa` "Full Name Company".
3. If still unresolved but they have a candidate email → email fallback (Gmail draft).
4. If no profile and no email → `On Hold` with the reason in `Next Action`.
Don't rabbit-hole: ~2 tries then fall back. (Matthew Pittinsky and Shailu Tipparaju both 404'd on 2026-05-21.)

## Connect-only profiles

Some 2nd-degree profiles show only **Connect** (no Message button), and the "•••" menu's "Send profile in a message" is NOT a message to them — it can't carry the outreach. Even Premium can't InMail them. → email fallback if they have an email, else `On Hold` (Andres can send a manual connection request; note is capped ~300 chars so the full draft won't fit). (Alan Louie, 2026-05-21.)

## InMail credit math

- Premium starts ~26 credits; each non-connection InMail = 1; 1st-degree DMs are free.
- For a ~30-prospect batch this WILL run short. Allocation rule: InMail every LinkedIn-only prospect first (no other channel), route email-havers to email when credits get tight. Read the live "Use 1 of N" from each composer and track down to 0.

## Warm-intro rule (the Ben Kornell lesson)

A large fraction of good angels share mutual connections with Andres (recurring connectors: **Vipul, Rob, Jeff**). Cold-InMailing someone you have a warm path to wastes the warm path and a credit. **Surface mutuals before sending** — ideally a single up-front list at run-start so Andres pulls warm-intro candidates, then send the rest. A mutual ≠ a confirmed warm intro (don't set Intro Path=Warm); it's a lead for Andres to judge. See memory `feedback_check_mutuals_before_linkedin_send` and `feedback_intro_path_warm_only_if_confirmed`.

## Source artifacts (this skill was distilled from)

- `Fundraising/linkedin-assisted-send-runbook.md` — the original batch runbook
- `Fundraising/linkedin-send-runs/2026-05-21-run.md` — supervisor log + lessons of the first full run (27 sent / 3 on hold)
- `Fundraising/2026-05-21-linkedin-assisted-send-goal-design.md` — design rationale
