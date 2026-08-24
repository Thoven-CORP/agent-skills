#!/usr/bin/env python3
"""Board health check — Linear credential expiry + live probe.

Run at every Meta session start. Warns BEFORE expiry instead of after outage.

Usage: python3 board-health.py
Exit 0 healthy · Exit 1 expiring soon (<24h) or probe failed.
"""
import json, os, time, subprocess, sys

AUTH = os.path.expanduser("~/.local/share/opencode/mcp-auth.json")

def load_token():
    try:
        lin = json.load(open(AUTH))["linear"]["tokens"]
        return lin.get("accessToken"), lin.get("expiresAt")
    except Exception as e:
        print(f"❌ cannot read {AUTH}: {e}")
        return None, None

def probe(token):
    r = subprocess.run(
        ["curl", "-s", "--max-time", "10", "-X", "POST", "https://mcp.linear.app/mcp",
         "-H", f"Authorization: Bearer {token}",
         "-H", "Content-Type: application/json",
         "-d", '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"health","version":"0"}}}'],
        capture_output=True, text=True)
    out = r.stdout
    if not out.strip():
        return False, "no response"
    if '"error"' in out and '401' in out:
        return False, "rejected (401)"
    return True, out[:80].replace("\n", " ")

tok, exp = load_token()
if not tok:
    sys.exit(1)

hours = (exp - time.time()) / 3600 if exp else -1
print(f"credential expires in {hours:.1f}h ({time.strftime('%a %H:%M', time.localtime(exp)) if exp else '?'})")

ok, detail = probe(tok)
print(f"live probe: {'✅ reachable' if ok else '⚠️ ' + detail}")

if not ok:
    print("→ fix: /mcp in any opencode pane → reconnect linear → approve in browser")
    sys.exit(1)
if 0 <= hours < 24:
    print("→ expiring within a day. Expect one failed turn then auto-refresh;")
    print("  if a client stays dark past expiry, reconnect it individually.")
sys.exit(0)
