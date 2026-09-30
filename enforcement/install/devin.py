#!/usr/bin/env python3
"""Installs the shell guard, the edit tracker, the uncommitted-edits stop hook, and the deny list into Devin CLI's config.json.

Devin's config here sets read_config_from.claude=false, so it never sees
Claude's settings and gets its own entries. Its PreToolUse matcher is a regex
on tool_name and its shell tool is "exec"; it blocks only on exit 2
(docs.devin.ai/cli/extensibility/hooks/overview). Deny rules are Exec(prefix)
tokens and always beat an allow such as Exec(git)
(docs.devin.ai/cli/reference/permissions). thoven-track-edits writes the session's
edit log on PostToolUse for the file tools and exec. thoven-uncommitted reads it on
Stop, which blocks with {"decision":"block","reason":...} on stdout and sends
stop_hook_active (docs.devin.ai/cli/extensibility/hooks/lifecycle-hooks).

Dry run by default. Pass --apply to write.
"""
import argparse
import copy
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR, add_missing, copy_file, load_denies, needs_copy, read_json, write_json

DEVIN_DIR = Path.home() / ".config" / "devin"
HOOKS_DIR = DEVIN_DIR / "hooks"
CONFIG = DEVIN_DIR / "config.json"

# (script name, event, matcher, timeout); each runs as `<hooks dir>/<script> --dialect devin`
HOOK_ENTRIES = [
    ("thoven-guard-bash", "PreToolUse", "^exec$", 10),
    ("thoven-track-edits", "PostToolUse", "^(edit|write|notebook_edit|apply_patch|exec)$", 10),
    ("thoven-uncommitted", "Stop", "", 10),
]


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

    original = read_json(CONFIG, {})
    config = copy.deepcopy(original)
    hook_plan = []
    for script_name, event, matcher, timeout in HOOK_ENTRIES:
        src = ENFORCEMENT_DIR / "hooks" / script_name
        dest = HOOKS_DIR / script_name
        command = f"{dest} --dialect devin"
        hook_needed = not hook_already_present(config, event, command)
        hook_plan.append((src, dest, needs_copy(src, dest), event, matcher, command, timeout, hook_needed))
    wanted_denies = [deny_token(d["argv"]) for d in load_denies()]
    missing_denies = [t for t in wanted_denies if t not in config.get("permissions", {}).get("deny", [])]

    print(f"Target config: {CONFIG}")
    for src, dest, copy_needed, event, matcher, command, timeout, hook_needed in hook_plan:
        print(f"- {dest}: copy={'yes' if copy_needed else 'no (already matches)'}")
        print(f"- hooks.{event}[{matcher}]: {'add' if hook_needed else 'already present'} {command}")
    for token in wanted_denies:
        print(f"- permissions.deny {token}: {'add' if token in missing_denies else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    changed = False
    for src, dest, copy_needed, event, matcher, command, timeout, hook_needed in hook_plan:
        if copy_needed:
            copy_file(src, dest, executable=True)
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
