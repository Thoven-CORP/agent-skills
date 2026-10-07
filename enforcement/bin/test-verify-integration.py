import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import uuid


ROOT = Path(__file__).resolve().parents[2]
HOOK = ROOT / "enforcement/hooks/thoven-require-evidence"


class ReceiptHookIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name) / "home"
        self.repo = self.home / "thoven" / "repo"
        (self.repo / "bin").mkdir(parents=True)
        (self.repo / "enforcement" / "bin").mkdir(parents=True)
        shutil.copy2(ROOT / "bin/verify", self.repo / "bin/verify")
        shutil.copy2(ROOT / "enforcement/bin/verify-engine.py", self.repo / "enforcement/bin/verify-engine.py")
        subprocess.run(["git", "init", "-b", "main", str(self.repo)], check=True, capture_output=True)
        self.git("config", "user.email", "verify@example.test")
        self.git("config", "user.name", "Verify Test")
        app = self.repo / "src/app.ts"
        app.parent.mkdir()
        app.write_text("export const ready = false\n")
        self.git("add", "bin/verify", "enforcement/bin/verify-engine.py", "src/app.ts")
        self.git("commit", "-m", "base")
        self.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.git("switch", "-c", "testing")
        app.write_text("export const ready = true\n")
        self.app = app
        self.session = "verify-int-" + uuid.uuid4().hex
        self.state = Path("/tmp/claude-thoven") / self.session
        self.state.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(self.state, ignore_errors=True))
        (self.state / "edited").write_text(str(app) + "\n")

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.repo, check=True, text=True, capture_output=True)

    def hook(self, block):
        payload = {"cwd": str(self.repo), "session_id": self.session,
                   "last_assistant_message": "Done.\n" + block}
        return subprocess.run([str(HOOK)], input=json.dumps(payload), text=True, capture_output=True,
                              env={**os.environ, "HOME": str(self.home)})

    def test_real_receipt_is_accepted_then_same_block_rejected_after_edit(self):
        result = subprocess.run([str(self.repo / "bin/verify")], cwd=self.repo, text=True, capture_output=True)
        self.assertEqual(0, result.returncode, result.stderr)
        lines = result.stdout.splitlines()
        start = lines.index("THOVEN_VERIFY_BEGIN")
        end = lines.index("THOVEN_VERIFY_END")
        block = "THOVEN_VERIFY_BEGIN\n" + lines[start + 1] + "\nTHOVEN_VERIFY_END"
        self.assertEqual("PASS", json.loads(lines[start + 1])["status"])
        accepted = self.hook(block)
        self.assertEqual(0, accepted.returncode, accepted.stderr)

        self.app.write_text("export const ready = false\n")
        stale = self.hook(block)
        self.assertEqual(2, stale.returncode)


if __name__ == "__main__":
    unittest.main()
