"""CFO weekly agent orchestrator. Pulls Mercury data, diffs vs budget, writes report."""

import argparse
import subprocess
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

# Local imports — make scripts/ importable when run as `python -m scripts.weekly_report`
sys.path.insert(0, str(Path(__file__).parent))
from mercury_client import get_transactions, get_cash_balance, MercuryAuthError, MercuryCLIError
from budget_parser import parse_budget, BudgetDocError
from vendor_categorizer import categorize
from tracker_reader import read_tracker
from analysis import compute_burn, mtd_by_vendor, detect_overages, detect_anomalies, compute_runway
from report_writer import render_report


VAULT_ROOT = Path("/Users/andresmartinez/Vaults/Executive-Assistant")
WEEKLY_REPORTS_DIR = VAULT_ROOT / "CFO" / "weekly-reports"
CFO_DIR = VAULT_ROOT / "CFO"


def find_latest_budget_doc() -> Path:
    """Return the most recent CFO/*-budget-line-items.md by date in filename.

    Checks both the main vault and the cfo-budget worktree (since the budget
    doc may live in the worktree until merged to main).
    """
    candidates = list(CFO_DIR.glob("*-budget-line-items.md"))
    # Also check the worktree
    worktree_cfo = VAULT_ROOT / ".claude" / "worktrees" / "cfo-budget" / "CFO"
    if worktree_cfo.exists():
        candidates += list(worktree_cfo.glob("*-budget-line-items.md"))
    if not candidates:
        raise BudgetDocError(f"No budget doc found in {CFO_DIR} or worktree")
    return sorted(candidates)[-1]


def find_last_report_date() -> date | None:
    """Return the date of the most recent successful report, or None if first run."""
    if not WEEKLY_REPORTS_DIR.exists():
        return None
    reports = sorted(WEEKLY_REPORTS_DIR.glob("[0-9]*-cfo-report.md"))
    if not reports:
        return None
    # Filename: YYYY-MM-DD-cfo-report.md
    return date.fromisoformat(reports[-1].name[:10])


def compute_baseline(transactions: list[dict], vendor_map: dict) -> dict[str, float]:
    """Per-vendor typical daily charge over the supplied window (for anomaly spike detection)."""
    totals = defaultdict(lambda: [0.0, 0])  # [sum, count]
    for t in transactions:
        v = categorize(t["description"], vendor_map)
        if v:
            totals[v][0] += t["amount"]
            totals[v][1] += 1
    return {v: data[0] / data[1] for v, data in totals.items() if data[1] > 0}


def _vendor_dedup_key(name: str) -> str:
    """Normalize a vendor display name so near-duplicate headings collapse.

    Catches the case dict-keying misses: two budget-doc `#### <vendor>` headings
    that look identical but differ by case or invisible whitespace (e.g. a stray
    non-breaking space introduced by copy-paste). casefold + collapse all
    whitespace runs to a single space.
    """
    import re
    return re.sub(r"\s+", " ", name).strip().casefold()


def build_vendor_table(mtd: dict[str, float], vendor_map: dict) -> list[dict]:
    """Per-vendor rows for the report table.

    Guards against duplicate vendor headings in the budget doc: if two headings
    normalize to the same display name, only the first is kept and a one-line
    warning is emitted to stderr (so it surfaces in the terminal without
    corrupting the ASCII dashboard on stdout).
    """
    rows = []
    seen = {}  # normalized name -> vendor key already emitted
    for vendor, info in vendor_map.items():
        norm = _vendor_dedup_key(vendor)
        if norm in seen:
            print(
                f"⚠ duplicate vendor heading in budget doc: {vendor!r} "
                f"(already counted as {seen[norm]!r}) — keeping the first, "
                f"skipping this row. Fix the budget doc so each vendor appears once.",
                file=sys.stderr,
            )
            continue
        seen[norm] = vendor
        spend = mtd.get(vendor, 0.0)
        cap = info["cap"]
        pct = (spend / cap * 100) if cap > 0 else 0
        rows.append({
            "vendor": vendor,
            "type": info["type"],
            "mtd": spend,
            "cap": cap,
            "pct": pct,
            "category": info["category"],
        })
    return rows


def build_free_tier_watch(transactions: list[dict], vendor_map: dict) -> list[dict]:
    """Status of free-tier-watched vendors this week."""
    out = []
    watched = {v: info for v, info in vendor_map.items() if info.get("is_free_tier_watch")}
    for vendor, info in watched.items():
        spend = sum(t["amount"] for t in transactions if categorize(t["description"], vendor_map) == vendor)
        status = "still free" if spend == 0 else "PAID — investigate"
        out.append({"vendor": vendor, "status": status, "mtd": spend})
    return out


def _compute_runway_delta(current_runway: float) -> float | None:
    """Diff current runway vs the prior week's reported runway (parsed from prior report file)."""
    if not WEEKLY_REPORTS_DIR.exists():
        return None
    reports = sorted(WEEKLY_REPORTS_DIR.glob("[0-9]*-cfo-report.md"))
    if not reports:
        return None
    import re
    text = reports[-1].read_text()
    m = re.search(r"Runway:\*\*\s+([\d.]+)\s+months", text)
    if not m:
        return None
    prior = float(m.group(1))
    return round(current_runway - prior, 1)


def _maybe_push(message: str) -> None:
    """Best-effort macOS push notification via osascript. Silent on failure."""
    try:
        subprocess.run(
            ["osascript", "-e", f'display notification "{message}" with title "CFO Agent"'],
            timeout=5,
            check=False,
        )
    except Exception:
        pass  # report still exists; push is best-effort


def _write_failure_report(d: date, reason: str, dry_run: bool):
    body = f"""---
date: {d.isoformat()}
category: Finance
status: Failed Report
---

# CFO Weekly — FAILED ({d.isoformat()})

**Reason:** {reason}

**Next step:** Resolve the error above and re-run `python -m scripts.weekly_report` or `/thoven-financials weekly`.
"""
    if dry_run:
        print(body)
        return body
    WEEKLY_REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = WEEKLY_REPORTS_DIR / f"failed-{d.isoformat()}-cfo-report.md"
    out_path.write_text(body)
    _maybe_push(f"CFO agent failed: {reason[:60]}")
    return out_path


def run_weekly_report(since: date | None = None, dry_run: bool = False):
    """
    Main entry point. Returns the path to the written report (or report string on dry-run).
    """
    today = date.today()
    if since is None:
        last = find_last_report_date()
        since = last if last else today - timedelta(days=7)
    until = today

    # Pull data
    try:
        transactions = get_transactions(since, until)
        cash = get_cash_balance()
    except (MercuryAuthError, MercuryCLIError) as e:
        return _write_failure_report(today, f"Mercury CLI error: {e}", dry_run)

    try:
        budget_doc = find_latest_budget_doc()
        vendor_map = parse_budget(budget_doc)
    except BudgetDocError as e:
        return _write_failure_report(today, f"Budget doc error: {e}", dry_run)

    tracker = read_tracker()

    # Baseline = transactions from the prior 4 weeks (excluding this week)
    baseline_since = since - timedelta(days=28)
    baseline_until = since - timedelta(days=1)
    try:
        baseline_txns = get_transactions(baseline_since, baseline_until)
    except (MercuryAuthError, MercuryCLIError):
        baseline_txns = []
    baseline = compute_baseline(baseline_txns, vendor_map)

    # Analyze
    week_burn = compute_burn(transactions)
    monthly_burn = compute_burn(baseline_txns) / 4 if baseline_txns else week_burn * 4
    mtd = mtd_by_vendor(transactions, vendor_map)
    overages = detect_overages(mtd, vendor_map)
    # Pass baseline_txns so detect_anomalies can recognize monthly sub renewals
    # (e.g., a $200 Anthropic charge today matches a $200 Anthropic charge ~30 days ago
    # — that's a Max plan billing renewal, not a spike).
    anomalies = detect_anomalies(transactions, vendor_map, baseline, recent_60d=baseline_txns)
    runway = compute_runway(cash, monthly_burn)

    # Guard against infinity before passing to render_report
    if runway == float("inf"):
        runway = 999.0

    runway_delta = _compute_runway_delta(runway)

    analysis_dict = {
        "week_burn": week_burn,
        "cash_on_hand": cash,
        "monthly_burn": monthly_burn,
        "runway_months": runway,
        "runway_delta": runway_delta,
        "overages": overages,
        "anomalies": anomalies,
        "vendor_table": build_vendor_table(mtd, vendor_map),
        "free_tier_watch": build_free_tier_watch(transactions, vendor_map),
    }

    report_md = render_report(analysis_dict, window=(since, until))

    if dry_run:
        print(report_md)
        return report_md

    WEEKLY_REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = WEEKLY_REPORTS_DIR / f"{until.isoformat()}-cfo-report.md"
    out_path.write_text(report_md)

    if overages:
        _maybe_push(f"CFO: {len(overages)} vendor overage(s) — see {out_path.name}")

    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CFO weekly agent")
    parser.add_argument("--since", type=date.fromisoformat, default=None, help="Start date YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true", help="Print report instead of writing to vault")
    args = parser.parse_args()
    result = run_weekly_report(since=args.since, dry_run=args.dry_run)
    if not args.dry_run:
        print(f"Report written to: {result}")
