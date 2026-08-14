import pytest
from datetime import date
from report_writer import render_report


def make_analysis():
    """Standard analysis dict the orchestrator builds before calling render_report."""
    return {
        "week_burn": 487.20,
        "cash_on_hand": 45200.00,
        "monthly_burn": 1742.0,
        "runway_months": 25.95,
        "runway_delta": -0.3,
        "overages": [
            {"vendor": "Anthropic", "mtd": 312.0, "cap": 300, "over_by": 12.0, "pct_of_cap": 104.0},
        ],
        "anomalies": [
            {"type": "unknown_vendor", "description": "Cursor", "amount": 20.0, "date": "2026-05-15"},
        ],
        "vendor_table": [
            {"vendor": "Anthropic", "type": "USAGE", "mtd": 312.0, "cap": 300, "pct": 104.0, "category": "AI Core Dev"},
            {"vendor": "Google Ads", "type": "STRATEGIC", "mtd": 358.0, "cap": 650, "pct": 55.0, "category": "Acquisition"},
        ],
        "free_tier_watch": [
            {"vendor": "Cloudflare", "status": "still free", "mtd": 0.0},
        ],
    }


def test_render_report_has_frontmatter():
    analysis = make_analysis()
    md = render_report(analysis, window=(date(2026, 5, 11), date(2026, 5, 18)))
    assert "---" in md
    assert "date: 2026-05-18" in md
    assert "window: 2026-05-11 to 2026-05-18" in md


def test_render_report_has_top_line():
    analysis = make_analysis()
    md = render_report(analysis, window=(date(2026, 5, 11), date(2026, 5, 18)))
    assert "$487.20" in md
    assert "25.9 months" in md or "25.95" in md
    assert "$1,742" in md


def test_render_report_includes_overage_flag():
    analysis = make_analysis()
    md = render_report(analysis, window=(date(2026, 5, 11), date(2026, 5, 18)))
    assert "Anthropic" in md
    assert "OVER" in md or "104%" in md


def test_render_report_omits_anomalies_section_when_empty():
    analysis = make_analysis()
    analysis["anomalies"] = []
    md = render_report(analysis, window=(date(2026, 5, 11), date(2026, 5, 18)))
    assert "## Anomalies" not in md


def test_render_report_includes_anomalies_when_present():
    analysis = make_analysis()
    md = render_report(analysis, window=(date(2026, 5, 11), date(2026, 5, 18)))
    assert "## Anomalies" in md
    assert "Cursor" in md
