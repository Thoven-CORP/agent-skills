"""Parse CFO/*-budget-line-items.md into a vendor → budget dict."""

import re
from pathlib import Path


class BudgetDocError(Exception):
    """Raised when the budget doc is missing or unparseable."""


TYPE_LINE = re.compile(r"^\s*-\s+\*\*Type:\*\*\s+(\w+)", re.MULTILINE)
BUDGET_LINE = re.compile(r"^\s*-\s+\*\*Budget:\*\*\s+\*\*\$?([\d,]+)", re.MULTILINE)
FREE_TIER_FLAG = "alert at first paid charge"

# Suffixes that mark a vendor entry as non-active (skip it)
SKIP_SUFFIXES = ("— CANCEL", "-- CANCEL", "— ONE-TIME", "-- ONE-TIME")


def parse_budget(doc_path: Path) -> dict[str, dict]:
    """
    Read a budget-line-items.md and return {vendor_key: {type, cap, category, is_free_tier_watch}}.

    Format expected:
      ### Category: <Category Name>
      #### <Vendor Name>            (or "#### <Vendor> — CANCEL" for cancelled)
      - **Type:** TYPE
      - **Budget:** **$X/mo**

    Free-tier flag detected by literal "alert at first paid charge" in the budget line.
    Cancelled vendors (suffix "— CANCEL") are skipped.
    One-time vendors (suffix "— ONE-TIME") are skipped.
    """
    if not doc_path.exists():
        raise BudgetDocError(f"Budget doc not found: {doc_path}")

    text = doc_path.read_text()
    lines = text.split("\n")

    result = {}
    current_category = None

    for i, line in enumerate(lines):
        cat_match = re.match(r"^###\s+Category:\s+(.+?)$", line)
        if cat_match:
            current_category = cat_match.group(1).strip()
            continue

        vendor_match = re.match(r"^####\s+(.+?)$", line)
        if vendor_match:
            vendor_full = vendor_match.group(1).strip()
            # Skip cancelled / one-time vendors
            if any(vendor_full.endswith(suffix) or suffix in vendor_full for suffix in SKIP_SUFFIXES):
                continue
            vendor = vendor_full

            # Read lines until the next vendor/category header (or max 20 lines)
            end = i + 1
            while end < len(lines) and end < i + 20:
                if re.match(r"^#{3,4}\s", lines[end]):
                    break
                end += 1
            block = "\n".join(lines[i:end])

            type_match = TYPE_LINE.search(block)
            budget_match = BUDGET_LINE.search(block)

            if type_match and budget_match:
                cap = int(budget_match.group(1).replace(",", ""))
                is_free_tier = FREE_TIER_FLAG in block.lower()
                result[vendor] = {
                    "type": type_match.group(1),
                    "cap": cap,
                    "category": current_category or "Uncategorized",
                    "is_free_tier_watch": is_free_tier,
                }

    return result
