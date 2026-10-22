import json
import os
import unittest
from unittest import mock

import testkit  # noqa: F401
from dispatch_lib.model import PaneRef, State
from dispatch_lib.mux import HerdrMux, Launch, MuxError, RexMux, normalise_rex, screen_fingerprint
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

    def test_blocked_carries_kind_msg_and_the_newest_update_as_fingerprint(self):
        st = normalise_rex([rec("working", at="T1"), rec("blocked", id="a", kind="permission", msg="approve Bash: rm",
                                                          at="T2")], CLAUDE)
        self.assertEqual((st.state, st.kind, st.msg, st.updated_at, st.fingerprint),
                         (State.BLOCKED, "permission", "approve Bash: rm", "T2", "T2"))

    def test_blocked_updated_at_is_the_blocked_records_own_stamp(self):
        st = normalise_rex([rec("blocked", kind="permission", at="T1"), rec("working", id="sub", at="T5")], CLAUDE)
        self.assertEqual((st.state, st.updated_at, st.fingerprint), (State.BLOCKED, "T1", "T5"))

    def test_a_subagent_update_moves_the_fingerprint_while_the_root_is_still(self):
        st = normalise_rex([rec("working", at="2026-10-22T11:00:00-04:00"),
                            rec("working", id="sub", at="2026-10-22T11:09:00-04:00")], CLAUDE)
        self.assertEqual(st.fingerprint, "2026-10-22T11:09:00-04:00")


class RexMuxCalls(unittest.TestCase):
    def test_missing_block_is_gone(self):
        run = FakeRunner({("rex", "block", "call"): Result(3, "", 'Error: block target "block:x" not found')})
        self.assertEqual(RexMux(run).status(PaneRef("rex", "block:x", "session:s")).state, State.GONE)

    def test_a_missing_session_or_rex_binary_raises_instead_of_reading_as_gone(self):
        for err in ('Error: session target "session:s" not found', "zsh: command not found: rex"):
            with self.subTest(err):
                run = FakeRunner({("rex", "block", "call"): Result(1, "", err)})
                with self.assertRaises(MuxError):
                    RexMux(run).status(PaneRef("rex", "block:x", "session:s"))

    def test_paste_waits_through_the_injected_sleep_before_enter(self):
        slept, run = [], FakeRunner()
        RexMux(run, sleep=slept.append).type_text(PaneRef("rex", "block:x", "session:s"), "hi")
        self.assertEqual(slept, [0.5])
        self.assertEqual(run.calls[-1], ["rex", "send-key", "-s", "session:s", "-b", "block:x", "enter"])

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



class HerdrSpawn(unittest.TestCase):
    def test_the_opening_prompt_rides_agent_start_and_nothing_is_typed(self):
        tab = Result(0, json.dumps({"result": {"root_pane": {"pane_id": "w9:p3"}}}), "")
        run = FakeRunner({("herdr", "tab", "create"): tab})
        launch = Launch(kind="claude", name="build-thv-1", argv=("claude", "-n", "build-thv-1", "--model", "haiku"),
                        prompt="Read and follow your brief: /b.md")
        with mock.patch.dict(os.environ, {"HERDR_WORKSPACE_ID": "w9", "HERDR_BIN": "herdr"}):
            ref = HerdrMux(run).spawn("/tree", "Build · x (THV-1)", launch, None)
        self.assertEqual(ref, PaneRef("herdr", "w9:p3", "w9"))
        start = next(c for c in run.calls if c[1:3] == ["agent", "start"])
        self.assertEqual(start[start.index("--") + 1:],
                         ["-n", "build-thv-1", "--model", "haiku", "Read and follow your brief: /b.md"])
        self.assertEqual([c for c in run.calls if c[1:3] in (["agent", "prompt"], ["agent", "send-keys"])], [])


if __name__ == "__main__":
    unittest.main()
