"""The events log: one JSON line per dispatch action, kept outside every Project so `dispatch clean` never
deletes it. Writing it never fails a command."""
from __future__ import annotations

import json
import os
import sys

from . import store
from .model import Event, Registration, iso, now_utc, parse_iso


def folder() -> str:
    return os.path.join(store.home(), "events")


def path_for(at: str) -> str:
    return os.path.join(folder(), parse_iso(at).strftime("%Y-%m") + ".jsonl")


def stderr_log(line: str) -> None:
    print(line, file=sys.stderr, flush=True)


def emit(ev: Event, log=stderr_log) -> bool:
    """Append `ev` as one line. On any failure, log it and return False."""
    try:
        line = (json.dumps(ev.to_dict(), separators=(",", ":"), sort_keys=True) + "\n").encode()
        path = path_for(ev.at)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # One write on an O_APPEND descriptor: concurrent writers never interleave a small line.
        fd = os.open(path, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o644)
        try:
            os.write(fd, line)
        finally:
            os.close(fd)
        return True
    except Exception as e:
        try:
            log(f"{iso(now_utc())} telemetry: {ev.event} event not written: {e!r}")
        except Exception:
            pass
        return False


def for_reg(name: str, reg: Registration, at: str | None = None, kind: str | None = None, status: str | None = None,
            **detail) -> Event:
    return Event(at=at or iso(now_utc()), event=name, project=reg.project, ticket=reg.ticket, agent=reg.agent_name,
                 pane=reg.pane.pane, backend=reg.pane.backend, cli=reg.cli, kind=kind, status=status, detail=detail)


def read(log=lambda line: None) -> list[Event]:
    """Every readable event, oldest first. A bad line is logged and skipped."""
    d = folder()
    out = []
    for name in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if not name.endswith(".jsonl"):
            continue
        with open(os.path.join(d, name), encoding="utf-8", errors="replace") as f:
            for n, line in enumerate(f, 1):
                if not line.strip():
                    continue
                try:
                    out.append(Event.from_dict(json.loads(line)))
                except (ValueError, TypeError) as e:
                    log(f"{name}:{n} skipped: {e}")
    out.sort(key=lambda e: parse_iso(e.at))
    return out
