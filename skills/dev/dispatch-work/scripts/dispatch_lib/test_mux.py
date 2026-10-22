import json
import unittest

import testkit  # noqa: F401
from dispatch_lib.model import PaneRef, State
from dispatch_lib.mux import HerdrMux, RexMux, normalise_rex, screen_fingerprint
from dispatch_lib.runner import Result
from testkit import FakeRunner

CLAUDE = {"last_exit": None, "foreground": {"pid": 10, "name": "2.1.308", "argv0": "claude"}}
CODEX = {"last_exit": None, "foreground": {"pid": 11, "name": "codex", "argv0": "codex"}}


def rec(state, id=None, kind=None, msg=None, at="2026-10-22T11:00:00-04:00"):
    r = {"state": state, "updated_at": at}
    if id:
        r["id"] = id
    if kind:
        r["kind"] = kind
    if msg:
        r["msg"] = msg
    return r


class RexNormalisationTable(unittest.TestCase):
    def test_table(self):
        rows = [
            ("root working", [rec("working")], CLAUDE, State.WORKING),
            ("root done", [rec("done")], CLAUDE, State.DONE),
            ("root idle", [rec("idle")], CLAUDE, State.IDLE),
            ("root blocked", [rec("blocked", kind="permission", msg="approve Bash: ls")], CLAUDE, State.BLOCKED),
            ("root done, child working", [rec("done"), rec("working", id="a1")], CLAUDE, State.WORKING),
            ("root working, child blocked", [rec("working"), rec("blocked", id="a1")], CLAUDE, State.BLOCKED),
            ("root idle, child done", [rec("idle"), rec("done", id="a1")], CLAUDE, State.DONE),
            ("root idle, child idle", [rec("idle"), rec("idle", id="a1")], CLAUDE, State.IDLE),
            ("no records", [], CLAUDE, State.UNKNOWN),
            ("codex at startup", [], CODEX, State.UNKNOWN),
            ("codex idle", [rec("idle")], CODEX, State.IDLE),
            ("program exited", [rec("done")], {**CLAUDE, "last_exit": {"exit_code": 0}}, State.GONE),
            ("shell in front", [rec("done")], {"last_exit": None, "foreground": {"pid": 9, "name": "zsh",
                                                                                 "argv0": "-zsh"}}, State.GONE),
            ("no foreground", [rec("done")], {"last_exit": None, "foreground": None}, State.GONE),
            ("block missing", [], None, State.GONE),
        ]
        for name, records, process, want in rows:
            with self.subTest(name):
                self.assertEqual(normalise_rex(records, process).state, want)

    def test_blocked_carries_kind_msg_and_root_fingerprint(self):
        st = normalise_rex([rec("working", at="T1"), rec("blocked", id="a", kind="permission", msg="approve Bash: rm",
                                                          at="T2")], CLAUDE)
        self.assertEqual((st.state, st.kind, st.msg, st.updated_at, st.fingerprint),
                         (State.BLOCKED, "permission", "approve Bash: rm", "T1", "T1"))


class RexMuxCalls(unittest.TestCase):
    def test_missing_block_is_gone(self):
        run = FakeRunner({("rex", "block", "call"): Result(3, "", 'Error: block target "block:x" not found')})
        self.assertEqual(RexMux(run).status(PaneRef("rex", "block:x", "session:s")).state, State.GONE)

    def test_status_reads_process_then_records(self):
        run = FakeRunner({
            ("rex", "block", "call", "-s", "session:s", "-b", "block:x", "process"): Result(0, json.dumps(CLAUDE), ""),
            ("rex", "block", "call", "-s", "session:s", "-b", "block:x", "program_status"):
                Result(0, json.dumps({"records": [rec("done")]}), ""),
        })
        self.assertEqual(RexMux(run).status(PaneRef("rex", "block:x", "session:s")).state, State.DONE)

    def test_read_tails_the_format_content(self):
        run = FakeRunner({("rex", "block", "call"): Result(0, json.dumps({"content": "a\nb\nc\n\n\n"}), "")})
        self.assertEqual(RexMux(run).read(PaneRef("rex", "block:x", "session:s"), 2), "b\nc")
        self.assertEqual(run.calls[0][-2:], ["format", '{"format": "text", "trim": true, "unwrap": true}'])


class HerdrMuxCalls(unittest.TestCase):
    def test_agent_status_maps_one_to_one_and_not_found_is_gone(self):
        for raw, want in (("working", State.WORKING), ("blocked", State.BLOCKED), ("done", State.DONE),
                          ("idle", State.IDLE), ("unknown", State.UNKNOWN)):
            with self.subTest(raw):
                run = FakeRunner({("herdr-bin", "agent", "get"): Result(
                    0, json.dumps({"result": {"agent": {"agent_status": raw}}}), "")})
                mux = HerdrMux(run)
                mux.bin = "herdr-bin"
                self.assertEqual(mux.status(PaneRef("herdr", "w1:p1", "w1")).state, want)
        run = FakeRunner({("herdr-bin", "agent", "get"): Result(1, json.dumps({"error": {"code": "agent_not_found"}}), "")})
        mux = HerdrMux(run)
        mux.bin = "herdr-bin"
        self.assertEqual(mux.status(PaneRef("herdr", "w1:p1", "w1")).state, State.GONE)

    def test_fingerprint_ignores_turn_timer_and_digits(self):
        a = screen_fingerprint("✽ Doodling… (4m 8s · ↓ 16.3k tokens)\nrunning tests 12\n")
        b = screen_fingerprint("✽ Doodling… (5m 9s · ↓ 17.1k tokens)\nrunning tests 13\n")
        c = screen_fingerprint("running other tests\n")
        self.assertEqual(a, b)
        self.assertNotEqual(a, c)


if __name__ == "__main__":
    unittest.main()
