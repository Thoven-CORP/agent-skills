"""Map Mercury transaction descriptions to vendor keys."""


def categorize(description: str, vendor_map: dict) -> str | None:
    """
    Map a Mercury transaction description to a vendor key in the budget.

    Matches via case-insensitive substring. Returns the LONGEST matching
    vendor key (so "LinkedIn Premium" wins over a hypothetical "LinkedIn").
    Returns None for unknown vendors.
    """
    if not description:
        return None

    desc_lower = description.lower()
    matches = [v for v in vendor_map if v.lower() in desc_lower]

    if not matches:
        return None

    # Longest match wins (specificity)
    return max(matches, key=len)
