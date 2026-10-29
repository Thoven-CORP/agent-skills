#!/usr/bin/env python3
"""Checks the rendered co.thoven.server-reaper plist. Writes nothing and loads nothing."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import server_reaper  # noqa: E402

home = Path("/Users/someone")
plist = server_reaper.render_plist(home)

assert plist["Label"] == "co.thoven.server-reaper", plist["Label"]
assert plist["StartInterval"] == 1800, plist["StartInterval"]
assert plist["ProgramArguments"] == ["/Users/someone/.thoven/bin/thoven-server-reaper"], plist["ProgramArguments"]
assert os.path.isfile(server_reaper.SOURCE) and os.access(server_reaper.SOURCE, os.X_OK), server_reaper.SOURCE
assert plist["StandardErrorPath"] == plist["StandardOutPath"] == "/Users/someone/.thoven/server-reaper-launchd.log", plist
assert plist["EnvironmentVariables"]["HOME"] == "/Users/someone", plist["EnvironmentVariables"]

print("test_server_reaper: all passed")
