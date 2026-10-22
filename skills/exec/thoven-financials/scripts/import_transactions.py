#!/usr/bin/env python3
"""
Transaction Import — Thoven
Parses CSV or PDF bank statements and maps transactions to budget categories.
Images/screenshots are handled by Claude directly (vision) before calling log_imported().
"""

import csv
import os
from datetime import datetime
from openpyxl import load_workbook

TRACKER_PATH = "/Users/andresmartinez/Vaults/Executive-Assistant/Thoven_Burn_Rate_Tracker.xlsx"
EXPENSES_START_ROW = 30

BUDGET_CATEGORIES = [
    "Meta Ads", "Google Ads", "Claude Code", "Metabase",
    "Canva", "Contractors", "Buffer", "Other SaaS", "Teacher Onboarding"
]

# Keyword → category mapping (lowercase match against description)
VENDOR_MAP = {
    "anthropic":            "Claude Code",
    "claude":               "Claude Code",
    "meta ":                "Meta Ads",
    "facebook":             "Meta Ads",
    "instagram":            "Meta Ads",
    "google ads":           "Google Ads",
    "adwords":              "Google Ads",
    "github":               "Other SaaS",
    "replit":               "Other SaaS",
    "21st.dev":             "Other SaaS",
    "21st dev":             "Other SaaS",
    "xero":                 "Other SaaS",
    "miro":                 "Other SaaS",
    "elevenlabs":           "Other SaaS",
    "canva":                "Canva",
    "metabase":             "Metabase",
    "checkr":               "Teacher Onboarding",
}

# Keywords that indicate inflows to skip (not expenses)
SKIP_KEYWORDS = ["stripe", "thoven corp", "wire from", "ozcan", "eren", "deposit", "transfer"]


def categorize(description: str) -> str | None:
    """Map a transaction description to a budget category. Returns None if unknown."""
    desc = description.lower()
    for keyword, category in VENDOR_MAP.items():
        if keyword in desc:
            return category
    return None


def should_skip(description: str) -> bool:
    """True if this looks like an inflow or intercompany transfer."""
    desc = description.lower()
    return any(kw in desc for kw in SKIP_KEYWORDS)


def parse_csv(filepath: str) -> list[dict]:
    """
    Parse a CSV export from Mercury or Rho/Xero.
    Handles both Mercury and Xero CSV column formats.
    Returns list of: {date, description, amount, category, raw}
    """
    transactions = []

    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = [h.strip().lower() for h in reader.fieldnames or []]
        # Detect Mercury format by its unique column headers
        is_mercury = "date (utc)" in headers or "source account" in headers

        for row in reader:
            # Normalize keys
            normalized = {k.strip().lower(): v.strip() for k, v in row.items()}

            # Extract date — handle Mercury "Date (UTC)" and Xero "Date" columns
            date = (
                normalized.get("date (utc)") or
                normalized.get("date") or
                normalized.get("created on") or
                normalized.get("transaction date") or ""
            )

            # Extract description
            description = (
                normalized.get("description") or
                normalized.get("payee") or
                normalized.get("reference") or
                normalized.get("name") or ""
            )

            # Extract amount
            amount_raw = (
                normalized.get("amount") or
                normalized.get("debit") or
                normalized.get("net amount") or "0"
            )

            try:
                amount = float(amount_raw.replace(",", "").replace("$", "").replace("(", "-").replace(")", ""))
            except ValueError:
                continue

            if amount == 0:
                continue

            if should_skip(description):
                continue

            # Mercury: negative = money out (expense), positive = money in
            # Xero/Rho: positive = expense, negative = income
            if is_mercury:
                if amount > 0:
                    continue  # inflow
                amount = abs(amount)
            else:
                if amount < 0:
                    continue  # inflow
                amount = abs(amount)

            category = categorize(description)

            transactions.append({
                "date": date[:10] if date else datetime.now().strftime("%Y-%m-%d"),
                "description": description,
                "amount": round(amount, 2),
                "category": category,  # None = needs manual assignment
            })

    return transactions


def parse_pdf(filepath: str) -> list[dict]:
    """Extract transactions from a PDF bank statement using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        raise ImportError("pdfplumber required: pip3 install pdfplumber")

    transactions = []

    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue
                for row in table[1:]:  # skip header
                    if not row or len(row) < 3:
                        continue
                    # Try to find date, description, amount columns
                    row_text = [str(cell or "").strip() for cell in row]
                    # Heuristic: first col = date, middle = description, last = amount
                    date_str = row_text[0][:10] if row_text[0] else ""
                    description = row_text[1] if len(row_text) > 1 else ""
                    amount_str = row_text[-1].replace(",", "").replace("$", "")

                    if should_skip(description):
                        continue

                    try:
                        amount = abs(float(amount_str))
                        if amount == 0:
                            continue
                    except ValueError:
                        continue

                    transactions.append({
                        "date": date_str or datetime.now().strftime("%Y-%m-%d"),
                        "description": description,
                        "amount": amount,
                        "category": categorize(description),
                    })

    return transactions


def parse_file(filepath: str) -> list[dict]:
    """Auto-detect file type and parse."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return parse_csv(filepath)
    elif ext == ".pdf":
        return parse_pdf(filepath)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .csv, .pdf")


def format_import_preview(transactions: list[dict]) -> str:
    """Format a preview of parsed transactions for user confirmation."""
    lines = [f"Found {len(transactions)} expense transactions:\n"]

    unknown = []
    categorized = []

    for t in transactions:
        if t["category"]:
            categorized.append(t)
        else:
            unknown.append(t)

    if categorized:
        lines.append("✓ Auto-categorized:")
        for t in categorized:
            lines.append(f"  {t['date']}  {t['category']:<22} ${t['amount']:>8,.2f}  — {t['description'][:40]}")

    if unknown:
        lines.append(f"\n❓ Unknown category ({len(unknown)} items — need manual assignment):")
        for t in unknown:
            lines.append(f"  {t['date']}  {'?':<22} ${t['amount']:>8,.2f}  — {t['description'][:40]}")
        lines.append(f"\nValid categories: {', '.join(BUDGET_CATEGORIES)}")

    total = sum(t["amount"] for t in transactions)
    lines.append(f"\nTotal: ${total:,.2f}")
    lines.append("\nConfirm to log all categorized transactions? (unknown items will be skipped until assigned)")

    return "\n".join(lines)


def log_imported(transactions: list[dict]) -> dict:
    """
    Write confirmed transactions to the tracker.
    Skips any with category=None.
    Returns summary dict.
    """
    wb = load_workbook(TRACKER_PATH)
    ws = wb.active

    BUDGET_ROWS = {
        "Meta Ads": 17, "Google Ads": 18, "Claude Code": 19, "Metabase": 20,
        "Canva": 21, "Contractors": 22, "Buffer": 23, "Other SaaS": 24,
        "Teacher Onboarding": 25,
    }

    # Find next empty expense row
    row = EXPENSES_START_ROW
    while ws[f"A{row}"].value:
        row += 1

    logged = []
    skipped = []

    for t in transactions:
        if not t["category"] or t["category"] not in BUDGET_ROWS:
            skipped.append(t)
            continue

        # Write expense row
        ws[f"A{row}"] = t["date"]
        ws[f"B{row}"] = t["category"]
        ws[f"C{row}"] = t["description"][:50]
        ws[f"D{row}"] = t["amount"]
        row += 1

        # Update MTD actual
        cat_row = BUDGET_ROWS[t["category"]]
        current = ws[f"C{cat_row}"].value or 0
        ws[f"C{cat_row}"] = current + t["amount"]

        # Update cash balance
        cash = ws["B3"].value or 0
        ws["B3"] = cash - t["amount"]

        logged.append(t)

    wb.save(TRACKER_PATH)

    return {
        "logged_count": len(logged),
        "skipped_count": len(skipped),
        "total_logged": sum(t["amount"] for t in logged),
        "skipped": skipped,
        "new_cash_balance": (wb.active["B3"].value),
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 import_transactions.py <file.csv|file.pdf>")
        sys.exit(1)

    filepath = sys.argv[1]
    transactions = parse_file(filepath)
    print(format_import_preview(transactions))
