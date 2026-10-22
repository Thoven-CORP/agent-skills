"""Read forward-looking ledger from Thoven_Burn_Rate_Tracker.xlsx."""

from pathlib import Path
from openpyxl import load_workbook


TRACKER_DEFAULT = Path("/Users/andresmartinez/Vaults/Executive-Assistant/Thoven_Burn_Rate_Tracker.xlsx")


def read_tracker(path: Path = TRACKER_DEFAULT) -> dict:
    """
    Read cash balance from the tracker xlsx. Returns empty values on missing/locked.

    v1: returns cash_balance only. planned_inflows / manual_expenses are v2 features
    and return as empty lists for forward-compat.
    """
    if not path.exists():
        return {
            "planned_inflows": [],
            "manual_expenses": [],
            "cash_balance": 0.0,
            "error": "file_missing",
        }

    try:
        wb = load_workbook(path, data_only=True)
    except PermissionError:
        return {
            "planned_inflows": [],
            "manual_expenses": [],
            "cash_balance": 0.0,
            "error": "file_locked",
        }

    ws = wb.active
    cash = ws["B3"].value or 0.0
    if isinstance(cash, str):
        cash = 0.0

    return {
        "planned_inflows": [],
        "manual_expenses": [],
        "cash_balance": float(cash),
        "error": None,
    }
