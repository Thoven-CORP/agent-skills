#!/usr/bin/env python3
"""Writes rules/thoven-law.md between markers into each repo's CLAUDE.md.

Every tool reads the repo CLAUDE.md (AGENTS.md is a symlink to it), and only
Claude reads ~/thoven/CLAUDE.md, so the cross-repo law has to live in the repo.

    law.py [REPO ...]          report drift, exit 1 if any
    law.py --apply [REPO ...]  write the block

REPO defaults to the main frontend and backend checkouts. A repo without the
markers gets the block after its "Cross-repo law" line, or at the end.
"""
import argparse
import sys
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
LAW = ENFORCEMENT_DIR / "rules" / "thoven-law.md"
DEFAULT_REPOS = [Path.home() / "thoven" / "frontend", Path.home() / "thoven" / "backend"]
START = "<!-- thoven-law:start. Generated from agent-skills/enforcement/rules/thoven-law.md -->"
END = "<!-- thoven-law:end -->"
ANCHOR = "Cross-repo law"


def render(text: str, law: str) -> str:
    block = f"{START}\n{law.rstrip()}\n{END}"
    if START in text and END in text:
        head, rest = text.split(START, 1)
        _, tail = rest.split(END, 1)
        return head + block + tail
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.startswith(ANCHOR):
            return "\n".join(lines[: i + 1] + ["", block] + lines[i + 1 :])
    return text.rstrip("\n") + "\n\n" + block + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("repos", nargs="*", type=Path)
    args = parser.parse_args()

    law = LAW.read_text()
    drift = 0
    for repo in args.repos or DEFAULT_REPOS:
        target = repo.expanduser() / "CLAUDE.md"
        if not target.is_file():
            print(f"MISSING  {target}")
            drift += 1
            continue
        text = target.read_text()
        wanted = render(text, law)
        if wanted == text:
            continue
        drift += 1
        if args.apply:
            target.write_text(wanted)
            print(f"updated  {target}")
        else:
            print(f"DRIFT    {target}  (thoven-law block {'stale' if START in text else 'missing'})")
    return 1 if drift and not args.apply else 0


if __name__ == "__main__":
    sys.exit(main())
