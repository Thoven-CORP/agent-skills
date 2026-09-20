#!/usr/bin/env bash
# Local stand-in for the hosted classifier so evals/test-classify.sh needs no key
# and no network. python3's http.server (not `nc -l`) because it can be killed
# cleanly by pid without leaving a listener bound to the port behind.
set -o pipefail

port="$1"
mode="$2"

case "$mode" in
  ok|slow|429|garbage|partial|badtype|echo) ;;
  *) echo "usage: stub-classifier.sh <port> <ok|slow|429|garbage|partial|badtype|echo>" >&2; exit 1 ;;
esac

exec python3 - "$port" "$mode" <<'PY'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

port, mode = int(sys.argv[1]), sys.argv[2]

OK_BODY = b'''{"model":"jev-latest","answers":{"area":{"type":"choice","choice":"billing","probabilities":{"billing":0.6,"tech":0.4},"confidence":0.596},"severity":{"type":"score","score":1.03,"legend":{"calm":0,"annoyed":1,"angry":2},"confidence":0.842},"is_urgent":{"type":"noul","noul":0.999}},"usage":{}}'''

# Answers only one of the schema's three questions.
PARTIAL_BODY = b'''{"model":"jev-latest","answers":{"area":{"type":"choice","choice":"billing","probabilities":{"billing":0.6,"tech":0.4},"confidence":0.596}},"usage":{}}'''

# Answers all three, but one carries a type the contract does not define.
BADTYPE_BODY = b'''{"model":"jev-latest","answers":{"area":{"type":"choice","choice":"billing","probabilities":{"billing":0.6,"tech":0.4},"confidence":0.596},"severity":{"type":"rank","rank":2,"confidence":0.842},"is_urgent":{"type":"noul","noul":0.999}},"usage":{}}'''

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        if mode == "echo":
            # Answers whatever was asked, so a real schema can be exercised without
            # a key. Values are fixed per type, which is what makes a run comparable.
            import json
            qs = json.loads(raw).get("questions", {})
            answers = {}
            for name, q in qs.items():
                t = q.get("type")
                if t == "choice":
                    opts = list(q.get("criteria", {}).keys())
                    answers[name] = {"type": "choice", "choice": opts[0] if opts else "unknown",
                                     "probabilities": {o: 1.0 / len(opts) for o in opts} if opts else {},
                                     "confidence": 0.81}
                elif t == "score":
                    lv = q.get("criteria", [])
                    answers[name] = {"type": "score", "score": 1.0,
                                     "legend": {str(i): v for i, v in enumerate(lv)},
                                     "confidence": 0.74}
                elif t == "noul":
                    answers[name] = {"type": "noul", "noul": 0.93}
            body = json.dumps({"model": "jev-latest", "answers": answers, "usage": {}}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
            return
        if mode == "slow":
            import time
            time.sleep(4)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(OK_BODY)
        elif mode == "429":
            self.send_response(429)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"rate limited"}')
        elif mode in ("partial", "badtype"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(PARTIAL_BODY if mode == "partial" else BADTYPE_BODY)
        elif mode == "garbage":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"not json")
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(OK_BODY)

    def log_message(self, *args):
        pass

HTTPServer(("127.0.0.1", port), Handler).serve_forever()
PY
