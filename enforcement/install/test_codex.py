import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import codex as installer


class CodexNotificationInstallTest(unittest.TestCase):
    def run_installer(self, root, apply=False):
        codex_dir = root / ".codex"
        with patch.multiple(installer, CODEX_DIR=codex_dir,
                            HOOKS_DIR=codex_dir / "hooks",
                            HOOKS_JSON=codex_dir / "hooks.json",
                            RULES=codex_dir / "rules" / "thoven.rules"), \
                patch.object(installer.sys, "argv", ["codex.py"] + (["--apply"] if apply else [])), \
                contextlib.redirect_stdout(io.StringIO()):
            installer.main()

    def test_optional_notification_cannot_fail_stop_after_install(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            settings = root / ".codex" / "hooks.json"
            settings.parent.mkdir()
            command = 'osascript -e \'display notification "Finished" with title "Codex"\''
            unrelated = {"command": "exit 7", "type": "command", "timeout": 5}
            original = {"hooks": {
                "Stop": [{"hooks": [{"command": command, "type": "command"}, unrelated]}],
                "PreToolUse": [{"hooks": [{"command": command, "type": "command"}]}],
            }}
            settings.write_text(json.dumps(original, indent=2) + "\n")
            before = settings.read_bytes()
            self.run_installer(root)
            self.assertEqual(before, settings.read_bytes(), "dry run changed settings")

            self.run_installer(root, apply=True)
            installed = json.loads(settings.read_text())
            stop_hooks = installed["hooks"]["Stop"][0]["hooks"]
            self.assertEqual(unrelated, stop_hooks[1])
            self.assertEqual(original["hooks"]["PreToolUse"][0], installed["hooks"]["PreToolUse"][0])
            self.assertEqual(before, settings.with_name("hooks.json.bak-thv969").read_bytes())

            fake = root / "osascript"
            marker = root / "notification-attempted"
            fake.write_text('#!/bin/sh\nprintf attempted > "$NOTIFICATION_PROBE"\nprintf "desktop unavailable\\n" >&2\nexit 1\n')
            fake.chmod(0o755)
            env = dict(os.environ, PATH=str(root) + ":" + os.environ["PATH"],
                       NOTIFICATION_PROBE=str(marker))
            result = subprocess.run(["/bin/sh", "-c", stop_hooks[0]["command"]],
                                    env=env, capture_output=True, text=True)
            self.assertTrue(marker.exists(), "notification was never attempted")
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual("", result.stderr)
            failed_guard = subprocess.run(["/bin/sh", "-c", stop_hooks[1]["command"]], env=env)
            self.assertEqual(7, failed_guard.returncode, "installer weakened another hook")

            applied = settings.read_bytes()
            self.run_installer(root, apply=True)
            self.assertEqual(applied, settings.read_bytes(), "second install changed settings")

    def test_install_does_not_add_desktop_notifications(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.run_installer(root, apply=True)
            hooks = json.loads((root / ".codex" / "hooks.json").read_text())
            self.assertFalse(any("osascript" in h["command"]
                                 for entries in hooks["hooks"].values()
                                 for entry in entries for h in entry["hooks"]))


if __name__ == "__main__":
    unittest.main()
