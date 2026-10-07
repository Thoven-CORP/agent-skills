import fcntl
import os
from pathlib import Path
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

    def test_public_wrapper_waits_for_shared_lock(self):
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            child = self.start_waiting_runner()
            self.addCleanup(lambda: child.poll() is None and child.kill())
            time.sleep(.15)
            self.assertIsNone(child.poll(), "runner should wait while another repo owns the shared lock")
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
            stdout, stderr = child.communicate(timeout=15)
        self.assertEqual(0, child.returncode, stderr)
        self.assertIn("THOVEN_VERIFY_BEGIN", stdout)

    def test_public_wrapper_cancels_while_waiting_and_releases(self):
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            child = self.start_waiting_runner()
            self.addCleanup(lambda: child.poll() is None and child.kill())
            time.sleep(.15)
            child.send_signal(signal.SIGTERM)
            stdout, _stderr = child.communicate(timeout=5)
            self.assertEqual(130, child.returncode, stdout)
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


if __name__ == "__main__":
    unittest.main()
