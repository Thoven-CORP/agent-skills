#!/usr/bin/env python3
"""Installs the enforcement hooks into Codex's hooks.json.

Codex uses the identical hooks.json shape as Claude Code, in its own file.
Dry run by default. Pass --apply to write.
"""
import argparse
import json
import shutil
import stat
import sys
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
CODEX_DIR = Path.home() / ".codex"
HOOKS_DIR = CODEX_DIR / "hooks"
HOOKS_JSON = CODEX_DIR / "hooks.json"

# (script name, event, matcher, timeout)
HOOK_SPECS = [
    ("thoven-guard-bash", "PreToolUse", "Bash", 10),
    ("thoven-track-edits", "PostToolUse", "Edit|Write|Bash", 10),
    ("thoven-require-evidence", "Stop", None, 10),
]


def command_for(script_name: str) -> str:
    return str(HOOKS_DIR / script_name)


def hook_already_present(config: dict, event: str, command: str) -> bool:
    for entry in config.get("hooks", {}).get(event, []):
        for h in entry.get("hooks", []):
            if h.get("command") == command:
                return True
    return False


def add_hook(config: dict, event: str, matcher, command: str, timeout: int) -> None:
    config.setdefault("hooks", {}).setdefault(event, [])
    hook_entry = {"command": command, "type": "command", "timeout": timeout}
    block = {"hooks": [hook_entry]}
    if matcher:
        block["matcher"] = matcher
    config["hooks"][event].append(block)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    config = json.loads(HOOKS_JSON.read_text()) if HOOKS_JSON.exists() else {"hooks": {}}

    plan = []
    for script_name, event, matcher, timeout in HOOK_SPECS:
        command = command_for(script_name)
        src = ENFORCEMENT_DIR / "hooks" / script_name
        dest = HOOKS_DIR / script_name
        copy_needed = not dest.exists() or dest.read_bytes() != src.read_bytes()
        settings_needed = not hook_already_present(config, event, command)
        plan.append((script_name, event, matcher, timeout, command, copy_needed, settings_needed))

    print(f"Target hooks.json: {HOOKS_JSON}")
    print(f"Target hooks dir: {HOOKS_DIR}")
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        print(f"- {script_name}: copy={'yes' if copy_needed else 'no (already matches)'} "
              f"hooks_entry[{event}/{matcher or '-'}]={'add' if settings_needed else 'already present'}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    if HOOKS_JSON.exists():
        backup = HOOKS_JSON.with_suffix(HOOKS_JSON.suffix + ".bak")
        if not backup.exists():
            shutil.copy2(HOOKS_JSON, backup)
            print(f"Backed up {HOOKS_JSON} to {backup}")

    HOOKS_DIR.mkdir(parents=True, exist_ok=True)
    for script_name, event, matcher, timeout, command, copy_needed, settings_needed in plan:
        if copy_needed:
            src = ENFORCEMENT_DIR / "hooks" / script_name
            dest = HOOKS_DIR / script_name
            shutil.copy2(src, dest)
            dest.chmod(dest.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
            print(f"Copied {src} -> {dest}")
        if settings_needed:
            add_hook(config, event, matcher, command, timeout)
            print(f"Added {event}/{matcher or '-'} entry for {script_name}")

    HOOKS_JSON.write_text(json.dumps(config, indent=2) + "\n")
    print(f"Wrote {HOOKS_JSON}")


if __name__ == "__main__":
    sys.exit(main())
