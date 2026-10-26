#!/usr/bin/env python3
"""Check design/art/INDEX.md against the files in design/art.

Usage: check_index.py [design/art directory]
Exit 0 clean, 1 findings, 2 nothing to check (no directory, no INDEX.md, or no rows).
"""
import subprocess
import sys
from pathlib import Path

KINDS = {"instrument", "mark", "icon", "sticker", "stamp", "frame", "scribble", "photo", "mascot", "palette"}
STATUSES = {"locked", "chosen", "draft", "superseded"}
SOURCES = ("reused", "generated", "hand-built", "sampled")
ART_SUFFIXES = {".png", ".svg", ".jpg", ".jpeg", ".webp", ".json"}
COLUMNS = ["name", "kind", "file", "paper", "source", "status", "notes"]


def default_dir():
    try:
        root = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip()
        if (Path(root) / "design/art").is_dir():
            return Path(root) / "design/art"
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return Path.home() / "thoven/frontend/design/art"


def rows(index):
    for n, line in enumerate(index.read_text().splitlines(), 1):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not line.startswith("|") or len(cells) != len(COLUMNS) or cells[0] in ("Name", "---"):
            continue
        yield n, dict(zip(COLUMNS, cells))


def main():
    art = Path(sys.argv[1]) if len(sys.argv) > 1 else default_dir()
    index = art / "INDEX.md"
    if not index.is_file():
        print(f"check_index: no INDEX.md in {art}", file=sys.stderr)
        return 2
    found = list(rows(index))
    if not found:
        print(f"check_index: {index} has no asset rows, nothing to check", file=sys.stderr)
        return 2

    problems, indexed = [], set()
    for n, r in found:
        where = f"INDEX.md:{n} {r['name']}"
        if r["kind"] not in KINDS:
            problems.append(f"{where}: kind '{r['kind']}' is not one of {sorted(KINDS)}")
        if r["status"] not in STATUSES:
            problems.append(f"{where}: status '{r['status']}' is not one of {sorted(STATUSES)}")
        if not r["source"].startswith(SOURCES):
            problems.append(f"{where}: source must start with one of {list(SOURCES)}")
        if r["file"] != "-":
            path = r["file"].strip("`")
            indexed.add(path)
            if not (art / path).is_file():
                problems.append(f"{where}: file {path} does not exist")
        elif r["paper"] == "-":
            problems.append(f"{where}: no file and no Paper node, so nothing points at the asset")

    for f in sorted(art.rglob("*")):
        rel = f.relative_to(art).as_posix()
        if f.is_file() and f.suffix.lower() in ART_SUFFIXES and rel not in indexed:
            problems.append(f"{rel}: file has no INDEX.md row")

    for p in problems:
        print(p)
    print(f"check_index: {len(found)} rows, {len(problems)} findings", file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
