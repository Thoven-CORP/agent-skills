"""Terminal multiplexers behind one interface: Rex and herdr."""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass
from typing import Protocol

from . import procs
from .model import Backend, DispatchError, PaneRef, State, Status, UsageError
from .runner import Result, Runner

SHELLS = {"zsh", "bash", "sh", "fish", "dash", "login", "tcsh", "csh", "ksh", "nu"}


class MuxError(DispatchError):
    pass


@dataclass(frozen=True)
class Launch:
    """What to start: argv without the prompt, so herdr can hand the args to `agent start`."""
    kind: str
    name: str
    argv: tuple[str, ...]
    prompt: str


class Mux(Protocol):
    def spawn(self, cwd: str, label: str, launch: Launch, split_of: str | None) -> PaneRef: ...
    def label(self, pane: PaneRef, label: str, tab: bool) -> None: ...
    def status(self, pane: PaneRef) -> Status: ...
    def read(self, pane: PaneRef, lines: int) -> str: ...
    def type_text(self, pane: PaneRef, text: str) -> None: ...
    def key(self, pane: PaneRef, key: str) -> None: ...
    def close(self, pane: PaneRef) -> None: ...
    def cpu(self, pane: PaneRef) -> float | None: ...
    def live_work(self, pane: PaneRef) -> list[str]: ...


def _json(res: Result, what: str) -> dict:
    if not res.ok:
        raise MuxError(f"{what} failed: {(res.err or res.out).strip()[:300]}")
    try:
        return json.loads(res.out or "{}")
    except ValueError:
        raise MuxError(f"{what} returned bad JSON: {res.out[:200]!r}")


def tail(text: str, lines: int) -> str:
    rows = text.rstrip("\n").splitlines()
    while rows and not rows[-1].strip():
        rows.pop()
    return "\n".join(rows[-lines:]) if lines > 0 else ""


def normalise_rex(records: list[dict], process: dict | None) -> Status:
    """The State over every OSC 7501 record (root and children) plus the block's process."""
    if process is None or process.get("last_exit") is not None:
        return Status(State.GONE)
    fg = process.get("foreground")
    if not fg or fg.get("name") in SHELLS or (fg.get("argv0") or "").lstrip("-") in SHELLS:
        return Status(State.GONE)
    root = next((r for r in records if not r.get("id")), None)
    # Newest across the tree: a main waiting on subagents leaves its root record untouched.
    updated = max((r.get("updated_at") or "" for r in records), default="") or None
    if not records:
        return Status(State.UNKNOWN)
    states = [r.get("state") for r in records]
    blocked = next((r for r in records if r.get("state") == "blocked"), None)
    if blocked:
        # updated_at is the blocked record's own stamp: one per blocked episode, while a working subagent
        # keeps moving the fingerprint.
        return Status(State.BLOCKED, blocked.get("kind"), blocked.get("msg"), blocked.get("updated_at") or updated,
                      updated)
    if "working" in states:
        working = next(r for r in records if r.get("state") == "working")
        return Status(State.WORKING, None, working.get("msg") or working.get("title"), updated, updated)
    return Status(State.DONE if "done" in states else State.IDLE, None, (root or {}).get("msg"), updated, updated)


class RexMux:
    KEYS = {"enter": "enter", "esc": "escape", "escape": "escape", "ctrl+c": "ctrl+c"}

    def __init__(self, run: Runner):
        self.run = run

    def _rex(self, *args, input=None, timeout=20) -> Result:
        return self.run(["rex", *args], input=input, timeout=timeout)

    def _call(self, pane: PaneRef, method: str, args: dict | None = None):
        argv = ["block", "call", "-s", pane.session, "-b", pane.pane, method]
        if args is not None:
            argv.append(json.dumps(args))
        res = self._rex(*argv)
        if not res.ok and "not found" in (res.err + res.out).lower():
            return None
        return _json(res, f"rex block call {method}")

    def spawn(self, cwd, label, launch, split_of):
        session = os.environ.get("REX_SESSION")
        if not session:
            raise UsageError("REX_SESSION is unset: run dispatch spawn from main's Rex pane")
        cmd = [*launch.argv, launch.prompt]
        if split_of:
            out = _json(self._rex("split", "-s", session, "-b", split_of, "--split=right", "--focus=false",
                                  "--keep-open", "--label", label, "-c", cwd, "--json", "--", *cmd),
                        "rex split")
        else:
            out = _json(self._rex("window", "new", "-s", session, label, "-c", cwd, "--focus=false",
                                  "--keep-open", "--json", "--", *cmd), "rex window new")
        ref = PaneRef("rex", out["block_ids"][0], session)
        self._rex("block", "rename", "-s", session, ref.pane, label)
        return ref

    def label(self, pane, label, tab):
        self._ok(self._rex("block", "rename", "-s", pane.session, pane.pane, label), "rex block rename")
        if tab:
            info = _json(self._rex("block", "inspect", "-s", pane.session, pane.pane, "--json"), "rex block inspect")
            window = (info.get("block") or {}).get("window_id")
            if not window:
                raise MuxError(f"could not read the window of {pane.pane}")
            self._ok(self._rex("window", "rename", "-s", pane.session, window, label), "rex window rename")

    @staticmethod
    def _ok(res: Result, what: str) -> None:
        if not res.ok:
            raise MuxError(f"{what} failed: {(res.err or res.out).strip()[:300]}")

    def _process(self, pane):
        return self._call(pane, "process")

    def status(self, pane):
        process = self._process(pane)
        if process is None:
            return Status(State.GONE)
        records = (self._call(pane, "program_status") or {}).get("records") or []
        return normalise_rex(records, process)

    def read(self, pane, lines):
        out = self._call(pane, "format", {"format": "text", "trim": True, "unwrap": True})
        if out is None:
            raise MuxError(f"{pane.pane} not found")
        return tail(out.get("content", ""), lines)

    def type_text(self, pane, text):
        body = json.dumps({"block_id": pane.pane, "event": {"type": "paste", "payload": {"text": text}}})
        self._ok(self._rex("api", "call", "-s", pane.session, "block.event", "-", input=body), "rex paste")
        # An Enter that lands while the TUI is still ingesting the paste becomes a newline in the box.
        time.sleep(0.5)
        self.key(pane, "enter")

    def key(self, pane, key):
        self._ok(self._rex("send-key", "-s", pane.session, "-b", pane.pane, self.KEYS.get(key.lower(), key)),
                 "rex send-key")

    def close(self, pane):
        res = self._rex("block", "close", "-s", pane.session, pane.pane)
        if not res.ok and "not found" not in (res.err + res.out).lower():
            raise MuxError(f"rex block close failed: {res.err.strip()[:300]}")

    def _agent_pid(self, pane):
        fg = ((self._process(pane) or {}).get("foreground") or {})
        return fg.get("pid")

    def cpu(self, pane):
        pid = self._agent_pid(pane)
        return procs.tree_cpu(procs.snapshot(self.run), pid) if pid else None

    def live_work(self, pane):
        pid = self._agent_pid(pane)
        return procs.live_work(procs.snapshot(self.run), pid) if pid else []


HERDR_STATES = {"working": State.WORKING, "blocked": State.BLOCKED, "done": State.DONE, "idle": State.IDLE,
                "unknown": State.UNKNOWN}


def screen_fingerprint(text: str) -> str:
    """The agent's own turn timer ("✽ Doodling… (4m 8s · ↓ 16.3k tokens)") ticks while a pane is
    stuck, so its line and every digit are dropped before hashing."""
    kept = [line for line in text.splitlines()[-40:] if not re.search(r"…\s*\(", line)]
    return hashlib.md5(re.sub(r"[0-9]", "", "\n".join(kept)).encode()).hexdigest()


class HerdrMux:
    def __init__(self, run: Runner):
        self.run = run
        self.bin = os.environ.get("HERDR_BIN") or os.path.expanduser("~/.local/bin/herdr")

    def _h(self, *args, input=None, timeout=20) -> Result:
        return self.run([self.bin, *args], input=input, timeout=timeout)

    def _ok(self, res: Result, what: str) -> Result:
        if not res.ok:
            raise MuxError(f"herdr {what} failed: {(res.err or res.out).strip()[:300]}")
        return res

    def spawn(self, cwd, label, launch, split_of):
        workspace = os.environ.get("HERDR_WORKSPACE_ID")
        if split_of:
            out = _json(self._h("pane", "split", split_of, "--direction", "right", "--cwd", cwd, "--no-focus"),
                        "herdr pane split")
            pane = out["result"]["pane"]["pane_id"]
        else:
            if not workspace:
                raise UsageError("HERDR_WORKSPACE_ID is unset: run dispatch spawn from main's herdr pane")
            out = _json(self._h("tab", "create", "--workspace", workspace, "--cwd", cwd, "--label", label,
                                "--no-focus"), "herdr tab create")
            pane = out["result"]["root_pane"]["pane_id"]
        ref = PaneRef("herdr", pane, workspace or pane.split(":")[0])
        self._h("pane", "rename", pane, label)
        # agent start needs the shell at its prompt; wait until the shell has drawn something.
        self._h("pane", "wait-output", pane, "--regex", r"\S", "--timeout", "15000", timeout=20)
        # The opening prompt rides in argv and is never typed: a typed Enter answers whatever dialog is up, and
        # the folder-trust dialog defaults to "No, exit". A prompt in argv waits behind the dialog instead.
        res = self._h("agent", "start", launch.name, "--kind", launch.kind, "--pane", pane, "--timeout", "120000",
                      "--", *launch.argv[1:], launch.prompt, timeout=130)
        if not res.ok and "agent_not_ready" not in res.out + res.err:
            raise MuxError(f"herdr agent start failed in {pane}: {(res.err or res.out).strip()[-300:]}")
        return ref

    def label(self, pane, label, tab):
        self._ok(self._h("pane", "rename", pane.pane, label), "pane rename")
        if tab:
            tab_id = ((_json(self._h("pane", "get", pane.pane), "herdr pane get").get("result") or {})
                      .get("pane") or {}).get("tab_id")
            if not tab_id:
                raise MuxError(f"could not read the tab of pane {pane.pane}")
            self._ok(self._h("tab", "rename", tab_id, label), "tab rename")

    def status(self, pane):
        res = self._h("agent", "get", pane.pane)
        try:
            data = json.loads(res.out or res.err or "{}")
        except ValueError:
            data = {}
        code = (data.get("error") or {}).get("code")
        if code == "agent_not_found" or code == "pane_not_found":
            return Status(State.GONE)
        agent = (data.get("result") or {}).get("agent")
        if not agent:
            raise MuxError(f"herdr agent get {pane.pane} failed: {(res.err or res.out).strip()[:200]}")
        state = HERDR_STATES.get(agent.get("agent_status"), State.UNKNOWN)
        screen = self._h("agent", "read", pane.pane, "--source", "recent-unwrapped", "--lines", "40")
        return Status(state, None, None, None, screen_fingerprint(screen.out) if screen.ok else None)

    def read(self, pane, lines):
        res = self._ok(self._h("agent", "read", pane.pane, "--source", "recent-unwrapped", "--lines", str(lines)),
                       "agent read")
        return tail(res.out, lines)

    def type_text(self, pane, text):
        self._ok(self._h("agent", "prompt", pane.pane, text), "agent prompt")

    def key(self, pane, key):
        self._ok(self._h("agent", "send-keys", pane.pane, key.lower()), "agent send-keys")

    def close(self, pane):
        res = self._h("pane", "close", pane.pane)
        if not res.ok and "not_found" not in res.out + res.err and "not found" not in res.out + res.err:
            raise MuxError(f"herdr pane close failed: {res.err.strip()[:300]}")

    def _agent_pid(self, pane):
        out = _json(self._h("pane", "process-info", "--pane", pane.pane), "herdr pane process-info")
        info = (out.get("result") or {}).get("process_info") or {}
        fg, shell = info.get("foreground_process_group_id"), info.get("shell_pid")
        return fg if fg and fg != shell else None

    def cpu(self, pane):
        pid = self._agent_pid(pane)
        return procs.tree_cpu(procs.snapshot(self.run), pid) if pid else None

    def live_work(self, pane):
        pid = self._agent_pid(pane)
        return procs.live_work(procs.snapshot(self.run), pid) if pid else []


BACKENDS: dict[Backend, type] = {"rex": RexMux, "herdr": HerdrMux}


def detect() -> Backend:
    if os.environ.get("REX_BLOCK"):
        return "rex"
    if os.environ.get("HERDR_PANE_ID"):
        return "herdr"
    raise UsageError("neither REX_BLOCK nor HERDR_PANE_ID is set: run dispatch from a Rex or herdr pane")


def main_pane() -> PaneRef:
    backend = detect()
    if backend == "rex":
        return PaneRef("rex", os.environ["REX_BLOCK"], os.environ.get("REX_SESSION", ""))
    return PaneRef("herdr", os.environ["HERDR_PANE_ID"], os.environ.get("HERDR_WORKSPACE_ID", ""))


def wait_started(mux, pane: PaneRef, before: Status, timeout: float, sleep=time.sleep, clock=time.monotonic) -> bool:
    """True once the pane is WORKING or BLOCKED, or (Rex) reports a newer updated_at than before."""
    end = clock() + timeout
    while True:
        st = mux.status(pane)
        if st.state in (State.WORKING, State.BLOCKED):
            return True
        if before.updated_at and st.updated_at and st.updated_at != before.updated_at:
            return True
        if clock() >= end:
            return False
        sleep(1)
