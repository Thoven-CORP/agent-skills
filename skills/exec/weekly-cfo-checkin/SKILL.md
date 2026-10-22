---
name: weekly-cfo-checkin
description: Run Thoven's weekly CFO check-in. Use when user says "weekly CFO", "CFO check-in", "CFO meeting", "how are we doing on budget", or "let's do our weekly finances". Renders a live ASCII KPI dashboard from Mercury (cash, weekly burn, runway, budget vs cap, anomalies) and reconciles it against the latest report in CFO/weekly-reports/. Live data only — never the spreadsheet.
---

# Weekly CFO Check-in

A front-facing financial report for Thoven. One invoke → one ASCII dashboard,
rendered live from Mercury. Report-only: read it in 30 seconds, act on the flags.

**This skill pulls LIVE data and never reads the burn-rate spreadsheet.** The
spreadsheet's cash cell is manually maintained and rots; Mercury is ground truth.
(That bug — a stale `-$3,020` cash reading in a clean box — is exactly what this
redesign killed. See `CFO/specs/2026-05-22-cfo-checkin-ascii-redesign-design.md`.)

## Step 1 — Render the dashboard

Run the check-in. It lives in the `thoven-financials` skill so the weekly report and
this live check-in share one engine (one definition of cash, burn, caps):

```bash
cd /Users/andresmartinez/.claude/skills/thoven-financials && python3 -m scripts.ascii_checkin
```

**Present the output verbatim inside a fenced code block** so the monospace
alignment holds in chat. Do not reformat it into a markdown table — the ASCII box
*is* the deliverable.

If it prints an error box (`⚠ Numbers are NOT shown`), the live pull failed.
Surface the error, do NOT fall back to any other number. An auth failure on the
`mercury` CLI (v0.7.2) means its browser OAuth session expired, not that an API key
was rotated: tell Andres to run `mercury login`, then re-run the check-in. The CLI
does not use an API key, so do not suggest rotating one.

## Step 2 — One-line read + flags

After the box, add a short human read (2-4 lines max). Lead with whatever the
data makes loudest:
- **Cash / runway** is the headline whenever runway is low — say it plainly.
- **OVER-cap vendors** float to the top of the budget section — call out the worst.
- **Agent reconciliation** — if it shows "New overages" or "⚠ stale", the last
  weekly report is behind. The 7am launchd agent was retired 2026-10-22, so stale
  is expected; offer to run the `thoven-financials` weekly report by hand.

## Step 3 — End with a one-line verdict

- ✅ **On track** — paced, no concerns
- ⚠️ **Watch [vendor/area]** — one thing to monitor
- 🚨 **Action needed** — something must be decided now (e.g. cash crunch)

## If Andres wants to act on a flag

- **Cancel / change a budget cap** → edit the budget doc
  (`CFO/<latest>-budget-line-items.md`), the single source for vendor caps.
- **Log a one-off expense or funding** → use the `thoven-financials` skill.
- **Deeper weekly write-up** → weekly reports live in `CFO/weekly-reports/`
  (the 7am agent that wrote them was retired 2026-10-22; run `thoven-financials`
  "weekly cfo" by hand). This check-in reconciles against the latest.

## Notes

- **Accounts:** Mercury Checking + Savings (this report). Rho card spending is
  not yet in the Mercury feed — ask Andres if a Rho number is needed.
- **Two windows by design:** budget-vs-cap is true month-to-date vs monthly cap;
  "this week" is the last 7 days. The weekly report uses a since-last-report window,
  so the check-in can legitimately surface overages the report's narrower window
  missed — that's the reconciliation working, not a bug.
