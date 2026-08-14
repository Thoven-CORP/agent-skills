"""Pure analysis functions — diff, anomaly detect, runway compute."""
from collections import defaultdict
from vendor_categorizer import categorize


def compute_burn(transactions: list[dict]) -> float:
    """Sum of all transaction amounts. Used for weekly + monthly burn calc."""
    return sum(t["amount"] for t in transactions)


def mtd_by_vendor(transactions: list[dict], vendor_map: dict) -> dict[str, float]:
    """
    Aggregate transaction amounts per vendor key. Unknown vendors are
    grouped under the special key "__UNKNOWN__".
    """
    totals = defaultdict(float)
    for t in transactions:
        vendor = categorize(t["description"], vendor_map) or "__UNKNOWN__"
        totals[vendor] += t["amount"]
    return dict(totals)


SPIKE_MULTIPLIER = 2.0
SUB_AMOUNT_TOLERANCE = 1.00  # dollars — matching tolerance for "same monthly charge"


def _is_monthly_sub_renewal(t: dict, recent_60d: list[dict], vendor: str) -> bool:
    """
    True if this transaction looks like a recurring monthly subscription billing.

    Heuristic: in the prior 60 days, the same vendor has at least one charge
    whose amount is within SUB_AMOUNT_TOLERANCE of this charge's amount.
    Subs bill at consistent amounts; usage charges vary. If a prior $200
    Anthropic charge exists, today's $200 Anthropic charge is the next renewal.
    """
    from vendor_categorizer import categorize as _cat
    target_amt = t["amount"]
    for prior in recent_60d:
        if prior.get("date", "") >= t.get("date", ""):
            continue  # only look backward
        if _cat(prior["description"], {vendor: {"type": ""}}) != vendor:
            # quick check: does prior txn map to same vendor?
            continue
        if abs(prior["amount"] - target_amt) <= SUB_AMOUNT_TOLERANCE:
            return True
    return False


def detect_anomalies(
    transactions: list[dict],
    vendor_map: dict,
    baseline: dict[str, float],
    recent_60d: list[dict] | None = None,
) -> list[dict]:
    """
    Return list of anomalies across three types:
      - unknown_vendor: txn description doesn't match any vendor
      - spike: txn amount > SPIKE_MULTIPLIER * baseline for that vendor, AND not a recognized monthly sub renewal
      - first_paid_charge: vendor flagged is_free_tier_watch=True hits non-zero charge

    baseline = {vendor_key: typical_per_day_amount}, computed by orchestrator
    from the prior 4 weeks of Mercury data.

    recent_60d (optional) = full list of prior-60-day transactions, used to
    recognize monthly subscription renewals and suppress them from spike detection.
    Without recent_60d, monthly subs will incorrectly trigger spike flags.
    """
    anomalies = []
    for t in transactions:
        vendor = categorize(t["description"], vendor_map)
        if vendor is None:
            anomalies.append({
                "type": "unknown_vendor",
                "description": t["description"],
                "amount": t["amount"],
                "date": t["date"],
            })
            continue

        # First-paid-charge: free-tier-watch vendor with any non-zero amount
        if vendor_map[vendor].get("is_free_tier_watch") and t["amount"] > 0:
            anomalies.append({
                "type": "first_paid_charge",
                "vendor": vendor,
                "amount": t["amount"],
                "date": t["date"],
            })

        # Spike: amount > 2x baseline for that vendor
        # BUT: suppress if this matches a monthly subscription renewal pattern.
        baseline_amt = baseline.get(vendor, 0)
        if baseline_amt > 0 and t["amount"] > SPIKE_MULTIPLIER * baseline_amt:
            if recent_60d and _is_monthly_sub_renewal(t, recent_60d, vendor):
                continue  # known monthly sub — not a spike
            anomalies.append({
                "type": "spike",
                "vendor": vendor,
                "amount": t["amount"],
                "baseline": baseline_amt,
                "date": t["date"],
            })

    return anomalies


def detect_overages(mtd: dict[str, float], vendor_map: dict) -> list[dict]:
    """
    Return list of overages: vendors where MTD spend exceeds their cap.
    Unknown vendors (__UNKNOWN__) are skipped — they surface as anomalies, not overages.
    Each overage: {vendor, mtd, cap, over_by, pct_of_cap}.
    """
    overages = []
    for vendor, mtd_amount in mtd.items():
        if vendor == "__UNKNOWN__":
            continue
        if vendor not in vendor_map:
            continue
        cap = vendor_map[vendor]["cap"]
        if cap > 0 and mtd_amount > cap:
            overages.append({
                "vendor": vendor,
                "mtd": mtd_amount,
                "cap": cap,
                "over_by": mtd_amount - cap,
                "pct_of_cap": round(mtd_amount / cap * 100, 1),
            })
    return overages


def compute_runway(cash: float, monthly_burn: float) -> float:
    """
    Months of runway given cash on hand and monthly burn.
    Zero burn -> infinite runway. Negative cash -> 0 (already underwater).
    """
    if monthly_burn <= 0:
        return float("inf")
    if cash <= 0:
        return 0.0
    return cash / monthly_burn
