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
cockpit = str(tmp / "thoven" / "agent-skills" / "claude" / "plugins" / "thoven-cockpit")
worktree = str(tmp / "thoven" / "agent-skills-thv-1063" / "claude" / "plugins" / "thoven-cockpit")
settings = tmp / ".claude" / "settings.json"


def run(*args, ok=True):
    got = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=dict(os.environ, HOME=str(tmp)))
    assert (got.returncode == 0) == ok, f"exit {got.returncode}\n{got.stdout}\n{got.stderr}"
    return got.stdout


def env():
    return json.loads(settings.read_text()).get("env", {})


def main_checkout():
    (tmp / "thoven" / "agent-skills" / ".git").mkdir(parents=True)
    plugin = Path(cockpit) / ".claude-plugin"
    plugin.mkdir(parents=True)
    (plugin / "plugin.json").write_text('{"name": "thoven-cockpit"}\n')


try:
    # Without a main checkout the step is skipped, says why, and an --apply exits 1.
    out = run()
    assert f"- env {KEY}: skipped, {tmp}/thoven/agent-skills is not a main checkout" in out, out
    assert not settings.exists(), "dry run wrote settings.json"
    run("--apply", ok=False)
    assert KEY not in env(), env()
    settings.unlink()

    main_checkout()
    settings.write_text(json.dumps({"env": {"OTHER": "1", KEY: f"/opt/other-plugin:{worktree}"}}, indent=2) + "\n")
    original = settings.read_bytes()

    out = run()
    assert f"- env {KEY}=/opt/other-plugin:{cockpit}: set" in out, out
    assert settings.read_bytes() == original, "dry run wrote settings.json"

    # The worktree copy is replaced by the main checkout, other folders and env keys are kept.
    run("--apply")
    assert env() == {"OTHER": "1", KEY: f"/opt/other-plugin:{cockpit}"}, env()
    assert (tmp / ".claude" / "settings.json.bak-thv969").read_bytes() == original, "backup is not the original"
    applied = settings.read_bytes()

    out = run("--apply")
    assert settings.read_bytes() == applied, "second --apply changed settings.json"
    assert f"- env {KEY}=/opt/other-plugin:{cockpit}: already present" in out, out
    assert "No changes." in out, out

    out = run("--rollback")
    assert f"- env {KEY}: remove {cockpit}" in out, out
    assert settings.read_bytes() == applied, "rollback dry run wrote settings.json"

    run("--rollback", "--apply")
    assert env() == {"OTHER": "1", KEY: "/opt/other-plugin"}, env()
    assert "hooks" in json.loads(settings.read_text()), "rollback removed the hooks"
    rolled = settings.read_bytes()
    out = run("--rollback", "--apply")
    assert settings.read_bytes() == rolled and "No changes." in out, out

    # With the cockpit as the only folder, rollback removes the variable itself.
    data = json.loads(settings.read_text())
    data["env"] = {KEY: cockpit}
    settings.write_text(json.dumps(data, indent=2) + "\n")
    run("--rollback", "--apply")
    assert "env" not in json.loads(settings.read_text()), settings.read_text()
finally:
    assert tmp.name.startswith("thv1063.") and str(tmp.parent) == "/tmp", tmp
    shutil.rmtree(tmp)

print("test_claude: all passed")
