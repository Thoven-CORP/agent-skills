"""Disk layout: one owner per file. Registrations, watch memory, briefs, snapshots and the board."""
from __future__ import annotations

import datetime
import json
import os
import re
import secrets
import shutil
import tempfile

from .model import (Entry, EntryKind, PaneRef, Registration, UsageError, check_project, check_ticket,
                    iso, now_utc, parse_iso)


def home() -> str:
    return os.environ.get("THOVEN_DISPATCH_HOME") or os.path.expanduser("~/.local/state/thoven/dispatch")


def project_dir(project: str) -> str:
    return os.path.join(home(), check_project(project))


def sub(project: str, name: str) -> str:
    return os.path.join(project_dir(project), name)


def projects() -> list[str]:
    root = home()
    if not os.path.isdir(root):
        return []
    return sorted(p for p in os.listdir(root) if os.path.isdir(os.path.join(root, p)) and re.match(r"^[a-z0-9-]+$", p))


def write_atomic(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), prefix=".tmp-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def read_json(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------- registrations

def pane_key(ref: PaneRef) -> str:
    return f"{ref.backend}-{re.sub(r'[^A-Za-z0-9._-]', '_', ref.pane)}"


def registration_path(project: str, ref: PaneRef) -> str:
    return os.path.join(sub(project, "panes"), pane_key(ref) + ".json")


def watch_path(project: str, ref: PaneRef) -> str:
    return os.path.join(sub(project, "panes"), pane_key(ref) + ".watch.json")


def write_registration(reg: Registration) -> str:
    path = registration_path(reg.project, reg.pane)
    write_atomic(path, json.dumps(reg.to_dict(), indent=2) + "\n")
    return path


def registrations(project: str | None = None) -> list[Registration]:
    out = []
    for p in [project] if project else projects():
        folder = sub(p, "panes")
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if not name.endswith(".json") or name.endswith(".watch.json"):
                continue
            data = read_json(os.path.join(folder, name))
            try:
                out.append(Registration.from_dict(data))
            except (TypeError, KeyError):
                continue
    return out


def find_registration(pane: str) -> Registration | None:
    """A Registration by pane id or agent name, across every project."""
    for reg in registrations():
        if pane in (reg.pane.pane, reg.agent_name):
            return reg
    return None


def remove_registration(reg: Registration) -> None:
    for path in (registration_path(reg.project, reg.pane), watch_path(reg.project, reg.pane)):
        try:
            os.unlink(path)
        except FileNotFoundError:
            pass


# ---------------------------------------------------------------- watch memory

def empty_watch() -> dict:
    return {"last_state": None, "since": None, "last_fingerprint": None, "fingerprint_since": None,
            "alerted": []}


def read_watch(project: str, ref: PaneRef) -> dict:
    data = read_json(watch_path(project, ref))
    if not isinstance(data, dict) or not isinstance(data.get("alerted", []), list):
        return empty_watch()
    for key in ("since", "fingerprint_since", "settle_since", "live_since"):
        if data.get(key) is not None:
            try:
                parse_iso(data[key])
            except (TypeError, ValueError):
                return empty_watch()
    return {**empty_watch(), **data}


def write_watch(project: str, ref: PaneRef, watch: dict) -> None:
    write_atomic(watch_path(project, ref), json.dumps(watch, indent=2) + "\n")


# ---------------------------------------------------------------- briefs and snapshots

def brief_path(project: str, ticket: str) -> str:
    return os.path.join(sub(project, "briefs"), f"{check_ticket(ticket)}.md")


def snapshot_path(project: str, ticket: str) -> str:
    return os.path.join(sub(project, "snapshots"), f"{check_ticket(ticket)}.md")


def board_md(project: str) -> str:
    return os.path.join(project_dir(project), "board.md")


def ticket_file(name: str, ticket: str) -> bool:
    """THV-1.md, THV-1-verify.md and THV-1.build-thv-1.md belong to THV-1; THV-10.md does not."""
    return re.match(rf"^{re.escape(ticket)}(?:[.-].*)?\.md$", name) is not None


# ---------------------------------------------------------------- the board

def format_entry(e: Entry) -> str:
    lines = [f"at: {e.at}", f"ticket: {e.ticket}", f"from: {e.frm}", f"kind: {e.kind.name}"]
    if e.status:
        lines.append(f"status: {e.status}")
    return "\n".join(lines) + "\n---\n" + e.body.rstrip("\n") + "\n"


def parse_entry(text: str) -> Entry:
    head, sep, body = text.partition("\n---\n")
    if not sep:
        raise ValueError("no --- line")
    fields = {}
    for line in head.splitlines():
        k, _, v = line.partition(":")
        fields[k.strip()] = v.strip()
    return Entry(at=fields["at"], ticket=fields["ticket"], frm=fields.get("from", ""),
                 kind=EntryKind[fields["kind"].upper()], status=fields.get("status") or None,
                 body=body.rstrip("\n"))


def post(project: str, ticket: str, kind: EntryKind, body: str, frm: str, status: str | None = None,
         at=None) -> str:
    check_ticket(ticket)
    t = at or now_utc()
    entry = Entry(at=iso(t), ticket=ticket, frm=frm, kind=kind, status=status, body=body)
    folder = sub(project, "board")
    os.makedirs(folder, exist_ok=True)
    t = t.astimezone(datetime.timezone.utc)
    stamp = t.strftime("%Y%m%dT%H%M%S") + f"{t.microsecond // 1000:03d}Z"
    while True:
        path = os.path.join(folder, f"{stamp}-{ticket}-{kind.name}-{secrets.token_hex(2)}.md")
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
            break
        except FileExistsError:
            continue
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(format_entry(entry))
    render(project)
    return path


def entries(project: str, ticket: str | None = None, since: str | None = None) -> list[tuple[str, Entry]]:
    folder = sub(project, "board")
    if not os.path.isdir(folder):
        return []
    cutoff = parse_iso(since) if since else None
    out = []
    for name in sorted(os.listdir(folder)):
        if not name.endswith(".md") or name.startswith("."):
            continue
        path = os.path.join(folder, name)
        try:
            with open(path, encoding="utf-8") as f:
                e = parse_entry(f.read())
            at = parse_iso(e.at)
        except (OSError, ValueError, KeyError):
            continue
        if ticket and e.ticket != ticket:
            continue
        if cutoff and at <= cutoff:
            continue
        out.append((path, e))
    out.sort(key=lambda pe: (parse_iso(pe[1].at), os.path.basename(pe[0])))
    return out


def show_entry(path: str, e: Entry) -> str:
    status = f" {e.status}" if e.status else ""
    return f"== {e.at} {e.ticket} {e.kind.name}{status} from {e.frm}  ({os.path.basename(path)})\n{e.body}\n"


def render(project: str) -> str:
    text = f"# Board: {project}\n\n" + "\n".join(show_entry(p, e) for p, e in entries(project))
    path = board_md(project)
    write_atomic(path, text)
    return path


def clean(project: str, ticket: str | None = None) -> list[str]:
    """Paths removed. Refusing while a pane is live is the caller's check."""
    root = project_dir(project)
    if not os.path.isdir(root):
        return []
    if ticket is None:
        shutil.rmtree(root)
        return [root]
    check_ticket(ticket)
    removed = []
    for folder in ("briefs", "snapshots"):
        d = sub(project, folder)
        for name in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if ticket_file(name, ticket):
                os.unlink(os.path.join(d, name))
                removed.append(os.path.join(d, name))
    for path, _ in entries(project, ticket=ticket):
        os.unlink(path)
        removed.append(path)
    render(project)
    return removed


def require_project_exists(project: str) -> str:
    root = project_dir(project)
    if not os.path.isdir(root):
        raise UsageError(f"no project {project!r} under {home()}")
    return root
