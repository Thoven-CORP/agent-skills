#!/usr/bin/env python3
"""Parse the fenced caps block from factory-rules/RULES.md."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

INT_KEYS = {
    "open_pr_cap",
    "weekly_pr_cap",
    "max_lines",
    "max_files",
    "ci_failure_stop",
}


def parse_caps(text: str) -> dict[str, str]:
    lines = text.splitlines()
    inside = False
    caps: dict[str, str] = {}
    for line in lines:
        if line.strip() == "```caps":
            inside = True
            continue
        if inside and line.strip() == "```":
            break
        if not inside or "=" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split("=", 1)
        caps[key.strip()] = value.strip()
    missing = INT_KEYS - set(caps)
    if missing:
        raise SystemExit(f"RULES.md caps block missing: {', '.join(sorted(missing))}")
    for key in INT_KEYS:
        try:
            int(caps[key])
        except ValueError as exc:
            raise SystemExit(f"cap {key} is not an int: {caps[key]}") from exc
    return caps


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rules", required=True)
    parser.add_argument("--print", dest="keys", nargs="*")
    args = parser.parse_args()
    caps = parse_caps(Path(args.rules).read_text())
    keys = args.keys or list(caps)
    for key in keys:
        if key not in caps:
            print(f"unknown cap: {key}", file=sys.stderr)
            return 2
        print(f"{key}={caps[key]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
