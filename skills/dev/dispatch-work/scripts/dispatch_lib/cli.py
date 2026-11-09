"""Command line for `scripts/dispatch`. Exit 0 ok, 2 usage, 3 wrong state, 1 otherwise."""
from __future__ import annotations

import argparse
import datetime
import importlib.util
import json
import os
import re
import sys
import time

from . import events, fleet, linear, stats, store, usage
from .model import (KINDS, REPORT_WORDS, DispatchError, EntryKind, Event, PaneRef, Registration, State, UsageError,
                    WrongState, check_project, check_ticket, iso, now_utc, parse_iso)
from .mux import BACKENDS, Launch, detect, main_pane, wait_started
from .runner import Runner, run as default_run
from .tick import tick_all
from .usage import claude_sessions, sessions_dir

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEND_WAIT = 60
ENTER_WAIT = 30
# A {{FIELD}} spawn did not fill, or a <<slot>> main did not fill. Single <…> is ordinary text (<div>, <url>).
PLACEHOLDER_RE = re.compile(r"\{\{[^{}]*\}\}|<<[^<>\n]+>>")
# The ticket id in brief.md's template; spawn and the herdr picker (compose.py) both fill it.
TICKET_SLOT = "THV-<id>"
KEY_RE = re.compile(r"^[A-Za-z0-9+_-]{1,20}$")
OPENER_RE = re.compile(r"^[/$][A-Za-z][\w:.-]*(\s|$)")
# The script that puts Thoven's fixes back on third-party skills (enforcement/hooks). Claude runs it at SessionStart;
# a Codex pane never does, so spawn runs it too and a reinstall mid-session cannot hand a pane unpatched skills.
SKILL_PATCH_SCRIPTS = ("~/.claude/hooks/reapply-skill-patches.py",
                       "~/thoven/agent-skills/enforcement/hooks/reapply-skill-patches.py")


# ---------------------------------------------------------------- helpers with no I/O beyond their args

def peer_name(folder: str, session_id: str | None) -> str | None:
    """Main's peer name: the `name` of the live session file whose sessionId is ours."""
    if not session_id:
        return None
    for s in claude_sessions(folder):
        if s.get("sessionId") == session_id and s.get("name"):
            return s["name"]
    return None


def argv_model(argv) -> str | None:
    """The value after --model or -m in a launch line."""
    argv = list(argv)
    return next((argv[i + 1] for i, x in enumerate(argv[:-1]) if x in ("--model", "-m")), None)


def fill_brief(text: str, values: dict[str, str]) -> str:
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    return text


def unfilled(text: str) -> list[tuple[int, str]]:
    return [(n, line) for n, line in enumerate(text.splitlines(), 1) if PLACEHOLDER_RE.search(line)]


def opener(text: str) -> str | None:
    """The brief's skill line, e.g. `/poteto-mode feature THV-1 "Cart"`; None when the brief opens with prose."""
    first = next((line.strip() for line in text.splitlines() if line.strip()), "")
    return first if OPENER_RE.match(first) else None


def agent_name_for(kind: str, ticket: str, taken: set[str]) -> str:
    base = f"{kind}-{ticket}".lower()
    name, n = base, 1
    while name in taken:
        n += 1
        name = f"{base}-{n}"
    return name


def pane_label(kind: str, title: str, ticket: str | None) -> str:
    if kind not in KINDS:
        raise UsageError(f"unknown kind {kind!r}. Use one of: {' '.join(KINDS)}")
    if not title.strip():
        raise UsageError("title is empty")
    return f"{kind} · {title} ({check_ticket(ticket)})" if ticket else f"{kind} · {title}"


def load_agents():
    spec = importlib.util.spec_from_file_location("dispatch_agents", os.path.join(SCRIPTS, "agents.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def build_launch(tier: str, cli: str | None, model: str | None, name: str, prompt: str, add_dirs: list[str],
                 agents=None) -> tuple[str, Launch]:
    ag = agents or load_agents()
    try:
        cfg = ag.load()
        tier_cli, tier_model, effort = ag.tier(cfg, str(tier))
        use_cli = cli or tier_cli
        use_model = model or (tier_model if use_cli == tier_cli else (ag.cli_spec(cfg, use_cli).get("models") or [""])[0])
        spec = ag.cli_spec(cfg, use_cli)
        args = ag.launch(cfg, use_cli, use_model, effort)
    except SystemExit as e:
        raise DispatchError(str(e.code))
    head = [spec.get("bin", use_cli)]
    if use_cli == "claude":
        head += ["-n", name]
    # --add-dir before the CLI's own flags: it is variadic in Claude and would swallow the prompt.
    for d in add_dirs:
        head += ["--add-dir", d]
    return use_cli, Launch(spec.get("kind", use_cli), name, tuple(head + args), prompt)


# ---------------------------------------------------------------- the app

class App:
    def __init__(self, run: Runner = default_run, out=sys.stdout, err=sys.stderr, script: str | None = None,
                 sleep=time.sleep, clock=time.monotonic):
        self.run, self.out, self.err, self.sleep, self.clock = run, out, err, sleep, clock
        self.script = script or os.path.join(SCRIPTS, "dispatch")

    def say(self, *lines: str) -> None:
        for line in lines:
            print(line, file=self.out, flush=True)

    def emit(self, ev: Event) -> None:
        events.emit(ev, log=lambda line: print(f"dispatch: {line}", file=self.err, flush=True))

    def soft(self, what: str, fn, default=None):
        """Telemetry reads: a failure is reported on stderr and never fails the command."""
        try:
            return fn()
        except Exception as e:
            print(f"dispatch: telemetry: {what}: {e!r}", file=self.err, flush=True)
            return default

    def reapply_skill_patches(self) -> None:
        """Re-apply the skill patches before a pane starts. Never blocks the spawn; every miss is said on stderr."""
        script = next((p for p in map(os.path.expanduser, SKILL_PATCH_SCRIPTS) if os.path.isfile(p)), None)
        if not script:
            print("dispatch: skill patches: no reapply-skill-patches.py found (" + ", ".join(SKILL_PATCH_SCRIPTS)
                  + "); the pane may read unpatched third-party skills", file=self.err, flush=True)
            return
        r = self.run([sys.executable, script], timeout=120)
        if not r.ok:
            tail = (r.err or r.out).strip().splitlines()[-3:]
            print(f"dispatch: skill patches: {script} exited {r.rc}; the pane may read unpatched third-party skills"
                  + "".join(f"\n  {line}" for line in tail), file=self.err, flush=True)
            return
        for line in r.out.splitlines():
            if "STALE" in line:
                print(f"dispatch: skill patches: {line.strip()}", file=self.err, flush=True)

    def mux(self, backend: str):
        return BACKENDS[backend](self.run)

    def resolve(self, pane: str, backend: str | None = None) -> tuple[PaneRef, Registration | None]:
        try:
            b = backend or detect()
        except UsageError:
            b = None
        session = (os.environ.get("REX_SESSION", "") if b == "rex" else os.environ.get("HERDR_WORKSPACE_ID", "")
                   ) if b else None
        reg = store.find_registration(pane, b, session)
        if reg:
            return reg.pane, reg
        if b is None:
            detect()
        return PaneRef(b, pane, session), None

    def main_name(self) -> str | None:
        return peer_name(sessions_dir(), os.environ.get("CLAUDE_CODE_SESSION_ID"))

    # ------------------------------------------------------------ commands

    def whoami(self, a):
        backend = detect()
        ref = main_pane()
        name = self.main_name()
        projects = sorted({r.project for r in store.registrations() if name and r.main_name == name})
        if a.json:
            return self.say(json.dumps({"backend": backend, "pane": ref.__dict__, "name": name, "projects": projects}))
        self.say(f"backend {backend}", f"pane {ref.pane}", f"session {ref.session}", f"name {name or '-'}",
                 f"project {','.join(projects) or '-'}")

    def snapshot(self, a):
        check_project(a.project)
        issue = linear.fetch_issue(check_ticket(a.ticket))
        path = store.snapshot_path(a.project, a.ticket)
        store.write_atomic(path, linear.render(issue))
        self.say(path)

    def spawn(self, a):
        project, ticket = check_project(a.project), check_ticket(a.ticket)
        label = pane_label(a.kind, a.title, ticket)
        cwd = os.path.abspath(os.path.expanduser(a.cwd))
        if not os.path.isdir(cwd):
            raise UsageError(f"--cwd is not a directory: {cwd}")
        if a.add_dir and not os.path.isdir(a.add_dir):
            raise UsageError(f"--add-dir is not a directory: {a.add_dir}")
        source = os.path.abspath(a.brief) if a.brief else store.brief_path(project, ticket)
        if not os.path.isfile(source):
            raise WrongState(f"no brief at {source}; write it first (references/brief.md)")
        backend = detect()
        main = self.main_name()
        if not main:
            raise DispatchError("main's Claude session has no peer name (no ~/.claude/sessions entry with a name "
                                "for $CLAUDE_CODE_SESSION_ID); name it with /rename and retry")
        taken = {r.agent_name for r in store.registrations()} | {
            s.get("name") for s in claude_sessions(sessions_dir()) if s.get("name")}
        name = agent_name_for(a.kind, ticket, taken)
        with open(source, encoding="utf-8") as f:
            raw = f.read()
        snapshot = store.snapshot_path(project, ticket)
        if "{{SNAPSHOT}}" in raw and not os.path.isfile(snapshot):
            raise WrongState(f"no snapshot at {snapshot}: run dispatch snapshot {project} {ticket} first")
        text = fill_brief(raw, {
            "MAIN_SESSION": main, "PROJECT": project, "BOARD": store.board_md(project),
            "SNAPSHOT": snapshot, "AGENT_NAME": name}).replace(TICKET_SLOT, ticket)
        left = unfilled(text)
        if left:
            raise WrongState(f"unfilled field in {source}:\n" + "\n".join(f"  {n}: {line}" for n, line in left))
        skill = opener(text)
        if not skill:
            raise WrongState(f"{source} does not open with a skill line (`/poteto-mode <playbook> {ticket} ...`, "
                             "`$poteto-mode` for Codex); references/brief.md")
        stem = os.path.splitext(os.path.basename(source))[0]
        brief = os.path.join(store.sub(project, "briefs"), f"{stem}.{name}.md")
        store.write_atomic(brief, text)
        # The pane's first prompt names the skill to invoke and carries the brief's text, so the pane never has to
        # open a file to learn its task. The file stays as the record.
        prompt = f"Invoke {skill} to start.\n\n" + text.split(skill, 1)[1].lstrip("\n")
        # The brief, snapshot and board sit outside the tree; without this a Claude pane asks to read its own brief.
        add_dirs = [d for d in (a.add_dir, store.project_dir(project)) if d]
        self.reapply_skill_patches()
        cli, launch = build_launch(a.tier, a.cli, a.model, name, prompt, add_dirs)
        base = a.base or (lambda r: r.out.strip() if r.ok else "")(self.run(["git", "-C", cwd, "rev-parse", "HEAD"]))
        regs: list[Registration] = []

        def on_pane(ref: PaneRef, launched_at: str) -> None:
            regs.append(Registration(project=project, ticket=ticket, kind=a.kind, title=a.title, pane=ref, cli=cli,
                                     agent_name=name, main_name=main, tree=cwd, base_sha=base, brief=brief,
                                     launched_at=launched_at))
            store.write_registration(regs[-1])

        def spawned(reg: Registration) -> None:
            self.emit(events.for_reg("spawn", reg, kind=a.kind, launched_at=reg.launched_at, tier=str(a.tier),
                                     model=argv_model(launch.argv), argv=list(launch.argv),
                                     brief_bytes=len(text.encode())))

        try:
            split = a.split_of or (None if a.tab else main_pane().pane)
            # Every dispatched pane floats minimized (Andres, 2026-11-05); --tab is his ask for a window.
            ref = self.mux(backend).spawn(cwd, label, launch, split, on_pane, floating=not a.tab)
        except Exception as e:
            if not regs:
                raise
            spawned(regs[-1])
            raise DispatchError(f"{e}\n{regs[-1].pane.pane} stays registered as {name}, so the tick raises STARTUP "
                                f"or GONE for it. Read it with dispatch read, or drop it with dispatch close.")
        if not regs or regs[-1].pane != ref:
            on_pane(ref, regs[-1].launched_at if regs else iso(now_utc()))
        reg = regs[-1]
        spawned(reg)
        if a.json:
            return self.say(json.dumps(reg.to_dict()))
        self.say(f"pane {ref.pane}", f"agent {name}", f"label {label}", f"brief {brief}",
                 f"launch {' '.join(launch.argv)}")

    def label(self, a):
        if a.kinds:
            return self.say(*KINDS)
        if not (a.pane and a.kind and a.title is not None):
            raise UsageError('usage: dispatch label <pane> <Kind> "<title>" [THV-x] [--tab] | dispatch label --kinds')
        text = pane_label(a.kind, a.title, a.ticket)
        ref, _ = self.resolve(a.pane, a.backend)
        self.mux(ref.backend).label(ref, text, a.tab)
        self.say(text)

    def status(self, a):
        ref, _ = self.resolve(a.pane, a.backend)
        st = self.mux(ref.backend).status(ref)
        if a.json:
            return self.say(json.dumps(st.to_dict()))
        self.say(f"{st.state.name} kind={st.kind or '-'} msg={st.msg or '-'} updated_at={st.updated_at or '-'}")

    def read(self, a):
        ref, _ = self.resolve(a.pane, a.backend)
        self.say(self.mux(ref.backend).read(ref, a.lines))

    def send(self, a):
        ref, reg = self.resolve(a.pane, a.backend)
        mux = self.mux(ref.backend)
        try:
            with open(a.file, encoding="utf-8") as f:
                text = f.read().rstrip("\n")
        except OSError as e:
            raise UsageError(f"cannot read {a.file}: {e}")
        if not text.strip():
            raise UsageError(f"{a.file} is empty")
        before = mux.status(ref)
        if before.state not in (State.IDLE, State.DONE):
            screen = ""
            try:
                screen = mux.read(ref, 15)
            except DispatchError:
                pass
            raise WrongState(f"refusing to send: {ref.pane} is {before.state.name}, not IDLE or DONE.\n{screen}")
        mux.type_text(ref, text)
        if reg:
            self.emit(events.for_reg("send", reg, bytes=len(text.encode())))
        if wait_started(mux, ref, before, SEND_WAIT, sleep=self.sleep, clock=self.clock):
            return self.say(f"sent {len(text.encode())} bytes to {ref.pane}")
        mux.key(ref, "enter")
        if wait_started(mux, ref, before, ENTER_WAIT, sleep=self.sleep, clock=self.clock):
            return self.say(f"sent {len(text.encode())} bytes to {ref.pane} (pressed Enter once)")
        raise WrongState(f"{ref.pane} never started on the text; it may sit unsent in the input box")

    def key(self, a):
        if not KEY_RE.match(a.key):
            raise UsageError(f"one key name like enter, esc, up, down, tab, y or 1, got {a.key!r}")
        ref, reg = self.resolve(a.pane, a.backend)
        key = a.key.lower()
        self.mux(ref.backend).key(ref, key)
        if reg:
            self.emit(events.for_reg("key", reg, key=key))
        self.say(f"{key} -> {ref.pane}")

    def interrupt(self, a):
        ref, reg = self.resolve(a.pane, a.backend)
        self.mux(ref.backend).key(ref, "esc")
        if reg:
            self.emit(events.for_reg("interrupt", reg))
        self.say(f"esc -> {ref.pane}")

    def close(self, a):
        ref, reg = self.resolve(a.pane, a.backend)
        sid = None
        if reg:
            if reg.cli == "claude":
                # Read while the pane lives: its sessions file goes when the agent exits. A GONE pane's id was
                # caught by an earlier tick.
                sid = self.soft("session id", lambda: usage.session_id(reg.agent_name)
                                or store.read_watch(reg.project, reg.pane).get("session_id"))
            # Dropped first and under tick.lock, so no tick pass sees a closing pane as GONE.
            with store.tick_lock():
                store.remove_registration(reg)
        try:
            self.mux(ref.backend).close(ref)
        finally:
            if reg:
                detail = (self.soft("usage", lambda: usage.summary(sid), {"session_id": sid})
                          if reg.cli == "claude" else {"usage_by_model": None})
                self.emit(events.for_reg("close", reg, **detail))
        self.say(f"closed {ref.pane}" + (f" ({reg.agent_name})" if reg else ""))

    def post(self, a):
        store.require_project_exists(a.project)
        try:
            kind = EntryKind[a.kind.upper()]
        except KeyError:
            raise UsageError(f"unknown kind {a.kind!r}: {', '.join(k.name.lower() for k in EntryKind)}")
        status = a.status.upper() if a.status else None
        if status and not re.match(r"^[A-Z_]+$", status):
            raise UsageError(f"status must be one word like DONE, got {a.status!r}")
        if kind == EntryKind.REPORT and status not in REPORT_WORDS:
            raise UsageError(f"report status {status!r} is not one of: {' '.join(REPORT_WORDS)}")
        body = sys.stdin.read() if a.body is None else a.body
        if not body.strip():
            raise UsageError("empty body: pipe the entry text on stdin")
        frm = a.frm or self.main_name() or "main"
        path = store.post(a.project, check_ticket(a.ticket), kind, body, frm, status)
        reg = self.soft("post sender", lambda: next(
            (r for r in store.registrations(a.project) if r.agent_name == frm), None))
        self.emit(events.for_reg("post", reg, kind=kind.value, status=status, frm=frm) if reg else Event(
            at=iso(now_utc()), event="post", project=a.project, ticket=a.ticket, agent=frm, kind=kind.value,
            status=status, detail={"frm": frm}))
        self.say(path)

    def board(self, a):
        store.require_project_exists(a.project)
        if a.since:
            try:
                parse_iso(a.since)
            except ValueError:
                raise UsageError(f"--since must be an ISO time like 2026-10-22T12:00:00Z, got {a.since!r}")
        for path, e in store.entries(a.project, ticket=a.ticket, since=a.since):
            self.say(store.show_entry(path, e))

    def watch(self, a, stop=lambda: False):
        store.require_project_exists(a.project)
        cursor = store.read_cursor(a.project)
        if cursor is None:
            # First watch on this project: replay from the earliest live pane's launch.
            launches = [parse_iso(r.launched_at) for r in store.registrations(a.project)]
            start = min(launches) if launches else now_utc()
            cursor = {"at": iso(start), "seen": {os.path.basename(p): e.at for p, e in store.entries(a.project)
                                                 if parse_iso(e.at) <= start}}
        store.write_cursor(a.project, cursor)
        lookback = datetime.timedelta(seconds=store.WATCH_LOOKBACK)
        while not stop():
            codex = {r.agent_name for r in store.registrations(a.project) if r.cli == "codex"}
            fresh = [(p, e) for p, e in store.entries(a.project, since=iso(parse_iso(cursor["at"]) - lookback))
                     if os.path.basename(p) not in cursor["seen"]]
            for path, e in fresh:
                cursor["seen"][os.path.basename(path)] = e.at
                cursor["at"] = max(cursor["at"], e.at, key=parse_iso)
                # A Codex pane cannot peer-message, so its own entries are main's only word from it.
                if e.kind == EntryKind.ALERT or (e.frm in codex and e.kind in (
                        EntryKind.REPORT, EntryKind.QUESTION, EntryKind.HANDOFF)):
                    first = (e.body.splitlines() or [""])[0]
                    self.say(f"{e.kind.name} {e.status or '-'} {e.ticket} {first}  {path}")
            if fresh:
                floor = parse_iso(cursor["at"]) - lookback
                cursor["seen"] = {n: t for n, t in cursor["seen"].items() if parse_iso(t) > floor}
                store.write_cursor(a.project, cursor)
            self.sleep(a.interval)

    def tick(self, a):
        tick_all(self.run, out=self.out)

    def clean(self, a):
        check_project(a.project)
        live = [r for r in store.registrations(a.project) if a.ticket is None or r.ticket == a.ticket]
        if live:
            raise WrongState("refusing to clean while panes are registered: "
                             + ", ".join(f"{r.agent_name} ({r.pane.pane})" for r in live)
                             + ". Run dispatch close <pane> first.")
        removed = store.clean(a.project, check_ticket(a.ticket) if a.ticket else None)
        self.emit(Event(at=iso(now_utc()), event="clean", project=a.project, ticket=a.ticket,
                        detail={"removed": len(removed)}))
        self.say(f"removed {len(removed)} path{'s' if len(removed) != 1 else ''}")

    def stats(self, a):
        try:
            since = stats.parse_day(a.since) if a.since else None
        except ValueError:
            raise UsageError(f"--since must be a day like 2026-10-15, got {a.since!r}")
        if a.project:
            check_project(a.project)
        rows = stats.build(events.read(log=lambda line: print(f"dispatch stats: {line}", file=self.err)),
                           since=since, project=a.project)
        if a.json:
            return self.say(json.dumps([r.to_dict() for r in rows]))
        if a.md:
            return self.out.write(stats.markdown(rows))
        self.out.write(stats.text(rows) if rows else "no dispatch events" + (f" since {a.since}" if a.since else "")
                       + "\n")

    def fleet(self, a):
        if a.action == "install" and a.dry_run:
            return self.out.write(fleet.plist(self.script).decode())
        if a.action == "install":
            return self.say(*fleet.install(self.run, self.script))
        if a.action == "uninstall":
            return self.say(*fleet.uninstall(self.run))
        _, lines = fleet.status(self.run)
        self.say(*lines)


def parser() -> argparse.ArgumentParser:
    json_opt = argparse.ArgumentParser(add_help=False)
    json_opt.add_argument("--json", action="store_true", help="JSON output")
    pane_opts = argparse.ArgumentParser(add_help=False)
    pane_opts.add_argument("--backend", choices=sorted(BACKENDS),
                           help="for a pane with no Registration: rex or herdr (default: the pane you run in)")
    p = argparse.ArgumentParser(prog="dispatch", description=__doc__)
    s = p.add_subparsers(dest="cmd", required=True)
    s.add_parser("whoami", parents=[json_opt], help="backend, main pane, main peer name, project")
    x = s.add_parser("snapshot", help="Linear ticket -> snapshots/<THV-x>.md")
    x.add_argument("project"), x.add_argument("ticket")
    x = s.add_parser("spawn", parents=[json_opt], help="open a labelled pane and start an agent on its brief")
    x.add_argument("project"), x.add_argument("ticket")
    x.add_argument("--kind", required=True, choices=KINDS)
    x.add_argument("--title", required=True)
    x.add_argument("--cwd", required=True)
    x.add_argument("--tier", required=True)
    x.add_argument("--cli", choices=("claude", "codex"))
    x.add_argument("--model", help="override the tier's model (same CLI)")
    x.add_argument("--add-dir")
    x.add_argument("--split-of", metavar="PANE", help="open beside this pane before floating (default: the pane you run in)")
    x.add_argument("--tab", action="store_true", help="open a new Rex window or herdr tab instead of a split")
    x.add_argument("--base", metavar="SHA")
    x.add_argument("--brief", metavar="FILE", help="default briefs/<THV-x>.md")
    x = s.add_parser("label", parents=[pane_opts], help='label a pane "<Kind> · <title> (THV-x)"')
    x.add_argument("pane", nargs="?"), x.add_argument("kind", nargs="?"), x.add_argument("title", nargs="?")
    x.add_argument("ticket", nargs="?")
    x.add_argument("--tab", action="store_true")
    x.add_argument("--kinds", action="store_true", help="print the allowed kinds")
    s.add_parser("status", parents=[json_opt, pane_opts], help="normalised Status").add_argument("pane")
    for name, text in (("interrupt", "press Esc"), ("close", "drop the pane's Registration and close the pane; logs a Claude pane's tokens")):
        s.add_parser(name, parents=[pane_opts], help=text).add_argument("pane")
    x = s.add_parser("key", parents=[pane_opts], help="press one key in a pane, to answer a dialog")
    x.add_argument("pane"), x.add_argument("key", help="enter, esc, up, down, tab, y, 1, ctrl+c ...")
    x = s.add_parser("read", parents=[pane_opts], help="scrollback tail")
    x.add_argument("pane"), x.add_argument("--lines", type=int, default=40)
    x = s.add_parser("send", parents=[pane_opts], help="type a file into an IDLE or DONE pane")
    x.add_argument("pane"), x.add_argument("file")
    x = s.add_parser("post", help="post an entry; body from stdin; prints its path")
    x.add_argument("project")
    x.add_argument("--ticket", required=True)
    x.add_argument("--kind", required=True, help=", ".join(k.name.lower() for k in EntryKind))
    x.add_argument("--status", help="a report needs one of " + " ".join(REPORT_WORDS))
    x.add_argument("--from", dest="frm")
    x.add_argument("--body", help=argparse.SUPPRESS)
    x = s.add_parser("board", help="print entries oldest first")
    x.add_argument("project"), x.add_argument("--ticket"), x.add_argument("--since", metavar="ISO")
    x = s.add_parser("watch", help="print one line per new ALERT, and per Codex REPORT, QUESTION or HANDOFF; "
                                   "replays what landed while no watch ran")
    x.add_argument("project"), x.add_argument("--interval", type=float, default=3, help=argparse.SUPPRESS)
    s.add_parser("tick", help="one watcher pass over every Registration")
    x = s.add_parser("clean", help="delete a ticket's files, or the whole project")
    x.add_argument("project"), x.add_argument("--ticket")
    x = s.add_parser("stats", parents=[json_opt], help="one row per pane from the events log (<home>/events/, which "
                                                       "clean keeps): reports, corrections, alerts, tokens")
    x.add_argument("--since", metavar="YYYY-MM-DD", help="rows with an event on or after this day (UTC)")
    x.add_argument("--project")
    x.add_argument("--md", action="store_true", help="markdown table and a friction footer")
    x = s.add_parser("fleet", help="launchd agent co.thoven.dispatch-tick")
    x.add_argument("action", choices=("install", "uninstall", "status"))
    x.add_argument("--dry-run", action="store_true", help="install: print the plist, write nothing")
    return p


def main(argv=None, app: App | None = None) -> int:
    app = app or App()
    try:
        a = parser().parse_args(argv)
    except SystemExit as e:
        return int(e.code or 0)
    try:
        getattr(app, a.cmd)(a)
        return 0
    except KeyboardInterrupt:
        return 0
    except DispatchError as e:
        print(f"dispatch {a.cmd}: {e}", file=app.err)
        return e.code
