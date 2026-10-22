import json
import os

import test_cli
import testkit  # noqa: F401
from dispatch_lib import events, stats, store, tick, usage
from dispatch_lib.model import Event, State, Status, UsageError, check_project, iso
from testkit import FakeMux, FakeRunner, HomeCase, assistant_line, at, claude_session, registration


def ev(seconds, name, agent="build-thv-1", ticket="THV-1", project="proj", cli="claude", kind=None, status=None,
       **detail):
    return Event(at=iso(at(seconds)), event=name, project=project, ticket=ticket, agent=agent, pane="block:a",
                 backend="rex", cli=cli, kind=kind, status=status, detail=detail)


def write_log(evs):
    for e in evs:
        assert events.emit(e)


class EventLog(HomeCase):
    def test_emit_appends_one_json_line_per_event_into_the_month_file(self):
        write_log([ev(0, "spawn", kind="Build", model="opus"), ev(60, "key", key="enter")])
        path = os.path.join(self.home, "events", "2026-10.jsonl")
        with open(path) as f:
            lines = f.read().splitlines()
        self.assertEqual([json.loads(line)["event"] for line in lines], ["spawn", "key"])
        self.assertEqual([e.detail for e in events.read()], [{"model": "opus"}, {"key": "enter"}])

    def test_a_bad_line_is_skipped_and_named(self):
        write_log([ev(0, "spawn")])
        with open(os.path.join(self.home, "events", "2026-10.jsonl"), "a") as f:
            f.write("not json\n" + json.dumps({"event": "nope", "at": "x", "project": "p"}) + "\n")
        skipped = []
        self.assertEqual(len(events.read(log=skipped.append)), 1)
        self.assertEqual(len(skipped), 2)

    def test_a_failed_write_is_logged_and_returns_false(self):
        open(os.path.join(self.home, "events"), "w").close()
        logged = []
        self.assertFalse(events.emit(ev(0, "spawn"), log=logged.append))
        self.assertIn("telemetry: spawn event not written", logged[0])

    def test_events_is_not_a_project(self):
        with self.assertRaises(UsageError):
            check_project("events")
        write_log([ev(0, "spawn")])
        self.assertEqual(store.projects(), [])


class CommandsEmit(test_cli.Harness):
    def setUp(self):
        super().setUp()
        os.makedirs(store.project_dir("proj"))
        self.reg = registration()
        store.write_registration(self.reg)
        os.environ["REX_SESSION"] = "session:s"

    def names(self):
        return [(e.event, e.agent, e.kind, e.status) for e in events.read()]

    def test_post_key_interrupt_and_clean_are_logged_and_clean_keeps_the_log(self):
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "report", "--status", "done",
                                  "--from", "build-thv-1", stdin="ok"), 0)
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "correction", "--from", "main-1",
                                  stdin="fix it"), 0)
        self.assertEqual(self.cmd("key", "build-thv-1", "enter"), 0)
        self.assertEqual(self.cmd("interrupt", "build-thv-1"), 0)
        self.assertEqual(self.cmd("close", "build-thv-1"), 0)
        self.assertEqual(self.cmd("clean", "proj"), 0)
        self.assertEqual(self.names(), [("post", "build-thv-1", "report", "DONE"),
                                        ("post", "main-1", "correction", None), ("key", "build-thv-1", None, None),
                                        ("interrupt", "build-thv-1", None, None), ("close", "build-thv-1", None, None),
                                        ("clean", None, None, None)])
        self.assertFalse(os.path.exists(store.project_dir("proj")))
        self.assertEqual(events.read()[0].pane, "block:a")

    def test_a_broken_events_log_never_fails_a_command(self):
        open(os.path.join(self.home, "events"), "w").close()
        self.assertEqual(self.cmd("post", "proj", "--ticket", "THV-1", "--kind", "question", "--from", "build-thv-1",
                                  stdin="which?"), 0)
        self.assertTrue(self.out.getvalue().strip().endswith(".md"))
        self.assertIn("telemetry: post event not written", self.err.getvalue())
        self.assertEqual(self.cmd("close", "build-thv-1"), 0)
        self.assertEqual(self.mux.closed, ["block:a"])

    def test_close_sums_the_claude_transcript_and_codex_is_not_tracked(self):
        claude_session(self.claude, 77, "build-thv-1", "sess-1")
        folder = os.path.join(self.claude, "projects", "-tree")
        os.makedirs(folder)
        with open(os.path.join(folder, "sess-1.jsonl"), "w") as f:
            f.write(assistant_line("m1", "claude-opus-5-5", 10, 100, 1000, 50))
        self.assertEqual(self.cmd("close", "build-thv-1"), 0)
        codex = registration(pane="block:c", cli="codex", agent_name="fix-thv-1")
        store.write_registration(codex)
        self.assertEqual(self.cmd("close", "fix-thv-1"), 0)
        claude_close, codex_close = [e.detail for e in events.read() if e.event == "close"]
        self.assertEqual(claude_close["session_id"], "sess-1")
        self.assertEqual(claude_close["usage_by_model"]["claude-opus-5-5"]["output_tokens"], 100)
        self.assertEqual(claude_close["turns"], 1)
        self.assertEqual(codex_close, {"usage_by_model": None})

    def test_a_gone_pane_is_costed_from_the_session_id_a_tick_caught(self):
        store.write_watch("proj", self.reg.pane, {**store.empty_watch(), "session_id": "sess-9"})
        folder = os.path.join(self.claude, "projects", "-tree")
        os.makedirs(folder)
        with open(os.path.join(folder, "sess-9.jsonl"), "w") as f:
            f.write(assistant_line("m1", "claude-sonnet-5", 1, 2))
        self.assertEqual(self.cmd("close", "build-thv-1"), 0)
        close = [e for e in events.read() if e.event == "close"][0]
        self.assertEqual(close.detail["usage_by_model"]["claude-sonnet-5"]["input_tokens"], 1)


class TickEmits(HomeCase):
    def setUp(self):
        super().setUp()
        self.reg = registration()
        store.write_registration(self.reg)
        self.mux = FakeMux()

    def test_an_alert_event_is_emitted_once_however_often_the_condition_holds(self):
        for seconds in (30, 60, 90, 120):
            self.mux.statuses["block:a"] = Status(State.GONE)
            tick.tick_pane(self.reg, FakeRunner(), at(seconds), self.mux)
        self.assertEqual([(e.event, e.status) for e in events.read() if e.event == "alert"], [("alert", "GONE")])
        self.assertEqual(self.alerts(), [("GONE", "THV-1")])

    def test_the_session_id_is_caught_once_into_the_watch(self):
        claude_session(self.claude, 5, "build-thv-1", "sess-5")
        for seconds in (30, 60):
            self.mux.statuses["block:a"] = Status(State.WORKING, fingerprint="f")
            tick.tick_pane(self.reg, FakeRunner(), at(seconds), self.mux)
        self.assertEqual(store.read_watch("proj", self.reg.pane)["session_id"], "sess-5")
        self.assertEqual([e.detail for e in events.read() if e.event == "session"], [{"session_id": "sess-5"}])

    def test_a_broken_events_log_still_posts_the_alert(self):
        open(os.path.join(self.home, "events"), "w").close()
        logged = []
        self.mux.statuses["block:a"] = Status(State.GONE)
        tick.tick_pane(self.reg, FakeRunner(), at(30), self.mux, log=logged.append)
        self.assertEqual(self.alerts(), [("GONE", "THV-1")])
        self.assertTrue(any("telemetry: alert event not written" in line for line in logged))


class Usage(HomeCase):
    def test_streamed_chunks_count_once_and_models_are_grouped_with_subagents(self):
        folder = os.path.join(self.claude, "projects", "-tree")
        os.makedirs(os.path.join(folder, "sess-1", "subagents"))
        with open(os.path.join(folder, "sess-1.jsonl"), "w") as f:
            f.write(json.dumps({"type": "user", "message": {"content": "hi", "usage": {"input_tokens": 999}}}) + "\n")
            f.write(assistant_line("m1", "claude-opus-5-5", 10, 1, 100, 5))
            f.write(assistant_line("m1", "claude-opus-5-5", 10, 40, 100, 5))
            f.write("{broken \"usage\"\n")
            f.write(assistant_line("m2", "claude-opus-5-5", 3, 7, 200, 0))
        with open(os.path.join(folder, "sess-1", "subagents", "agent-x.jsonl"), "w") as f:
            f.write(assistant_line("m3", "claude-haiku-5", 1, 2, 3, 4))
        s = usage.summary("sess-1")
        self.assertEqual(s["transcript"], os.path.join(folder, "sess-1.jsonl"))
        self.assertEqual(s["turns"], 3)
        self.assertEqual(s["usage_by_model"], {
            "claude-opus-5-5": {"input_tokens": 13, "output_tokens": 47, "cache_read_input_tokens": 300,
                                "cache_creation_input_tokens": 5},
            "claude-haiku-5": {"input_tokens": 1, "output_tokens": 2, "cache_read_input_tokens": 3,
                               "cache_creation_input_tokens": 4}})

    def test_no_transcript_or_a_bad_id_gives_null_usage(self):
        self.assertIsNone(usage.summary("sess-missing")["usage_by_model"])
        self.assertEqual(usage.transcripts("../*"), [])
        self.assertIsNone(usage.summary(None)["usage_by_model"])


def fixture():
    """Two panes on THV-1, one Codex pane on THV-2, and one September pane."""
    return [
        ev(-30 * 86400, "spawn", agent="build-thv-9", ticket="THV-9", kind="Build", launched_at=iso(at(-30 * 86400))),
        ev(0, "spawn", kind="Build", model="opus", launched_at=iso(at(0))),
        ev(90, "alert", kind="alert", status="STARTUP"),
        ev(100, "key", key="enter"),
        ev(300, "send", bytes=40),
        ev(360, "post", agent="main-1", kind="correction"),
        ev(600, "post", kind="question"),
        ev(900, "alert", kind="alert", status="SETTLED_NO_REPORT"),
        ev(1800, "post", kind="report", status="DONE"),
        ev(1900, "close", session_id="s1", usage_by_model={"claude-opus-5-5": {
            "input_tokens": 1000, "output_tokens": 500, "cache_read_input_tokens": 2_000_000,
            "cache_creation_input_tokens": 0}}),
        ev(2000, "post", agent="main-1", kind="correction"),
        ev(2000, "spawn", agent="fix-thv-1", kind="Fix", model="opus", launched_at=iso(at(2000))),
        ev(2100, "post", agent="main-1", kind="correction"),
        ev(3000, "spawn", agent="fix-thv-2", ticket="THV-2", cli="codex", kind="Fix", model="gpt-5.5",
           launched_at=iso(at(3000))),
        ev(3200, "alert", agent="fix-thv-2", ticket="THV-2", cli="codex", kind="alert", status="STARTUP"),
        ev(4000, "post", agent="fix-thv-2", ticket="THV-2", cli="codex", kind="handoff"),
        ev(4100, "close", agent="fix-thv-2", ticket="THV-2", cli="codex", usage_by_model=None),
    ]


class Stats(HomeCase):
    def test_rows_time_to_report_corrections_and_usage(self):
        rows = {r.agent: r for r in stats.build(fixture())}
        build = rows["build-thv-1"]
        self.assertEqual(build.first_report_secs, 600)
        self.assertEqual(build.final_status, "DONE")
        # One send plus the correction at 360s; the one at 2000s came after close.
        self.assertEqual(build.corrections, 2)
        self.assertEqual((build.questions, build.keys), (1, 1))
        self.assertEqual(build.alerts, {"STARTUP": 1, "SETTLED_NO_REPORT": 1})
        self.assertEqual(rows["fix-thv-1"].corrections, 2)
        self.assertIsNone(rows["fix-thv-1"].closed_at)
        self.assertEqual(rows["fix-thv-2"].handoffs, 1)
        self.assertEqual(rows["fix-thv-2"].usage_note, "not tracked")

    def test_a_live_pane_is_costed_from_its_session_event(self):
        rows = stats.build([ev(0, "spawn"), ev(30, "session", session_id="s7")],
                           usage_for=lambda sid: {"usage_by_model": {"m": {"input_tokens": 5}}})
        self.assertEqual((rows[0].usage_by_model, rows[0].usage_note), ({"m": {"input_tokens": 5}}, "so far"))

    def test_since_and_project_filter(self):
        evs = fixture()
        self.assertEqual(len(stats.build(evs)), 4)
        self.assertEqual([r.agent for r in stats.build(evs, since=stats.parse_day("2026-10-01"))],
                         ["build-thv-1", "fix-thv-1", "fix-thv-2"])
        self.assertEqual(stats.build(evs, project="other"), [])

    def test_markdown_has_a_friction_footer_and_empty_is_empty(self):
        md = stats.markdown(stats.build(fixture(), since=stats.parse_day("2026-10-01")))
        self.assertIn("| proj | THV-1 | build-thv-1 | claude opus | 2026-10-22 12:00 | 10m | DONE | 2 | 1 | 0 |", md)
        self.assertIn("opus-5-5 1.5k / 2.0M", md)
        self.assertIn("- Alerts: STARTUP 2, SETTLED_NO_REPORT 1", md)
        self.assertIn("- Rows with 2 or more corrections: build-thv-1 (THV-1, 2), fix-thv-1 (THV-1, 2)", md)
        self.assertEqual(stats.markdown([]), "")


class StatsCommand(test_cli.Harness):
    def test_since_filters_and_a_bad_day_is_a_usage_error(self):
        write_log(fixture())
        self.assertEqual(self.cmd("stats", "--since", "2026-10-01", "--json"), 0)
        self.assertEqual([r["agent"] for r in json.loads(self.out.getvalue())],
                         ["build-thv-1", "fix-thv-1", "fix-thv-2"])
        self.assertEqual(self.cmd("stats", "--since", "10/01"), 2)
        self.assertIn("--since must be a day", self.err.getvalue())
        self.assertEqual(self.cmd("stats", "--md", "--project", "nope"), 0)
        self.assertEqual(self.out.getvalue(), "")
        self.assertEqual(self.cmd("stats"), 0)
        self.assertIn("build-thv-9", self.out.getvalue())
