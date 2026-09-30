#!/usr/bin/env python3
"""Installs the enforcement hooks and the deny list into Claude Code's settings.json.

Dry run by default. Pass --apply to write. Do not run --apply against a
live settings.json unless you mean to touch it: these hooks are already
wired on this machine, so the normal use of this script is proof, not
install.
"""
import argparse
import copy
import json
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR, add_missing, copy_file, load_denies, needs_copy, read_json, write_json

CLAUDE_DIR = Path.home() / ".claude"
HOOKS_DIR = CLAUDE_DIR / "hooks"
SETTINGS = CLAUDE_DIR / "settings.json"

# (script name, event, matcher, timeout)
HOOK_SPECS = [
    ("thoven-guard-bash", "PreToolUse", "Bash", 10),
    ("thoven-track-edits", "PostToolUse", "Edit|Write|Bash", 10),
    ("thoven-require-evidence", "Stop", None, 10),
    ("thoven-uncommitted", "Stop", None, 10),
]


def deny_token(argv: list) -> str:
    return f"Bash({' '.join(argv)}:*)"


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

    original = read_json(SETTINGS, {})
    settings = copy.deepcopy(original)

    plan = []
    for script_name, event, matcher, timeout in HOOK_SPECS:
        command = command_for(script_name)
        src = ENFORCEMENT_DIR / "hooks" / script_name
        copy_needed = needs_copy(src, HOOKS_DIR / script_name)
        settings_needed = not hook_already_present(settings, event, command)
        plan.append((script_name, event, matcher, timeout, command, copy_needed, settings_needed))

    wanted_denies = [deny_token(d["argv"]) for d in load_denies()]
    missing_denies = [t for t in wanted_denies if t not in settings.get("permissions", {}).get("deny", [])]

    print(f"Target settings file: {SETTINGS}")
    print(f"Target hooks dir: {HOOKS_DIR}")
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        print(f"- {script_name}: copy={'yes' if copy_needed else 'no (already matches)'} "
              f"settings_entry[{event}/{matcher or '-'}]={'add' if settings_needed else 'already present'}")
    for token in wanted_denies:
        print(f"- permissions.deny {token}: {'add' if token in missing_denies else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    changed = False
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        if copy_needed:
            copy_file(ENFORCEMENT_DIR / "hooks" / script_name, HOOKS_DIR / script_name, executable=True)
            changed = True
        if settings_needed:
            add_hook(settings, event, matcher, command, timeout)
            print(f"Added {event}/{matcher or '-'} entry for {script_name}")
    for token in add_missing(settings.setdefault("permissions", {}).setdefault("deny", []), wanted_denies):
        print(f"Added permissions.deny {token}")

    if settings != original:
        write_json(SETTINGS, settings)
        changed = True
    if not changed:
        print("No changes.")


if __name__ == "__main__":
    sys.exit(main())
