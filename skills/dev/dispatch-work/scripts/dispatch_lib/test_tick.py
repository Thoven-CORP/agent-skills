import io
import json
import os
import unittest
from unittest.mock import patch

import testkit  # noqa: F401
from dispatch_lib import store, tick
from dispatch_lib.model import EntryKind, State, Status
from testkit import FakeMux, FakeRunner, HomeCase, at, registration
from dispatch_lib.runner import Result


def working(fp="fp1"):
    return Status(State.WORKING, fingerprint=fp, updated_at=fp)


def done(fp="fp2"):
    return Status(State.DONE, fingerprint=fp, updated_at=fp)


class TickCase(HomeCase):
    def setUp(self):
        super().setUp()
        self.mux = FakeMux()
        self.run = FakeRunner({("git",): Result(0, "", "")})

    def reg(self, **kw):
        reg = registration(**kw)
        store.write_registration(reg)
        return reg

    def tick(self, reg, status, seconds):
        self.mux.statuses[reg.pane.pane] = status
        return [a.word for a, _ in tick.tick_pane(reg, self.run, at(seconds), self.mux)]

    def report(self, reg, seconds=30):
        store.post(reg.project, reg.ticket, EntryKind.REPORT, "all good", reg.agent_name, "DONE", at=at(seconds))


class Blocked(TickCase):
    def test_blocked_under_120s_is_quiet_and_over_alerts_once(self):
        reg = self.reg()
        blocked = Status(State.BLOCKED, "permission", "approve Bash: rm -rf x", "u1", "u1")
        self.assertEqual(self.tick(reg, working(), 0), [])
        self.assertEqual(self.tick(reg, blocked, 30), [])
        self.assertEqual(self.tick(reg, blocked, 149), [])
        self.assertEqual(self.tick(reg, blocked, 150), ["BLOCKED"])
        self.assertEqual(self.tick(reg, blocked, 180), [])
        self.assertEqual(self.alerts(), [("BLOCKED", "THV-1")])
        body = store.entries("proj")[0][1].body
        self.assertEqual(body, "build-thv-1 (rex block:a): blocked permission: approve Bash: rm -rf x")

    def test_a_new_blocked_episode_alerts_again(self):
        reg = self.reg()
        blocked = Status(State.BLOCKED, "permission", "m", "u1", "u1")
        self.tick(reg, blocked, 0)
        self.assertEqual(self.tick(reg, blocked, 120), ["BLOCKED"])
        self.tick(reg, working("w2"), 150)
        again = Status(State.BLOCKED, "permission", "m", "u3", "u3")
        self.tick(reg, again, 180)
        self.assertEqual(self.tick(reg, again, 300), ["BLOCKED"])


class Frozen(TickCase):
    def test_unchanged_fingerprint_for_10_minutes_at_low_cpu_alerts_once(self):
        reg = self.reg()
        self.mux._cpu = 0.4
        self.assertEqual(self.tick(reg, working("same"), 0), [])
        self.assertEqual(self.tick(reg, working("same"), 599), [])
        self.assertEqual(self.tick(reg, working("same"), 600), ["FROZEN"])
        self.assertEqual(self.tick(reg, working("same"), 630), [])

    def test_busy_cpu_or_a_changing_fingerprint_is_not_frozen(self):
        reg = self.reg()
        self.mux._cpu = 80.0
        self.tick(reg, working("same"), 0)
        self.assertEqual(self.tick(reg, working("same"), 900), [])
        self.mux._cpu = 0.0
        self.assertEqual(self.tick(reg, working("new"), 960), [])
        self.assertEqual(self.tick(reg, working("new"), 1559), [])
        self.assertEqual(self.tick(reg, working("new"), 1560), ["FROZEN"])


class Settle(TickCase):
    def test_claude_settle_with_report_and_clean_tree_posts_nothing(self):
        reg = self.reg()
        self.tick(reg, working(), 0)
        self.report(reg, 30)
        self.assertEqual(self.tick(reg, done(), 60), [])
        self.assertEqual(self.tick(reg, done(), 90), [])
        self.assertEqual(self.alerts(), [])

    def test_claude_settle_without_report_alerts_settled_no_report_once(self):
        reg = self.reg()
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), ["SETTLED_NO_REPORT"])
        self.assertEqual(self.tick(reg, done(), 90), [])
        self.assertEqual(self.alerts(), [("SETTLED_NO_REPORT", "THV-1")])

    def test_a_report_from_before_launch_does_not_count(self):
        reg = self.reg(launched_at="2026-10-22T12:00:10.000Z")
        self.report(reg, 5)
        self.tick(reg, working(), 20)
        self.assertEqual(self.tick(reg, done(), 60), ["SETTLED_NO_REPORT"])

    def test_a_dirty_tree_beside_a_report_is_quiet_and_a_limit_line_still_alerts(self):
        reg = self.reg()
        self.run = FakeRunner({("git",): Result(0, " M app.rb\n?? new.txt\n", "")})
        self.mux.screen = "working\nYou've hit your usage limit · resets at 5pm\n"
        self.tick(reg, working(), 0)
        self.report(reg)
        self.assertEqual(self.tick(reg, done(), 60), ["LIMIT"])
        bodies = {e.status: e.body for _, e in store.entries("proj") if e.kind == EntryKind.ALERT}
        self.assertEqual(bodies["LIMIT"], "build-thv-1 (rex block:a): You've hit your usage limit · resets at 5pm")
        self.assertEqual(self.run.calls[0], ["git", "-C", "/nonexistent", "status", "--porcelain"])

    def test_a_dirty_tree_rides_the_no_report_alert(self):
        reg = self.reg()
        self.run = FakeRunner({("git",): Result(0, " M app.rb\n", "")})
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), ["SETTLED_NO_REPORT"])
        body = [e.body for _, e in store.entries("proj") if e.kind == EntryKind.ALERT][0]
        self.assertTrue(body.endswith("; /nonexistent: 1 uncommitted:  M app.rb"), body)

    def test_a_fix_round_that_settles_without_a_new_report_alerts(self):
        reg = self.reg()
        self.tick(reg, working(), 0)
        self.report(reg, 30)
        self.assertEqual(self.tick(reg, done(), 60), [])
        self.tick(reg, working("w3"), 120)
        self.assertEqual(self.tick(reg, done("d3"), 180), ["SETTLED_NO_REPORT"])

    def test_codex_settle_always_alerts_settled_with_gate_results(self):
        reg = self.reg(cli="codex")
        self.tick(reg, Status(State.UNKNOWN), 0)
        self.tick(reg, working(), 40)
        self.report(reg, 50)
        self.assertEqual(self.tick(reg, Status(State.IDLE, fingerprint="i"), 70), ["SETTLED"])
        self.assertEqual(store.entries("proj")[-1][1].body,
                         "build-thv-1 (rex block:a): codex settled. report: yes; dirty: no; limit: no")
        self.assertEqual(self.tick(reg, Status(State.IDLE, fingerprint="i"), 100), [])

    def test_unknown_at_startup_then_idle_is_not_a_settle_after_idle(self):
        reg = self.reg(cli="codex")
        self.tick(reg, Status(State.IDLE), 0)
        self.assertEqual(self.alerts(), [("SETTLED", "THV-1")])
        self.assertEqual(self.tick(reg, Status(State.UNKNOWN), 30), [])
        self.assertEqual(self.tick(reg, Status(State.IDLE), 60), [])

    def test_live_work_waits_and_rechecks_then_runs_the_gates_when_it_ends(self):
        reg = self.reg()
        self.mux.live = ["sleep 300 (pid 4242)"]
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), [])
        self.assertEqual(self.tick(reg, done(), 90), [])
        self.assertEqual(self.alerts(), [])
        self.mux.live = []
        self.assertEqual(self.tick(reg, done(), 120), ["SETTLED_NO_REPORT"])

    def test_live_work_escalates_only_after_ten_minutes(self):
        reg = self.reg()
        self.mux.live = ["pnpm dev (pid 77)"]
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), [])
        self.assertEqual(self.tick(reg, done(), 659), [])
        self.assertEqual(self.tick(reg, done(), 660), ["LIVE_WORK"])
        self.assertEqual(self.tick(reg, done(), 690), [])
        self.assertEqual(store.entries("proj")[-1][1].body,
                         "build-thv-1 (rex block:a): still running after settle: pnpm dev (pid 77)")

    def test_resuming_work_then_settling_again_is_a_new_episode(self):
        reg = self.reg()
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), ["SETTLED_NO_REPORT"])
        self.tick(reg, working("w3"), 90)
        self.assertEqual(self.tick(reg, done("d3"), 120), ["SETTLED_NO_REPORT"])


class Gone(TickCase):
    def test_gone_alerts_once(self):
        reg = self.reg()
        self.assertEqual(self.tick(reg, Status(State.GONE), 0), ["GONE"])
        self.assertEqual(self.tick(reg, Status(State.GONE), 30), [])


class Idempotency(TickCase):
    def test_two_ticks_at_the_same_moment_never_double_post(self):
        reg = self.reg()
        self.tick(reg, working(), 0)
        self.assertEqual(self.tick(reg, done(), 60), ["SETTLED_NO_REPORT"])
        self.assertEqual(self.tick(reg, done(), 60), [])
        self.assertEqual(len(store.entries("proj")), 1)

    def test_a_corrupt_or_missing_watch_file_resets_to_empty(self):
        reg = self.reg()
        path = store.watch_path("proj", reg.pane)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        for junk in ("{not json", json.dumps([1, 2]), json.dumps({"since": "yesterday"})):
            with self.subTest(junk):
                with open(path, "w") as f:
                    f.write(junk)
                self.assertEqual(store.read_watch("proj", reg.pane), store.empty_watch())
        self.assertEqual(self.tick(reg, working(), 0), [])
        with open(path) as f:
            self.assertEqual(json.load(f)["last_state"], "WORKING")

    def test_one_pane_failing_never_stops_the_pass(self):
        bad = self.reg(pane="block:bad", ticket="THV-1")
        good = self.reg(pane="block:good", ticket="THV-2")
        self.mux.statuses = {bad.pane.pane: RuntimeError("rex down"), good.pane.pane: Status(State.GONE)}
        out = io.StringIO()
        count = tick.tick_all(self.run, at(0), mux_for=lambda r: self.mux, out=out)
        self.assertEqual(count, 1)
        self.assertEqual(self.alerts(), [("GONE", "THV-2")])
        self.assertIn("block:bad tick failed: RuntimeError('rex down')", out.getvalue())



class Startup(TickCase):
    def unknown(self):
        return Status(State.UNKNOWN)

    def test_no_status_90s_after_launch_alerts_once(self):
        reg = self.reg(launched_at="2026-10-22T12:00:00.000Z")
        self.assertEqual(self.tick(reg, self.unknown(), 60), [])
        self.assertEqual(self.tick(reg, self.unknown(), 95), ["STARTUP"])
        self.assertEqual(self.tick(reg, self.unknown(), 125), [])

    def test_a_pane_that_reported_once_never_raises_startup(self):
        reg = self.reg()
        self.tick(reg, working(), 10)
        self.assertEqual(self.tick(reg, self.unknown(), 200), [])


class AlertDedup(TickCase):
    def test_a_crash_after_posting_never_reposts(self):
        self.reg()
        with patch.object(store, "write_watch", side_effect=RuntimeError("disk full")):
            for s in (0, 30, 60):
                tick.tick_all(self.run, at(s), mux_for=lambda r: self.mux, out=io.StringIO())
        self.assertEqual(self.alerts(), [("GONE", "THV-1")])

    def test_a_watch_reset_does_not_realert_an_alerted_blocked_episode(self):
        reg = self.reg()
        blocked = Status(State.BLOCKED, "permission", "m", "u1", "u1")
        self.tick(reg, blocked, 0)
        self.assertEqual(self.tick(reg, blocked, 120), ["BLOCKED"])
        os.unlink(store.watch_path("proj", reg.pane))
        self.assertEqual(self.tick(reg, blocked, 150), [])
        self.assertEqual(self.tick(reg, blocked, 300), [])
        self.assertEqual(self.alerts(), [("BLOCKED", "THV-1")])


if __name__ == "__main__":
    unittest.main()
