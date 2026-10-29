#!/usr/bin/env python3
"""Installs bin/thoven-server-reaper to ~/.thoven/bin and a LaunchAgent that runs it every 30 minutes.

The copy keeps the job independent of whichever branch the agent-skills checkout is on.
Dry run by default. Pass --apply to copy the script, write the plist and (re)load it.
"""
import argparse
import os
import plistlib
import shutil
import subprocess
import sys
from pathlib import Path

from common import ENFORCEMENT_DIR

LABEL = "co.thoven.server-reaper"
PLIST = Path.home() / "Library" / "LaunchAgents" / f"{LABEL}.plist"
SOURCE = ENFORCEMENT_DIR / "bin" / "thoven-server-reaper"
JOB_PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"


def installed_script(home: Path) -> Path:
    return home / ".thoven" / "bin" / "thoven-server-reaper"


def render_plist(home: Path) -> dict:
    log = str(home / ".thoven" / "server-reaper-launchd.log")
    return {
        "Label": LABEL,
        "ProgramArguments": [str(installed_script(home))],
        "StartInterval": 1800,
        "RunAtLoad": True,
        "StandardOutPath": log,
        "StandardErrorPath": log,
        "EnvironmentVariables": {"PATH": JOB_PATH, "HOME": str(home)},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="copy, write and load; default is dry run")
    args = parser.parse_args()

    home = Path.home()
    target = installed_script(home)
    wanted = render_plist(home)
    domain = f"gui/{os.getuid()}"
    print(f"- copy {SOURCE} to {target}")
    print(f"- write {PLIST}: runs it every {wanted['StartInterval']}s and at load")
    print(f"- then: launchctl bootout {domain}/{LABEL} (failure ignored); launchctl bootstrap {domain} {PLIST}")
    if not args.apply:
        print("\nDry run only. Re-run with --apply to install and load.")
        return 0

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, target)
    target.chmod(0o755)
    PLIST.parent.mkdir(parents=True, exist_ok=True)
    with PLIST.open("wb") as f:
        plistlib.dump(wanted, f)
    subprocess.run(["launchctl", "bootout", f"{domain}/{LABEL}"], capture_output=True)
    loaded = subprocess.run(["launchctl", "bootstrap", domain, str(PLIST)], capture_output=True, text=True)
    if loaded.returncode != 0:
        print(f"launchctl bootstrap failed: {loaded.stderr.strip()}", file=sys.stderr)
        return 1
    print(f"Installed {target} and loaded {LABEL} into {domain}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
