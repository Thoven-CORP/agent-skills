#!/usr/bin/env python3
"""Installs the enforcement hooks into Claude Code's settings.json.

Dry run by default. Pass --apply to write. Do not run --apply against a
live settings.json unless you mean to touch it: these hooks are already
wired on this machine, so the normal use of this script is proof, not
install.
"""
import argparse
import json
import shutil
import stat
import sys
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
CLAUDE_DIR = Path.home() / ".claude"
HOOKS_DIR = CLAUDE_DIR / "hooks"
SETTINGS = CLAUDE_DIR / "settings.json"

# (script name, event, matcher, timeout)
HOOK_SPECS = [
    ("thoven-guard-bash", "PreToolUse", "Bash", 10),
    ("thoven-track-edits", "PostToolUse", "Edit|Write|Bash", 10),
    ("thoven-require-evidence", "Stop", None, 10),
]


def command_for(script_name: str) -> str:
    return str(HOOKS_DIR / script_name)


def hook_already_present(settings: dict, event: str, command: str) -> bool:
    for entry in settings.get("hooks", {}).get(event, []):
        for h in entry.get("hooks", []):
            if h.get("command") == command:
                return True
    return False


def add_hook(settings: dict, event: str, matcher, command: str, timeout: int) -> None:
    settings.setdefault("hooks", {}).setdefault(event, [])
    hook_entry = {"type": "command", "command": command, "timeout": timeout}
    block = {"hooks": [hook_entry]}
    if matcher:
        block["matcher"] = matcher
    settings["hooks"][event].append(block)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    settings = json.loads(SETTINGS.read_text()) if SETTINGS.exists() else {}

    plan = []
    for script_name, event, matcher, timeout in HOOK_SPECS:
        command = command_for(script_name)
        src = ENFORCEMENT_DIR / "hooks" / script_name
        copy_needed = not (HOOKS_DIR / script_name).exists() or (
            (HOOKS_DIR / script_name).read_bytes() != src.read_bytes()
        )
        settings_needed = not hook_already_present(settings, event, command)
        plan.append((script_name, event, matcher, timeout, command, copy_needed, settings_needed))

    print(f"Target settings file: {SETTINGS}")
    print(f"Target hooks dir: {HOOKS_DIR}")
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        print(f"- {script_name}: copy={'yes' if copy_needed else 'no (already matches)'} "
              f"settings_entry[{event}/{matcher or '-'}]={'add' if settings_needed else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    if SETTINGS.exists():
        backup = SETTINGS.with_suffix(SETTINGS.suffix + ".bak")
        if not backup.exists():
            shutil.copy2(SETTINGS, backup)
            print(f"Backed up {SETTINGS} to {backup}")

    HOOKS_DIR.mkdir(parents=True, exist_ok=True)
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        if copy_needed:
            src = ENFORCEMENT_DIR / "hooks" / script_name
            dest = HOOKS_DIR / script_name
            shutil.copy2(src, dest)
            dest.chmod(dest.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
            print(f"Copied {src} -> {dest}")
        if settings_needed:
            add_hook(settings, event, matcher, command, timeout)
            print(f"Added {event}/{matcher or '-'} entry for {script_name}")

    SETTINGS.write_text(json.dumps(settings, indent=2) + "\n")
    print(f"Wrote {SETTINGS}")


if __name__ == "__main__":
    sys.exit(main())
