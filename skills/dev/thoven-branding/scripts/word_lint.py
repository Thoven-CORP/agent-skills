#!/usr/bin/env python3
"""Flag retired words in Thoven copy a person reads.

Usage: word_lint.py [--data PATH] [FILE ... | -]
Reads stdin when no file is given or a file is `-`.
Exit 0 clean, 1 findings, 2 refused (message on stderr).
"""

import argparse
import json
import re
import sys
from pathlib import Path

DEFAULT_DATA = Path(__file__).resolve().parent / "retired_words.json"
REQUIRED_KEYS = ("id", "pattern", "say", "why")


class Refusal(Exception):
    pass


def load_entries(path):
    if not path.is_file():
        raise Refusal(f"data file not found: {path}")
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        raise Refusal(f"data file is empty: {path}")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise Refusal(f"data file is not valid JSON: {path}: {exc}")
    if not isinstance(data, list) or not data:
        raise Refusal(f"data file must be a non-empty JSON list: {path}")

    entries = []
    seen_ids = set()
    for index, entry in enumerate(data):
        if not isinstance(entry, dict):
            raise Refusal(f"entry {index} is not an object")
        missing = [k for k in REQUIRED_KEYS if not isinstance(entry.get(k), str) or not entry[k].strip()]
        if missing:
            raise Refusal(f"entry {index} ({entry.get('id', '?')}) lacks {', '.join(missing)}")
        if entry["id"] in seen_ids:
            raise Refusal(f"entry {index} repeats id {entry['id']}")
        seen_ids.add(entry["id"])
        try:
            regex = re.compile(entry["pattern"], re.IGNORECASE)
        except re.error as exc:
            raise Refusal(f"entry {index} ({entry['id']}) pattern does not compile: {exc}")
        entries.append((regex, entry))
    return entries


def read_sources(args):
    names = args or ["-"]
    sources = []
    for name in names:
        if name == "-":
            label, text = "<stdin>", sys.stdin.read()
        else:
            path = Path(name)
            if not path.is_file():
                raise Refusal(f"file not found: {name}")
            label, text = name, path.read_text(encoding="utf-8")
        if not text.strip():
            raise Refusal(f"{label} is empty; there is no copy to lint")
        sources.append((label, text))
    return sources


def findings_for(label, text, entries):
    line_starts = [0] + [m.end() for m in re.finditer("\n", text)]
    found = []
    for regex, entry in entries:
        for match in regex.finditer(text):
            offset = match.start()
            line = _line_index(line_starts, offset)
            col = offset - line_starts[line] + 1
            matched = " ".join(match.group(0).split())
            found.append((line + 1, col, entry["id"], matched, entry))
    found.sort(key=lambda f: (f[0], f[1], f[2]))
    return [
        f'{label}:{line}:{col}: "{matched}" -> say: {entry["say"]} (why: {entry["why"]})'
        for line, col, _, matched, entry in found
    ]


def _line_index(line_starts, offset):
    low, high = 0, len(line_starts) - 1
    while low < high:
        mid = (low + high + 1) // 2
        if line_starts[mid] <= offset:
            low = mid
        else:
            high = mid - 1
    return low


def main(argv):
    parser = argparse.ArgumentParser(description="Flag retired words in Thoven copy.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="retired-words JSON registry")
    parser.add_argument("files", nargs="*", help="copy files; - or none reads stdin")
    args = parser.parse_args(argv)

    try:
        entries = load_entries(args.data)
        sources = read_sources(args.files)
    except Refusal as exc:
        print(f"word_lint: refused: {exc}", file=sys.stderr)
        return 2

    lines = [line for label, text in sources for line in findings_for(label, text, entries)]
    for line in lines:
        print(line)
    return 1 if lines else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
