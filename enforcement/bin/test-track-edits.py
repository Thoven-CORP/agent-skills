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

    def test_unicode_path_from_repo_cwd_is_recorded(self):
        changed = self.repo / "src" / "café.ts"
        changed.write_text("export const value = 2\n")
        result = self.invoke("touch src/café.ts", cwd=self.repo)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(changed), (self.state / "edited").read_text().splitlines())

    def test_unicode_path_from_sibling_is_recorded(self):
        changed = self.repo / "src" / "café.ts"
        changed.write_text("export const value = 2\n")
        result = self.invoke(f"touch {changed}")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(changed), (self.state / "edited").read_text().splitlines())

    def test_renamed_path_and_following_record_are_recorded(self):
        subprocess.run(["git", "-C", str(self.repo), "add", "src/new.ts"], check=True, capture_output=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-m", "base"], check=True, capture_output=True)
        renamed = self.repo / "src" / "café -> renamed.ts"
        subprocess.run(["git", "-C", str(self.repo), "mv", "src/new.ts", str(renamed)], check=True)
        following = self.repo / "src" / "z-following.ts"
        following.write_text("export const following = 1\n")
        result = self.invoke(f"git -C {self.repo} status --short")
        self.assertEqual(0, result.returncode, result.stderr)
        edited = (self.state / "edited").read_text().splitlines()
        self.assertIn(str(renamed), edited)
        self.assertIn(str(following), edited)

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

    def test_depth_two_sibling_named_in_command_is_logged(self):
        sibling = self.workspace / "backend-thv-2"
        sibling.mkdir()
        subprocess.run(["git", "init", str(sibling)], check=True, capture_output=True)
        changed = sibling / "change.rb"
        changed.write_text("class Change; end\n")
        result = self.invoke(f"touch {changed}", cwd=self.repo)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn(str(changed), (self.state / "edited").read_text().splitlines())

    def test_checkout_nested_under_node_modules_is_never_scanned(self):
        nested = self.workspace / "x" / "node_modules" / "pkg"
        nested.mkdir(parents=True)
        subprocess.run(["git", "init", str(nested)], check=True, capture_output=True)
        changed = nested / "index.js"
        changed.write_text("module.exports = 1\n")
        result = self.invoke(f"touch {changed}", cwd=self.repo)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertNotIn(str(changed), (self.state / "edited").read_text().splitlines())

    def test_large_node_modules_tree_does_not_slow_the_hook(self):
        base = self.workspace / "x" / "node_modules"
        for index in range(3000):
            (base / f"pkg{index}" / "lib").mkdir(parents=True)
            if index % 10 == 0:
                (base / f"pkg{index}" / ".git").mkdir()
        started = time.monotonic()
        result = self.invoke(f"ls {self.repo}", cwd=self.repo)
        elapsed = time.monotonic() - started
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertLess(elapsed, 2.0, f"hook took {elapsed:.1f}s on a large node_modules tree")

    def test_scan_leaves_the_index_unwritten(self):
        kept = self.repo / "kept.txt"
        kept.write_text("same\n")
        subprocess.run(["git", "-C", str(self.repo), "add", "kept.txt"], check=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-qm", "kept"], check=True)
        # A stale stat entry: a plain git status refreshes it and writes the index, holding index.lock.
        os.utime(kept, (time.time() - 3600, time.time() - 3600))
        index = self.repo / ".git" / "index"
        before = index.read_bytes()
        result = self.invoke("true", cwd=self.repo)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(before, index.read_bytes())


class PerCommandStampTest(unittest.TestCase):
    """A Bash call is charged only with the files that changed while it ran."""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name).resolve()
        self.home = root / "home"
        self.repo = self.home / "thoven" / "frontend-thv-1249"
        self.repo.mkdir(parents=True)
        subprocess.run(["git", "init", str(self.repo)], check=True, capture_output=True)
        self.state_root = root / "state"
        self.session = "stamp-" + uuid.uuid4().hex
        self.state = self.state_root / self.session
        self.state.mkdir(parents=True)
        self.started = time.time() - 60
        self.set_mtime(self.state / "started", self.started, create=True)

    @staticmethod
    def set_mtime(path, when, create=False):
        if create:
            path.touch()
        os.utime(path, (when, when))

    def run_hook(self, payload, *args):
        return subprocess.run([str(TRACKER), *args], input=json.dumps(payload), text=True, capture_output=True,
                              env={**os.environ, "HOME": str(self.home), "THOVEN_CLAUDE_STATE": str(self.state_root)})

    def bash(self, command, *args, event="PostToolUse"):
        return self.run_hook({"cwd": str(self.home / "thoven"), "session_id": self.session, "hook_event_name": event,
                              "tool_name": "Bash", "tool_input": {"command": command}}, *args)

    def edited(self):
        path = self.state / "edited"
        return path.read_text().splitlines() if path.exists() else []

    def test_file_dirtied_by_another_process_before_the_command_is_not_charged(self):
        theirs = self.repo / "theirs.ts"
        theirs.write_text("x\n")
        self.set_mtime(theirs, time.time() - 30)  # after session start, before this command
        self.assertEqual(0, self.bash("ls", "--pre", event="PreToolUse").returncode)
        self.assertEqual(0, self.bash(f"git -C {self.repo} log").returncode)
        self.assertNotIn(str(theirs), self.edited())

    def test_file_written_by_the_command_is_charged(self):
        theirs = self.repo / "theirs.ts"
        theirs.write_text("x\n")
        self.set_mtime(theirs, time.time() - 30)
        self.bash("touch mine", "--pre", event="PreToolUse")
        mine = self.repo / "mine.ts"
        mine.write_text("y\n")
        self.set_mtime(mine, time.time() + 2)
        self.bash(f"echo y > {mine}")
        self.assertIn(str(mine), self.edited())
        self.assertNotIn(str(theirs), self.edited())

    def test_without_a_stamp_the_session_start_is_the_boundary(self):
        old, recent = self.repo / "old.ts", self.repo / "recent.ts"
        for path, when in ((old, self.started - 30), (recent, time.time() - 30)):
            path.write_text("x\n")
            self.set_mtime(path, when)
        self.bash(f"git -C {self.repo} status")
        self.assertIn(str(recent), self.edited())
        self.assertNotIn(str(old), self.edited())

    def test_stamp_is_spent_by_the_command_it_belongs_to(self):
        self.bash("ls", "--pre", event="PreToolUse")
        self.bash("ls")
        late = self.repo / "late.ts"
        late.write_text("x\n")
        self.set_mtime(late, time.time() - 30)  # older than the spent stamp, newer than session start
        self.bash(f"git -C {self.repo} status")
        self.assertIn(str(late), self.edited())

    def test_cursor_pre_shell_event_stamps_with_the_cursor_dialect(self):
        theirs = self.repo / "theirs.ts"
        theirs.write_text("x\n")
        self.set_mtime(theirs, time.time() - 30)
        conversation = {"conversation_id": self.session, "cwd": str(self.home / "thoven"), "command": f"ls {self.repo}"}
        self.run_hook({**conversation, "hook_event_name": "beforeShellExecution"}, "--dialect", "cursor", "--pre")
        self.assertTrue((self.state / "cmd-started").exists())
        self.run_hook({**conversation, "hook_event_name": "afterShellExecution"}, "--dialect", "cursor")
        self.assertNotIn(str(theirs), self.edited())

    def test_empty_input_exits_zero_and_writes_nothing(self):
        for args in ((), ("--pre",)):
            result = self.run_hook({}, *args)
            self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual([], list(self.state_root.glob("*/cmd-started")))
        self.assertEqual([], self.edited())
        self.assertEqual({self.session}, {p.name for p in self.state_root.iterdir()})


if __name__ == "__main__":
    unittest.main()
