#!/usr/bin/env python3
"""Installs a LaunchAgent that runs bin/thoven-sync every 30 minutes and at login.

Dry run by default. Pass --apply to write the plist and (re)load it with launchctl.
"""
import argparse
import os
import plistlib
import shutil
import subprocess
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR

LABEL = "co.thoven.sync"
PLIST = Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"
SYNC = ENFORCEMENT_DIR / "bin" / "thoven-sync"
BACKUP_SUFFIX = ".bak-thv974"
# launchd hands a job a bare PATH, which lacks Homebrew's git.
JOB_PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"


def render_plist(home: Path) -> dict:
    log = str(home / ".thoven" / "sync-launchd.log")
    return {
        "Label": LABEL,
        "ProgramArguments": [str(SYNC)],
        "StartInterval": 1800,
        "RunAtLoad": True,
        "StandardOutPath": log,
        "StandardErrorPath": log,
        "EnvironmentVariables": {"PATH": JOB_PATH, "HOME": str(home)},
    }


def current():
    try:
        return plistlib.loads(PLIST.read_bytes())
    except (OSError, plistlib.InvalidFileException):
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write and load; default is dry run")
    args = parser.parse_args()

    home = Path.home()
    wanted = render_plist(home)
    existing = current()
    differs = existing != wanted
    domain = f"gui/{os.getuid()}"

    print(f"Target plist: {PLIST}")
    print(f"- runs {SYNC} every {wanted['StartInterval']}s and at load, logging to {wanted['StandardOutPath']}")
    print(f"- plist: {'absent, write' if not PLIST.exists() else 'differs, rewrite' if differs else 'already matches'}")
    print(f"- then: launchctl bootout {domain}/{LABEL} (failure ignored); launchctl bootstrap {domain} {PLIST}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write and load.")
        return 0

    Path(wanted["StandardOutPath"]).parent.mkdir(parents=True, exist_ok=True)
    if differs:
        PLIST.parent.mkdir(parents=True, exist_ok=True)
        backup = PLIST.with_name(PLIST.name + BACKUP_SUFFIX)
        if PLIST.exists() and not backup.exists():
            shutil.copy2(PLIST, backup)
            print(f"Backed up {PLIST} to {backup}")
        with PLIST.open("wb") as f:
            plistlib.dump(wanted, f)
        print(f"Wrote {PLIST}")
    subprocess.run(["launchctl", "bootout", f"{domain}/{LABEL}"], capture_output=True)
    loaded = subprocess.run(["launchctl", "bootstrap", domain, str(PLIST)], capture_output=True, text=True)
    if loaded.returncode != 0:
        print(f"launchctl bootstrap failed: {loaded.stderr.strip()}", file=sys.stderr)
        return 1
    print(f"Loaded {LABEL} into {domain}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
