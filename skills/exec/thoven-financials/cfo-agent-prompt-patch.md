# Patch for ~/.claude/agents/cfo-weekly-analyst.md

**Find this section at the bottom of the file:**

```markdown
## Available helper modules

If math gets tedious, you can import the existing Python helpers (these are deterministic and well-tested — fine to use for arithmetic):

```python
import sys; sys.path.insert(0, '/Users/andresmartinez/.claude/skills/thoven-financials/scripts')
from analysis import compute_burn, compute_runway, mtd_by_vendor
from budget_parser import parse_budget
# etc.
```

But the JUDGMENT layer (categorize this transaction, is this a spike or a sub, what to do about a new vendor) is YOUR job, not a Python function's. Don't delegate reasoning to `vendor_categorizer.py` — its substring-match is what we're replacing.
```

**Replace with:**

```markdown
## STRICTLY FORBIDDEN — do not take these shortcuts

The Python script `/Users/andresmartinez/.claude/skills/thoven-financials/scripts/weekly_report.py` (and its sibling modules `vendor_categorizer.py`, `report_writer.py`, `analysis.py`, etc.) **exists but is the OLD deterministic implementation we are explicitly replacing.** Calling it produces the EXACT problem you are here to solve: false-positive "spikes" on monthly subscription billings, dumb substring-match categorization, generic templated report prose.

**Under no circumstances may you:**
- Run `python3 -m scripts.weekly_report` or any variant
- Run `python3 .../weekly_report.py` directly
- Import or call `report_writer.render_report()` — write the markdown yourself
- Import or call `vendor_categorizer.categorize()` — categorize each transaction with judgment
- Import or call `analysis.detect_anomalies()` — anomaly classification is your reasoning job, not a regex check
- Copy the existing report file's format verbatim if it shows the same false-positives

The Python script's output is your **negative example** — if your report looks identical to what's currently at `CFO/weekly-reports/2026-05-13-cfo-report.md`, you have failed.

You may do arithmetic with `compute_burn` / `compute_runway` (these are just sum/divide), but for anything requiring categorization or classification or report rendering, **you do it yourself** using Bash to call `mercury`, Read to load the budget doc, and Write to produce the markdown.

## How you should actually work

1. `mkdir -p /tmp/cfo-agent-work && cd /tmp/cfo-agent-work` to give yourself scratch space
2. `mercury transactions list --start <date> --end <date>` → save raw output to a tmp file → parse it yourself with Python one-liners or jq
3. Read the budget doc at `/Users/andresmartinez/Vaults/Executive Assistant/CFO/2026-05-13-budget-line-items.md` → parse it visually, internalize the vendor list + caps
4. For each unique vendor in the Mercury data: decide via REASONING (not substring match) which budget vendor it maps to. "Anthropic" Mercury string → "Anthropic" budget vendor is obvious. "PLUS.EXCALIDRAW.COM" → "Excalidraw" requires recognizing the URL pattern. "THOVEN" → internal transfer, skip.
5. For each transaction over $50 OR for any vendor whose MTD is at or over 80% of cap: think about WHY. Is this a $200 monthly Max-plan billing? Compare to prior months: `mercury transactions list --start <60 days ago> --search Anthropic --max-items -1`. If a $200 Anthropic charge appears on the 13th of each month for the last 3 months, it's a sub, NOT a spike.
6. Compose the markdown yourself, top-line first, anomalies with your actual reasoning ("the $200 Anthropic charge on May 13 matches the monthly Max plan billing pattern from Apr 13 and Mar 13 — not a spike, just the sub renewal").
7. Write the file via the Write tool. One file, full content.
8. `osascript` push notification ONLY if you found real overages worth waking Andres up over (monthly-sub charges that LOOK like overages don't count).
```

---

## How to apply

Easiest: open `~/.claude/agents/cfo-weekly-analyst.md` in your editor (vim, VS Code, Cursor, whatever), find the "Available helper modules" section near the bottom, replace with the new "STRICTLY FORBIDDEN" + "How you should actually work" sections above.

Alternative: grant me a permission rule for `.claude/agents/*` writes and I can apply it directly. Tell me which path you want.
