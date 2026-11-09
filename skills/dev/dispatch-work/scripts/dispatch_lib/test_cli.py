import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

import testkit  # noqa: F401
from dispatch_lib import cli, fleet, store
from dispatch_lib.model import EntryKind, State, Status
from dispatch_lib.mux import Launch, MuxError
from dispatch_lib.runner import Result
from testkit import FakeMux, FakeRunner, HomeCase, at, registration


class Harness(HomeCase):
    def setUp(self):
        super().setUp()
        # Tests may run inside a real Rex or herdr pane; none may see it.
        env = patch.dict(os.environ)
        env.start()
        self.addCleanup(env.stop)
        for name in ("REX_BLOCK", "REX_SESSION", "HERDR_PANE_ID", "HERDR_WORKSPACE_ID", "CLAUDE_CODE_SESSION_ID"):
            os.environ.pop(name, None)
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
    def setUp(self):
        super().setUp()
        os.makedirs(store.project_dir("proj"))

    def test_a_typo_project_is_refused_not_created(self):
        def stop_watching(seconds):
            raise KeyboardInterrupt

        self.app.sleep = stop_watching
        for argv in (("post", "projj", "--ticket", "THV-1", "--kind", "answer"), ("board", "projj"),
                     ("watch", "projj")):
            with self.subTest(argv[0]):
                self.assertEqual(self.cmd(*argv, stdin="x"), 2)
                self.assertIn(f"no project 'projj' under {self.home}", self.err.getvalue())
        self.assertFalse(os.path.exists(store.project_dir("projj")))

    def test_a_ticket_takes_any_linear_team_key_and_refuses_the_rest(self):
        self.assertEqual(self.cmd("post", "proj", "--ticket", "DEP-24", "--kind", "answer", stdin="x"), 0)
        for bad in ("", "dep-24", "DEP", "24", "DEP-24x"):
            with self.subTest(bad):
                self.assertEqual(self.cmd("post", "proj", "--ticket", bad, "--kind", "answer", stdin="x"), 2)

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

    def test_a_report_status_must_be_a_report_word(self):
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "report", "--status", "DNOE",
                                  stdin="x"), 2)
        self.assertIn("report status 'DNOE' is not one of: DONE DONE_WITH_CONCERNS NEEDS_CONTEXT BLOCKED VERIFIED "
                      "FINDINGS", self.err.getvalue())
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "report", stdin="x"), 2)
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "report", "--status", "verified",
                                  stdin="x"), 0)
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "question", "--status",
                                  "NEEDS_CONTEXT", stdin="x"), 0)

    def test_board_since_must_be_an_iso_time(self):
        self.assertEqual(self.cmd("board", "proj", "--since", "yesterday"), 2)
        self.assertIn("--since must be an ISO time like 2026-10-22T12:00:00Z, got 'yesterday'", self.err.getvalue())

    def test_json_is_offered_only_where_it_is_honoured(self):
        with patch("sys.stderr", io.StringIO()):
            self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "answer", "--json", stdin="x"), 2)
            self.assertEqual(self.cmd("board", "proj", "--json"), 2)
        store.write_registration(registration(pane="block:a", ticket="THV-1"))
        self.mux.statuses["block:a"] = Status(State.IDLE)
        self.assertEqual(self.cmd("status", "block:a", "--json"), 0)
        self.assertEqual(json.loads(self.out.getvalue())["state"], "IDLE")

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


class Fleet(Harness):
    def test_a_failed_bootstrap_exits_1_and_says_the_job_is_not_loaded(self):
        plist = os.path.join(self.home, "LaunchAgents", "co.thoven.dispatch-tick.plist")
        self.app.run = FakeRunner({
            ("launchctl", "bootstrap"): Result(5, "", "Bootstrap failed: 5: Input/output error\n"),
            ("launchctl", "print"): Result(113, "", "Could not find service"),
        })
        with patch.object(fleet, "plist_path", lambda: plist):
            self.assertEqual(self.cmd("fleet", "install"), 1)
        self.assertEqual(self.err.getvalue(), "dispatch fleet: launchctl bootstrap failed: Bootstrap failed: 5: "
                                              "Input/output error. The old job is not loaded: no tick runs until "
                                              "`dispatch fleet install` succeeds.\n")


class Watch(Harness):
    def setUp(self):
        super().setUp()
        os.makedirs(store.project_dir("proj"))
        store.write_registration(registration(pane="block:a", ticket="THV-1", launched_at="2026-10-22T12:00:00.000Z"))
        store.write_registration(registration(pane="block:c", ticket="THV-2", cli="codex",
                                              launched_at="2026-10-22T12:05:00.000Z"))

    def watch(self):
        """One pass of `dispatch watch proj`, as a fresh process would run it."""
        self.out.seek(0), self.out.truncate()
        passes = iter([False, True])
        self.app.watch(cli.parser().parse_args(["watch", "proj"]), stop=lambda: next(passes))
        return [line.split("  ")[0] for line in self.out.getvalue().splitlines()]

    def post(self, minute, kind, frm, status, body, ticket="THV-1"):
        return store.post("proj", ticket, kind, body, frm, status, at=at(minute * 60))

    def test_first_watch_replays_since_the_earliest_live_launch(self):
        self.post(-1, EntryKind.ALERT, "dispatch-tick", "GONE", "before launch")
        self.post(1, EntryKind.ALERT, "dispatch-tick", "BLOCKED", "after launch")
        self.assertEqual(self.watch(), ["ALERT BLOCKED THV-1 after launch"])

    def test_a_watch_restart_replays_what_landed_while_it_was_down(self):
        self.post(1, EntryKind.ALERT, "dispatch-tick", "BLOCKED", "first")
        self.assertEqual(self.watch(), ["ALERT BLOCKED THV-1 first"])
        self.post(2, EntryKind.ALERT, "dispatch-tick", "LIMIT", "while down")
        self.assertEqual(self.watch(), ["ALERT LIMIT THV-1 while down"])
        self.assertEqual(self.watch(), [])

    def test_an_entry_published_late_with_an_earlier_time_is_still_delivered(self):
        self.post(3, EntryKind.ALERT, "dispatch-tick", "BLOCKED", "published first")
        self.assertEqual(self.watch(), ["ALERT BLOCKED THV-1 published first"])
        self.post(2, EntryKind.ALERT, "dispatch-tick", "FROZEN", "slow tick pass")
        self.assertEqual(self.watch(), ["ALERT FROZEN THV-1 slow tick pass"])

    def test_codex_reports_questions_and_handoffs_are_forwarded(self):
        self.post(6, EntryKind.QUESTION, "build-thv-2", "NEEDS_CONTEXT", "Which table?", "THV-2")
        self.post(7, EntryKind.HANDOFF, "build-thv-2", "HANDOFF", "budget", "THV-2")
        self.post(8, EntryKind.REPORT, "build-thv-2", "DONE", "all done", "THV-2")
        self.post(9, EntryKind.REPORT, "build-thv-1", "DONE", "claude says so by peer message")
        self.post(10, EntryKind.ANSWER, "main", None, "use orders", "THV-2")
        self.assertEqual(self.watch(), ["QUESTION NEEDS_CONTEXT THV-2 Which table?", "HANDOFF HANDOFF THV-2 budget",
                                        "REPORT DONE THV-2 all done"])


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
        self.patches = os.path.join(self.home, "reapply-skill-patches.py")
        open(self.patches, "w").close()
        patch.object(cli, "SKILL_PATCH_SCRIPTS", (self.patches,)).start()

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

    def test_a_brief_without_a_skill_line_is_refused(self):
        for text in ("", "\n\n", "Read and follow the ticket.\n/poteto-mode feature THV-5\n", "poteto-mode feature\n",
                     "/ feature THV-5\n", "$5 budget\n"):
            with self.subTest(text):
                self.brief(text)
                self.assertEqual(self.spawn(), 3)
                self.assertIn("does not open with a skill line", self.err.getvalue())
                self.assertEqual(self.mux.spawned, [])
                self.assertEqual(store.registrations(), [])

    def test_the_skill_line_leads_the_first_prompt(self):
        for line in ('/poteto-mode feature THV-5 "Cart"', '$poteto-mode Verify THV-5 "Cart"', "/poteto-mode"):
            with self.subTest(line):
                self.brief(f"\n{line}\nYou are {{{{AGENT_NAME}}}}.\n")
                self.assertEqual(self.spawn(), 0)
                launch = self.mux.spawned[-1][2]
                self.assertEqual(launch.prompt, f"Invoke {line} to start.\n\nYou are build-thv-5-{len(store.registrations()) + 1}.\n")

    def test_missing_brief_is_refused(self):
        self.assertEqual(self.spawn(), 3)
        self.assertIn("no brief at", self.err.getvalue())

    def test_a_brief_that_reads_the_snapshot_needs_the_snapshot(self):
        self.brief("/poteto-mode feature THV-5 \"Cart\"\nSPEC {{SNAPSHOT}}\n")
        self.assertEqual(self.spawn(), 3)
        self.assertIn(f"no snapshot at {self.home}/proj/snapshots/THV-5.md: run dispatch snapshot proj THV-5 first",
                      self.err.getvalue())
        self.assertEqual(self.mux.spawned, [])
        self.snapshot()
        self.assertEqual(self.spawn(), 0)

    def test_a_failed_agent_start_keeps_the_registration_and_says_so(self):
        self.brief("/poteto-mode feature THV-5 \"Cart\"\ngo {{AGENT_NAME}}\n")
        self.mux.start_error = MuxError("herdr agent start failed in block:new1: timed out")
        self.assertEqual(self.spawn(), 1)
        reg = store.registrations()[0]
        self.assertEqual((reg.pane.pane, reg.agent_name, reg.launched_at),
                         ("block:new1", "build-thv-5-2", "2026-10-22T12:00:00.000Z"))
        self.assertIn("herdr agent start failed in block:new1: timed out", self.err.getvalue())
        self.assertIn("block:new1 stays registered as build-thv-5-2, so the tick raises STARTUP or GONE for it",
                      self.err.getvalue())

    def test_spawn_reapplies_the_skill_patches_before_the_pane_opens(self):
        self.snapshot()
        self.brief("/poteto-mode feature THV-5 \"Cart\"\nbuild it\n")
        self.assertEqual(self.spawn(), 0)
        self.assertIn([sys.executable, self.patches], self.app.run.calls)
        self.assertEqual(len(self.mux.spawned), 1)
        self.assertEqual(self.err.getvalue(), "")

    def test_a_refused_spawn_runs_no_patches(self):
        self.brief("/poteto-mode feature THV-5\nRepo <<path>>\n")
        self.assertEqual(self.spawn(), 3)
        self.assertNotIn([sys.executable, self.patches], self.app.run.calls)

    def test_a_missing_patch_script_is_said_and_the_pane_still_opens(self):
        os.remove(self.patches)
        self.snapshot()
        self.brief("/poteto-mode feature THV-5 \"Cart\"\nbuild it\n")
        self.assertEqual(self.spawn(), 0)
        self.assertIn("no reapply-skill-patches.py found", self.err.getvalue())
        self.assertEqual(len(self.mux.spawned), 1)

    def test_a_failed_or_stale_patch_run_is_said(self):
        self.snapshot()
        self.brief("/poteto-mode feature THV-5 \"Cart\"\nbuild it\n")
        self.app.run = FakeRunner({(sys.executable, self.patches): Result(1, "", "Traceback\nKeyError: x")})
        self.assertEqual(self.spawn(), 0)
        self.assertIn(f"{self.patches} exited 1", self.err.getvalue())
        self.assertIn("KeyError: x", self.err.getvalue())
        self.err.seek(0), self.err.truncate()
        self.app.run = FakeRunner({(sys.executable, self.patches): Result(
            0, "  STALE      .agents/skills: build-design/SKILL.md: | A raw value ...\n", "")})
        self.assertEqual(self.spawn(), 0)
        self.assertIn("skill patches: STALE      .agents/skills: build-design", self.err.getvalue())

    def test_legitimate_angle_brackets_pass_and_fields_fill(self):
        self.snapshot()
        self.brief("/poteto-mode feature THV-5 \"Cart\"\n"
                   "You are {{AGENT_NAME}}; main {{MAIN_SESSION}}; board {{BOARD}}; spec {{SNAPSHOT}}; "
                   "project {{PROJECT}}.\nArray<string> and <Parallel panes> and a -> b.\n"
                   "<div> <https://linear.app/x> <a@b.co> <Path> a << b\n"
                   "post --ticket THV-<id>\n")
        self.assertEqual(self.spawn(), 0)
        reg = store.registrations()[0]
        self.assertEqual((reg.agent_name, reg.main_name, reg.pane.pane, reg.base_sha, reg.cli, reg.tree),
                         ("build-thv-5-2", "andres-main", "block:new1", "abc123", "claude", self.tree))
        self.assertEqual(reg.brief, os.path.join(self.home, "proj", "briefs", "THV-5.build-thv-5-2.md"))
        with open(reg.brief) as f:
            self.assertEqual(f.read(), "/poteto-mode feature THV-5 \"Cart\"\n"
                                       f"You are build-thv-5-2; main andres-main; board {self.home}/proj/board.md; "
                                       f"spec {self.home}/proj/snapshots/THV-5.md; project proj.\n"
                                       "Array<string> and <Parallel panes> and a -> b.\n"
                                       "<div> <https://linear.app/x> <a@b.co> <Path> a << b\n"
                                       "post --ticket THV-5\n")
        cwd, label, launch, split = self.mux.spawned[0]
        self.assertEqual((cwd, label, split), (self.tree, "Build · Cart (THV-5)", "block:main"))
        self.assertEqual(self.mux.floating, [True])
        self.assertEqual(launch.prompt, 'Invoke /poteto-mode feature THV-5 "Cart" to start.\n\n'
                                        f"You are build-thv-5-2; main andres-main; board {self.home}/proj/board.md; "
                                        f"spec {self.home}/proj/snapshots/THV-5.md; project proj.\n"
                                        "Array<string> and <Parallel panes> and a -> b.\n"
                                        "<div> <https://linear.app/x> <a@b.co> <Path> a << b\n"
                                        "post --ticket THV-5\n")
        self.assertEqual(self.spawn(), 0)
        self.assertEqual(store.registrations()[1].agent_name, "build-thv-5-3")

    def test_tab_opens_a_window_and_split_of_names_the_pane(self):
        self.brief("/poteto-mode feature THV-5 \"Cart\"\nGo\n")
        self.snapshot()
        self.assertEqual(self.spawn("--tab"), 0)
        self.assertEqual(self.spawn("--split-of", "block:builder"), 0)
        self.assertEqual([s[3] for s in self.mux.spawned], [None, "block:builder"])
        self.assertEqual(self.mux.floating, [False, True])

    def test_brief_flag_uses_another_file(self):
        self.brief("/poteto-mode Verify THV-5 \"Cart\"\nverify {{AGENT_NAME}}\n", name="THV-5-verify.md")
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


class AlertTableDocs(unittest.TestCase):
    def test_skill_md_has_one_alert_row_per_word_the_tick_raises(self):
        import re
        from dispatch_lib.model import AlertWord
        with open(os.path.join(cli.SCRIPTS, "..", "SKILL.md")) as f:
            text = f.read()
        table = text[text.index("| Alert | Main does |"):]
        table = table[:table.index("\n\n")]
        rows = re.findall(r"^\| `([A-Z_]+)`", table, re.M)
        self.assertEqual(sorted(rows), sorted(w.value for w in AlertWord))


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

    def test_a_pane_id_in_two_backends_resolves_by_backend(self):
        herdr = registration(pane="block:a", ticket="THV-2", agent_name="build-thv-2")
        herdr = herdr.__class__(**{**herdr.__dict__, "pane": herdr.pane.__class__("herdr", "block:a", "w1")})
        store.write_registration(herdr)
        self.assertEqual(self.cmd("close", "block:a"), 3)
        self.assertIn("block:a matches 2 registrations (build-thv-1, build-thv-2): pass --backend or the agent name",
                      self.err.getvalue())
        self.assertEqual(self.cmd("close", "block:a", "--backend", "herdr"), 0)
        self.assertEqual(self.out.getvalue(), "closed block:a (build-thv-2)\n")
        self.assertEqual([r.agent_name for r in store.registrations()], ["build-thv-1"])

    def test_key_presses_one_key_to_answer_a_dialog(self):
        self.assertEqual(self.cmd("key", "build-thv-1", "down"), 0)
        self.assertEqual(self.cmd("key", "block:a", "Enter"), 0)
        self.assertEqual(self.mux.keys, [("block:a", "down"), ("block:a", "enter")])
        self.assertEqual(self.out.getvalue(), "enter -> block:a\n")
        self.assertEqual(self.cmd("key", "block:a", "rm -rf"), 2)
        self.assertEqual(len(self.mux.keys), 2)

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
