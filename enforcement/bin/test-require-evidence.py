import hashlib
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
            "python3 -c 'import hashlib,json,sys; b=json.load(sys.stdin); sys.exit(0 if b == json.load(open(sys.argv[1])) and b.get(\"sourceDigest\") == hashlib.sha256(open(\"src/app.ts\", \"rb\").read()).hexdigest() else 1)' \"$FAKE_RECEIPT\"\n"
        )
        verifier.chmod(0o755)
        self.session = "thv1131-" + uuid.uuid4().hex
        self.state = Path("/tmp/claude-thoven") / self.session
        self.state.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(self.state, ignore_errors=True))
        (self.state / "edited").write_text(str(self.root / "src" / "app.ts") + "\n")
        self.receipt = {
            "sourceDigest": hashlib.sha256((self.root / "src/app.ts").read_bytes()).hexdigest(),
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

    def call_hook(self, message=None, **overrides):
        payload = dict(self.payload)
        if message is not None:
            payload["last_assistant_message"] = message
        payload.update(overrides)
        return subprocess.run([str(HOOK)], input=json.dumps(payload), text=True, capture_output=True,
                              env={**os.environ, "HOME": str((Path(self.tmp.name) / "home").resolve()), "FAKE_RECEIPT": str(self.fake_receipt)})

    def test_recursive_stop_does_not_block_again(self):
        self.assertEqual(0, self.call_hook("Done.", stop_hook_active=True).returncode)
        self.assertEqual(2, self.call_hook("Done.", stop_hook_active=False).returncode)

    def test_historical_status_summaries_do_not_claim_current_completion(self):
        for message in ("Previously, I completed THV-1127. The current task is pending.",
                        "THV-1127: fix round 3 done; report missing.",
                        "| Ticket | Status |\n| THV-1127 | completed yesterday |",
                        "> Done.\nThat was the prior agent's report."):
            with self.subTest(message=message):
                result = self.call_hook(message)
                self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(2, self.call_hook("Previously, I completed THV-1127.\nDone with the current repair.").returncode)

    def test_admitted_receipt_is_revalidated_without_repeated_pasting(self):
        self.assertEqual(0, self.call_hook().returncode)
        result = self.call_hook("Done. The repair remains complete.")
        self.assertEqual(0, result.returncode, result.stderr)
        changed = dict(self.receipt, head="changed-head")
        self.fake_receipt.write_text(json.dumps(changed))
        self.assertEqual(2, self.call_hook("Done.").returncode)

    def test_new_source_requires_fresh_evidence_even_with_preserved_mtime(self):
        self.assertEqual(0, self.call_hook().returncode)
        source = self.root / "src/app.ts"
        before = source.stat()
        source.write_text("export const ready = false\n")
        os.utime(source, ns=(before.st_atime_ns, before.st_mtime_ns))
        self.assertEqual(2, self.call_hook("Done.").returncode)
        self.assertEqual(2, self.call_hook().returncode)
        self.receipt["sourceDigest"] = hashlib.sha256(source.read_bytes()).hexdigest()
        self.fake_receipt.write_text(json.dumps(self.receipt))
        fresh = "Done.\nTHOVEN_VERIFY_BEGIN\n" + json.dumps(self.receipt) + "\nTHOVEN_VERIFY_END"
        self.assertEqual(0, self.call_hook(fresh).returncode)

    def test_explicit_invalid_evidence_cannot_fall_back_to_admission(self):
        self.assertEqual(0, self.call_hook().returncode)
        for content in ("{}", "", "[]", "not-json"):
            with self.subTest(content=content):
                message = "Done.\nTHOVEN_VERIFY_BEGIN\n" + content + "\nTHOVEN_VERIFY_END"
                self.assertEqual(2, self.call_hook(message).returncode)

    def test_current_claim_after_history_and_in_tables_requires_evidence(self):
        for message in ("Yesterday the prior repair was completed. Done with this repair.",
                        "THV-1127: completed the current repair.",
                        "| Current repair | completed |"):
            with self.subTest(message=message):
                self.assertEqual(2, self.call_hook(message).returncode)

    def test_corrupt_remembered_receipt_is_refused(self):
        self.assertEqual(0, self.call_hook().returncode)
        (self.state / "verified-evidence.json").write_text("not-json")
        self.assertEqual(2, self.call_hook("Done.").returncode)

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
        self.assertEqual(2, self.call_hook("Done. No check run.").returncode)
        self.assertEqual(0, self.call_hook().returncode)

    def test_workspace_archive_json_reports_are_documents(self):
        workspace = self.root.parent
        subprocess.run(["git", "init", str(workspace)], check=True, capture_output=True)
        report = workspace / "archive" / "verification" / "receipt.json"
        report.parent.mkdir(parents=True)
        report.write_text('{}')
        self.payload['cwd'] = str(workspace)
        for path in (str(report), 'archive/verification/receipt.json'):
            with self.subTest(path=path):
                (self.state / 'edited').write_text(path + '\n')
                result = self.call_hook('Done. Reports archived.')
                self.assertEqual(0, result.returncode, result.stderr)

    def test_archive_exception_cannot_hide_configuration_or_code(self):
        workspace = self.root.parent
        subprocess.run(["git", "init", str(workspace)], check=True, capture_output=True)
        archive = workspace / 'archive'
        archive.mkdir()
        report = archive / 'receipt.json'
        report.write_text('{}')
        config = self.root / 'config.json'
        config.write_text('{}')
        escaped = archive / 'escaped.json'
        escaped.symlink_to(config)
        nested_archive = self.root / 'archive'
        nested_archive.mkdir()
        linked = nested_archive / 'linked.json'
        linked.symlink_to(report)
        paths = (workspace / 'config.json', nested_archive / 'config.json',
                 archive / 'script.py', escaped, linked)
        for path in paths:
            with self.subTest(path=str(path)):
                (self.state / 'edited').write_text(str(path) + '\n')
                result = self.call_hook('Done. No check run.')
                self.assertEqual(2, result.returncode)
                self.assertIn('needs one complete THOVEN_VERIFY block', result.stderr)


if __name__ == "__main__":
    unittest.main()
