#!/usr/bin/env python3
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ENGINE = Path(__file__).resolve().parents[1] / "bin" / "verify-engine.py"
WRAPPER = Path(__file__).resolve().parents[2] / "bin" / "verify"


class VerifyReceiptTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        (self.repo / "enforcement" / "bin").mkdir(parents=True)
        self.engine = self.repo / "enforcement" / "bin" / "verify-engine.py"
        if ENGINE.is_file():
            self.engine.write_bytes(ENGINE.read_bytes())
            self.engine.chmod(0o755)
        self.wrapper = self.repo / "bin" / "verify"
        self.wrapper.parent.mkdir(parents=True)
        if WRAPPER.is_file():
            self.wrapper.write_bytes(WRAPPER.read_bytes())
            self.wrapper.chmod(0o755)
        self.git("init", "-b", "main")
        self.git("config", "user.email", "verify@example.test")
        self.git("config", "user.name", "Verify Test")
        (self.repo / "source.py").write_text("value = 1\n")
        self.git("add", ".")
        self.git("commit", "-m", "base")
        self.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.git("switch", "-c", "testing")
        (self.repo / "source.py").write_text("value = 2\n")

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.repo, check=True, text=True, capture_output=True)

    def verify(self, *args, input=None):
        lock_fd = os.environ.get("THOVEN_VERIFY_LOCK_FD")
        return subprocess.run([sys.executable, str(self.engine), *args], cwd=self.repo,
                              input=input, text=True, capture_output=True,
                              pass_fds=(int(lock_fd),) if lock_fd else ())

    def receipt_from(self, output):
        lines = output.splitlines()
        begin = lines.index("THOVEN_VERIFY_BEGIN")
        end = lines.index("THOVEN_VERIFY_END")
        return json.loads(lines[begin + 1])

    def test_pass_receipt_is_fresh_and_bound_to_the_current_diff(self):
        result = self.verify()
        self.assertEqual(0, result.returncode, result.stderr)
        receipt = self.receipt_from(result.stdout)
        self.assertEqual("PASS", receipt["status"])
        self.assertTrue(receipt["rows"])
        accepted = self.verify("--check-evidence", input=json.dumps(receipt))
        self.assertEqual(0, accepted.returncode, accepted.stderr)

        self.assertTrue(self.wrapper.is_file(), "public bin/verify must provide --check-evidence")
        public = subprocess.run([str(self.wrapper), "--check-evidence"], cwd=self.repo,
                                input=json.dumps(receipt), text=True, capture_output=True)
        self.assertEqual(0, public.returncode, public.stderr)

        (self.repo / "source.py").write_text("value = 3\n")
        stale = self.verify("--check-evidence", input=json.dumps(receipt))
        self.assertNotEqual(0, stale.returncode)

    def test_receipt_metadata_and_rows_cannot_be_edited(self):
        result = self.verify()
        self.assertEqual(0, result.returncode, result.stderr)
        receipt = self.receipt_from(result.stdout)
        for mutate in (
            lambda item: item.update(head="other"),
            lambda item: item.update(base="missing-base"),
            lambda item: item["rows"].pop(),
            lambda item: item["rows"][0].update(command="echo no checks"),
        ):
            changed = json.loads(json.dumps(receipt))
            mutate(changed)
            rejected = self.verify("--check-evidence", input=json.dumps(changed))
            self.assertNotEqual(0, rejected.returncode)

    def test_failed_run_invalidates_the_previous_pass_receipt(self):
        first = self.verify()
        self.assertEqual(0, first.returncode, first.stderr)
        receipt_path = self.repo / ".git" / "thoven-verify.json"
        self.assertTrue(receipt_path.exists())
        (self.repo / "broken.py").write_text("def broken(:\n")
        failed = self.verify()
        self.assertEqual(1, failed.returncode)
        self.assertFalse(receipt_path.exists())

    def test_empty_and_rowless_receipts_are_refused(self):
        empty = self.verify("--check-evidence", input="{}")
        self.assertNotEqual(0, empty.returncode)

        result = self.verify()
        self.assertEqual(0, result.returncode, result.stderr)
        receipt = self.receipt_from(result.stdout)
        receipt["rows"] = []
        (self.repo / ".git" / "thoven-verify.json").write_text(json.dumps(receipt))
        rowless = self.verify("--check-evidence", input=json.dumps(receipt))
        self.assertNotEqual(0, rowless.returncode)


if __name__ == "__main__":
    unittest.main()
