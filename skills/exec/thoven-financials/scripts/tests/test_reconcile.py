"""Tests for reconcile.py — parsing the agent report and diffing vs live."""

from datetime import date
from pathlib import Path

import reconcile


AGENT_REPORT = """---
date: 2026-05-18
category: Finance
status: Weekly Report
window: 2026-05-13 to 2026-05-18
---

# CFO Weekly — May 13–18, 2026

## Top Line

- **This week's burn:** $804.04
- **Cash on hand:** $464.98
- **Monthly burn (4-week avg):** $352/mo
- **Runway:** 1.3 months

## Status — 2 Flags

⚠ **OVERAGE — Replit:** $140 MTD vs $50 cap (280%)
⚠ **OVERAGE — Notion:** $48 MTD vs $20 cap (240%)
"""


def _write_report(tmp_path: Path, name: str, body: str) -> Path:
    p = tmp_path / name
    p.write_text(body)
    return p


def test_parse_report_extracts_fields(tmp_path):
    p = _write_report(tmp_path, "2026-05-18-cfo-report.md", AGENT_REPORT)
    parsed = reconcile.parse_report(p)
    assert parsed["date"] == date(2026, 5, 18)
    assert parsed["cash"] == 464.98
    assert parsed["overage_vendors"] == ["Replit", "Notion"]


def test_find_last_report_ignores_failed(tmp_path):
    _write_report(tmp_path, "2026-05-13-cfo-report.md", AGENT_REPORT)
    _write_report(tmp_path, "2026-05-18-cfo-report.md", AGENT_REPORT)
    _write_report(tmp_path, "failed-2026-05-20-cfo-report.md", "boom")
    latest = reconcile.find_last_report(tmp_path)
    assert latest.name == "2026-05-18-cfo-report.md"


def test_find_last_report_none_when_empty(tmp_path):
    assert reconcile.find_last_report(tmp_path) is None


def test_reconcile_no_report():
    analysis = {"cash_on_hand": 442.98, "week_txns": [], "overages": []}
    out = reconcile.reconcile(analysis, Path("/nonexistent"), today=date(2026, 5, 22))
    assert out["agent_last_run"] is None


def test_reconcile_full_diff(tmp_path):
    _write_report(tmp_path, "2026-05-18-cfo-report.md", AGENT_REPORT)
    analysis = {
        "cash_on_hand": 442.98,
        "week_txns": [
            {"date": "2026-05-20", "description": "Canva", "amount": 15.0},
            {"date": "2026-05-21", "description": "Excalidraw", "amount": 7.0},
            {"date": "2026-05-18", "description": "Google", "amount": 500.0},  # == agent date, excluded
        ],
        "overages": [{"vendor": "Replit"}, {"vendor": "Notion"}],
    }
    out = reconcile.reconcile(analysis, tmp_path, today=date(2026, 5, 22))
    assert out["agent_last_run"] == date(2026, 5, 18)
    assert out["days_since"] == 4
    assert out["stale"] is False
    # only charges strictly after 2026-05-18
    assert out["since_agent"]["count"] == 2
    assert out["since_agent"]["sum"] == 22.0
    assert set(out["since_agent"]["vendors"]) == {"Canva", "Excalidraw"}
    assert out["agent_cash"] == 464.98
    assert out["live_cash"] == 442.98
    assert out["cash_drift"] == -22.0
    assert out["new_overages"] == []  # agent already caught both


def test_reconcile_flags_stale_and_new_overage(tmp_path):
    _write_report(tmp_path, "2026-05-01-cfo-report.md", AGENT_REPORT)
    analysis = {
        "cash_on_hand": 400.0,
        "week_txns": [],
        "overages": [{"vendor": "Replit"}, {"vendor": "Notion"}, {"vendor": "Twilio"}],
    }
    out = reconcile.reconcile(analysis, tmp_path, today=date(2026, 5, 22))
    assert out["stale"] is True  # 21 days > 7
    assert out["new_overages"] == ["Twilio"]  # live has it, agent didn't
