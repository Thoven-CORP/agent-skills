import json
import os
import shutil
import tempfile
import unittest
from unittest.mock import patch

import compose

CTX = {"ticket": "THV-7", "url": "", "path": "/tree", "repo": "frontend", "branch": "work/thv-7",
       "base": "abc123", "other_repo": "", "pane": "w5A:p9", "agent": "thv-7"}


class SelfBriefTest(unittest.TestCase):
    def brief(self, **ctx):
        return compose.brief("claude", {**CTX, **ctx})

    def test_reports_by_dispatch_post_and_peer_message(self):
        text = self.brief(main_session="lessons-main", project="live-lesson-portal")
        self.assertNotIn("{{", text)
        self.assertIn("standing.md", text)
        self.assertIn("post live-lesson-portal --ticket THV-7 --kind report", text)
        self.assertIn("--from thv-7", text)
        self.assertIn("SendMessage to lessons-main", text)
        self.assertIn(f"DISPATCH = {compose.dispatch_script()}", text)

    def test_no_inbox_and_no_herdr_prompt(self):
        for main in ("lessons-main", ""):
            with self.subTest(main=main):
                text = self.brief(main_session=main, project="p")
                self.assertNotIn("dispatch/out", text)
                self.assertNotIn("agent prompt", text)
                self.assertNotIn("THV-<id>", text)

    def test_without_a_main_session_the_pane_prints_instead(self):
        text = self.brief(main_session="", project="p")
        self.assertNotIn("{{", text)
        self.assertIn("no named Claude session", text)

    def test_a_field_compose_cannot_fill_stops_the_brief(self):
        refs = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, refs)
        with open(os.path.join(refs, "brief.md"), "w") as f:
            f.write("```text\nhead\nSTANDING   x\nREPORT to {{NEW_FIELD}}\n```\n")
        with patch.object(compose, "refs_dir", return_value=refs), self.assertRaises(SystemExit) as e:
            self.brief(main_session="m", project="p")
        self.assertIn("NEW_FIELD", str(e.exception))


class ResolveTest(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.home)
        patcher = patch.dict(os.environ, {"CLAUDE_CONFIG_DIR": os.path.join(self.home, "claude"),
                                          "THOVEN_DISPATCH_HOME": os.path.join(self.home, "dispatch")})
        patcher.start()
        self.addCleanup(patcher.stop)
        os.makedirs(os.path.join(self.home, "claude", "sessions"))

    def session(self, pid, name):
        with open(os.path.join(self.home, "claude", "sessions", f"{pid}.json"), "w") as f:
            json.dump({"pid": pid, "sessionId": f"s{pid}", "name": name}, f)

    def register(self, project, main):
        folder = os.path.join(self.home, "dispatch", project, "panes")
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, f"herdr-w1_p{len(os.listdir(folder))}.json"), "w") as f:
            json.dump({"project": project, "ticket": "THV-1", "kind": "Build", "title": "t",
                       "pane": {"backend": "herdr", "pane": "w1:p1", "session": "w1"}, "cli": "claude",
                       "agent_name": "build-thv-1", "main_name": main, "tree": "/t", "base_sha": "",
                       "brief": "/b", "launched_at": ""}, f)

    def herdr(self, results):
        return patch.object(compose, "herdr_json", side_effect=lambda *a: results.get(a[:2]))

    def test_main_session_is_the_claude_session_in_the_dispatcher_pane(self):
        self.session(4242, "lessons-main")
        self.session(5151, "other")
        info = {"process_info": {"foreground_process_group_id": 4242}}
        with self.herdr({("pane", "process-info"): info}):
            self.assertEqual(compose.main_session("w5A:p1"), "lessons-main")
        with self.herdr({("pane", "process-info"): {"process_info": {"foreground_process_group_id": 9}}}):
            self.assertEqual(compose.main_session("w5A:p1"), "")
        self.assertEqual(compose.main_session(""), "")

    def test_project_is_mains_only_project_else_the_space_label(self):
        space = {("workspace", "get"): {"workspace": {"label": "Live Lesson Portal"}}}
        with self.herdr(space):
            self.assertEqual(compose.project_for("lessons-main", "w5A"), "live-lesson-portal")
            self.register("lessons", "lessons-main")
            self.assertEqual(compose.project_for("lessons-main", "w5A"), "lessons")
            self.register("other", "lessons-main")
            self.assertEqual(compose.project_for("lessons-main", "w5A"), "live-lesson-portal")
        with self.herdr({}):
            self.assertEqual(compose.project_for("", ""), "herdr")


if __name__ == "__main__":
    unittest.main()
