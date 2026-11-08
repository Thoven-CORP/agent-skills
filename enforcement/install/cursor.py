#!/usr/bin/env python3
"""Installs the enforcement agents, the shell guard, the edit tracker, and the deny list into Cursor.

The guard runs on Cursor's beforeShellExecution event, which the IDE and the
cursor-agent CLI both fire (cursor.com/docs/hooks). The deny list goes into
~/.cursor/cli-config.json as Shell(command:args) tokens: Cursor matches
Shell(x) against the first token only, and command:args globs the arguments
(cursor.com/docs/cli/reference/permissions). thoven-track-edits writes the session's
edit log on afterFileEdit and afterShellExecution (cursor.com/docs/hooks).

Dry run by default. Pass --apply to write.
"""
import argparse
import copy
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR, add_missing, copy_file, drop_retired, load_denies, needs_copy, read_json, write_json

CURSOR_DIR = Path.home() / ".cursor"
CURSOR_AGENTS_DIR = CURSOR_DIR / "agents"
HOOKS_DIR = CURSOR_DIR / "hooks"
HOOKS_JSON = CURSOR_DIR / "hooks.json"
CLI_CONFIG = CURSOR_DIR / "cli-config.json"

AGENT_FILES = ["verifier.md", "ui-builder.md", "explorer.md", "poteto-agent.md"]

# (script name, event, timeout, extra args); each runs as `<hooks dir>/<script> --dialect cursor<extra args>`
HOOK_ENTRIES = [
    ("thoven-guard-bash", "beforeShellExecution", 10, ""),
    ("thoven-track-edits", "beforeShellExecution", 10, " --pre"),
    ("thoven-track-edits", "afterFileEdit", 10, ""),
    ("thoven-track-edits", "afterShellExecution", 10, ""),
]


def deny_token(argv: list) -> str:
    return f"Shell({argv[0]}:{' '.join(argv[1:])}*)"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    plan = []
    for name in AGENT_FILES:
        src = ENFORCEMENT_DIR / "agents" / name
        dest = CURSOR_AGENTS_DIR / name
        plan.append((name, src, dest, needs_copy(src, dest)))

    hooks_orig = read_json(HOOKS_JSON, {"version": 1, "hooks": {}})
    hooks_cfg = copy.deepcopy(hooks_orig)
    for entry in drop_retired(hooks_cfg):
        print(f"- retired hook: remove {entry}")
    hook_plan = []
    for script_name, event, timeout, extra in HOOK_ENTRIES:
        src = ENFORCEMENT_DIR / "hooks" / script_name
        dest = HOOKS_DIR / script_name
        command = f"{dest} --dialect cursor{extra}"
        hook_needed = not any(e.get("command") == command for e in hooks_cfg.get("hooks", {}).get(event, []))
        hook_plan.append((src, dest, needs_copy(src, dest), event, command, timeout, hook_needed))

    cli_orig = read_json(CLI_CONFIG, {})
    cli_cfg = copy.deepcopy(cli_orig)
    wanted_denies = [deny_token(d["argv"]) for d in load_denies()]
    missing_denies = [t for t in wanted_denies if t not in cli_cfg.get("permissions", {}).get("deny", [])]

    print(f"Target agents dir: {CURSOR_AGENTS_DIR}")
    for name, src, dest, copy_needed in plan:
        print(f"- {name}: copy={'yes' if copy_needed else 'no (already matches)'}")
    for src, dest, copy_needed, event, command, timeout, hook_needed in hook_plan:
        print(f"- {dest}: copy={'yes' if copy_needed else 'no (already matches)'}")
        print(f"- {HOOKS_JSON} hooks.{event}: {'add' if hook_needed else 'already present'} {command}")
    for token in wanted_denies:
        print(f"- {CLI_CONFIG} permissions.deny {token}: {'add' if token in missing_denies else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    changed = False
    for name, src, dest, copy_needed in plan:
        if copy_needed:
            copy_file(src, dest)
            changed = True
    for src, dest, copy_needed, event, command, timeout, hook_needed in hook_plan:
        if copy_needed:
            copy_file(src, dest, executable=True)
            changed = True
        if hook_needed:
            hooks_cfg.setdefault("version", 1)
            hooks_cfg.setdefault("hooks", {}).setdefault(event, []).append({"command": command, "timeout": timeout})
            print(f"Added hooks.{event} entry {command}")
    if hooks_cfg != hooks_orig or not HOOKS_JSON.exists():
        write_json(HOOKS_JSON, hooks_cfg)
        changed = True

    for token in add_missing(cli_cfg.setdefault("permissions", {}).setdefault("deny", []), wanted_denies):
        print(f"Added permissions.deny {token}")
    if cli_cfg != cli_orig:
        write_json(CLI_CONFIG, cli_cfg)
        changed = True

    if not changed:
        print("No changes.")


if __name__ == "__main__":
    sys.exit(main())
