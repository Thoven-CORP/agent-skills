"""Wraps Mercury CLI calls. Read-only operations only.

Mercury CLI (v0.7.2+) outputs NEWLINE-DELIMITED JSON objects (pretty-printed,
NOT a JSON array). We parse via JSONDecoder.raw_decode to walk multiple
concatenated objects from one stdout buffer.

Flags verified against `mercury transactions list --help` on 2026-05-13:
- Use --start / --end (NOT --since / --until)
- No --json flag exists; output is JSON by default
- Expenses have negative `amount`; income has positive `amount`
"""

import json
import os
import shutil
import subprocess
from datetime import date


class MercuryAuthError(Exception):
    """Raised when Mercury CLI returns an auth/credentials failure."""


class MercuryCLIError(Exception):
    """Raised on any other Mercury CLI failure."""


_MERCURY_BIN = None


def _mercury_bin() -> str:
    """Resolve the mercury binary even when PATH is bare (launchd, skill shells).

    Bare `mercury` relies on PATH containing ~/.local/bin, which is not
    guaranteed outside an interactive login shell. We resolve once and cache.
    """
    global _MERCURY_BIN
    if _MERCURY_BIN:
        return _MERCURY_BIN
    found = shutil.which("mercury") or os.path.expanduser("~/.local/bin/mercury")
    _MERCURY_BIN = found
    return found


def _run(args: list[str]) -> str:
    """Run mercury CLI and return stdout. Raise on failure."""
    try:
        result = subprocess.run(
            [_mercury_bin(), *args],
            capture_output=True,
            text=True,
            timeout=60,
        )
    except FileNotFoundError as e:
        raise MercuryCLIError(
            f"mercury binary not found (looked on PATH and ~/.local/bin): {e}"
        )
    if result.returncode != 0:
        stderr = result.stderr.lower()
        if "auth" in stderr or "login" in stderr or "credential" in stderr or "unauthorized" in stderr:
            raise MercuryAuthError(result.stderr.strip())
        raise MercuryCLIError(f"mercury {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout


def _parse_json_stream(text: str) -> list[dict]:
    """Parse multiple pretty-printed JSON objects concatenated in one buffer."""
    decoder = json.JSONDecoder()
    objs = []
    text = text.strip()
    idx = 0
    while idx < len(text):
        while idx < len(text) and text[idx].isspace():
            idx += 1
        if idx >= len(text):
            break
        obj, end_idx = decoder.raw_decode(text, idx)
        objs.append(obj)
        idx = end_idx
    return objs


def get_transactions(since: date, until: date) -> list[dict]:
    """
    Pull Mercury transactions in [since, until]. Returns normalized list of
    {date, description, amount, account} — expense-only, amount magnitude.

    `since` becomes --start, `until` becomes --end (createdAt window).
    """
    output = _run([
        "transactions", "list",
        "--start", since.isoformat(),
        "--end", until.isoformat(),
        "--max-items", "-1",
    ])
    raw = _parse_json_stream(output)

    txns = []
    for t in raw:
        amount = float(t.get("amount", 0))
        if amount >= 0:
            continue  # skip inflows
        posted = t.get("postedAt") or t.get("createdAt") or ""
        description = t.get("counterpartyName") or t.get("bankDescription") or ""
        txns.append({
            "date": posted[:10],
            "description": description,
            "amount": abs(amount),
            "account": t.get("accountId", ""),
        })
    return txns


def get_account_balances() -> list[dict]:
    """Per-account balances: [{name, kind, available}]. kind is 'checking'/'savings'."""
    output = _run(["accounts", "list"])
    accounts = _parse_json_stream(output)
    return [
        {
            "name": a.get("name", ""),
            "kind": a.get("kind", ""),
            "available": float(a.get("availableBalance", 0)),
        }
        for a in accounts
    ]


def get_cash_balance() -> float:
    """Sum of available balances across all Mercury accounts."""
    return sum(a["available"] for a in get_account_balances())
