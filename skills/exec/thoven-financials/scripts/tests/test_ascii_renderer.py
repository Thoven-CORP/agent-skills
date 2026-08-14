"""Tests for ascii_renderer.py — alignment contract + structural correctness."""

from datetime import date

import ascii_renderer as r


def _analysis():
    return {
        "cash_on_hand": 442.98,
        "checking": 442.98,
        "savings": 0.0,
        "week_burn": 655.40,
        "monthly_burn": 352.0,
        "runway_months": 1.3,
        "week_window": (date(2026, 5, 15), date(2026, 5, 22)),
        "week_txns": [
            {"date": "2026-05-18", "description": "Google", "amount": 500.0},
            {"date": "2026-05-18", "description": "Notion", "amount": 48.0},
            {"date": "2026-05-20", "description": "Canva", "amount": 15.0},
        ],
        "vendor_table": [
            {"vendor": "Replit", "type": "USAGE", "mtd": 140.0, "cap": 50, "pct": 280.0, "category": "x"},
            {"vendor": "Notion", "type": "FIXED", "mtd": 48.0, "cap": 20, "pct": 240.0, "category": "x"},
            {"vendor": "Google", "type": "STRATEGIC", "mtd": 500.0, "cap": 650, "pct": 77.0, "category": "x"},
            {"vendor": "Anthropic", "type": "USAGE", "mtd": 0.0, "cap": 300, "pct": 0.0, "category": "x"},
        ],
        "overages": [
            {"vendor": "Replit", "mtd": 140.0, "cap": 50, "over_by": 90.0, "pct_of_cap": 280.0},
            {"vendor": "Notion", "mtd": 48.0, "cap": 20, "over_by": 28.0, "pct_of_cap": 240.0},
        ],
        "anomalies": [],
        "budget_doc_name": "2026-05-13-budget-line-items.md",
    }


def _recon():
    return {
        "agent_last_run": date(2026, 5, 18),
        "days_since": 4,
        "stale": False,
        "since_agent": {"count": 2, "sum": 22.0, "vendors": ["Canva", "Excalidraw"]},
        "agent_cash": 464.98,
        "live_cash": 442.98,
        "cash_drift": -22.0,
        "agent_overage_vendors": ["Replit", "Notion"],
        "live_overage_vendors": ["Replit", "Notion"],
        "new_overages": [],
    }


def test_dw_strips_variation_selector():
    assert r._dw("⚠️") == 1   # bare warn + VS16 counts as one column
    assert r._dw("ABC") == 3


def test_card_lines_fixed_width():
    top, mid, bot = r._card("CASH", "$442.98")
    assert r._dw(top) == r.CARD_W
    assert r._dw(mid) == r.CARD_W
    assert r._dw(bot) == r.CARD_W


def test_cards_row_aligned():
    cards = [r._card("CASH", "$442.98"), r._card("BURN / wk", "$655"), r._card("RUNWAY", "1.3 mo")]
    rows = r._cards_row(cards)
    widths = {r._dw(line) for line in rows}
    assert len(widths) == 1  # all three lines identical width


def test_render_no_emoji_variation_selector():
    out = r.render(_analysis(), _recon())
    assert "️" not in out  # alignment contract: never emit VS16


def test_render_overages_float_to_top():
    out = r.render(_analysis(), _recon())
    budget_block = out.split("BUDGET vs CAP")[1]
    assert budget_block.index("Replit") < budget_block.index("Google")


def test_render_contains_key_sections():
    out = r.render(_analysis(), _recon())
    for token in ["THOVEN CFO", "CASH", "THIS WEEK", "BUDGET vs CAP", "AGENT RECONCILIATION", "Mercury CLI"]:
        assert token in out


def test_render_runway_alert_when_low():
    a = _analysis()
    a["runway_months"] = 1.3
    assert r.WARN in r.render(a, _recon())


def test_render_error_box_hides_numbers():
    out = r.render_error("Mercury auth failed", "needs login")
    assert "NOT shown" in out
    assert "needs login" in out
    assert r.WARN in out
