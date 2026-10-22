"""tell_main (twlib.py) and tw_tell_main (lib/common.sh): with no pane to prompt, a dispatch-registered
pane's message becomes an ALERT on its Project board; nothing is written to $TMPDIR/dispatch/out."""
import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import twlib as tw

COMMON_SH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib", "common.sh")


def executable(path, body):
    with open(path, "w") as f:
        f.write("#!/usr/bin/env bash\n" + body)
    os.chmod(path, os.stat(path).st_mode | stat.S_IXUSR)


class Fixture(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.root)
        self.home = os.path.join(self.root, "dispatch")
        self.state = os.path.join(self.root, "state")
        self.tmpdir = os.path.join(self.root, "tmp")
        self.log = os.path.join(self.root, "calls.log")
        os.makedirs(self.tmpdir)
        self.herdr = os.path.join(self.root, "herdr")
        # Every prompt fails, as when main is gone; a toast succeeds.
        executable(self.herdr, f'echo "herdr $*" >> {self.log}\n[ "$1" = notification ] || exit 1\n')
        self.dispatch = os.path.join(self.root, "dispatch-bin")
        executable(self.dispatch, f'echo "dispatch $*" >> {self.log}\nsed "s/^/stdin /" >> {self.log}\n'
                                  f'echo {self.home}/proj/board/entry.md\n')
        self.env = {"THOVEN_DISPATCH_HOME": self.home, "HERDR_PLUGIN_STATE_DIR": self.state,
                    "HERDR_BIN_PATH": self.herdr, "TW_DISPATCH_BIN": self.dispatch, "TMPDIR": self.tmpdir}
        os.makedirs(os.path.join(self.state, "dispatch", "by-pane"))
        with open(os.path.join(self.state, "dispatch", "by-pane", "w5A_p29.json"), "w") as f:
            json.dump({"dispatcher": "w5A:p1"}, f)

    def register(self):
        folder = os.path.join(self.home, "lessons", "panes")
        os.makedirs(folder)
        with open(os.path.join(folder, "herdr-w5A_p29.json"), "w") as f:
            json.dump({"project": "lessons", "ticket": "THV-1188", "pane": {"backend": "herdr", "pane": "w5A:p29"}}, f)

    def calls(self):
        if not os.path.exists(self.log):
            return []
        with open(self.log) as f:
            return f.read().splitlines()

    def assert_no_inbox(self):
        self.assertFalse(os.path.exists(os.path.join(self.tmpdir, "dispatch")), os.listdir(self.tmpdir))


class PythonTellMainTest(Fixture):
    def tell(self):
        with patch.dict(os.environ, {"TW_DISPATCH_BIN": self.dispatch, "THOVEN_DISPATCH_HOME": self.home}), \
             patch.object(tw, "STATE", self.state), patch.object(tw, "HERDR", self.herdr):
            return tw.tell_main("THV-1188", "[thoven verify] THV-1188 needs you.", "w5A:p29", "w5A")

    def test_a_registered_pane_posts_an_alert_to_its_board(self):
        self.register()
        where = self.tell()
        self.assertEqual(where, f"{self.home}/proj/board/entry.md")
        calls = self.calls()
        self.assertIn("dispatch post lessons --ticket THV-1188 --kind alert --status ESCALATION --from thoven.workflow", calls)
        self.assertIn("stdin [thoven verify] THV-1188 needs you.", calls)
        self.assertTrue(any(c.startswith("herdr notification show") for c in calls), calls)
        self.assert_no_inbox()

    def test_an_unregistered_pane_only_toasts(self):
        self.assertIsNone(self.tell())
        calls = self.calls()
        self.assertFalse([c for c in calls if c.startswith("dispatch")], calls)
        self.assertTrue(any(c.startswith("herdr notification show") and "needs you" in c for c in calls), calls)
        self.assert_no_inbox()

    def test_twlib_has_no_inbox(self):
        self.assertFalse(hasattr(tw, "INBOX"))


class BashTellMainTest(Fixture):
    def tell(self):
        script = f'. "{COMMON_SH}"; tw_tell_main THV-1188 "[thoven verify] THV-1188 needs you." w5A:p29 w5A'
        env = {k: v for k, v in os.environ.items() if k not in ("TW_REPORT_TO",)}
        return subprocess.run(["bash", "-c", script], env={**env, **self.env}, capture_output=True, text=True)

    def test_a_registered_pane_posts_an_alert_to_its_board(self):
        self.register()
        self.assertEqual(self.tell().returncode, 0)
        calls = self.calls()
        self.assertIn("dispatch post lessons --ticket THV-1188 --kind alert --status ESCALATION --from thoven.workflow", calls)
        self.assertIn("stdin [thoven verify] THV-1188 needs you.", calls)
        self.assertTrue(any(c.startswith("herdr notification show") for c in calls), calls)
        self.assert_no_inbox()

    def test_an_unregistered_pane_only_toasts(self):
        self.tell()
        calls = self.calls()
        self.assertFalse([c for c in calls if c.startswith("dispatch")], calls)
        self.assertTrue(any(c.startswith("herdr notification show") and "needs you" in c for c in calls), calls)
        self.assert_no_inbox()


if __name__ == "__main__":
    unittest.main()
