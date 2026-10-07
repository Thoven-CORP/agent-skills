#!/usr/bin/env python3
"""Installs the enforcement hooks and the deny list into Claude Code's settings.json,
and points CLAUDE_CODE_PLUGIN_DIRS in its env block at the cockpit plugin.

Dry run by default. Pass --apply to write. Do not run --apply against a
live settings.json unless you mean to touch it: these hooks are already
wired on this machine, so the normal use of this script is proof, not
install. --rollback takes the cockpit out of CLAUDE_CODE_PLUGIN_DIRS and
leaves everything else alone; it is a dry run too without --apply.
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

# ADR2 (THV-1053): the main checkout, never a worktree, which breaks when it is cleaned.
PLUGIN_DIRS_ENV = "CLAUDE_CODE_PLUGIN_DIRS"
AGENT_SKILLS_MAIN = Path.home() / "thoven" / "agent-skills"
COCKPIT_DIR = AGENT_SKILLS_MAIN / "claude" / "plugins" / "thoven-cockpit"

# (script name, event, matcher, timeout)
HOOK_SPECS = [
    ("thoven-guard-bash", "PreToolUse", "Bash", 10),
    ("thoven-track-edits", "PostToolUse", "Edit|Write|Bash", 10),
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


def is_cockpit(path: str) -> bool:
    """Any copy of the cockpit plugin: the main checkout's or a worktree's."""
    return Path(path).name == COCKPIT_DIR.name


def with_cockpit(dirs: list) -> list:
    """The main checkout's cockpit in place of any other copy, every other folder kept in order."""
    main = str(COCKPIT_DIR)
    if main in dirs:
        return [d for d in dirs if d == main or not is_cockpit(d)]
    return [d for d in dirs if not is_cockpit(d)] + [main]


def cockpit_problem():
    """Why the cockpit cannot be pointed at, or None. A worktree's `.git` is a file, not a folder."""
    if not (AGENT_SKILLS_MAIN / ".git").is_dir():
        return f"{AGENT_SKILLS_MAIN} is not a main checkout"
    if not (COCKPIT_DIR / ".claude-plugin" / "plugin.json").is_file():
        return f"{COCKPIT_DIR} holds no .claude-plugin/plugin.json"
    return None


def rollback(apply: bool) -> int:
    original = read_json(SETTINGS, {})
    settings = copy.deepcopy(original)
    dirs = plugin_dirs(settings)
    kept = [d for d in dirs if not is_cockpit(d)]
    print(f"Target settings file: {SETTINGS}")
    print(f"- env {PLUGIN_DIRS_ENV}: {'remove ' + ', '.join(d for d in dirs if is_cockpit(d)) if kept != dirs else 'no cockpit entry'}")
    if not apply:
        print("\nDry run only. Re-run with --rollback --apply to write.")
        return 0
    set_plugin_dirs(settings, kept)
    if settings != original:
        write_json(SETTINGS, settings)
    else:
        print("No changes.")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    parser.add_argument("--rollback", action="store_true", help=f"take the cockpit out of {PLUGIN_DIRS_ENV} only")
    args = parser.parse_args()
    if args.rollback:
        return rollback(args.apply)

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
    problem = cockpit_problem()
    dirs = plugin_dirs(settings)
    wanted_dirs = dirs if problem else with_cockpit(dirs)
    if problem:
        print(f"- env {PLUGIN_DIRS_ENV}: skipped, {problem}")
    else:
        print(f"- env {PLUGIN_DIRS_ENV}={os.pathsep.join(wanted_dirs)}: {'set' if wanted_dirs != dirs else 'already present'}")

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
    if wanted_dirs != dirs:
        set_plugin_dirs(settings, wanted_dirs)
        print(f"Set env {PLUGIN_DIRS_ENV}={os.pathsep.join(wanted_dirs)}")

    if settings != original:
        write_json(SETTINGS, settings)
        changed = True
    if not changed:
        print("No changes.")
    return 1 if problem else 0


if __name__ == "__main__":
    sys.exit(main())
