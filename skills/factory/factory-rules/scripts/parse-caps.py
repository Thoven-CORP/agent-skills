#!/usr/bin/env python3
"""Parse the fenced caps block from factory-rules/RULES.md.

Reads a file or stdin. Never evals. Integer caps are validated.
"""
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
    "claim_lock_hours",
    "replay_min_tickets",
    "live_score_pct",
    "station_fail_k",
    "monthly_eval_budget",
}
STATUS_KEYS = {
    "weekly_pr_cap_status",
    "pr_size_status",
    "station_fail_k_status",
    "monthly_eval_budget_status",
    "judge_blind_status",
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
        key, value = key.strip(), value.strip()
        if not key or not value:
            raise SystemExit(f"empty cap line: {line}")
        caps[key] = value
    missing = INT_KEYS - set(caps)
    if missing:
        raise SystemExit(f"RULES.md caps block missing: {', '.join(sorted(missing))}")
    for key in INT_KEYS:
        if not caps[key].isdigit() or int(caps[key]) < 0:
            raise SystemExit(f"cap {key} is not a non-negative int: {caps[key]}")
    return caps


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rules", help="path to RULES.md (tests and git-show temp files)")
    parser.add_argument("--stdin", action="store_true")
    parser.add_argument("--print", dest="keys", nargs="*")
    args = parser.parse_args()
    if args.stdin:
        text = sys.stdin.read()
    elif args.rules:
        text = Path(args.rules).read_text()
    else:
        print("usage: parse-caps.py --rules FILE | --stdin", file=sys.stderr)
        return 2
    caps = parse_caps(text)
    keys = args.keys or (sorted(INT_KEYS) + sorted(k for k in caps if k not in INT_KEYS))
    for key in keys:
        if key not in caps:
            print(f"unknown cap: {key}", file=sys.stderr)
            return 2
        print(f"{key}={caps[key]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
