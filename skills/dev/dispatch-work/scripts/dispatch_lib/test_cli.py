import io
import json
import os
import tempfile
import unittest
from unittest.mock import patch

import testkit  # noqa: F401
from dispatch_lib import cli, store
from dispatch_lib.model import EntryKind, State, Status
from dispatch_lib.mux import Launch, MuxError
from testkit import FakeMux, FakeRunner, HomeCase, registration


class Harness(HomeCase):
    def setUp(self):
        super().setUp()
        self.mux = FakeMux()
        self.out, self.err = io.StringIO(), io.StringIO()
        self.now = 0.0
        self.app = cli.App(run=FakeRunner(), out=self.out, err=self.err, sleep=self.advance, clock=lambda: self.now)
        self.app.mux = lambda backend: self.mux

    def advance(self, seconds):
        self.now += seconds

    def cmd(self, *argv, stdin=None):
        self.out.seek(0), self.out.truncate()
        self.err.seek(0), self.err.truncate()
        with patch("sys.stdin", io.StringIO(stdin or "")):
            return cli.main(list(argv), self.app)


class PostBoardClean(Harness):
    def test_round_trip(self):
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-7", "--kind", "report", "--status", "done",
                                  "--from", "build-thv-7", stdin="Acceptance ok\nProof ok\n"), 0)
        path = self.out.getvalue().strip()
        self.assertRegex(os.path.basename(path), r"^\d{8}T\d{9}Z-THV-7-REPORT-[0-9a-f]{4}\.md$")
        with open(path) as f:
            text = f.read()
        self.assertRegex(text, r"^at: \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z\nticket: THV-7\nfrom: build-thv-7\n"
                               r"kind: REPORT\nstatus: DONE\n---\nAcceptance ok\nProof ok\n$")
        self.cmd("post", "proj", "--ticket", "THV-8", "--kind", "question", "--from", "m", stdin="Which one?")
        self.assertEqual(self.cmd("board", "proj", "--ticket", "THV-7"), 0)
        shown = self.out.getvalue()
        self.assertIn("THV-7 REPORT DONE from build-thv-7", shown)
        self.assertIn("Acceptance ok\nProof ok", shown)
        self.assertNotIn("THV-8", shown)
        with open(store.board_md("proj")) as f:
            board = f.read()
        self.assertTrue(board.startswith("# Board: proj\n"))
        self.assertIn("THV-8 QUESTION from m", board)

        for folder, name in (("briefs", "THV-7.md"), ("briefs", "THV-7-verify.md"), ("briefs", "THV-7.build-thv-7.md"),
                             ("snapshots", "THV-7.md"), ("briefs", "THV-70.md")):
            os.makedirs(store.sub("proj", folder), exist_ok=True)
            open(os.path.join(store.sub("proj", folder), name), "w").close()
        self.assertEqual(self.cmd("clean", "proj", "--ticket", "THV-7"), 0)
        self.assertEqual(self.out.getvalue(), "removed 5 paths\n")
        self.assertEqual(os.listdir(store.sub("proj", "briefs")), ["THV-70.md"])
        self.assertEqual([e.ticket for _, e in store.entries("proj")], ["THV-8"])
        self.cmd("board", "proj", "--ticket", "THV-7")
        self.assertEqual(self.out.getvalue(), "")
        self.assertEqual(self.cmd("clean", "proj", "--ticket", "THV-7"), 0)
        self.assertEqual(self.out.getvalue(), "removed 0 paths\n")
        self.assertEqual(self.cmd("clean", "proj"), 0)
        self.assertFalse(os.path.exists(os.path.join(self.home, "proj")))
        self.assertEqual(self.cmd("clean", "proj"), 0)

    def test_board_since_and_bad_input(self):
        import datetime
        t = datetime.datetime(2026, 10, 22, 12, tzinfo=datetime.timezone.utc)
        store.post("proj", "THV-1", EntryKind.ANSWER, "first", "main", at=t)
        store.post("proj", "THV-1", EntryKind.CORRECTION, "second", "main", at=t + datetime.timedelta(minutes=5))
        self.cmd("board", "proj", "--since", "2026-10-22T12:01:00Z")
        self.assertNotIn("first", self.out.getvalue())
        self.assertIn("second", self.out.getvalue())
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "gossip", stdin="x"), 2)
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "answer", stdin="  \n"), 2)
        self.assertEqual(self.cmd("post", "Bad_Project", "--ticket", "THV-1", "--kind", "answer", stdin="x"), 2)
        self.assertEqual(self.cmd("post", "proj", "--ticket", "thv-1", "--kind", "answer", stdin="x"), 2)

    def test_clean_refuses_while_a_pane_is_live(self):
        store.write_registration(registration(project="proj", ticket="THV-7"))
        store.post("proj", "THV-7", EntryKind.REPORT, "r", "x", "DONE")
        self.assertEqual(self.cmd("clean", "proj", "--ticket", "THV-7"), 3)
        self.assertIn("refusing to clean while panes are registered: build-thv-7 (block:a)", self.err.getvalue())
        self.assertEqual(self.cmd("clean", "proj"), 3)
        self.assertEqual(len(store.entries("proj")), 1)
        self.assertEqual(self.cmd("clean", "proj", "--ticket", "THV-9"), 0)
        self.assertEqual(self.cmd("close", "block:a"), 0)
        self.assertEqual(self.mux.closed, ["block:a"])
        self.assertEqual(self.cmd("clean", "proj", "--ticket", "THV-7"), 0)
        self.assertEqual(store.entries("proj"), [])


class Spawn(Harness):
    def setUp(self):
        super().setUp()
        self.sessions = tempfile.TemporaryDirectory()
        self.addCleanup(self.sessions.cleanup)
        with open(os.path.join(self.sessions.name, "123.json"), "w") as f:
            json.dump({"sessionId": "sess-main", "name": "andres-main", "status": "busy", "cwd": "/"}, f)
        with open(os.path.join(self.sessions.name, "456.json"), "w") as f:
            json.dump({"sessionId": "sess-x", "name": "build-thv-5", "status": "idle", "cwd": "/"}, f)
        env = {"REX_BLOCK": "block:main", "REX_SESSION": "session:s", "CLAUDE_CODE_SESSION_ID": "sess-main",
               "CLAUDE_CONFIG_DIR": os.path.dirname(self.sessions.name)}
        patcher = patch.dict(os.environ, env)
        patcher.start()
        self.addCleanup(patcher.stop)
        patch.object(cli, "sessions_dir", lambda: self.sessions.name).start()
        self.addCleanup(patch.stopall)
        patch.object(cli, "build_launch", lambda tier, c, m, name, prompt, add: (
            "claude", Launch("claude", name, ("claude", "-n", name, "--model", m or "opus"), prompt))).start()
        self.tree = tempfile.mkdtemp()
        self.addCleanup(lambda: os.rmdir(self.tree))

    def brief(self, text, name="THV-5.md"):
        os.makedirs(store.sub("proj", "briefs"), exist_ok=True)
        with open(os.path.join(store.sub("proj", "briefs"), name), "w") as f:
            f.write(text)

    def spawn(self, *extra):
        return self.cmd("spawn", "proj", "THV-5", "--kind", "Build", "--title", "Cart", "--cwd", self.tree,
                        "--tier", "3", "--base", "abc123", *extra)

    def snapshot(self):
        os.makedirs(store.sub("proj", "snapshots"), exist_ok=True)
        open(store.snapshot_path("proj", "THV-5"), "w").close()

    def test_placeholder_refusal(self):
        for text, line in (("You are {{AGENT_NAME}}.\nRepo <<path>>, branch x\n", "2: Repo <<path>>, branch x"),
                           ("Hi {{MAIN_SESSION}}\nSee {{UNKNOWN}}\n", "2: See {{UNKNOWN}}"),
                           ("Fixes <<the two findings, verbatim>> today\n",
                            "1: Fixes <<the two findings, verbatim>> today"),
                           ("Read <<Path>>\n", "1: Read <<Path>>"),
                           ("<<…>>\n", "1: <<…>>")):
            with self.subTest(text):
                self.brief(text)
                self.assertEqual(self.spawn(), 3)
                self.assertIn(line, self.err.getvalue())
                self.assertEqual(self.mux.spawned, [])
                self.assertEqual(store.registrations(), [])

    def test_missing_brief_is_refused(self):
        self.assertEqual(self.spawn(), 3)
        self.assertIn("no brief at", self.err.getvalue())

    def test_a_brief_that_reads_the_snapshot_needs_the_snapshot(self):
        self.brief("SPEC {{SNAPSHOT}}\n")
        self.assertEqual(self.spawn(), 3)
        self.assertIn(f"no snapshot at {self.home}/proj/snapshots/THV-5.md: run dispatch snapshot proj THV-5 first",
                      self.err.getvalue())
        self.assertEqual(self.mux.spawned, [])
        self.snapshot()
        self.assertEqual(self.spawn(), 0)

    def test_a_failed_agent_start_keeps_the_registration_and_says_so(self):
        self.brief("go {{AGENT_NAME}}\n")
        self.mux.start_error = MuxError("herdr agent start failed in block:new1: timed out")
        self.assertEqual(self.spawn(), 1)
        reg = store.registrations()[0]
        self.assertEqual((reg.pane.pane, reg.agent_name, reg.launched_at),
                         ("block:new1", "build-thv-5-2", "2026-10-22T12:00:00.000Z"))
        self.assertIn("herdr agent start failed in block:new1: timed out", self.err.getvalue())
        self.assertIn("block:new1 stays registered as build-thv-5-2, so the tick raises STARTUP or GONE for it",
                      self.err.getvalue())

    def test_legitimate_angle_brackets_pass_and_fields_fill(self):
        self.snapshot()
        self.brief("You are {{AGENT_NAME}}; main {{MAIN_SESSION}}; board {{BOARD}}; spec {{SNAPSHOT}}; "
                   "project {{PROJECT}}.\nArray<string> and <Parallel panes> and a -> b.\n"
                   "<div> <https://linear.app/x> <a@b.co> <Path> a << b\n"
                   "post --ticket THV-<id>\n")
        self.assertEqual(self.spawn(), 0)
        reg = store.registrations()[0]
        self.assertEqual((reg.agent_name, reg.main_name, reg.pane.pane, reg.base_sha, reg.cli, reg.tree),
                         ("build-thv-5-2", "andres-main", "block:new1", "abc123", "claude", self.tree))
        self.assertEqual(reg.brief, os.path.join(self.home, "proj", "briefs", "THV-5.build-thv-5-2.md"))
        with open(reg.brief) as f:
            self.assertEqual(f.read(), f"You are build-thv-5-2; main andres-main; board {self.home}/proj/board.md; "
                                       f"spec {self.home}/proj/snapshots/THV-5.md; project proj.\n"
                                       "Array<string> and <Parallel panes> and a -> b.\n"
                                       "<div> <https://linear.app/x> <a@b.co> <Path> a << b\n"
                                       "post --ticket THV-5\n")
        cwd, label, launch, split = self.mux.spawned[0]
        self.assertEqual((cwd, label, split), (self.tree, "Build · Cart (THV-5)", None))
        self.assertEqual(launch.prompt, f"Read and follow your brief: {reg.brief}")
        self.assertEqual(self.spawn(), 0)
        self.assertEqual(store.registrations()[1].agent_name, "build-thv-5-3")

    def test_brief_flag_uses_another_file(self):
        self.brief("verify {{AGENT_NAME}}\n", name="THV-5-verify.md")
        self.assertEqual(self.spawn("--brief", os.path.join(store.sub("proj", "briefs"), "THV-5-verify.md")), 0)
        self.assertTrue(store.registrations()[0].brief.endswith("/briefs/THV-5-verify.build-thv-5-2.md"))


class TemplateDocs(unittest.TestCase):
    """brief.md and review.md slots are exactly what spawn refuses: filling every <<…>> leaves nothing."""

    def test_each_template_passes_once_its_slots_are_filled(self):
        import re
        refs = os.path.join(cli.SCRIPTS, "..", "references")
        fields = {k: "x" for k in ("MAIN_SESSION", "PROJECT", "BOARD", "SNAPSHOT", "AGENT_NAME")}
        for name in ("brief.md", "review.md"):
            with self.subTest(name), open(os.path.join(refs, name)) as f:
                block = re.search(r"```text\n(.*?)\n```", f.read(), re.S).group(1)
                text = cli.fill_brief(block, fields).replace(cli.TICKET_SLOT, "THV-1")
                self.assertTrue(cli.unfilled(text), "the template has no <<slot>>")
                self.assertEqual(cli.unfilled(re.sub(r"<<[^<>\n]+>>", "filled", text)), [])
                self.assertNotIn("THV-<", text)


class FakeAgents:
    SPECS = {"claude": {"kind": "claude", "models": ["opus", "haiku"]}, "codex": {"kind": "codex", "models": ["gpt-x"]}}

    def load(self):
        return {}

    def tier(self, cfg, n):
        return "claude", "opus", "2"

    def cli_spec(self, cfg, cli):
        return self.SPECS[cli]

    def launch(self, cfg, cli, model, effort):
        return ["--model", model, "--effort", {"2": "medium"}[effort]]


class BuildLaunch(unittest.TestCase):
    def test_claude_gets_its_name_and_dirs_before_its_flags(self):
        cli_name, launch = cli.build_launch("2", None, "haiku", "build-thv-5", "go", ["/fe", "/home/p"], FakeAgents())
        self.assertEqual((cli_name, launch.kind, launch.name, launch.prompt), ("claude", "claude", "build-thv-5", "go"))
        self.assertEqual(launch.argv, ("claude", "-n", "build-thv-5", "--add-dir", "/fe", "--add-dir", "/home/p",
                                       "--model", "haiku", "--effort", "medium"))

    def test_codex_by_name_takes_its_first_model_and_no_session_name(self):
        cli_name, launch = cli.build_launch("2", "codex", None, "build-thv-5", "go", [], FakeAgents())
        self.assertEqual((cli_name, launch.argv), ("codex", ("codex", "--model", "gpt-x", "--effort", "medium")))


class Whoami(unittest.TestCase):
    def test_peer_name_from_a_fake_sessions_dir(self):
        with tempfile.TemporaryDirectory() as d:
            for pid, body in (("1", {"sessionId": "aaa", "name": "other", "status": "idle"}),
                              ("2", {"sessionId": "bbb", "name": "thoven-main", "status": "busy"}),
                              ("3", "not json")):
                with open(os.path.join(d, f"{pid}.json"), "w") as f:
                    f.write(body if isinstance(body, str) else json.dumps(body))
            self.assertEqual(cli.peer_name(d, "bbb"), "thoven-main")
            self.assertIsNone(cli.peer_name(d, "zzz"))
            self.assertIsNone(cli.peer_name(d, None))
            self.assertIsNone(cli.peer_name(os.path.join(d, "missing"), "bbb"))


class PaneCommands(Harness):
    def setUp(self):
        super().setUp()
        store.write_registration(registration(pane="block:a", ticket="THV-1"))
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.file = os.path.join(self.dir.name, "fix.md")
        with open(self.file, "w") as f:
            f.write("FIX ROUND 1/3 THV-1\n")

    def test_send_refuses_a_working_pane(self):
        self.mux.statuses["block:a"] = Status(State.WORKING)
        self.assertEqual(self.cmd("send", "build-thv-1", self.file), 3)
        self.assertEqual(self.mux.typed, [])

    def test_send_presses_enter_once_when_the_text_sits_unsent(self):
        seq = iter([Status(State.IDLE, updated_at="u1")] + [Status(State.IDLE, updated_at="u1")] * 61
                   + [Status(State.WORKING, updated_at="u2")])
        self.mux.status = lambda pane: next(seq)
        self.assertEqual(self.cmd("send", "block:a", self.file), 0)
        self.assertEqual(self.mux.typed, [("block:a", "FIX ROUND 1/3 THV-1")])
        self.assertEqual(self.mux.keys, [("block:a", "enter")])
        self.assertEqual(self.out.getvalue(), "sent 19 bytes to block:a (pressed Enter once)\n")

    def test_send_exits_3_when_the_pane_never_starts(self):
        self.mux.statuses["block:a"] = Status(State.IDLE, updated_at="u1")
        self.assertEqual(self.cmd("send", "block:a", self.file), 3)
        self.assertEqual(self.mux.keys, [("block:a", "enter")])

    def test_close_drops_the_registration_before_closing_the_pane(self):
        registered_at_close = []
        self.mux.close = lambda pane: registered_at_close.append(bool(store.registrations()))
        self.assertEqual(self.cmd("close", "build-thv-1"), 0)
        self.assertEqual(registered_at_close, [False])
        self.assertEqual(self.out.getvalue(), "closed block:a (build-thv-1)\n")

    def test_label_and_kinds(self):
        self.assertEqual(self.cmd("label", "--kinds"), 0)
        self.assertEqual(self.out.getvalue().split(), ["Meta", "Plan", "Design", "Build", "Review", "Research",
                                                       "Audit", "Fix", "Verify"])
        self.assertEqual(self.cmd("label", "block:a", "Build", "Cart", "THV-1", "--tab"), 0)
        self.assertEqual(self.mux.labels, [("block:a", "Build · Cart (THV-1)", True)])
        self.assertEqual(self.cmd("label", "block:a", "Builder", "Cart"), 2)


if __name__ == "__main__":
    unittest.main()
