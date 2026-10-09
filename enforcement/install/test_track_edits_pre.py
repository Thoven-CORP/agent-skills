#!/usr/bin/env python3
"""Each installer registers thoven-track-edits --pre on its pre-shell event.

Runs every installer against a throwaway HOME; never touches the real ~/.claude, ~/.codex, ~/.cursor or ~/.config/devin.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def install(script, home):
    subprocess.run([sys.executable, str(HERE / script), "--apply"], capture_output=True, text=True,
                   env=dict(os.environ, HOME=str(home)))


def commands(config, event):
    found = []
    for entry in config["hooks"].get(event, []):
        found += [h["command"] for h in entry.get("hooks", [entry])]
    return found


class PreCommandRegistrationTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.home = Path(tmp.name).resolve()

    def assert_pre_hook(self, script, config_path, event, suffix):
        install(script, self.home)
        config = json.loads((self.home / config_path).read_text())
        wanted = [c for c in commands(config, event) if "thoven-track-edits" in c]
        self.assertEqual(1, len(wanted), commands(config, event))
        self.assertTrue(wanted[0].endswith(suffix), wanted[0])
        # the post hook is still there, without --pre
        post = "PostToolUse" if event == "PreToolUse" else "afterShellExecution"
        self.assertTrue(any("thoven-track-edits" in c and "--pre" not in c for c in commands(config, post)))

    def test_claude(self):
        self.assert_pre_hook("claude.py", ".claude/settings.json", "PreToolUse", "thoven-track-edits --pre")

    def test_codex(self):
        self.assert_pre_hook("codex.py", ".codex/hooks.json", "PreToolUse", "thoven-track-edits --pre")

    def test_cursor(self):
        self.assert_pre_hook("cursor.py", ".cursor/hooks.json", "beforeShellExecution", "--dialect cursor --pre")

    def test_devin(self):
        self.assert_pre_hook("devin.py", ".config/devin/config.json", "PreToolUse", "--dialect devin --pre")

    def test_second_apply_adds_nothing(self):
        install("claude.py", self.home)
        first = (self.home / ".claude/settings.json").read_bytes()
        install("claude.py", self.home)
        self.assertEqual(first, (self.home / ".claude/settings.json").read_bytes())


if __name__ == "__main__":
    unittest.main()
