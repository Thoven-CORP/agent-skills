"""Reconcile live Mercury state against the 7am agent's last report.

Trust-but-verify: the agent runs Monday 7am and writes a markdown report.
When Andres runs the live check-in, we want to know:
  - did the agent actually run recently? (silent-failure catch)
  - what has hit the account since the agent last looked? (its blind spot)
  - does live cash match what the agent recorded? (drift)
  - does live agree with the agent on which vendors are over cap?

We parse the agent's own markdown (the format emitted by report_writer.py).
Parsing is defensive: any field we can't read becomes None rather than crashing
the check-in. Reconciliation degrading gracefully beats no check-in at all.
"""

import re
from datetime import date
from pathlib import Path

STALE_DAYS = 7  # agent runs weekly; older than this is stale

_CASH_RE = re.compile(r"Cash on hand:\*\*\s*\$([\d,]+\.?\d*)")
_OVERAGE_RE = re.compile(r"OVERAGE\s+—\s+([^:]+):")


def find_last_report(reports_dir: Path) -> Path | None:
    """Most recent successful report (failed-* reports are excluded by the glob)."""
    if not reports_dir.exists():
        return None
    reports = sorted(reports_dir.glob("[0-9]*-cfo-report.md"))
    return reports[-1] if reports else None


def parse_report(path: Path) -> dict:
    """Pull date, cash, and flagged-overage vendors from an agent report."""
    text = path.read_text()
    report_date = date.fromisoformat(path.name[:10])

    cash_match = _CASH_RE.search(text)
    cash = float(cash_match.group(1).replace(",", "")) if cash_match else None

    overage_vendors = [v.strip() for v in _OVERAGE_RE.findall(text)]

    return {"date": report_date, "cash": cash, "overage_vendors": overage_vendors}


def reconcile(analysis: dict, reports_dir: Path, today: date | None = None) -> dict:
    """Compare the live `analysis` dict against the agent's last report.

    `analysis` must carry: cash_on_hand, week_txns (each {date,description,amount}),
    and overages (list of {vendor,...}). Returns a reconciliation dict consumed
    by ascii_renderer._render_recon.
    """
    today = today or date.today()
    live_overage_vendors = [o["vendor"] for o in analysis.get("overages", [])]

    report_path = find_last_report(reports_dir)
    if report_path is None:
        return {
            "agent_last_run": None,
            "live_overage_vendors": live_overage_vendors,
        }

    parsed = parse_report(report_path)
    agent_date = parsed["date"]
    days_since = (today - agent_date).days

    # Charges that posted after the agent's report date — its blind spot.
    cutoff = agent_date.isoformat()
    since = [t for t in analysis.get("week_txns", []) if t["date"] > cutoff]
    since_vendors = []
    for t in since:
        if t["description"] not in since_vendors:
            since_vendors.append(t["description"])

    agent_overages = parsed["overage_vendors"]
    new_overages = [v for v in live_overage_vendors if v not in agent_overages]

    cash_drift = None
    if parsed["cash"] is not None:
        cash_drift = round(analysis["cash_on_hand"] - parsed["cash"], 2)

    return {
        "agent_last_run": agent_date,
        "days_since": days_since,
        "stale": days_since > STALE_DAYS,
        "since_agent": {
            "count": len(since),
            "sum": round(sum(t["amount"] for t in since), 2),
            "vendors": since_vendors,
        },
        "agent_cash": parsed["cash"],
        "live_cash": analysis["cash_on_hand"],
        "cash_drift": cash_drift,
        "agent_overage_vendors": agent_overages,
        "live_overage_vendors": live_overage_vendors,
        "new_overages": new_overages,
    }
