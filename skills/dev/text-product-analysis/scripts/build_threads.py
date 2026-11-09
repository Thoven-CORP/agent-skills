#!/usr/bin/env python3
"""Turn twilio_raw.json into readable threads, labelled from the database.

Twilio is the transcript: every message a parent or teacher saw lives there, including replies
the database never stored. The database adds only what Twilio cannot say: who the people are,
whether a teacher-side message was typed by the teacher or sent by Thoven automation, and which
messages Thoven wrote but never handed to Twilio.

Inputs in --dir:
  twilio_raw.json      from fetch_twilio.py
  db_people.json       query 1 in references/db-lookups.md
  db_messages.json     query 2
  db_bodies.json       optional, query 3: {"<db message id>": "<body>"} for the DB-only rows
Writes threads.json and anomalies.json, prints a summary, and prints the DB-only ids that still
need query 3.
"""
import argparse
import collections
import datetime as dt
import json
import pathlib
import sys

ISO = "%Y-%m-%dT%H:%M:%SZ"


def parse(ts):
    return dt.datetime.strptime(ts[:19] + "Z", ISO) if ts else None


def same(full, given):
    # Lookups store full ids; a prefix is accepted so a hand-trimmed export still joins.
    return bool(full and given and full.startswith(given))


def load(path, default=None):
    if not path.exists():
        if default is not None:
            return default
        sys.exit(f"missing {path}")
    data = json.loads(path.read_text())
    return data if data is not None else (default if default is not None else [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--since", required=True, help="YYYY-MM-DD, window start (UTC)")
    ap.add_argument("--until", help="YYYY-MM-DD, window end (UTC), default now")
    args = ap.parse_args()
    d = pathlib.Path(args.dir)
    since = dt.datetime.strptime(args.since, "%Y-%m-%d")
    until = dt.datetime.strptime(args.until, "%Y-%m-%d") if args.until else dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)

    tw = load(d / "twilio_raw.json")
    people = load(d / "db_people.json", [])
    dbm = load(d / "db_messages.json", [])
    bodies = load(d / "db_bodies.json", {})
    if not tw:
        sys.exit("twilio_raw.json holds no threads")

    by_conv = collections.defaultdict(list)
    for r in dbm:
        by_conv[r["conversation_id"]].append(r)

    threads, anomalies, need_bodies = [], [], []
    for csid, v in tw.items():
        attrs = json.loads(v["conv"].get("attributes") or "{}")
        local = attrs.get("local_conversation_id") or ""
        who = next((p for p in people if same(local, p["conversation_id"])), None)
        db_key = next((k for k in by_conv if same(local, k)), None)
        rows = by_conv.get(db_key, [])
        used = set()

        msgs = []
        for m in v["messages"]:
            try:
                ma = json.loads(m.get("attributes") or "{}")
            except json.JSONDecodeError:
                ma = {}
            row = next((r for r in rows if r["id"] not in used and same(ma.get("message_id"), r["id"])), None) \
                or next((r for r in rows if r["id"] not in used and same(m["sid"], r.get("twilio_sid"))), None)
            if row:
                used.add(row["id"])
            author = m.get("author") or ""
            if author.startswith("+"):
                role = "parent"
            elif row and row.get("source_kind") == "automation":
                role = "automation"
            elif row:
                role = "teacher"
            else:
                role = "teacher side, unlabelled"
            msgs.append({
                "at": m["date_created"], "role": role, "body": m.get("body") or "",
                "media": [{"type": x.get("content_type"), "size": x.get("size")} for x in (m.get("media") or [])],
                "in_db": bool(row), "db_status": row and row.get("status"), "twilio_sid": m["sid"],
                "delivery": m.get("delivery"),
            })
            if role == "parent" and not row and since <= parse(m["date_created"]) < until:
                anomalies.append({"kind": "inbound reply missing from the database", "thread": csid,
                                  "at": m["date_created"], "body": (m.get("body") or "")[:200],
                                  "media": len(m.get("media") or [])})

        for r in rows:
            if r["id"] in used or not (since <= parse(r["created_at"]) < until):
                continue
            body = bodies.get(r["id"])
            if body is None:
                need_bodies.append(r["id"])
            msgs.append({"at": r["created_at"], "role": "automation" if r.get("source_kind") == "automation"
                         else (r.get("sender_type") or "unknown"), "body": body or "", "media": [], "in_db": True,
                         "db_status": r.get("status"), "twilio_sid": None,
                         "in_app_only": r.get("source_kind") == "automation" and r.get("dispatch_intent") is False})
            if r.get("source_kind") == "automation" and r.get("dispatch_intent") is False:
                continue
            kind = f"not sent ({r['failure_code']})" if r.get("failure_code") else "written but never reached Twilio"
            anomalies.append({"kind": kind, "thread": csid, "at": r["created_at"],
                              "status": r.get("status"), "failure_code": r.get("failure_code"),
                              "db_message_id": r["id"], "body": (body or "")[:200]})

        msgs.sort(key=lambda x: x["at"])
        seen = collections.defaultdict(list)
        for x in msgs:
            if x["role"] == "automation" and x["body"]:
                seen[x["body"]].append(parse(x["at"]))
        for body, times in seen.items():
            times.sort()
            if any(b - a <= dt.timedelta(minutes=10) for a, b in zip(times, times[1:])) and times[-1] >= since:
                anomalies.append({"kind": "same automated text sent more than once", "thread": csid,
                                  "count": len(times), "at": times[0].strftime(ISO), "body": body[:200]})

        in_window = [x for x in msgs if since <= parse(x["at"]) < until]
        if not in_window:
            continue
        threads.append({
            "twilio_sid": csid, "conversation_id": local,
            "teacher": who and who.get("teacher"), "parent": who and who.get("parent"),
            "children": who and who.get("children"),
            "test_account": bool(who and (who.get("teacher_test") or who.get("parent_test"))),
            "counts": dict(collections.Counter(x["role"] for x in in_window)),
            "last_at": msgs[-1]["at"], "messages": msgs,
        })

    linked = {next((k for k in by_conv if same(json.loads(v["conv"].get("attributes") or "{}")
                                                   .get("local_conversation_id") or "", k)), None)
              for v in tw.values()}
    for conv, rows in by_conv.items():
        recent = [r for r in rows if since <= parse(r["created_at"]) < until]
        if conv in linked or not recent:
            continue
        who = next((p for p in people if same(conv, p["conversation_id"])), {})
        anomalies.append({"kind": "family has no Twilio thread", "conversation_id": conv,
                          "teacher": who.get("teacher"), "parent": who.get("parent"),
                          "messages_in_window": len(recent),
                          "statuses": dict(collections.Counter(f"{r.get('status')}:{r.get('failure_code') or ''}"
                                                               for r in recent))})

    threads.sort(key=lambda t: t["last_at"], reverse=True)
    (d / "threads.json").write_text(json.dumps(threads, indent=1, ensure_ascii=False))
    (d / "anomalies.json").write_text(json.dumps(anomalies, indent=1, ensure_ascii=False))

    print(f"threads in window {len(threads)}, messages in window "
          f"{sum(sum(t['counts'].values()) for t in threads)}, anomalies {len(anomalies)}")
    for k, n in collections.Counter(a["kind"] for a in anomalies).most_common():
        print(f"  {n:3d}  {k}")
    for t in threads:
        print(f"  {t['teacher'] or '?'} <-> {t['parent'] or '?'}  {t['counts']}{'  TEST' if t['test_account'] else ''}")
    unnamed = sum(1 for t in threads if not t["teacher"])
    if unnamed:
        print(f"  {unnamed} threads have no db_people row: rerun query 1 with a wider window")
    if need_bodies:
        print("DB-only rows without a body, run query 3 for:")
        print(",".join(f"'{i}'" for i in need_bodies))


if __name__ == "__main__":
    main()
