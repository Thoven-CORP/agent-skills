#!/usr/bin/env python3
"""Installs the shell guard, its plugin adapter, the edit-tracker plugin, and the deny list into OpenCode.

OpenCode has no shell-hook config. A plugin's tool.execute.before runs the guard
and throws to block (opencode.ai/docs/plugins). The deny list becomes
permission.bash glob rules; the last matching rule wins, so they are appended
(opencode.ai/docs/permissions). thoven-track-edits.js feeds thoven-track-edits from
tool.execute.after.
opencode.jsonc is only edited when it parses as plain JSON, because rewriting it
would drop its comments.

Dry run by default. Pass --apply to write.
"""
import argparse
import copy
import json
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR, GUARD, copy_file, load_denies, needs_copy, write_json

OPENCODE_DIR = Path.home() / ".config" / "opencode"
CONFIG = OPENCODE_DIR / "opencode.jsonc"

# (repo source, installed copy, executable)
FILES = [
    (GUARD, OPENCODE_DIR / "hooks" / "thoven-guard-bash", True),
    (ENFORCEMENT_DIR / "opencode" / "thoven-guard.js", OPENCODE_DIR / "plugins" / "thoven-guard.js", False),
    (ENFORCEMENT_DIR / "hooks" / "thoven-track-edits", OPENCODE_DIR / "hooks" / "thoven-track-edits", True),
    (ENFORCEMENT_DIR / "opencode" / "thoven-track-edits.js", OPENCODE_DIR / "plugins" / "thoven-track-edits.js", False),
]
# Installed by earlier versions. OpenCode loads every file in plugins/, so a retired plugin is deleted.
RETIRED_FILES = [
    OPENCODE_DIR / "plugins" / "thoven-uncommitted.js",
    OPENCODE_DIR / "hooks" / "thoven-uncommitted",
]


def deny_pattern(argv: list) -> str:
    return f"{' '.join(argv)}*"


def with_denies(config: dict, patterns: list) -> dict:
    config = copy.deepcopy(config)
    perm = config.get("permission")
    if isinstance(perm, str):
        perm = {"*": perm}
    perm = perm if isinstance(perm, dict) else {}
    bash = perm.get("bash")
    if isinstance(bash, str):
        bash = {"*": bash}
    bash = bash if isinstance(bash, dict) else {}
    for p in patterns:
        if bash.get(p) != "deny":
            bash.pop(p, None)
            bash[p] = "deny"
    perm["bash"] = bash
    config["permission"] = perm
    return config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    args = parser.parse_args()

    plan = [(src, dest, exe, needs_copy(src, dest)) for src, dest, exe in FILES]
    patterns = [deny_pattern(d["argv"]) for d in load_denies()]

    config = wanted = None
    skip_reason = None
    if not CONFIG.exists():
        skip_reason = f"{CONFIG} does not exist"
    else:
        try:
            config = json.loads(CONFIG.read_text())
            wanted = with_denies(config, patterns)
        except json.JSONDecodeError:
            skip_reason = f"{CONFIG} has comments or is not plain JSON; not rewriting JSONC"

    print(f"Target config dir: {OPENCODE_DIR}")
    for path in RETIRED_FILES:
        if path.exists():
            print(f"- {path}: remove (retired)")
    for src, dest, exe, copy_needed in plan:
        print(f"- {dest}: copy={'yes' if copy_needed else 'no (already matches)'}")
    if skip_reason:
        print(f"- permission.bash deny rules skipped: {skip_reason}")
    else:
        for p in patterns:
            present = config.get("permission", {}).get("bash", {}) if isinstance(config.get("permission"), dict) else {}
            state = "already present" if isinstance(present, dict) and present.get(p) == "deny" else "add"
            print(f"- permission.bash {json.dumps(p)}: deny {state}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    changed = False
    for path in RETIRED_FILES:
        if path.exists():
            path.unlink()
            print(f"Removed retired {path}")
            changed = True
    for src, dest, exe, copy_needed in plan:
        if copy_needed:
            copy_file(src, dest, executable=exe)
            changed = True
    if not skip_reason and wanted != config:
        write_json(CONFIG, wanted)
        changed = True
    if not changed:
        print("No changes.")


if __name__ == "__main__":
    sys.exit(main())
