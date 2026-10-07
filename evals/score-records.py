#!/usr/bin/env python3
"""Count real classify records in a Devin transcript.

The skill text itself contains the strings "status": "undecided" and
"binding": true as instructions, so a grep over the transcript counts the
prose as if it were a result. Only a record that parses as JSON and carries
every key the contract emits is a real one.
"""
import json, re, sys

RECORD = re.compile(r'\{\s*"schema"\s*:\s*"[^"]+"\s*,\s*"status".*?\n\}', re.S)

def records(path):
    raw = open(path).read().replace('\\n', '\n').replace('\\"', '"')
    out = []
    for m in RECORD.finditer(raw):
        try:
            r = json.loads(m.group(0))
        except json.JSONDecodeError:
            continue
        if {"schema", "status", "reason"} <= r.keys():
            out.append(r)
    return out

if __name__ == "__main__":
    rs = records(sys.argv[1])
    ok = [r for r in rs if r["status"] == "answered"]
    und = [r for r in rs if r["status"] == "undecided"]
    ans = [a for r in ok for a in r.get("answers", {}).values()]
    print(f"{len(rs)}\t{len(ok)}\t{len(und)}\t"
          f"{sum(1 for a in ans if a.get('binding'))}\t"
          f"{sum(1 for a in ans if not a.get('binding'))}\t"
          f"{','.join(sorted({r['reason'] for r in und})) or '-'}")
