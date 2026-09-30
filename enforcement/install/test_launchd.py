#!/usr/bin/env python3
"""Checks the rendered co.thoven.sync plist. Writes nothing and loads nothing."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import launchd  # noqa: E402

home = Path("/Users/someone")
plist = launchd.render_plist(home)

assert plist["Label"] == "co.thoven.sync", plist["Label"]
assert plist["StartInterval"] == 1800, plist["StartInterval"]
assert plist["RunAtLoad"] is True, plist["RunAtLoad"]
program = plist["ProgramArguments"]
assert len(program) == 1, program
assert os.path.isabs(program[0]), program
assert Path(program[0]).name == "thoven-sync", program
assert os.path.isfile(program[0]) and os.access(program[0], os.X_OK), f"{program[0]} is not an executable file"
assert plist["StandardOutPath"] == "/Users/someone/.thoven/sync-launchd.log", plist["StandardOutPath"]
assert plist["StandardErrorPath"] == plist["StandardOutPath"], plist["StandardErrorPath"]
assert plist["EnvironmentVariables"] == {
    "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
    "HOME": "/Users/someone",
}, plist["EnvironmentVariables"]
assert launchd.PLIST == Path.home() / "Library" / "LaunchAgents" / "co.thoven.sync.plist", launchd.PLIST

print("test_launchd: all passed")
