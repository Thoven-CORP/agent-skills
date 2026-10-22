---
name: thoven-financials
description: Manage Thoven burn rate tracker. Use when user wants to add expenses, log funding, check burn rate/runway, update budgets, or review financial status. Triggers "add $X [category]", "received $X from", "show burn rate", "what's my runway", "budget vs actual", "update [category] budget"
---

# Thoven Financials

Conversational interface for managing the Thoven burn rate tracker spreadsheet.

## File Location

`/Users/andresmartinez/Vaults/Executive-Assistant/Thoven_Burn_Rate_Tracker.xlsx`

## Core Operations

### 1. Add Expense

**User says:** "Add $200 Meta Ads spend"

**Process:**
1. Parse amount and category from natural language
2. Run: `python scripts/tracker.py` with add_expense()
3. Respond with confirmation and updated totals

**Response format:**
```
✓ Added $200 to Meta Ads
Meta Ads spend this month: $200 / $500 budget (40%)
Cash balance: $2,900
```

**Categories:**
- Meta Ads, Google Ads, Claude Code, Metabase, Canva, Contractors, Travel, Other SaaS, Teacher Onboarding

### 2. Add Funding

**User says:** "Received $1000 from Keri's dad"

**Process:**
1. Parse amount and source
2. Run add_funding()
3. Respond with new balance and runway

**Response format:**
```
✓ Added funding: $1,000 from Keri's dad
New balance: $3,900 | Runway: 3.3 months
```

### 3. Check Status

**User says:** "What's my runway?" or "Show burn rate"

**Response format:**
```
Cash: $3,900 | Burn: $1,200/mo | Runway: 3.3 months
```

### 4. Budget vs Actual

**User says:** "Show budget vs actual"

**Response format:**
```
Budget vs Actual (MTD)

Meta Ads:      $450 / $500  (90%) ⚠️
Google Ads:    $0 / $375    (0%)
Claude Code:   $200 / $200  (100%) ⚠️
Metabase:      $100 / $100  (100%) ⚠️
Canva:         $67 / $67    (100%) ⚠️
Contractors:   $225 / $225  (100%) ⚠️
Travel:        $0 / $0      (-)
Other SaaS:    $0 / $0      (-)

Total: $1,042 / $1,467 (71%)
```

### 5. Update Budget

**User says:** "Update Meta Ads budget to $600"

**Response:** `✓ Updated Meta Ads budget: $500 → $600`

## Implementation

All operations use `scripts/tracker.py`:

```python
import sys
sys.path.append('/Users/andresmartinez/.claude/skills/thoven-financials/scripts')
from tracker import add_expense, add_funding, get_status, get_budget_status, update_budget

# Examples
result = add_expense("Meta Ads", 200, "Lead gen")
result = add_funding("Keri's dad", 1000)
status = get_status()
budget = get_budget_status()
result = update_budget("Meta Ads", 600)
```

### 6. Import Transactions (CSV, PDF, or Screenshot)

**User says:** "import transactions: /path/to/file.csv" or drops a screenshot

**Process for CSV/PDF:**
```python
import sys
sys.path.append('/Users/andresmartinez/.claude/skills/thoven-financials/scripts')
from import_transactions import parse_file, format_import_preview, log_imported

transactions = parse_file("/path/to/file.csv")
print(format_import_preview(transactions))
# Show preview → wait for user confirmation → then:
result = log_imported(transactions)
```

**Process for screenshots/images:**
1. Read the image using Claude's vision
2. Extract each transaction: date, description, amount
3. Build the transactions list manually and call `log_imported()`

**Response format:**
```
Found 22 expense transactions:

✓ Auto-categorized:
  02-13-2026  Claude Code      $200.00  — Anthropic
  02-06-2026  Teacher Onboarding  $509.83  — Checkr
  ...

❓ Unknown (2 items):
  02-21-2026  ?   $250.00  — Music Teachers National Association
  → Assign to: Buffer (one-time), Contractors, or Other SaaS?

Total: $1,300.27
Log 20 categorized transactions?
```

**Supported formats:**
- Mercury CSV export (auto-detected by headers)
- Rho/Xero CSV export
- PDF bank statements
- Screenshots (Claude reads visually)

### 7. Weekly CFO Report

**User says:** "weekly cfo", "cfo report", "run cfo". The local Monday 7am launchd job (`co.thoven.cfo-weekly`, `scripts/run_cfo_agent.sh`) was retired 2026-10-22, so this report runs only when invoked by hand.

**Process:**
```python
import sys
sys.path.append('/Users/andresmartinez/.claude/skills/thoven-financials/scripts')
from weekly_report import run_weekly_report

# Default: since last report (or 7d ago for first run), write to CFO/weekly-reports/
result = run_weekly_report()
print(f"Report written: {result}")

# Dry-run: print to stdout, don't write
run_weekly_report(dry_run=True)

# Custom window:
from datetime import date
run_weekly_report(since=date(2026, 5, 1))
```

**Or via CLI directly:**
```bash
cd ~/.claude/skills/thoven-financials
python3 -m scripts.weekly_report --dry-run                       # preview to stdout
python3 -m scripts.weekly_report --since 2026-05-06 --dry-run    # custom window preview
python3 -m scripts.weekly_report                                  # write real report
```

**Output:** `CFO/weekly-reports/YYYY-MM-DD-cfo-report.md`
- Top-line: cash, weekly burn, monthly burn (4-week avg), runway with week-over-week delta
- Per-vendor MTD vs cap table (sorted by % of cap, overages float to top)
- Anomalies section (conditional): unknown vendors, spikes (>2x baseline), first-paid-charge on free-tier-watched vendors
- Free-Tier Watch: status of Cloudflare / Neon / Daily.co
- Push notification on any vendor cap overage; silent otherwise

**Data sources:**
- `mercury` CLI (read-only `transactions list --start --end`, `accounts list`)
- `CFO/2026-05-13-budget-line-items.md` (vendor caps + categories, latest by filename — searches both vault root and active worktree)
- `Thoven_Burn_Rate_Tracker.xlsx` (forward-looking ledger — currently unused in v1, cash from Mercury is ground truth)

**Setup (one-time):**
- Mercury CLI: `curl -sSf https://cli.mercury.com/install.sh | sh`
- Auth: `mercury login` (browser OAuth session; it expires, see Troubleshooting below)
- Verify: `mercury accounts list`

**Scheduling:** none is running. The local launchd job was retired 2026-10-22. To automate again, ask Andres first, then use the `/schedule` skill for a cloud routine. A cloud routine cannot reach the local `mercury` CLI session.

## Troubleshooting Mercury CLI

The `mercury` CLI (v0.7.2) authenticates with a browser OAuth session, not an API key. When it fails with an auth, login, credential or unauthorized error, the session has **expired**. Run `mercury login`, finish the browser flow, then check with `mercury accounts list`. Do not rotate a Mercury API key for this: the CLI does not read one. The `MERCURY_API_KEY` secret belongs only to the Cloudflare `notion-cfo-worker`.

## Natural Language Variations

**Import:** "import transactions: [filepath]", "log this statement: [file/screenshot]", "upload transactions"
**Add Expense:** "Add $X [category]", "Log $X [category]", "Spent $X on [category]"
**Add Funding:** "Received $X from [source]", "Got $X from [source]"
**Check Status:** "What's my runway?", "Show burn rate", "Current balance?"
**Budget Review:** "Show budget vs actual", "Budget status"
**Update Budget:** "Update [category] budget to $X", "Set [category] at $X"
**Weekly CFO:** "weekly cfo", "cfo report", "run cfo report", "weekly burn check"

## Error Handling

Invalid category:
```
✗ Unknown category: Office Supplies
Valid: Meta Ads, Google Ads, Claude Code, Metabase, Canva, Contractors, Travel, Other SaaS
```

## Warnings

- Budget >80%: Show ⚠️
- Over budget: "OVER BUDGET ⚠️"
- Runway <2 months: Suggest reviewing expenses or securing funding

## References

- Detailed examples: [references/examples.md](references/examples.md)
