"""Data shapes shared by every dispatch command."""
from __future__ import annotations

import datetime
import re
from dataclasses import MISSING, asdict, dataclass, field, fields
from enum import Enum
from typing import Literal

Backend = Literal["rex", "herdr"]

KINDS = ("Meta", "Plan", "Design", "Build", "Review", "Research", "Audit", "Fix", "Verify")
REPORT_WORDS = ("DONE", "DONE_WITH_CONCERNS", "NEEDS_CONTEXT", "BLOCKED", "VERIFIED", "FINDINGS")
PROJECT_RE = re.compile(r"^[a-z0-9-]+$")
TICKET_RE = re.compile(r"^THV-[0-9]+$")
# Folders under the dispatch home that are not Projects.
RESERVED_DIRS = ("events",)


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


class AlertWord(str, Enum):
    """Every word `dispatch tick` posts as an ALERT entry's status. SKILL.md has one row per word."""
    STARTUP = "STARTUP"
    BLOCKED = "BLOCKED"
    FROZEN = "FROZEN"
    GONE = "GONE"
    LIMIT = "LIMIT"
    SETTLED_NO_REPORT = "SETTLED_NO_REPORT"
    SETTLED = "SETTLED"
    TICK_ERROR = "TICK_ERROR"


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
    pane: PaneRef
    cli: Literal["claude", "codex"]
    agent_name: str
    tree: str
    launched_at: str
    kind: str = ""
    title: str = ""
    main_name: str = ""
    base_sha: str = ""
    brief: str = ""

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, d) -> "Registration":
        """Unknown keys are ignored and optional ones default, so an older or newer dispatch can read the file.
        ValueError names a missing required key."""
        if not isinstance(d, dict):
            raise ValueError("not a JSON object")
        missing = [f.name for f in fields(cls) if f.default is MISSING and f.name not in d]
        if missing:
            raise ValueError("missing " + ", ".join(missing))
        pane = d["pane"] if isinstance(d["pane"], dict) else {}
        try:
            ref = PaneRef(backend=pane["backend"], pane=pane["pane"], session=pane.get("session", ""))
        except KeyError as e:
            raise ValueError(f"pane is missing {e.args[0]}")
        return cls(**{f.name: d[f.name] for f in fields(cls) if f.name in d and f.name != "pane"}, pane=ref)


@dataclass(frozen=True)
class Entry:
    at: str
    ticket: str
    frm: str
    kind: EntryKind
    status: str | None
    body: str


EVENT_NAMES = ("spawn", "session", "post", "alert", "send", "key", "interrupt", "close", "clean")


@dataclass(frozen=True)
class Event:
    """One line of the events log. `kind` is the pane's Kind on spawn and the entry kind on post;
    `status` is the report word or alert word."""
    at: str
    event: str
    project: str
    ticket: str | None = None
    agent: str | None = None
    pane: str | None = None
    backend: str | None = None
    cli: str | None = None
    kind: str | None = None
    status: str | None = None
    detail: dict = field(default_factory=dict)

    def to_dict(self):
        return asdict(self)

    @classmethod
    def from_dict(cls, d) -> "Event":
        """ValueError when `d` is not an event; unknown keys are ignored."""
        if not isinstance(d, dict) or d.get("event") not in EVENT_NAMES:
            raise ValueError("not an event")
        e = cls(**{f.name: d[f.name] for f in fields(cls) if f.name in d})
        parse_iso(e.at)
        if not isinstance(e.project, str) or not isinstance(e.detail, dict):
            raise ValueError("bad project or detail")
        return e


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
    if project in RESERVED_DIRS:
        raise UsageError(f"{project!r} is reserved for dispatch's own files; pick another project slug")
    return project


def check_ticket(ticket: str) -> str:
    if not TICKET_RE.match(ticket or ""):
        raise UsageError(f"ticket must look like THV-123, got {ticket!r}")
    return ticket
