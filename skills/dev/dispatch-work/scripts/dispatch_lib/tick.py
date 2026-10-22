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
STARTUP_AFTER = 90
FROZEN_AFTER = 600
FROZEN_CPU = 5.0
LIVE_GRACE = 600
LIMIT_RE = re.compile(r"limit reached|resets at|usage limit|weekly limit", re.I)
ACTIVE = (State.WORKING, State.BLOCKED)
SETTLED = (State.DONE, State.IDLE)


@dataclass(frozen=True)
class Alert:
    word: str
    episode: str
    body: str


class Gates:
    """The slow checks, run only when a step needs them."""

    def __init__(self, reg: Registration, mux, run: Runner):
        self.reg, self.mux, self.run = reg, mux, run

    def cpu(self) -> float | None:
        return self.mux.cpu(self.reg.pane)

    def live_work(self) -> list[str]:
        return self.mux.live_work(self.reg.pane)

    def report_count(self) -> int:
        """This pane's own REPORT, QUESTION and HANDOFF entries since its launch."""
        after = parse_iso(self.reg.launched_at)
        return sum(1 for _, e in store.entries(self.reg.project, ticket=self.reg.ticket)
                   if e.kind in (EntryKind.REPORT, EntryKind.QUESTION, EntryKind.HANDOFF)
                   and e.frm == self.reg.agent_name and parse_iso(e.at) > after)

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
    w.pop("alerted", None)
    alerts: list[Alert] = []
    stamp = iso(now)

    def alert(word: str, episode: str, detail: str) -> None:
        # Raised on every tick the condition holds; the board entry named after (pane, word, episode) dedups it.
        alerts.append(Alert(word, episode, detail))

    def done() -> tuple[dict, list[Alert]]:
        return w, alerts

    if status.state == State.GONE:
        alert("GONE", "pane", "the agent is no longer running in the pane")
        w["last_state"] = State.GONE.name
        return done()

    prev = State[w["last_state"]] if w["last_state"] in State.__members__ else None
    state = status.state
    if state != State.UNKNOWN and w["last_state"] != state.name:
        w["last_state"], w["since"] = state.name, stamp
    if status.fingerprint != w["last_fingerprint"] or not w["fingerprint_since"]:
        w["last_fingerprint"], w["fingerprint_since"] = status.fingerprint, stamp

    if state != State.UNKNOWN:
        w["status_seen"] = True
    elif not w.get("status_seen") and _secs(now, reg.launched_at) >= STARTUP_AFTER:
        alert("STARTUP", reg.launched_at, f"no status {STARTUP_AFTER}s after launch: a trust, update or login "
              "dialog is likely waiting")

    if state == State.BLOCKED and _secs(now, w["since"]) >= BLOCKED_AFTER:
        # Rex stamps the blocked record, so its episode survives a lost watch file; herdr has no stamp.
        alert("BLOCKED", status.updated_at or w["since"], f"blocked {status.kind or '?'}: {status.msg or '-'}")

    if state == State.WORKING and status.fingerprint and _secs(now, w["fingerprint_since"]) >= FROZEN_AFTER:
        cpu = gates.cpu()
        if cpu is None or cpu < FROZEN_CPU:
            alert("FROZEN", status.updated_at or w["fingerprint_since"],
                  f"working with no change since {w['fingerprint_since']}, cpu {'?' if cpu is None else cpu}%")

    if state in ACTIVE:
        w["settle_since"], w["pending"] = None, False
    elif state in SETTLED:
        # Only an observed ACTIVE -> SETTLED transition is a settle; a pane first seen settled is just recorded.
        if prev in ACTIVE:
            w["settle_since"], w["pending"] = stamp, True
        if w.get("pending"):
            settle(reg, w, now, gates, alert)
    return done()


def settle(reg: Registration, w: dict, now: datetime.datetime, gates, alert) -> None:
    """Runs on every settled tick until the settle is resolved: by a report, an alert, or a new turn."""
    episode = w["settle_since"]
    limit = gates.limit_line()
    if limit:
        alert("LIMIT", episode, limit)
    count = gates.report_count()
    # The turn boundary is the pane's own report count at the last resolved settle, not a sampled time.
    reported = count > (w.get("reports_at_settle") or 0)

    def resolve() -> None:
        w["pending"], w["reports_at_settle"] = False, count

    def dirty_text() -> str:
        dirty = gates.dirty()
        return f"{len(dirty)} uncommitted: " + "; ".join(dirty[:5]) if dirty else ""

    if reg.cli == "codex":
        live, dirty = gates.live_work(), dirty_text()
        alert("SETTLED", episode, "codex settled. report: " + ("yes" if reported else "no")
              + "; dirty: " + (dirty or "no") + "; limit: " + (limit or "no")
              + (f"; still running: {', '.join(live[:3])}" if live else ""))
        return resolve()
    if reported:
        return resolve()
    live = gates.live_work()
    # A background shell wakes a Claude agent when it ends, so the report may still come.
    if live and _secs(now, episode) < LIVE_GRACE:
        return
    dirty = dirty_text()
    # Shared integration trees always carry other sessions' edits, so a dirty tree only matters without a report.
    alert("SETTLED_NO_REPORT", episode, f"settled with no REPORT, QUESTION or HANDOFF entry from {reg.agent_name} "
          "this turn" + (f"; {reg.tree}: {dirty}" if dirty else "")
          + (f"; still running: {', '.join(live[:3])}" if live else ""))
    resolve()


def tick_pane(reg: Registration, run: Runner, now: datetime.datetime | None = None, mux=None) -> list[tuple[Alert, str]]:
    mux = mux or BACKENDS[reg.pane.backend](run)
    now = now or now_utc()
    watch = store.read_watch(reg.project, reg.pane)
    new, alerts = step(reg, watch, mux.status(reg.pane), now, Gates(reg, mux, run))
    posted = []
    for a in alerts:
        body = f"{reg.agent_name} ({reg.pane.backend} {reg.pane.pane}): {a.body}"
        path = store.post(reg.project, reg.ticket, EntryKind.ALERT, body, "dispatch-tick", a.word, at=now,
                          dedup=f"{store.pane_key(reg.pane)}|{a.word}|{a.episode}")
        if path:
            posted.append((a, path))
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
