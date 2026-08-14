"""Live CFO check-in — front-facing KPI dashboard for chat.

Entry point for the /weekly-cfo-checkin skill. Pulls live Mercury data, computes
the same primitives the 7am agent uses (analysis.py / budget_parser /
vendor_categorizer), reconciles against the agent's last report, and renders the
ASCII dashboard via ascii_renderer.

Two windows on purpose:
  - month-to-date  -> budget vs cap (honest: monthly spend vs monthly cap)
  - last 7 days    -> the "this week" line items + weekly burn

Run:  python3 -m scripts.ascii_checkin   (from the skill root)
"""

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import ascii_renderer
from mercury_client import (
    get_transactions,
    get_account_balances,
    MercuryAuthError,
    MercuryCLIError,
)
from budget_parser import parse_budget, BudgetDocError
from analysis import (
    compute_burn,
    mtd_by_vendor,
    detect_overages,
    detect_anomalies,
    compute_runway,
)
from reconcile import reconcile
# Reuse the agent's helpers so there is one definition of these, not two.
from weekly_report import (
    find_latest_budget_doc,
    compute_baseline,
    build_vendor_table,
    WEEKLY_REPORTS_DIR,
)


def build_checkin_analysis(today: date | None = None) -> dict:
    """Pull live data and assemble the analysis dict. Raises on Mercury/budget errors."""
    today = today or date.today()
    month_start = today.replace(day=1)
    week_start = today - timedelta(days=7)
    pull_start = min(month_start, week_start)

    all_txns = get_transactions(pull_start, today)
    accounts = get_account_balances()
    checking = sum(a["available"] for a in accounts if a["kind"] == "checking")
    savings = sum(a["available"] for a in accounts if a["kind"] == "savings")
    cash = sum(a["available"] for a in accounts)

    budget_doc = find_latest_budget_doc()
    vendor_map = parse_budget(budget_doc)

    mtd_txns = [t for t in all_txns if t["date"] >= month_start.isoformat()]
    week_txns = [t for t in all_txns if t["date"] >= week_start.isoformat()]
    week_txns.sort(key=lambda t: t["date"], reverse=True)

    # Baseline = the 4 weeks before this week, for run-rate burn + spike detection.
    base_since = week_start - timedelta(days=28)
    base_until = week_start - timedelta(days=1)
    try:
        baseline_txns = get_transactions(base_since, base_until)
    except (MercuryAuthError, MercuryCLIError):
        baseline_txns = []
    baseline = compute_baseline(baseline_txns, vendor_map)

    week_burn = compute_burn(week_txns)
    monthly_burn = compute_burn(baseline_txns) if baseline_txns else week_burn * 4
    mtd = mtd_by_vendor(mtd_txns, vendor_map)
    overages = detect_overages(mtd, vendor_map)
    anomalies = detect_anomalies(week_txns, vendor_map, baseline, recent_60d=baseline_txns)
    runway = compute_runway(cash, monthly_burn)
    if runway == float("inf"):
        runway = 999.0

    return {
        "cash_on_hand": cash,
        "checking": checking,
        "savings": savings,
        "week_burn": week_burn,
        "monthly_burn": monthly_burn,
        "runway_months": runway,
        "week_window": (week_start, today),
        "week_txns": week_txns,
        "vendor_table": build_vendor_table(mtd, vendor_map),
        "overages": overages,
        "anomalies": anomalies,
        "budget_doc_name": budget_doc.name,
    }


def main() -> int:
    try:
        analysis = build_checkin_analysis()
    except MercuryAuthError as e:
        print(ascii_renderer.render_error("Mercury auth failed", f"Run `mercury login`: {e}"))
        return 1
    except MercuryCLIError as e:
        print(ascii_renderer.render_error("Mercury CLI error", str(e)))
        return 1
    except BudgetDocError as e:
        print(ascii_renderer.render_error("Budget doc missing", str(e)))
        return 1

    recon = reconcile(analysis, WEEKLY_REPORTS_DIR)
    print(ascii_renderer.render(analysis, recon))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
