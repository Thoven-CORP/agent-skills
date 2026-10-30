#!/usr/bin/env python3
"""Render threads.json as phone-style conversation stages for the artifact page.

Writes <dir>/threads_fragment.html: one <h3> per thread that holds teacher or parent text, newest
first, each with every message in its full history. Paste it into the artifact's conversations
section. Notification-only threads are listed in the artifact as a table instead.
"""
import argparse
import html
import json
import pathlib
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
BUBBLE = {
    "teacher": "align-self:flex-start;background:#fff;border:1px solid #e7e2d9;color:#2b2a28;",
    "teacher side, unlabelled": "align-self:flex-start;background:#fff;border:1px dashed #c9c2b6;color:#2b2a28;",
    "parent": "align-self:flex-end;background:#0ea5e9;color:#fff;",
    "automation": "align-self:center;background:#f3efe8;color:#6b645a;font-size:12px;max-width:86%;",
}
HUMAN = {"teacher", "parent", "teacher side, unlabelled"}


def when(iso):
    t = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(ET)
    return t.strftime("%a %b %-d, %-I:%M %p ET")


def flags(m):
    out = []
    if m.get("never_reached_twilio"):
        out.append(f"never sent ({m.get('db_status') or '?'})")
    if m["role"] == "parent" and not m["in_db"]:
        out.append("missing from Thoven")
    out += [f"picture {x.get('type')} {round((x.get('size') or 0) / 1024)} KB" for x in m.get("media") or []]
    return out


def bubble(m, t):
    role = m["role"]
    who = {"automation": "Thoven", "parent": t["parent"], "teacher": t["teacher"]}.get(role) or role
    body = html.escape(m["body"] or "").replace("\n", "<br>") or "<i>(no text)</i>"
    tags = "".join(
        '<span style="display:inline-block;margin-top:4px;margin-right:4px;font-size:10.5px;font-weight:600;'
        f'padding:1px 6px;border-radius:6px;background:#fee2e2;color:#b91c1c">{html.escape(f)}</span>'
        for f in flags(m))
    return (f'<div style="display:flex;flex-direction:column;max-width:78%;{BUBBLE.get(role, BUBBLE["teacher"])}'
            'padding:8px 11px;border-radius:14px;line-height:1.4">'
            f'<span style="font-size:10.5px;opacity:.75;margin-bottom:2px">{html.escape(who)} · {when(m["at"])}</span>'
            f"<span>{body}</span>{('<span>' + tags + '</span>') if tags else ''}</div>")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    d = pathlib.Path(ap.parse_args().dir)
    threads = [t for t in json.loads((d / "threads.json").read_text())
               if not t["test_account"] and HUMAN & set(t["counts"])]
    if not threads:
        sys.exit("no thread in the window holds teacher or parent text")
    parts = []
    for i, t in enumerate(threads):
        c = t["counts"]
        stats = ", ".join(f"{n} {k}" for k, n in sorted(c.items()))
        parts.append(
            f'<h3 id="thread-{i + 1}">{html.escape(t["teacher"] or "?")} ↔ {html.escape(t["parent"] or "?")}</h3>\n'
            f'<p class="muted small">Children on the account: {html.escape(t["children"] or "none")} · '
            f'in the window: {stats} · {when(t["messages"][0]["at"])} to {when(t["last_at"])}</p>\n'
            '<div class="stage-wrap"><div class="stage" style="background:#faf8f4;min-height:0">'
            '<div style="display:flex;flex-direction:column;gap:8px">'
            + "\n".join(bubble(m, t) for m in t["messages"]) + "</div></div></div>")
    (d / "threads_fragment.html").write_text("\n\n".join(parts))
    print(f"wrote {d / 'threads_fragment.html'}: {len(parts)} threads")


if __name__ == "__main__":
    main()
