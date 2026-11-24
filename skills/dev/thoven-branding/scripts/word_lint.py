#!/usr/bin/env python3
"""Flag retired words in Thoven copy a person reads.

Usage: word_lint.py [--data PATH] [--once] [FILE ... | -]
Reads stdin when no file is given or a file is `-`.
--once treats each file or stdin as one screen or dialog block, one text node per
line, and also flags a content word that appears on 3 or more distinct lines.
Exit 0 clean, 1 findings, 2 refused (message on stderr).
"""

import argparse
import json
import re
import sys
from pathlib import Path

ONCE_MIN_LINES = 3
ONCE_MIN_LETTERS = 5
ONCE_SAY = (
    "state each fact once: the title says what happened, one line says what it means "
    "or what is next, a fact list holds only what those two do not"
)
STOPWORDS = frozenset(
    "about after again being because before could every first other their there these "
    "those which while where would should still under until using".split()
)

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


def stem(word):
    word = word.lower()
    for suffix in ("ing", "ed", "es", "s"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 4:
            word = word[: -len(suffix)]
            break
    if word.endswith("e") and len(word) > 4:
        word = word[:-1]
    return word


def repeated_words(label, text):
    lines_by_stem = {}
    first_form = {}
    for number, line in enumerate(text.splitlines(), start=1):
        for word in re.findall(r"[A-Za-z]+", line):
            lowered = word.lower()
            if len(lowered) < ONCE_MIN_LETTERS or lowered in STOPWORDS:
                continue
            key = stem(lowered)
            first_form.setdefault(key, lowered)
            numbers = lines_by_stem.setdefault(key, [])
            if number not in numbers:
                numbers.append(number)
    return [
        f'{label}: "{first_form[key]}" is on lines {", ".join(map(str, numbers))} -> say: {ONCE_SAY}'
        for key, numbers in lines_by_stem.items()
        if len(numbers) >= ONCE_MIN_LINES
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
    parser.add_argument("--once", action="store_true", help="also flag content words repeated on 3+ lines of one block")
    parser.add_argument("files", nargs="*", help="copy files; - or none reads stdin")
    args = parser.parse_args(argv)

    try:
        entries = load_entries(args.data)
        sources = read_sources(args.files)
    except Refusal as exc:
        print(f"word_lint: refused: {exc}", file=sys.stderr)
        return 2

    lines = [line for label, text in sources for line in findings_for(label, text, entries)]
    if args.once:
        lines += [line for label, text in sources for line in repeated_words(label, text)]
    for line in lines:
        print(line)
    return 1 if lines else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
