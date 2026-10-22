"""A Claude pane's token use: its session id from ~/.claude/sessions, then its transcript's usage."""
from __future__ import annotations

import glob
import json
import os
import re

from . import store

SESSION_ID_RE = re.compile(r"^[A-Za-z0-9-]{1,80}$")
USAGE_KEYS = ("input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")


def claude_dir() -> str:
    return os.environ.get("CLAUDE_CONFIG_DIR") or os.path.expanduser("~/.claude")


def sessions_dir() -> str:
    return os.path.join(claude_dir(), "sessions")


def claude_sessions(folder: str) -> list[dict]:
    out = []
    for path in sorted(glob.glob(os.path.join(folder, "*.json"))):
        data = store.read_json(path)
        if isinstance(data, dict):
            out.append(data)
    return out


def session_id(agent_name: str, folder: str | None = None) -> str | None:
    """The sessionId of the live Claude session named `agent_name` (spawn launches it with `-n`)."""
    for s in claude_sessions(folder or sessions_dir()):
        sid = s.get("sessionId")
        if s.get("name") == agent_name and isinstance(sid, str) and SESSION_ID_RE.match(sid):
            return sid
    return None


def transcripts(sid: str, root: str | None = None) -> list[str]:
    """The session's transcript first, then its subagents' transcripts. Empty when none is on disk."""
    if not SESSION_ID_RE.match(sid or ""):
        return []
    projects = os.path.join(root or claude_dir(), "projects")
    main = sorted(glob.glob(os.path.join(projects, "*", sid + ".jsonl")))
    subs = sorted(glob.glob(os.path.join(projects, "*", sid, "subagents", "*.jsonl")))
    return main[:1] + subs if main else subs


def sum_usage(paths: list[str]) -> tuple[dict, int]:
    """({model: {usage key: total}}, assistant messages). Streamed chunks repeat a message.id, so the last
    line seen for an id stands for the whole message."""
    by_id: dict[str, tuple[str, dict]] = {}
    for path in paths:
        with open(path, encoding="utf-8", errors="replace") as f:
            for n, line in enumerate(f):
                if '"usage"' not in line:
                    continue
                try:
                    d = json.loads(line)
                except ValueError:
                    continue
                msg = d.get("message") if isinstance(d, dict) and d.get("type") == "assistant" else None
                if not isinstance(msg, dict) or not isinstance(msg.get("usage"), dict):
                    continue
                by_id[msg.get("id") or f"{path}:{n}"] = (str(msg.get("model") or "unknown"), msg["usage"])
    totals: dict[str, dict] = {}
    for model, u in by_id.values():
        t = totals.setdefault(model, dict.fromkeys(USAGE_KEYS, 0))
        for k in USAGE_KEYS:
            v = u.get(k)
            t[k] += v if isinstance(v, int) else 0
    return totals, len(by_id)


def summary(sid: str | None, root: str | None = None) -> dict:
    """The close event's usage detail for one Claude session."""
    paths = transcripts(sid, root) if sid else []
    totals, turns = sum_usage(paths) if paths else ({}, 0)
    return {"session_id": sid, "transcript": paths[0] if paths else None,
            "usage_by_model": totals if paths else None, "turns": turns}
