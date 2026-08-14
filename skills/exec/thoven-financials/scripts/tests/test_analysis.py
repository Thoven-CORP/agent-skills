import pytest
from analysis import compute_burn


def test_compute_burn_sums_amounts(sample_transactions):
    # sample_transactions has 5 entries: 10.07 + 100.15 + 12.00 + 101.83 + 29.99 = 254.04
    assert compute_burn(sample_transactions) == pytest.approx(254.04)


def test_compute_burn_empty_list():
    assert compute_burn([]) == 0.0


def test_compute_burn_ignores_non_amount_keys():
    txns = [{"date": "2026-05-13", "description": "X", "amount": 5.0, "extra": "ignored"}]
    assert compute_burn(txns) == 5.0


from analysis import mtd_by_vendor


def test_mtd_by_vendor_aggregates_per_vendor(sample_transactions, sample_vendor_map):
    result = mtd_by_vendor(sample_transactions, sample_vendor_map)
    assert result["Anthropic"] == pytest.approx(10.07)
    assert result["Replit"] == pytest.approx(100.15)
    assert result["GitHub"] == pytest.approx(12.00)
    assert result["LinkedIn Premium"] == pytest.approx(101.83)
    assert result["Checkr"] == pytest.approx(29.99)


def test_mtd_by_vendor_groups_unknown(sample_vendor_map):
    txns = [
        {"date": "2026-05-13", "description": "Cursor", "amount": 20.0},
        {"date": "2026-05-13", "description": "Anthropic", "amount": 10.0},
    ]
    result = mtd_by_vendor(txns, sample_vendor_map)
    assert result["Anthropic"] == 10.0
    assert result["__UNKNOWN__"] == 20.0


def test_mtd_by_vendor_empty_transactions(sample_vendor_map):
    assert mtd_by_vendor([], sample_vendor_map) == {}


from analysis import detect_overages


def test_detect_overages_returns_only_over_cap(sample_vendor_map):
    mtd = {"Anthropic": 350.0, "Replit": 40.0, "GitHub": 15.0}
    overages = detect_overages(mtd, sample_vendor_map)
    assert len(overages) == 1
    assert overages[0]["vendor"] == "Anthropic"
    assert overages[0]["mtd"] == 350.0
    assert overages[0]["cap"] == 300
    assert overages[0]["over_by"] == 50.0


def test_detect_overages_empty_when_under_cap(sample_vendor_map):
    mtd = {"Anthropic": 100.0, "Replit": 30.0}
    assert detect_overages(mtd, sample_vendor_map) == []


def test_detect_overages_skips_unknown_bucket(sample_vendor_map):
    # __UNKNOWN__ isn't in vendor_map — should be ignored, not an overage
    mtd = {"__UNKNOWN__": 500.0, "Anthropic": 50.0}
    assert detect_overages(mtd, sample_vendor_map) == []


from analysis import detect_anomalies


def test_detect_unknown_vendor_anomaly(sample_vendor_map):
    txns = [{"date": "2026-05-13", "description": "Cursor", "amount": 20.0}]
    baseline = {}
    anomalies = detect_anomalies(txns, sample_vendor_map, baseline)
    assert len(anomalies) == 1
    assert anomalies[0]["type"] == "unknown_vendor"
    assert anomalies[0]["description"] == "Cursor"
    assert anomalies[0]["amount"] == 20.0


def test_detect_spike_anomaly(sample_vendor_map):
    txns = [{"date": "2026-05-13", "description": "Anthropic", "amount": 50.0}]
    baseline = {"Anthropic": 10.0}  # typical $10/day
    anomalies = detect_anomalies(txns, sample_vendor_map, baseline)
    spikes = [a for a in anomalies if a["type"] == "spike"]
    assert len(spikes) == 1
    assert spikes[0]["vendor"] == "Anthropic"
    assert spikes[0]["amount"] == 50.0
    assert spikes[0]["baseline"] == 10.0


def test_no_spike_when_under_2x_baseline(sample_vendor_map):
    txns = [{"date": "2026-05-13", "description": "Anthropic", "amount": 15.0}]
    baseline = {"Anthropic": 10.0}
    anomalies = detect_anomalies(txns, sample_vendor_map, baseline)
    spikes = [a for a in anomalies if a["type"] == "spike"]
    assert spikes == []


def test_first_paid_charge_anomaly(sample_vendor_map):
    txns = [{"date": "2026-05-13", "description": "Cloudflare bill", "amount": 5.0}]
    baseline = {}
    anomalies = detect_anomalies(txns, sample_vendor_map, baseline)
    first_paid = [a for a in anomalies if a["type"] == "first_paid_charge"]
    assert len(first_paid) == 1
    assert first_paid[0]["vendor"] == "Cloudflare"


from analysis import compute_runway


def test_compute_runway_basic():
    assert compute_runway(cash=50000.0, monthly_burn=1686.0) == pytest.approx(29.66, rel=0.01)


def test_compute_runway_zero_burn_returns_inf():
    assert compute_runway(cash=10000.0, monthly_burn=0.0) == float("inf")


def test_compute_runway_negative_cash():
    # Negative cash = already underwater; runway = 0 (not negative months)
    assert compute_runway(cash=-500.0, monthly_burn=1000.0) == 0.0
