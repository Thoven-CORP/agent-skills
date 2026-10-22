"""Shared fixtures for the dispatch tests: a temp THOVEN_DISPATCH_HOME, a FakeMux and a fake runner."""
import datetime
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dispatch_lib import store  # noqa: E402
from dispatch_lib.model import PaneRef, Registration, State, Status  # noqa: E402
from dispatch_lib.runner import Result  # noqa: E402

T0 = datetime.datetime(2026, 10, 22, 12, 0, 0, tzinfo=datetime.timezone.utc)


def at(seconds: float) -> datetime.datetime:
    return T0 + datetime.timedelta(seconds=seconds)


class FakeRunner:
    """Answers argv prefixes from a table; records every call."""

    def __init__(self, table=None):
        self.table = list((table or {}).items())
        self.calls = []

    def __call__(self, argv, input=None, timeout=30):
        argv = list(argv)
        self.calls.append(argv)
        for prefix, result in self.table:
            if argv[:len(prefix)] == list(prefix):
                return result(argv, input) if callable(result) else result
        return Result(0, "", "")


class FakeMux:
    def __init__(self, statuses=None, screen="", cpu=0.0, live=None):
        self.statuses = dict(statuses or {})
        self.screen, self._cpu, self.live = screen, cpu, list(live or [])
        self.typed, self.keys, self.closed, self.labels, self.spawned = [], [], [], [], []

    def spawn(self, cwd, label, launch, split_of):
        self.spawned.append((cwd, label, launch, split_of))
        return PaneRef("rex", f"block:new{len(self.spawned)}", "session:test")

    def label(self, pane, label, tab):
        self.labels.append((pane.pane, label, tab))

    def status(self, pane):
        st = self.statuses.get(pane.pane, Status(State.GONE))
        if isinstance(st, Exception):
            raise st
        return st

    def read(self, pane, lines):
        return "\n".join(self.screen.splitlines()[-lines:])

    def type_text(self, pane, text):
        self.typed.append((pane.pane, text))

    def key(self, pane, key):
        self.keys.append((pane.pane, key))

    def close(self, pane):
        self.closed.append(pane.pane)

    def cpu(self, pane):
        return self._cpu

    def live_work(self, pane):
        return list(self.live)


def registration(pane="block:a", cli="claude", ticket="THV-1", project="proj", tree="/nonexistent",
                 launched_at="2026-10-22T11:59:00.000Z", agent_name=None):
    return Registration(project=project, ticket=ticket, kind="Build", title="T", pane=PaneRef("rex", pane, "session:s"),
                        cli=cli, agent_name=agent_name or f"build-{ticket.lower()}", main_name="main-1", tree=tree,
                        base_sha="abc", brief="/b.md", launched_at=launched_at)


class HomeCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = self.tmp.name
        old = os.environ.get("THOVEN_DISPATCH_HOME")
        os.environ["THOVEN_DISPATCH_HOME"] = self.home
        self.addCleanup(lambda: os.environ.__setitem__("THOVEN_DISPATCH_HOME", old) if old is not None
                        else os.environ.pop("THOVEN_DISPATCH_HOME", None))

    def alerts(self, project="proj"):
        return [(e.status, e.ticket) for _, e in store.entries(project) if e.kind.name == "ALERT"]


def capture():
    return io.StringIO(), io.StringIO()
