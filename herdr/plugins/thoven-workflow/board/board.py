#!/usr/bin/env python3
"""Status board: one self-contained HTML page of every pane, its ticket, PR, CI, Linear state,
verifier verdict, and the staging deploys. Opens /tmp/herdr-board.html.

Every source runs in parallel with its own timeout, and a source that fails renders as
"unavailable" with the reason instead of failing the page. Pane output is read with
`--source visible`, which never scrolls another session's agent (recent reads with --lines can).

  board.py            gather, render, open
  board.py --no-open  gather and render only
"""
import concurrent.futures as cf
import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

HERDR = os.environ.get("HERDR_BIN_PATH") or "herdr"
STATE = os.environ.get("HERDR_PLUGIN_STATE_DIR") or os.path.expanduser("~/.local/state/herdr/plugins/thoven.workflow")
CONFIG = os.environ.get("HERDR_PLUGIN_CONFIG_DIR") or os.path.expanduser("~/.config/herdr/plugins/config/thoven.workflow")
OUT = os.environ.get("TW_BOARD_OUT", "/tmp/herdr-board.html")
TIMEOUT = 8
VERCEL_PROJECT = "thoven-staging"
RENDER_SERVICES = ["thoven-api-staging", "thoven-worker-staging"]
TICKET_RE = re.compile(r"thv-(\d+)", re.I)


class Unavailable(Exception):
    pass


def run(argv, cwd=None, timeout=TIMEOUT):
    try:
        p = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout, stdin=subprocess.DEVNULL)
    except FileNotFoundError:
        raise Unavailable(f"{argv[0]} is not installed")
    except subprocess.TimeoutExpired:
        raise Unavailable(f"{' '.join(argv[:3])} timed out after {timeout}s")
    return p


def run_json(argv, cwd=None, timeout=TIMEOUT):
    p = run(argv, cwd=cwd, timeout=timeout)
    if p.returncode != 0:
        raise Unavailable(last_line(p.stderr or p.stdout) or f"{argv[0]} exited {p.returncode}")
    try:
        return json.loads(p.stdout)
    except json.JSONDecodeError:
        raise Unavailable(f"{argv[0]} returned non-JSON output")


def last_line(text):
    lines = [l.strip() for l in (text or "").splitlines() if l.strip() and not set(l.strip()) <= set("│╭╮╰╯─ ")]
    return lines[-1][:200] if lines else ""


def env_value(name):
    """Env first, then the plugin config dir's .env."""
    if os.environ.get(name):
        return os.environ[name]
    try:
        with open(os.path.join(CONFIG, ".env"), encoding="utf-8") as f:
            for line in f:
                k, _, v = line.strip().partition("=")
                if k.strip() == name and v.strip():
                    return v.strip().strip("'\"")
    except OSError:
        pass
    return None


def age(ts):
    if ts is None:
        return ""
    if isinstance(ts, (int, float)):
        t = dt.datetime.fromtimestamp(ts / 1000 if ts > 1e11 else ts, dt.timezone.utc)
    else:
        try:
            t = dt.datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except ValueError:
            return str(ts)
    s = int((dt.datetime.now(dt.timezone.utc) - t).total_seconds())
    for unit, n in (("d", 86400), ("h", 3600), ("m", 60)):
        if s >= n:
            return f"{s // n}{unit} ago"
    return "just now"


# ---------------------------------------------------------------- panes


CHROME = re.compile(r"^[\s│┃|╭╮╰╯─━┌┐└┘├┤┬┴┼═>❯›⏵·•…\-_=]*$")


def tail_lines(text, n=3):
    keep = []
    for line in text.splitlines():
        s = line.rstrip()
        if not s.strip() or CHROME.match(s):
            continue
        # Agent UI chrome: status bars, mode lines, update banners, spinner footers.
        if re.search(r"bypass permissions|auto mode on|\? for shortcuts|esc to interrupt|ctrl\+[a-z] to|"
                     r"[█░▰▱]{3}|Update installed|disable recaps|^\s*✻ \w+ for \d", s, re.I):
            continue
        keep.append(s.strip("│ ").rstrip())
    return keep[-n:]


def git_branch(cwd):
    if not cwd or not os.path.isdir(cwd):
        return None, None
    p = run(["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD", "--show-toplevel"], timeout=4)
    if p.returncode != 0:
        return None, None
    out = p.stdout.split()
    return (out[0], out[1]) if len(out) >= 2 else (None, None)


def read_verdict(pane_id):
    for name in (pane_id, pane_id.replace(":", "_")):
        path = os.path.join(STATE, "verify", f"{name}.json")
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    return json.load(f)
            except (OSError, json.JSONDecodeError) as e:
                return {"status": "unreadable", "reasons": [str(e)]}
    return None


def gather_panes(pool):
    snap = run_json([HERDR, "api", "snapshot"])["result"]["snapshot"]
    ws = {w["workspace_id"]: w.get("label") or w["workspace_id"] for w in snap.get("workspaces", [])}
    tabs = {t["tab_id"]: t.get("label") or t["tab_id"] for t in snap.get("tabs", [])}
    names = {a["pane_id"]: a.get("name") for a in snap.get("agents", [])}
    panes = []
    for p in snap.get("panes", []):
        cwd = p.get("foreground_cwd") or p.get("cwd")
        panes.append({
            "pane_id": p["pane_id"],
            "workspace": ws.get(p.get("workspace_id"), p.get("workspace_id")),
            "tab": tabs.get(p.get("tab_id"), p.get("tab_id")),
            "agent": p.get("agent"),
            "name": names.get(p["pane_id"]),
            "status": p.get("agent_status") or "no agent",
            "title": p.get("terminal_title_stripped") or "",
            "cwd": cwd,
        })

    def enrich(pane):
        try:
            pane["branch"], pane["toplevel"] = git_branch(pane["cwd"])
        except Unavailable:
            pane["branch"], pane["toplevel"] = None, None
        m = TICKET_RE.search(pane["branch"] or "") or TICKET_RE.search(os.path.basename(pane["cwd"] or "")) \
            or TICKET_RE.search(pane["workspace"] or "")
        pane["ticket"] = f"THV-{m.group(1)}" if m else None
        try:
            r = run([HERDR, "pane", "read", pane["pane_id"], "--source", "visible"])
            pane["tail"] = tail_lines(r.stdout) if r.returncode == 0 else [f"(read failed: {last_line(r.stderr)})"]
        except Unavailable as e:
            pane["tail"] = [f"({e})"]
        pane["verdict"] = read_verdict(pane["pane_id"])
        return pane

    return list(pool.map(enrich, panes))


# ---------------------------------------------------------------- PRs


def gather_pr(branch, toplevel):
    p = run(["gh", "pr", "view", branch, "--json", "number,url,state,isDraft,title,statusCheckRollup"], cwd=toplevel)
    if p.returncode != 0:
        msg = last_line(p.stderr)
        if "no pull requests found" in msg:
            return {"none": True}
        raise Unavailable(msg or "gh pr view failed")
    d = json.loads(p.stdout)
    ok = bad = wait = 0
    for c in d.get("statusCheckRollup") or []:
        concl = (c.get("conclusion") or c.get("state") or "").upper()
        status = (c.get("status") or "").upper()
        if status and status != "COMPLETED" and not c.get("conclusion"):
            wait += 1
        elif concl in ("SUCCESS", "SKIPPED", "NEUTRAL"):
            ok += 1
        elif concl in ("PENDING", "EXPECTED", "QUEUED", "IN_PROGRESS", ""):
            wait += 1
        else:
            bad += 1
    d["checks"] = {"ok": ok, "bad": bad, "wait": wait}
    return d


# ---------------------------------------------------------------- Linear


def linear_key():
    key = os.environ.get("LINEAR_API_KEY")
    if not key:
        path = os.path.expanduser("~/.linear-api-key")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                key = f.read().strip() or None
    return key or env_value("LINEAR_API_KEY")


def gather_linear(tickets):
    key = linear_key()
    if not key:
        raise Unavailable(f"needs LINEAR_API_KEY (env, ~/.linear-api-key, or {CONFIG}/.env)")
    fields = "identifier title url state { name type } comments(first: 50) { nodes { body createdAt user { name } } }"
    parts = [f't{i}: issue(id: "{t}") {{ {fields} }}' for i, t in enumerate(tickets)]
    body = json.dumps({"query": "query {\n" + "\n".join(parts) + "\n}"}).encode()
    req = urllib.request.Request("https://api.linear.app/graphql", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": key})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            raise Unavailable("Linear key rejected (401): refresh ~/.linear-api-key")
        raise Unavailable(f"Linear HTTP {e.code}")
    except (urllib.error.URLError, TimeoutError) as e:
        raise Unavailable(f"Linear unreachable: {e}")
    out = {}
    for i, t in enumerate(tickets):
        node = (d.get("data") or {}).get(f"t{i}")
        if not node:
            out[t] = {"missing": True}
            continue
        comments = sorted((node.get("comments") or {}).get("nodes") or [], key=lambda c: c.get("createdAt") or "")
        node["latest_comment"] = comments[-1] if comments else None
        out[t] = node
    return out


# ---------------------------------------------------------------- deploys and errors


def gather_vercel():
    d = run_json(["vercel", "ls", VERCEL_PROJECT, "--format", "json"], cwd="/tmp", timeout=TIMEOUT + 4)
    deps = d.get("deployments") or []
    if not deps:
        raise Unavailable("no deployments returned")
    latest = deps[0]
    ready = next((x for x in deps if x.get("state") == "READY"), None)
    return {"latest": latest, "ready": ready}


def gather_render():
    svcs = run_json(["render", "services", "-o", "json", "--confirm"])
    ids = {}
    for s in svcs:
        sv = s.get("service") or s
        if sv.get("name") in RENDER_SERVICES:
            ids[sv["name"]] = sv["id"]
    out = {}
    with cf.ThreadPoolExecutor(len(RENDER_SERVICES)) as pool:
        futs = {name: pool.submit(run_json, ["render", "deploys", "list", ids[name], "-o", "json", "--confirm"])
                for name in RENDER_SERVICES if name in ids}
        for name in RENDER_SERVICES:
            if name not in futs:
                out[name] = {"error": "service not found in render services"}
                continue
            try:
                deps = futs[name].result()
                out[name] = {"latest": deps[0] if deps else None}
            except Unavailable as e:
                out[name] = {"error": str(e)}
    return out


def gather_sentry():
    token, org = env_value("SENTRY_AUTH_TOKEN"), env_value("SENTRY_ORG")
    if not token:
        raise Unavailable(f"not configured (set SENTRY_AUTH_TOKEN and SENTRY_ORG in {CONFIG}/.env)")
    if not org:
        raise Unavailable(f"needs SENTRY_ORG in {CONFIG}/.env")
    url = f"https://sentry.io/api/0/organizations/{org}/issues/?query=firstSeen%3A-24h&statsPeriod=24h&limit=10"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise Unavailable(f"Sentry HTTP {e.code}")
    except (urllib.error.URLError, TimeoutError) as e:
        raise Unavailable(f"Sentry unreachable: {e}")


# ---------------------------------------------------------------- gather


def settle(fut, wait=TIMEOUT + 6):
    try:
        return {"ok": True, "data": fut.result(timeout=wait)}
    except Unavailable as e:
        return {"ok": False, "why": str(e)}
    except cf.TimeoutError:
        return {"ok": False, "why": f"timed out after {wait}s"}
    except Exception as e:  # a source bug must not take the page down
        return {"ok": False, "why": f"{type(e).__name__}: {e}"}


def gather():
    with cf.ThreadPoolExecutor(24) as pool, cf.ThreadPoolExecutor(8) as inner:
        f_panes = pool.submit(gather_panes, inner)
        f_vercel = pool.submit(gather_vercel)
        f_render = pool.submit(gather_render)
        f_sentry = pool.submit(gather_sentry)
        panes = settle(f_panes, wait=40)
        tickets = sorted({p["ticket"] for p in panes.get("data") or [] if p.get("ticket")},
                         key=lambda t: int(t.split("-")[1]))
        prs = {}
        seen = {}
        for p in panes.get("data") or []:
            b, top = p.get("branch"), p.get("toplevel")
            if b and top and b not in ("main", "HEAD") and (top, b) not in seen:
                seen[(top, b)] = pool.submit(gather_pr, b, top)
        f_linear = pool.submit(gather_linear, tickets) if tickets else None
        for k, f in seen.items():
            prs[k] = settle(f)
        return {
            "panes": panes,
            "tickets": tickets,
            "prs": prs,
            "linear": settle(f_linear) if f_linear else {"ok": True, "data": {}},
            "vercel": settle(f_vercel, wait=20),
            "render": settle(f_render, wait=24),
            "sentry": settle(f_sentry),
        }


# ---------------------------------------------------------------- render

e = html.escape


def chip(kind, text):
    icon = {"ok": "✓", "bad": "✗", "wait": "⏳", "idle": "", "off": ""}[kind]
    return f'<span class="chip {kind}">{icon + " " if icon else ""}{e(text)}</span>'


def status_chip(status):
    return chip({"working": "wait", "blocked": "bad", "done": "ok", "idle": "idle"}.get(status, "off"), status)


def verdict_chip(v):
    if not v:
        return chip("off", "verifier: no verdict")
    s = v.get("status", "?")
    kind = {"ok": "ok", "fail": "bad", "fail2": "bad", "pending": "wait"}.get(s, "off")
    extra = f", {v['nudges']} nudges" if v.get("nudges") else ""
    return chip(kind, f"verifier: {s}{extra}")


def deploy_chip(state):
    s = (state or "?").lower()
    if s in ("ready", "live", "succeeded"):
        return chip("ok", s)
    if s in ("error", "failed", "build_failed", "update_failed", "canceled", "deactivated", "pre_deploy_failed"):
        return chip("bad" if s != "canceled" and s != "deactivated" else "off", s)
    return chip("wait", s)


def first_line(text, n=90):
    t = (text or "").strip().splitlines()
    return (t[0][:n] + ("…" if len(t[0]) > n else "")) if t else ""


def unavailable(why):
    return f'<div class="na">unavailable: {e(why)}</div>'


def render_deploys(g):
    cells = []
    v = g["vercel"]
    if v["ok"]:
        lt, rd = v["data"]["latest"], v["data"]["ready"]
        meta = lt.get("meta") or {}
        body = f'{deploy_chip(lt.get("state"))}<div class="sub">{e(first_line(meta.get("githubCommitMessage"), 60))}</div>' \
               f'<div class="sub">{e(age(lt.get("createdAt")))}</div>'
        if rd is not lt and rd:
            body += f'<div class="sub">last ready: {e(first_line((rd.get("meta") or {}).get("githubCommitMessage"), 50))}, {e(age(rd.get("createdAt")))}</div>'
        cells.append(("Vercel thoven-staging", body))
    else:
        cells.append(("Vercel thoven-staging", unavailable(v["why"])))
    r = g["render"]
    for name in RENDER_SERVICES:
        if not r["ok"]:
            cells.append((f"Render {name}", unavailable(r["why"])))
            continue
        d = r["data"].get(name) or {}
        if d.get("error"):
            cells.append((f"Render {name}", unavailable(d["error"])))
        elif d.get("latest"):
            lt = d["latest"]
            cells.append((f"Render {name}", f'{deploy_chip(lt.get("status"))}'
                          f'<div class="sub">{e(first_line((lt.get("commit") or {}).get("message"), 60))}</div>'
                          f'<div class="sub">{e(age(lt.get("finishedAt") or lt.get("createdAt")))}</div>'))
        else:
            cells.append((f"Render {name}", '<div class="na">no deploys</div>'))
    s = g["sentry"]
    if s["ok"]:
        issues = s["data"]
        body = chip("ok" if not issues else "bad", f"{len(issues)} new in 24h")
        body += "".join(f'<div class="sub"><a href="{e(i.get("permalink", "#"))}">{e(first_line(i.get("title"), 60))}</a></div>' for i in issues[:4])
        cells.append(("Sentry", body))
    else:
        cells.append(("Sentry", f'<div class="na">{e(s["why"])}</div>'))
    return '<section class="strip">' + "".join(f'<div class="cell"><h3>{e(t)}</h3>{b}</div>' for t, b in cells) + "</section>"


def split_label(label):
    """Labels named elsewhere may join parts with a middle dot; the board shows one part per line."""
    return "<br>".join(e(x.strip()) for x in (label or "").split(" · "))


def render_pane(p):
    who = " ".join(x for x in (p.get("agent") or "shell", f'({p["name"]})' if p.get("name") else "") if x)
    v = p.get("verdict")
    reasons = "".join(f"<li>{e(str(x))}</li>" for x in (v or {}).get("reasons") or [])
    tail = "\n".join(p.get("tail") or [])
    return f"""<div class="pane">
  <div class="row"><strong>{e(p['pane_id'])}</strong>{status_chip(p['status'])}{verdict_chip(v)}<span class="chip off">{e(who)}</span></div>
  <div class="sub">workspace {split_label(p['workspace'])}</div>
  <div class="sub">tab {split_label(p['tab'])}</div>
  <div class="sub mono">{e(p['cwd'] or '')}</div>
  <div class="sub mono">branch {e(p.get('branch') or 'none')}</div>
  {f'<ul class="reasons">{reasons}</ul>' if reasons else ''}
  {f'<pre>{e(tail)}</pre>' if tail else ''}
</div>"""


def render_pr(key, res):
    top, branch = key
    label = f"{os.path.basename(top)}: {branch}"
    if not res["ok"]:
        return f'<div class="pr"><span class="mono">{e(label)}</span>{unavailable(res["why"])}</div>'
    d = res["data"]
    if d.get("none"):
        return f'<div class="pr"><span class="mono">{e(label)}</span><span class="chip off">no PR</span></div>'
    c = d["checks"]
    ci = chip("bad", f"CI {c['bad']} failing") if c["bad"] else chip("wait", f"CI {c['wait']} running") if c["wait"] \
        else chip("ok", "CI green") if c["ok"] else chip("off", "no checks")
    state = d.get("state", "?") + (" draft" if d.get("isDraft") else "")
    return (f'<div class="pr"><a href="{e(d["url"])}">#{d["number"]}</a> <span class="mono">{e(label)}</span>'
            f'{chip("ok" if d.get("state") == "MERGED" else "off", state)}{ci}<div class="sub">{e(first_line(d.get("title")))}</div></div>')


def render_linear(t, lin):
    link = f"https://linear.app/thoven/issue/{t}"
    if not lin["ok"]:
        return f'<div class="lin"><a href="{link}">{t} in Linear</a><div class="na">{e(lin["why"])}</div></div>'
    d = (lin["data"] or {}).get(t) or {}
    if d.get("missing"):
        return f'<div class="lin"><a href="{link}">{t}</a><div class="na">not found in Linear</div></div>'
    st = d.get("state") or {}
    kind = {"completed": "ok", "canceled": "off", "started": "wait"}.get(st.get("type"), "idle")
    c = d.get("latest_comment")
    cm = f'<div class="sub">latest comment, {e(age(c.get("createdAt")))}: {e(first_line(c.get("body"), 140))}</div>' if c else '<div class="sub">no comments</div>'
    return f'<div class="lin"><a href="{e(d.get("url") or link)}">{e(d.get("title") or t)}</a>{chip(kind, st.get("name", "?"))}{cm}</div>'


def render(g):
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    parts = [render_deploys(g)]
    if not g["panes"]["ok"]:
        parts.append(f'<div class="card">{unavailable("panes: " + g["panes"]["why"])}</div>')
    panes = g["panes"].get("data") or []
    for t in g["tickets"]:
        mine = [p for p in panes if p.get("ticket") == t]
        keys = sorted({(p["toplevel"], p["branch"]) for p in mine if (p.get("toplevel"), p.get("branch")) in g["prs"]})
        bad = any(p["status"] == "blocked" or (p.get("verdict") or {}).get("status") in ("fail", "fail2") for p in mine)
        parts.append(f"""<section class="card{' alert' if bad else ''}">
  <h2>{e(t)}</h2>
  {render_linear(t, g['linear'])}
  {''.join(render_pr(k, g['prs'][k]) for k in keys) or '<div class="na">no branch with a PR lookup</div>'}
  <div class="panes">{''.join(render_pane(p) for p in mine)}</div>
</section>""")
    loose = [p for p in panes if not p.get("ticket")]
    if loose:
        parts.append(f'<section class="card"><h2>Panes without a ticket</h2><div class="panes">{"".join(render_pane(p) for p in loose)}</div></section>')
    n_bad = sum(1 for p in panes if p["status"] == "blocked")
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>herdr board</title>
<style>
body{{margin:0;padding:24px;background:#f7f2e9;color:#2b2622;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
header{{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}} h1{{margin:0;font-size:20px}}
.gen{{color:#8a7f73;font-size:12px}}
.strip{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px}}
.cell,.card{{background:#fff;border:1px solid #ebe3d6;border-radius:12px;padding:14px 16px}}
.card{{margin-bottom:16px}} .card.alert{{border-color:#e7a29a}}
h2{{margin:0 0 8px;font-size:16px}} h3{{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#8a7f73}}
.chip{{display:inline-block;margin:0 6px 4px 0;padding:1px 8px;border-radius:999px;font-size:12px;border:1px solid transparent;white-space:nowrap}}
.chip.ok{{background:#e6f4ea;color:#1e6b35;border-color:#bfe3c9}} .chip.bad{{background:#fdeaea;color:#a12a20;border-color:#f3c1bc}}
.chip.wait{{background:#fff3dc;color:#8a5a00;border-color:#f2d9a6}} .chip.idle{{background:#eef0f3;color:#4a5260}}
.chip.off{{background:#f4f1ec;color:#6f665c}}
.sub{{color:#6f665c;font-size:12px}} .mono{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}}
.na{{color:#8a7f73;font-style:italic;font-size:12px;overflow-wrap:anywhere}}
.lin,.pr{{padding:6px 0;border-top:1px solid #f1ebe1}} .lin a,.pr a{{margin-right:8px}}
.panes{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;margin-top:10px}}
.pane{{background:#fcfaf6;border:1px solid #efe8dc;border-radius:10px;padding:10px 12px}}
.row{{display:flex;flex-wrap:wrap;align-items:center;gap:2px 0}} .row strong{{margin-right:8px}}
pre{{margin:8px 0 0;padding:8px;background:#f4efe6;border-radius:8px;font-size:11px;white-space:pre-wrap;word-break:break-word;max-height:12em;overflow:auto}}
ul.reasons{{margin:6px 0 0 18px;padding:0;color:#a12a20;font-size:12px}} a{{color:#9a4d00}}
</style></head><body>
<header><h1>herdr board</h1>{chip('bad', f'{n_bad} blocked') if n_bad else chip('ok', 'nothing blocked')}<span class="chip off">{len(panes)} panes</span><span class="gen">generated {now}</span></header>
{''.join(parts)}
</body></html>"""


def main():
    g = gather()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(render(g))
    summary = {k: ("ok" if g[k]["ok"] else g[k]["why"]) for k in ("panes", "linear", "vercel", "render", "sentry")}
    summary["prs"] = {f"{os.path.basename(k[0])}:{k[1]}": ("ok" if v["ok"] else v["why"]) for k, v in g["prs"].items()}
    print(json.dumps(summary, indent=1))
    if "--no-open" not in sys.argv:
        subprocess.run(["open", OUT], check=False)


if __name__ == "__main__":
    main()
