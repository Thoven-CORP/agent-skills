import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest
import uuid


TRACKER = Path(__file__).resolve().parents[1] / "hooks" / "thoven-track-edits"


class TrackEditsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name) / "home"
        self.workspace = self.home / "thoven"
        self.home = self.home.resolve()
        self.workspace = self.workspace.resolve()
        self.repo = self.workspace / "frontend-thv-1131"
        self.repo.mkdir(parents=True)
        subprocess.run(["git", "init", str(self.repo)], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.email", "test@example.test"], check=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.name", "Test"], check=True)
        self.file = self.repo / "src" / "new.ts"
        self.file.parent.mkdir()
        self.file.write_text("export const value = 1\n")
        self.session = "track1131-" + uuid.uuid4().hex
        self.state = Path("/tmp/claude-thoven") / self.session
        self.state.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(self.state, ignore_errors=True))
        started = self.state / "started"
        started.touch()
        os.utime(started, (time.time() - 10, time.time() - 10))
        self.file.touch()

    def invoke(self, command, cwd=None):
        payload = {
            "cwd": str(cwd or self.workspace),
            "session_id": self.session,
            "tool_name": "Bash",
            "tool_input": {"command": command},
        }
        return subprocess.run([str(TRACKER)], input=json.dumps(payload), text=True, capture_output=True,
                              env={**os.environ, "HOME": str(self.home)})

    def test_workspace_root_bash_edit_is_recorded_in_sibling_repo(self):
        result = self.invoke(f"python3 write {self.file}")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(self.file), (self.state / "edited").read_text().splitlines())

    def test_frontend_command_editing_sibling_backend_is_recorded(self):
        sibling = self.workspace / "backend"
        (sibling / "src").mkdir(parents=True)
        subprocess.run(["git", "init", str(sibling)], check=True, capture_output=True)
        changed = sibling / "src" / "change.rb"
        changed.write_text("class Change; end\n")
        result = self.invoke(f"touch ../backend/src/change.rb", cwd=self.repo)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(changed), (self.state / "edited").read_text().splitlines())

    def test_workspace_root_relative_editor_path_is_normalized(self):
        payload = {
            "cwd": str(self.workspace),
            "session_id": self.session,
            "tool_name": "Edit",
            "tool_input": {"file_path": "frontend-thv-1131/src/new.ts"},
        }
        result = subprocess.run([str(TRACKER)], input=json.dumps(payload), text=True, capture_output=True,
                                env={**os.environ, "HOME": str(self.home)})
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(self.file.resolve()), (self.state / "edited").read_text().splitlines())

    def test_workspace_root_records_more_than_200_changed_paths(self):
        files = [self.repo / "bulk" / f"item-{index}.py" for index in range(205)]
        files[0].parent.mkdir()
        for path in files:
            path.write_text("value = 1\n")
        result = self.invoke(f"python3 read {self.repo}/bulk")
        self.assertEqual(0, result.returncode, result.stderr)
        edited = (self.state / "edited").read_text().splitlines()
        self.assertTrue(set(map(str, files)).issubset(edited))

    def test_workspace_root_tracked_deletion_is_recorded(self):
        subprocess.run(["git", "-C", str(self.repo), "add", "src/new.ts"], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-m", "base"], check=True, capture_output=True)
        self.file.unlink()
        result = self.invoke(f"git -C {self.repo} status --short")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(self.file), (self.state / "edited").read_text().splitlines())




if __name__ == "__main__":
    unittest.main()
