"""`dispatch snapshot`: the ticket as main read it, from Linear's GraphQL API."""
from __future__ import annotations

import json
import os
import urllib.request

from .model import DispatchError

ENDPOINT = "https://api.linear.app/graphql"
QUERY = """query($id: String!) {
  issue(id: $id) {
    identifier title url description
    state { name }
    parent { identifier title description }
    comments(first: 250) { nodes { body createdAt user { name } } }
  }
}"""


def api_key() -> str:
    key = os.environ.get("LINEAR_API_KEY")
    if key:
        return key.strip()
    try:
        with open(os.path.expanduser("~/.linear-api-key"), encoding="utf-8") as f:
            key = f.read().strip()
    except OSError:
        key = ""
    if not key:
        raise DispatchError("no Linear key: set LINEAR_API_KEY or write ~/.linear-api-key")
    return key


def http_post(url: str, body: bytes, headers: dict) -> bytes:
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def fetch_issue(ticket: str, post=http_post) -> dict:
    body = json.dumps({"query": QUERY, "variables": {"id": ticket}}).encode()
    try:
        raw = post(ENDPOINT, body, {"Content-Type": "application/json", "Authorization": api_key()})
    except OSError as e:
        raise DispatchError(f"Linear request failed: {e}")
    data = json.loads(raw)
    if data.get("errors"):
        raise DispatchError("Linear: " + "; ".join(e.get("message", "?") for e in data["errors"]))
    issue = (data.get("data") or {}).get("issue")
    if not issue:
        raise DispatchError(f"Linear has no issue {ticket}")
    return issue


def render(issue: dict) -> str:
    comments = sorted((issue.get("comments") or {}).get("nodes") or [], key=lambda c: c.get("createdAt", ""))
    out = [f"# {issue['identifier']}: {issue['title']}", "",
           f"State: {(issue.get('state') or {}).get('name', '?')}  ", f"URL: {issue.get('url', '')}", "",
           "## Description", "", (issue.get("description") or "(none)").strip(), ""]
    parent = issue.get("parent")
    if parent:
        out += [f"## Parent {parent['identifier']}: {parent['title']}", "",
                (parent.get("description") or "(none)").strip(), ""]
    out += [f"## Comments ({len(comments)}, newest last)", ""]
    for c in comments:
        who = (c.get("user") or {}).get("name") or "?"
        out += [f"### {c.get('createdAt', '?')} {who}", "", (c.get("body") or "").strip(), ""]
    return "\n".join(out).rstrip("\n") + "\n"
