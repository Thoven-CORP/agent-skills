#!/usr/bin/env python3
"""Runs claude.py against a throwaway HOME under /tmp; never touches the real ~/.claude."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "claude.py"
KEY = "CLAUDE_CODE_PLUGIN_DIRS"

tmp = Path(tempfile.mkdtemp(prefix="thv1063.", dir="/tmp"))
stale = str(tmp / "thoven" / "agent-skills" / "claude" / "plugins" / "retired-plugin")
stale_worktree = str(tmp / "thoven" / "agent-skills-thv-1063" / "claude" / "plugins" / "retired-plugin")
settings = tmp / ".claude" / "settings.json"


def run(*args, ok=True):
    got = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=dict(os.environ, HOME=str(tmp)))
    assert (got.returncode == 0) == ok, f"exit {got.returncode}\n{got.stdout}\n{got.stderr}"
    return got.stdout


def data():
    return json.loads(settings.read_text())


def write(value):
    settings.parent.mkdir(parents=True, exist_ok=True)
    settings.write_text(json.dumps(value, indent=2) + "\n")


try:
    # Empty input: no settings.json. Nothing is added to the env, and --apply leaves no env block.
    out = run()
    assert f"- env {KEY}: no stale entry" in out, out
    assert not settings.exists(), "dry run wrote settings.json"
    run("--apply")
    assert "env" not in data(), data()
    assert "hooks" in data(), "the hooks were not installed"
    out = run("--apply")
    assert "No changes." in out, out

    # Present input: the retired plugin folder, from the main checkout and a worktree, beside a live one.
    write({**data(), "env": {"OTHER": "1", KEY: f"{stale}:/opt/other-plugin:{stale_worktree}"}})
    original = settings.read_bytes()
    out = run()
    assert f"- env {KEY}: remove {stale}, {stale_worktree}" in out, out
    assert settings.read_bytes() == original, "dry run wrote settings.json"
    run("--apply")
    assert data()["env"] == {"OTHER": "1", KEY: "/opt/other-plugin"}, data()["env"]
    applied = settings.read_bytes()
    out = run("--apply")
    assert settings.read_bytes() == applied and "No changes." in out, out
    assert f"- env {KEY}: no stale entry" in out, out

    # When the stale folder was the only entry, the variable goes, and an env block left empty goes too.
    write({**data(), "env": {KEY: stale}})
    run("--apply")
    assert "env" not in data(), data()
    assert "--rollback" not in run("--help")

    # The session-procs hooks land on their three events with their modes.
    write({})
    run("--apply")
    for event, suffix in (("PostToolUse", "thoven-session-procs record"), ("SessionEnd", "thoven-session-procs end"),
                          ("SubagentStop", "thoven-session-procs end --agent")):
        found = [h["command"] for e in data()["hooks"][event] for h in e["hooks"] if "thoven-session-procs" in h["command"]]
        assert len(found) == 1 and found[0].endswith(suffix), (event, found)
finally:
    assert tmp.name.startswith("thv1063.") and str(tmp.parent) == "/tmp", tmp
    shutil.rmtree(tmp)

print("test_claude: all passed")
