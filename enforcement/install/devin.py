#!/usr/bin/env python3
"""Installs the shell guard and the deny list into Devin CLI's config.json.

Devin's config here sets read_config_from.claude=false, so it never sees
Claude's settings and gets its own entries. Its PreToolUse matcher is a regex
on tool_name and its shell tool is "exec"; it blocks only on exit 2
(docs.devin.ai/cli/extensibility/hooks/overview). Deny rules are Exec(prefix)
tokens and always beat an allow such as Exec(git)
(docs.devin.ai/cli/reference/permissions).

Dry run by default. Pass --apply to write.
"""
import argparse
import copy
import sys
from pathlib import Path

from common import GUARD, add_missing, copy_file, load_denies, needs_copy, read_json, write_json

DEVIN_DIR = Path.home() / ".config" / "devin"
HOOKS_DIR = DEVIN_DIR / "hooks"
CONFIG = DEVIN_DIR / "config.json"

# (event, matcher, command, timeout)
HOOK_ENTRY = ("PreToolUse", "^exec$", f"{HOOKS_DIR / 'thoven-guard-bash'} --dialect devin", 10)


def deny_token(argv: list) -> str:
    return f"Exec({' '.join(argv)})"


def hook_already_present(config: dict, event: str, command: str) -> bool:
    for entry in config.get("hooks", {}).get(event, []):
        for h in entry.get("hooks", []):
            if h.get("command") == command:
                return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    guard_dest = HOOKS_DIR / "thoven-guard-bash"
    guard_copy = needs_copy(GUARD, guard_dest)

    event, matcher, command, timeout = HOOK_ENTRY
    original = read_json(CONFIG, {})
    config = copy.deepcopy(original)
    hook_needed = not hook_already_present(config, event, command)
    wanted_denies = [deny_token(d["argv"]) for d in load_denies()]
    missing_denies = [t for t in wanted_denies if t not in config.get("permissions", {}).get("deny", [])]

    print(f"Target config: {CONFIG}")
    print(f"- {guard_dest}: copy={'yes' if guard_copy else 'no (already matches)'}")
    print(f"- hooks.{event}[{matcher}]: {'add' if hook_needed else 'already present'} {command}")
    for token in wanted_denies:
        print(f"- permissions.deny {token}: {'add' if token in missing_denies else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    changed = False
    if guard_copy:
        copy_file(GUARD, guard_dest, executable=True)
        changed = True
    if hook_needed:
        config.setdefault("hooks", {}).setdefault(event, []).append(
            {"matcher": matcher, "hooks": [{"type": "command", "command": command, "timeout": timeout}]}
        )
        print(f"Added hooks.{event}[{matcher}] entry {command}")
    for token in add_missing(config.setdefault("permissions", {}).setdefault("deny", []), wanted_denies):
        print(f"Added permissions.deny {token}")
    if config != original:
        write_json(CONFIG, config)
        changed = True
    if not changed:
        print("No changes.")


if __name__ == "__main__":
    sys.exit(main())
