import fcntl
import os
from pathlib import Path
import selectors
import shutil
import signal
import subprocess
import tempfile
import time
import unittest


ROOT = Path(__file__).resolve().parents[2]


class VerifyWrapperLockTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        (self.repo / "bin").mkdir()
        (self.repo / "enforcement/bin").mkdir(parents=True)
        shutil.copy2(ROOT / "bin/verify", self.repo / "bin/verify")
        shutil.copy2(ROOT / "enforcement/bin/verify-engine.py", self.repo / "enforcement/bin/verify-engine.py")
        subprocess.run(["git", "init", "-b", "main", str(self.repo)], check=True, capture_output=True)
        self.git("config", "user.email", "verify@example.test")
        self.git("config", "user.name", "Verify Test")
        (self.repo / "source.txt").write_text("base\n")
        self.git("add", "bin/verify", "enforcement/bin/verify-engine.py", "source.txt")
        self.git("commit", "-m", "base")
        self.git("update-ref", "refs/remotes/origin/main", "HEAD")
        self.git("switch", "-c", "testing")
        (self.repo / "source.txt").write_text("changed\n")
        self.lock_path = Path(f"/tmp/thoven-verify-{os.getuid()}.lock")

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.repo, check=True, text=True, capture_output=True)

    def start_waiting_runner(self):
        return subprocess.Popen([str(self.repo / "bin/verify")], cwd=self.repo,
                                text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def wait_for_lock_message(self, child, timeout=5):
        selector = selectors.DefaultSelector()
        selector.register(child.stderr, selectors.EVENT_READ)
        deadline = time.monotonic() + timeout
        received = ""
        try:
            while time.monotonic() < deadline:
                events = selector.select(max(0, deadline - time.monotonic()))
                if not events:
                    break
                chunk = os.read(child.stderr.fileno(), 4096).decode(errors="replace")
                if not chunk:
                    break
                received += chunk
                if "bin/verify: waiting for verification lock" in received:
                    return True, received
            return False, received
        finally:
            selector.close()

    def assert_waiting_for_lock(self, child):
        saw_wait, output = self.wait_for_lock_message(child)
        self.assertTrue(saw_wait, f"runner did not report lock contention: {output!r}")
        self.assertIsNone(child.poll(), "runner must remain alive until it owns the lock")

    def test_public_wrapper_waits_for_shared_lock(self):
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            child = self.start_waiting_runner()
            self.addCleanup(lambda: child.poll() is None and child.kill())
            self.assert_waiting_for_lock(child)
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
            stdout, stderr = child.communicate(timeout=15)
        self.assertEqual(0, child.returncode, stderr)
        self.assertIn("THOVEN_VERIFY_BEGIN", stdout)

    def test_public_wrapper_cancels_while_waiting_and_releases(self):
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            child = self.start_waiting_runner()
            self.addCleanup(lambda: child.poll() is None and child.kill())
            self.assert_waiting_for_lock(child)
            child.send_signal(signal.SIGTERM)
            stdout, _stderr = child.communicate(timeout=5)
            self.assertEqual(130, child.returncode, stdout)
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

    def test_lock_wait_contract_detects_a_noop_flock_mutation(self):
        wrapper = self.repo / "bin" / "verify-mutated"
        source = (self.repo / "bin" / "verify").read_text()
        real_flock = "fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)"
        self.assertIn(real_flock, source)
        wrapper.write_text(source.replace(real_flock, "pass", 1))
        wrapper.chmod(0o755)
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            child = subprocess.Popen([str(wrapper)], cwd=self.repo, text=True,
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.addCleanup(lambda: child.poll() is None and child.kill())
            saw_wait, message = self.wait_for_lock_message(child, timeout=3)
            self.assertFalse(saw_wait, f"mutated runner unexpectedly reported contention: {message!r}")
            stdout, stderr = child.communicate(timeout=15)
            self.assertEqual(0, child.returncode, stderr)
            self.assertIn("THOVEN_VERIFY_BEGIN", stdout)
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


if __name__ == "__main__":
    unittest.main()
