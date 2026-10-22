"""`dispatch tick`: one pass of the per-pane watcher state machine over every Registration."""
from __future__ import annotations

import datetime
import fcntl
import os
import re
import sys
import traceback
from dataclasses import dataclass

from . import store
from .model import EntryKind, Registration, State, Status, iso, now_utc, parse_iso
from .mux import BACKENDS
from .runner import Runner

BLOCKED_AFTER = 120
FROZEN_AFTER = 600
FROZEN_CPU = 5.0
LIVE_GRACE = 600
KEEP_KEYS = 100
LIMIT_RE = re.compile(r"limit reached|resets at|usage limit|weekly limit", re.I)
ACTIVE = (State.WORKING, State.BLOCKED)
SETTLED = (State.DONE, State.IDLE)


@dataclass(frozen=True)
class Alert:
    word: str
    key: str
    body: str


class Gates:
    """The slow checks, run only when a step needs them."""

    def __init__(self, reg: Registration, mux, run: Runner):
        self.reg, self.mux, self.run = reg, mux, run

    def cpu(self) -> float | None:
        return self.mux.cpu(self.reg.pane)

    def live_work(self) -> list[str]:
        return self.mux.live_work(self.reg.pane)

    def has_report(self) -> bool:
        launched = parse_iso(self.reg.launched_at)
        return any(e.kind in (EntryKind.REPORT, EntryKind.QUESTION, EntryKind.HANDOFF)
                   and parse_iso(e.at) > launched
                   for _, e in store.entries(self.reg.project, ticket=self.reg.ticket))

    def dirty(self) -> list[str]:
        res = self.run(["git", "-C", self.reg.tree, "status", "--porcelain"], timeout=20)
        return [line for line in res.out.splitlines() if line.strip()] if res.ok else []

    def limit_line(self) -> str | None:
        screen = self.mux.read(self.reg.pane, 30)
        return next((line.strip() for line in screen.splitlines() if LIMIT_RE.search(line)), None)


def _secs(now: datetime.datetime, since: str | None) -> float:
    return (now - parse_iso(since)).total_seconds() if since else 0.0


def step(reg: Registration, watch: dict, status: Status, now: datetime.datetime, gates) -> tuple[dict, list[Alert]]:
    """The next watch memory and the alerts to post. Pure apart from the lazy gates."""
    w = {**store.empty_watch(), **watch}
    w["alerted"] = list(w.get("alerted") or [])
    alerts: list[Alert] = []
    stamp = iso(now)

    def alert(word: str, episode: str, detail: str) -> None:
        key = f"{word}@{episode}"
        if key not in w["alerted"]:
            w["alerted"].append(key)
            alerts.append(Alert(word, key, detail))

    def done() -> tuple[dict, list[Alert]]:
        w["alerted"] = w["alerted"][-KEEP_KEYS:]
        return w, alerts

    if status.state == State.GONE:
        alert("GONE", "pane", "the agent is no longer running in the pane")
        w["last_state"] = State.GONE.name
        return done()

    prev = State[w["last_state"]] if w["last_state"] in State.__members__ else State.WORKING
    state = status.state
    if state != State.UNKNOWN and w["last_state"] != state.name:
        w["last_state"], w["since"] = state.name, stamp
    if status.fingerprint != w["last_fingerprint"] or not w["fingerprint_since"]:
        w["last_fingerprint"], w["fingerprint_since"] = status.fingerprint, stamp

    if state == State.BLOCKED and _secs(now, w["since"]) >= BLOCKED_AFTER:
        alert("BLOCKED", w["since"], f"blocked {status.kind or '?'}: {status.msg or '-'}")

    if state == State.WORKING and status.fingerprint and _secs(now, w["fingerprint_since"]) >= FROZEN_AFTER:
        cpu = gates.cpu()
        if cpu is None or cpu < FROZEN_CPU:
            alert("FROZEN", w["fingerprint_since"],
                  f"working with no change since {w['fingerprint_since']}, cpu {'?' if cpu is None else cpu}%")

    if state in ACTIVE:
        w["settle_since"] = w["live_since"] = None
        w["pending"] = False
    elif state in SETTLED:
        if prev in ACTIVE:
            w["settle_since"], w["live_since"], w["pending"] = stamp, None, True
        if w.get("pending"):
            settle(reg, w, now, gates, alert)
    return done()


def settle(reg: Registration, w: dict, now: datetime.datetime, gates, alert) -> None:
    episode = w["settle_since"]
    live = gates.live_work()
    if live:
        # A background shell still runs; the agent is woken when it ends, so wait and look again.
        w["live_since"] = w.get("live_since") or iso(now)
        if _secs(now, w["live_since"]) >= LIVE_GRACE:
            alert("LIVE_WORK", episode, "still running after settle: " + ", ".join(live[:3]))
        return
    w["pending"], w["live_since"] = False, None
    dirty, limit = gates.dirty(), gates.limit_line()
    dirty_text = f"{len(dirty)} uncommitted: " + "; ".join(dirty[:5]) if dirty else ""
    if reg.cli == "codex":
        alert("SETTLED", episode, "codex settled. report: " + ("yes" if gates.has_report() else "no")
              + "; dirty: " + (dirty_text or "no") + "; limit: " + (limit or "no"))
        return
    if not gates.has_report():
        alert("SETTLED_NO_REPORT", episode, f"settled with no REPORT, QUESTION or HANDOFF entry since {reg.launched_at}")
    if dirty:
        alert("DIRTY", episode, f"{reg.tree}: {dirty_text}")
    if limit:
        alert("LIMIT", episode, limit)


def tick_pane(reg: Registration, run: Runner, now: datetime.datetime | None = None, mux=None) -> list[tuple[Alert, str]]:
    mux = mux or BACKENDS[reg.pane.backend](run)
    now = now or now_utc()
    watch = store.read_watch(reg.project, reg.pane)
    new, alerts = step(reg, watch, mux.status(reg.pane), now, Gates(reg, mux, run))
    posted = []
    for a in alerts:
        body = f"{reg.agent_name} ({reg.pane.backend} {reg.pane.pane}): {a.body}"
        posted.append((a, store.post(reg.project, reg.ticket, EntryKind.ALERT, body, "dispatch-tick", a.word, at=now)))
    store.write_watch(reg.project, reg.pane, new)
    return posted


def tick_all(run: Runner, now: datetime.datetime | None = None, mux_for=None, out=sys.stdout) -> int:
    """Alerts posted. One pane failing never stops the pass."""
    now = now or now_utc()
    os.makedirs(store.home(), exist_ok=True)
    with open(os.path.join(store.home(), "tick.lock"), "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        count = 0
        for reg in store.registrations():
            try:
                for a, path in tick_pane(reg, run, now, mux_for(reg) if mux_for else None):
                    count += 1
                    print(f"{iso(now)} {reg.project} {reg.ticket} ALERT {a.word} {reg.agent_name} {path}",
                          file=out, flush=True)
            except Exception as e:
                print(f"{iso(now_utc())} {reg.project} {reg.ticket} {reg.pane.pane} tick failed: {e!r}", file=out,
                      flush=True)
                traceback.print_exc(limit=2, file=out)
        return count
