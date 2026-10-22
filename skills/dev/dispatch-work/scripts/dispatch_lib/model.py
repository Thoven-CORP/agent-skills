"""Data shapes shared by every dispatch command."""
from __future__ import annotations

import datetime
import re
from dataclasses import asdict, dataclass
from enum import Enum
from typing import Literal

Backend = Literal["rex", "herdr"]

KINDS = ("Meta", "Plan", "Design", "Build", "Review", "Research", "Audit", "Fix", "Verify")
REPORT_WORDS = ("DONE", "DONE_WITH_CONCERNS", "NEEDS_CONTEXT", "BLOCKED", "VERIFIED", "FINDINGS")
ALERT_WORDS = ("BLOCKED", "FROZEN", "GONE", "LIMIT", "SETTLED_NO_REPORT", "DIRTY", "LIVE_WORK", "SETTLED")
PROJECT_RE = re.compile(r"^[a-z0-9-]+$")
TICKET_RE = re.compile(r"^THV-[0-9]+$")


class DispatchError(Exception):
    code = 1


class UsageError(DispatchError):
    code = 2


class WrongState(DispatchError):
    code = 3


class State(Enum):
    WORKING = "working"
    BLOCKED = "blocked"
    DONE = "done"
    IDLE = "idle"
    GONE = "gone"
    UNKNOWN = "unknown"


class EntryKind(Enum):
    REPORT = "report"
    QUESTION = "question"
    ANSWER = "answer"
    CORRECTION = "correction"
    HANDOFF = "handoff"
    ALERT = "alert"


@dataclass(frozen=True)
class PaneRef:
    backend: Backend
    pane: str
    session: str


@dataclass(frozen=True)
class Status:
    state: State
    kind: str | None = None
    msg: str | None = None
    updated_at: str | None = None
    fingerprint: str | None = None

    def to_dict(self):
        return {**asdict(self), "state": self.state.name}


@dataclass(frozen=True)
class Registration:
    project: str
    ticket: str
    kind: str
    title: str
    pane: PaneRef
    cli: Literal["claude", "codex"]
    agent_name: str
    main_name: str
    tree: str
    base_sha: str
    brief: str
    launched_at: str

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, d):
        fields = dict(d)
        fields["pane"] = PaneRef(**fields["pane"])
        return cls(**fields)


@dataclass(frozen=True)
class Entry:
    at: str
    ticket: str
    frm: str
    kind: EntryKind
    status: str | None
    body: str


def now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def iso(t: datetime.datetime) -> str:
    return t.astimezone(datetime.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_iso(s: str) -> datetime.datetime:
    t = datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
    return t if t.tzinfo else t.replace(tzinfo=datetime.timezone.utc)


def check_project(project: str) -> str:
    if not PROJECT_RE.match(project or ""):
        raise UsageError(f"project must be a lowercase slug [a-z0-9-]+, got {project!r}")
    return project


def check_ticket(ticket: str) -> str:
    if not TICKET_RE.match(ticket or ""):
        raise UsageError(f"ticket must look like THV-123, got {ticket!r}")
    return ticket
