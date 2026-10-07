import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import uuid


HOOK = Path(__file__).resolve().parents[1] / "hooks" / "thoven-require-evidence"


class RequireEvidenceTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "home" / "thoven" / "repo"
        (self.root / "bin").mkdir(parents=True)
        (self.root / "src").mkdir()
        self.root = self.root.resolve()
        (self.root / "src" / "app.ts").write_text("export const ready = true\n")
        subprocess.run(["git", "init", str(self.root)], check=True, capture_output=True)
        self.fake_receipt = Path(self.tmp.name) / "receipt.json"
        verifier = self.root / "bin" / "verify"
        verifier.write_text(
            "#!/bin/sh\n"
            "[ \"$1\" = --check-evidence ] || exit 2\n"
            "python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin) == json.load(open(sys.argv[1])) else 1)' \"$FAKE_RECEIPT\"\n"
        )
        verifier.chmod(0o755)
        self.session = "thv1131-" + uuid.uuid4().hex
        self.state = Path("/tmp/claude-thoven") / self.session
        self.state.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(self.state, ignore_errors=True))
        (self.state / "edited").write_text(str(self.root / "src" / "app.ts") + "\n")
        self.receipt = {
            "version": 1,
            "repo": str(self.root),
            "head": "abc123",
            "base": "origin/main",
            "mergeBase": "abc123",
            "fingerprint": "f" * 64,
            "seconds": 1.25,
            "status": "PASS",
            "rows": [{"id": "unit", "command": ["bin/test"], "status": "PASS", "seconds": 1.0}],
        }
        self.fake_receipt.write_text(json.dumps(self.receipt))
        self.payload = {
            "cwd": str(self.root),
            "session_id": self.session,
            "last_assistant_message": "Done.\nTHOVEN_VERIFY_BEGIN\n" + json.dumps(self.receipt) + "\nTHOVEN_VERIFY_END",
        }

    def call_hook(self, message=None):
        payload = dict(self.payload)
        if message is not None:
            payload["last_assistant_message"] = message
        return subprocess.run([str(HOOK)], input=json.dumps(payload), text=True, capture_output=True,
                              env={**os.environ, "HOME": str((Path(self.tmp.name) / "home").resolve()), "FAKE_RECEIPT": str(self.fake_receipt)})

    def test_done_claim_without_a_verification_block_is_rejected(self):
        result = self.call_hook("Done. No check run.")
        self.assertEqual(2, result.returncode)
        self.assertIn("fresh PASS block", result.stderr)

    def test_matching_pass_block_is_delegated_to_the_repo_verifier(self):
        result = self.call_hook()
        self.assertEqual(0, result.returncode, result.stderr)

    def test_stale_or_failed_verifier_result_is_rejected(self):
        failed = dict(self.receipt, status="FAIL")
        self.fake_receipt.write_text(json.dumps(failed))
        result = self.call_hook()
        self.assertEqual(2, result.returncode)

    def test_wrong_repo_head_base_or_rowless_block_is_rejected(self):
        for field, value in (("repo", "/wrong/repo"), ("head", "other-head"), ("base", "other-base"), ("rows", [])):
            with self.subTest(field=field):
                changed = dict(self.receipt)
                changed[field] = value
                message = "Done.\nTHOVEN_VERIFY_BEGIN\n" + json.dumps(changed) + "\nTHOVEN_VERIFY_END"
                self.assertEqual(2, self.call_hook(message).returncode)

    def test_duplicate_blocks_are_rejected(self):
        block = "THOVEN_VERIFY_BEGIN\n" + json.dumps(self.receipt) + "\nTHOVEN_VERIFY_END"
        self.assertEqual(2, self.call_hook("Done.\n" + block + "\n" + block).returncode)

    def test_missing_block_for_second_edited_repo_is_rejected(self):
        second = Path(self.tmp.name) / "home" / "thoven" / "other-repo"
        (second / "src").mkdir(parents=True)
        (second / "src" / "second.ts").write_text("export const other = true\n")
        subprocess.run(["git", "init", str(second)], check=True, capture_output=True)
        (self.state / "edited").write_text(
            str(self.root / "src" / "app.ts") + "\n" + str(second / "src" / "second.ts") + "\n"
        )
        self.assertEqual(2, self.call_hook().returncode)

    def test_deleted_code_path_still_resolves_to_its_repo(self):
        deleted = self.root / "src" / "deep" / "deleted.ts"
        (self.state / "edited").write_text(str(deleted) + "\n")
        result = self.call_hook()
        self.assertEqual(0, result.returncode, result.stderr)

    def test_yaml_gate_config_requires_verification(self):
        config = self.root / "config.yml"
        (self.state / "edited").write_text(str(config) + "\n")
        self.assertEqual(0, self.call_hook().returncode)
        self.assertEqual(2, self.call_hook("Done. No check run.").returncode)


if __name__ == "__main__":
    unittest.main()
