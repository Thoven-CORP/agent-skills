"""`dispatch stats`: one row per (project, ticket, agent) from the events log."""
from __future__ import annotations

import datetime
from collections import Counter
from dataclasses import asdict, dataclass, field

from . import usage
from .model import Event, parse_iso

FIRST_WORD_KINDS = ("report", "question", "handoff")
COLUMNS = ("Project", "Ticket", "Agent", "CLI", "Spawned", "First report", "Final", "Corrections", "Questions",
           "Handoffs", "Alerts", "Keys", "Closed", "Tokens in+out / cache")


@dataclass
class Row:
    project: str
    ticket: str | None
    agent: str
    first_at: str
    last_at: str
    cli: str | None = None
    model: str | None = None
    kind: str | None = None
    spawned_at: str | None = None
    first_report_secs: float | None = None
    final_status: str | None = None
    corrections: int = 0
    questions: int = 0
    handoffs: int = 0
    alerts: dict = field(default_factory=dict)
    keys: int = 0
    interrupts: int = 0
    closed_at: str | None = None
    session_id: str | None = None
    usage_by_model: dict | None = None
    usage_note: str | None = None

    def to_dict(self):
        return asdict(self)


def parse_day(s: str) -> datetime.datetime:
    """ValueError unless `s` is YYYY-MM-DD. The day starts at 00:00 UTC."""
    return datetime.datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)


def build(evs: list[Event], since: datetime.datetime | None = None, project: str | None = None,
          usage_for=usage.summary) -> list[Row]:
    table: dict[tuple, Row] = {}
    corrections: list[Event] = []

    def row(e: Event) -> Row:
        key = (e.project, e.ticket, e.agent)
        r = table.get(key) or table.setdefault(key, Row(e.project, e.ticket, e.agent, e.at, e.at))
        r.last_at = e.at
        r.cli = r.cli or e.cli
        return r

    for e in evs:
        if e.event == "post" and e.kind == "correction":
            corrections.append(e)
            continue
        if not e.agent or e.event == "clean" or (e.event == "post" and e.kind not in FIRST_WORD_KINDS):
            continue
        r = row(e)
        if e.event == "spawn":
            r.spawned_at = e.detail.get("launched_at") or e.at
            r.model, r.kind, r.cli = e.detail.get("model"), e.kind, e.cli
        elif e.event == "session":
            r.session_id = e.detail.get("session_id") or r.session_id
        elif e.event == "post":
            if r.first_report_secs is None and r.spawned_at:
                r.first_report_secs = (parse_iso(e.at) - parse_iso(r.spawned_at)).total_seconds()
            if e.kind == "report":
                r.final_status = e.status
            r.questions += e.kind == "question"
            r.handoffs += e.kind == "handoff"
        elif e.event == "alert" and e.status:
            r.alerts[e.status] = r.alerts.get(e.status, 0) + 1
        elif e.event == "send":
            r.corrections += 1
        elif e.event == "key":
            r.keys += 1
        elif e.event == "interrupt":
            r.interrupts += 1
        elif e.event == "close":
            r.closed_at = e.at
            r.session_id = e.detail.get("session_id") or r.session_id
            r.usage_by_model = e.detail.get("usage_by_model")

    for c in corrections:
        at = parse_iso(c.at)
        for r in table.values():
            # A CORRECTION entry names the ticket, not a pane: it counts for every pane of the ticket alive then.
            if (r.project, r.ticket) == (c.project, c.ticket) and parse_iso(r.spawned_at or r.first_at) <= at and (
                    r.closed_at is None or at <= parse_iso(r.closed_at)):
                r.corrections += 1
                r.last_at = max(r.last_at, c.at, key=parse_iso)

    out = [r for r in table.values() if (project is None or r.project == project)
           and (since is None or parse_iso(r.last_at) >= since)]
    for r in out:
        if r.cli == "codex":
            r.usage_by_model, r.usage_note = None, "not tracked"
        elif r.usage_by_model is None and r.session_id:
            r.usage_by_model = usage_for(r.session_id).get("usage_by_model")
            r.usage_note = None if r.closed_at else "so far"
    return sorted(out, key=lambda r: (parse_iso(r.spawned_at or r.first_at), r.agent))


# ---------------------------------------------------------------- rendering

def num(n: int) -> str:
    return f"{n / 1e6:.1f}M" if n >= 1e6 else f"{n / 1e3:.1f}k" if n >= 1e3 else str(n)


def dur(secs: float | None) -> str:
    if secs is None:
        return "-"
    s = max(0, int(secs))
    return f"{s}s" if s < 60 else f"{s // 60}m" if s < 3600 else f"{s // 3600}h{s % 3600 // 60:02d}m"


def tokens(r: Row) -> str:
    if r.usage_note == "not tracked":
        return "not tracked"
    if not r.usage_by_model:
        return "-"
    parts = []
    for model, u in sorted(r.usage_by_model.items()):
        io = u.get("input_tokens", 0) + u.get("output_tokens", 0)
        cache = u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0)
        parts.append(f"{model.removeprefix('claude-')} {num(io)} / {num(cache)}")
    return "; ".join(parts) + (f" ({r.usage_note})" if r.usage_note else "")


def cells(r: Row) -> list[str]:
    spawned = parse_iso(r.spawned_at).strftime("%Y-%m-%d %H:%M") if r.spawned_at else "-"
    alerts = ", ".join(f"{w} {n}" for w, n in sorted(r.alerts.items())) or "-"
    keys = str(r.keys) + (f" +{r.interrupts} esc" if r.interrupts else "")
    cli = " ".join(x for x in (r.cli, r.model) if x) or "-"
    return [r.project, r.ticket or "-", r.agent, cli, spawned, dur(r.first_report_secs), r.final_status or "-",
            str(r.corrections), str(r.questions), str(r.handoffs), alerts, keys, "yes" if r.closed_at else "no",
            tokens(r)]


def markdown(rows: list[Row]) -> str:
    if not rows:
        return ""
    lines = ["| " + " | ".join(COLUMNS) + " |", "|" + "---|" * len(COLUMNS)]
    lines += ["| " + " | ".join(c.replace("|", "/") for c in cells(r)) + " |" for r in rows]
    words = Counter()
    for r in rows:
        words.update(r.alerts)
    heavy = [f"{r.agent} ({r.ticket}, {r.corrections})" for r in rows if r.corrections >= 2]
    lines += ["", "**Friction**", "",
              "- Alerts: " + (", ".join(f"{w} {n}" for w, n in words.most_common()) or "none"),
              "- Rows with 2 or more corrections: " + (", ".join(heavy) or "none")]
    return "\n".join(lines) + "\n"


def text(rows: list[Row]) -> str:
    grid = [list(COLUMNS)] + [cells(r) for r in rows]
    widths = [max(len(row[i]) for row in grid) for i in range(len(COLUMNS))]
    return "\n".join("  ".join(c.ljust(w) for c, w in zip(row, widths)).rstrip() for row in grid) + "\n"
