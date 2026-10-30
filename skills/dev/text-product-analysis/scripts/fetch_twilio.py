#!/usr/bin/env python3
"""Pull every teacher-parent thread from Twilio Conversations into one JSON file.

Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_CONVERSATIONS_SERVICE_SID from the
environment and never prints them. Writes <out>/twilio_raw.json:
  { "<CH sid>": {"conv": {...}, "messages": [...]}, ... }
Whole threads are kept; build_threads.py applies the window. A conversation's date_updated does not
move when a message arrives, so threads cannot be filtered by date here.
"""
import argparse
import base64
import json
import os
import pathlib
import sys
import urllib.request

FIELDS = ("sid", "friendly_name", "date_created", "date_updated", "state", "attributes")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="scratch folder")
    args = ap.parse_args()

    missing = [k for k in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_CONVERSATIONS_SERVICE_SID")
               if not os.environ.get(k)]
    if missing:
        sys.exit(f"missing env: {', '.join(missing)} (source the backend .env first)")

    auth = "Basic " + base64.b64encode(
        f"{os.environ['TWILIO_ACCOUNT_SID']}:{os.environ['TWILIO_AUTH_TOKEN']}".encode()).decode()
    # The Conversations API is service-scoped; the bare /v1/Conversations path returns 404.
    base = f"https://conversations.twilio.com/v1/Services/{os.environ['TWILIO_CONVERSATIONS_SERVICE_SID']}"

    def pages(url, key):
        while url:
            req = urllib.request.Request(url, headers={"Authorization": auth})
            with urllib.request.urlopen(req, timeout=60) as f:
                page = json.load(f)
            yield from page[key]
            url = page["meta"].get("next_page_url")

    out = {}
    for c in pages(f"{base}/Conversations?PageSize=100", "conversations"):
        msgs = list(pages(f"{base}/Conversations/{c['sid']}/Messages?PageSize=200&Order=asc", "messages"))
        out[c["sid"]] = {"conv": {k: c.get(k) for k in FIELDS}, "messages": msgs}

    dest = pathlib.Path(args.out)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "twilio_raw.json").write_text(json.dumps(out))
    print(f"threads {len(out)} messages {sum(len(v['messages']) for v in out.values())} -> {dest / 'twilio_raw.json'}")
    if not out:
        sys.exit("no threads: check the service SID")


if __name__ == "__main__":
    main()
