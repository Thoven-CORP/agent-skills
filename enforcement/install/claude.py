#!/usr/bin/env python3
"""Installs the enforcement hooks and the deny list into Claude Code's settings.json,
and takes stale entries out of CLAUDE_CODE_PLUGIN_DIRS in its env block.

Dry run by default. Pass --apply to write. Do not run --apply against a
live settings.json unless you mean to touch it: these hooks are already
wired on this machine, so the normal use of this script is proof, not
install.
"""
import argparse
import copy
import json
import os
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR, add_missing, copy_file, load_denies, needs_copy, read_json, write_json

CLAUDE_DIR = Path.home() / ".claude"
HOOKS_DIR = CLAUDE_DIR / "hooks"
SETTINGS = CLAUDE_DIR / "settings.json"

PLUGIN_DIRS_ENV = "CLAUDE_CODE_PLUGIN_DIRS"

# (script name, event, matcher, timeout, args); --pre stamps the start of each shell call
HOOK_SPECS = [
    ("thoven-guard-bash", "PreToolUse", "Bash", 10, ""),
    ("thoven-track-edits", "PreToolUse", "Bash", 10, " --pre"),
    ("thoven-track-edits", "PostToolUse", "Edit|Write|Bash", 10, ""),
    ("thoven-uncommitted", "Stop", None, 10, ""),
    ("thoven-andres-mode", "SessionStart", "startup|clear|compact", 10, ""),
    ("thoven-ticket-recall", "UserPromptSubmit", None, 6, " --harness claude"),
]


def deny_token(argv: list) -> str:
    return f"Bash({' '.join(argv)}:*)"


def command_for(script_name: str, args: str = "") -> str:
    return str(HOOKS_DIR / script_name) + args


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


def plugin_dirs(settings: dict) -> list:
    """Claude Code splits the variable on the path delimiter, as PATH is split."""
    return [d for d in settings.get("env", {}).get(PLUGIN_DIRS_ENV, "").split(os.pathsep) if d.strip()]


def set_plugin_dirs(settings: dict, dirs: list) -> None:
    env = settings.setdefault("env", {})
    if dirs:
        env[PLUGIN_DIRS_ENV] = os.pathsep.join(dirs)
    else:
        env.pop(PLUGIN_DIRS_ENV, None)
    if not env:
        del settings["env"]


def is_stale(path: str) -> bool:
    """A folder under an agent-skills checkout's claude/plugins/, main or worktree: the repo ships no
    Claude plugin any more, so an entry there points at a deleted folder."""
    parts = Path(path).parts
    return any(p.startswith("agent-skills") and parts[i + 1 : i + 3] == ("claude", "plugins")
               for i, p in enumerate(parts))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    original = read_json(SETTINGS, {})
    settings = copy.deepcopy(original)

    plan = []
    for script_name, event, matcher, timeout, extra in HOOK_SPECS:
        command = command_for(script_name, extra)
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
    dirs = plugin_dirs(settings)
    wanted_dirs = [d for d in dirs if not is_stale(d)]
    gone = [d for d in dirs if is_stale(d)]
    print(f"- env {PLUGIN_DIRS_ENV}: {'remove ' + ', '.join(gone) if gone else 'no stale entry'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return 0

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
    if gone:
        set_plugin_dirs(settings, wanted_dirs)
        print(f"Removed {', '.join(gone)} from env {PLUGIN_DIRS_ENV}")

    if settings != original:
        write_json(SETTINGS, settings)
        changed = True
    if not changed:
        print("No changes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
