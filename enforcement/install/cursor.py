#!/usr/bin/env python3
"""Installs the enforcement agent definitions into Cursor.

Cursor's hooks.json only confirms one event name on this machine
(sessionStart). PreToolUse, PostToolUse, and Stop equivalents are not
verified to exist in Cursor, so this installer does not touch hooks.json
and does not guess at event names. It installs agent files only.

Dry run by default. Pass --apply to write.
"""
import argparse
import shutil
import sys
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
CURSOR_AGENTS_DIR = Path.home() / ".cursor" / "agents"

AGENT_FILES = ["verifier.md", "ui-builder.md", "explorer.md", "poteto-agent.md"]

UNVERIFIED_NOTE = (
    "Cursor hook wiring skipped: only the sessionStart event is confirmed on this "
    "machine (~/.cursor/hooks.json). PreToolUse, PostToolUse, and Stop equivalents "
    "are unverified, so thoven-guard-bash, thoven-track-edits, and "
    "thoven-require-evidence are not wired into Cursor. The hook half of "
    "enforcement is unwired for Cursor until those event names are confirmed."
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    plan = []
    for name in AGENT_FILES:
        src = ENFORCEMENT_DIR / "agents" / name
        dest = CURSOR_AGENTS_DIR / name
        copy_needed = not dest.exists() or dest.read_bytes() != src.read_bytes()
        plan.append((name, src, dest, copy_needed))

    print(f"Target agents dir: {CURSOR_AGENTS_DIR}")
    for name, src, dest, copy_needed in plan:
        print(f"- {name}: copy={'yes' if copy_needed else 'no (already matches)'}")
    print(f"\n{UNVERIFIED_NOTE}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    CURSOR_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    for name, src, dest, copy_needed in plan:
        if not copy_needed:
            continue
        if dest.exists():
            backup = dest.with_suffix(dest.suffix + ".bak")
            if not backup.exists():
                shutil.copy2(dest, backup)
                print(f"Backed up {dest} to {backup}")
        shutil.copy2(src, dest)
        print(f"Copied {src} -> {dest}")


if __name__ == "__main__":
    sys.exit(main())
