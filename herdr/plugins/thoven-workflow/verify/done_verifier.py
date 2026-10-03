#!/usr/bin/env python3
"""done-verifier: when a pane's agent says it is done, check that it is.

  --event   pane.agent_status_changed hook. Acts only on a transition INTO done.
  --manual  verify the focused pane now (prefix+v); notification + badge, no nudge.

Contract read by board/: $STATE/verify/<pane_id>.json =
  {"pane_id","ticket","status":"ok|fail|fail2|pending","reasons":[...],"nudges":N,"checked_at":ISO}
Private bookkeeping (last status for debounce, escalation flag) lives in
$STATE/verify-internal/<pane_id>.json so the contract file keeps its exact shape.

Scope: --event skips main panes, meaning any pane marked main (main-pane.<ws>) or recorded
as a dispatcher (dispatch/by-pane/*.json). A main waits on CI and holds watchers, so it is
not a build pane claiming done. Safety gate: if $STATE/verify.only-panes exists, --event acts
only on the pane ids listed in it (whitespace separated; empty file = act on none).

Never crashes the hook: everything is caught, logged to $STATE/verify.log, exit 0.
"""
import fcntl
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import twlib as tw  # noqa: E402

MAX_NUDGES = 2
TOKEN = "tw_verify"
LOG = "verify.log"

# ------------------------------------------------------------------ check 1
# Live child processes that are WORK, not infrastructure.
#
# Observed on a real Claude pane (herdr pane process-info + ps -axo pid,ppid,pgid):
#   -zsh (pane shell, own pgid)
#     claude                      <- agent; foreground process-group leader
#       caffeinate -i -t 300      <- same pgid as claude
#       node .../notion-mcp-server, npm exec ..., paper mcp, gws mcp,
#       Python .../mem0/.../mcp_server.py, playwright-mcp ...   <- same pgid as claude
#       /bin/zsh -c source ~/.claude/shell-snapshots/... && <cmd>   <- OWN pgid
#         <cmd> (pnpm dev, vitest, sleep, agent-browser, ...)
#
# EXCLUDE (infrastructure):
#   - the pane shell and the agent process itself;
#   - anything in the agent's process group: the agent spawns MCP servers,
#     language servers and caffeinate into its own group, and they live as long
#     as the agent does;
#   - by name, wherever they sit: caffeinate, herdr (hooks/CLI), MCP servers
#     (`mcp` in argv), language servers (*-language-server, *lsp*, gopls,
#     rust-analyzer, pyright, tsserver), and `ps` itself.
# INCLUDE (work): every other descendant. Each Bash-tool call runs in its own
#   `zsh -c source .../shell-snapshots/...` group; one still alive when the agent
#   says done is a background shell, and its children are the dev server / test
#   runner / browser / sleep loop. The reason names the deepest child of each
#   such group, so "pnpm dev" is reported rather than the zsh wrapper.
# Not seen: processes that daemonised themselves out of the tree (nohup + disown
#   reparented to launchd). The tree cannot follow those.
INFRA_RE = re.compile(
    r"(^|/)(caffeinate|herdr|ps)( |$)|mcp|language-server|(^|[/ -])lsp|gopls|"
    r"rust-analyzer|pyright|tsserver|sourcekit", re.I)
WRAPPER_RE = re.compile(r"/shell-snapshots/|^(/bin/)?(ba|z)?sh -c ")


def check_processes(pane_id, has_agent):
    shell, agent = tw.pane_procs(pane_id, has_agent)
    if not shell:
        return None
    procs = tw.ps_snapshot()
    agent_pgid = procs.get(agent, {}).get("pgid") if agent else None
    me = os.getpid()
    work = []
    for p in tw.descendants(procs, shell):
        if p["pid"] in (agent, me) or p["pid"] == os.getppid():
            continue
        if agent_pgid and p["pgid"] == agent_pgid:
            continue
        if INFRA_RE.search(p["cmd"]):
            continue
        work.append(p)
    if not work:
        return None
    # Collapse each group to its most informative member: a non-wrapper leaf.
    groups = {}
    for p in work:
        groups.setdefault(p["pgid"], []).append(p)
    names = []
    for members in groups.values():
        real = [m for m in members if not WRAPPER_RE.search(m["cmd"])] or members
        pick = real[-1]
        names.append(f"{tw.short_cmd(pick['cmd'], 30)} (pid {pick['pid']})")
    n = len(names)
    return f"{n} live process{'es' if n > 1 else ''}: " + ", ".join(names[:3]) + (
        " …" if n > 3 else "")


# ------------------------------------------------------------------ git checks

def git(cwd, *args):
    rc, out, _ = tw.run(["git", "-C", cwd, *args], timeout=10)
    return out.strip() if rc == 0 else None


def repo_info(cwd):
    """(toplevel, branch, ticket) or (None, None, None) when cwd is not a repo."""
    if not cwd or not os.path.isdir(cwd):
        return None, None, None
    top = git(cwd, "rev-parse", "--show-toplevel")
    if not top:
        return None, None, None
    branch = git(top, "rev-parse", "--abbrev-ref", "HEAD")
    m = re.search(r"thv-(\d+)", branch or "", re.I)
    return top, branch, (f"THV-{m.group(1)}" if m else None)


def check_dirty(top):
    out = git(top, "status", "--porcelain", "--untracked-files=no")
    if out:
        n = len(out.splitlines())
        return f"{n} uncommitted tracked file{'s' if n > 1 else ''}"
    return None


RED = {"FAILURE", "ERROR", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE"}
PENDING = {"PENDING", "EXPECTED", "QUEUED", "IN_PROGRESS", "WAITING", "REQUESTED"}


def check_pr(top, branch, dirty):
    """('fail'|'pending', reason) or None when green or skipped."""
    ahead = git(top, "rev-list", "--count", "origin/main..HEAD")
    if ahead == "0" and not dirty:
        return None  # read-only / verifier pane: nothing to ship
    rc, out, err = tw.run(["gh", "pr", "view", branch, "--json",
                           "number,state,statusCheckRollup"], cwd=top, timeout=25)
    if rc != 0:
        if "no pull requests found" in err.lower():
            return None  # main pushes and opens the PR (dispatch brief), so its absence is not the pane's
        return "pending", "PR lookup failed: " + (err.strip().splitlines() or ["?"])[-1][:60]
    try:
        pr = json.loads(out)
    except Exception:
        return "pending", "PR lookup returned bad JSON"
    num, state = pr.get("number"), pr.get("state")
    if state == "MERGED":
        return None
    if state == "CLOSED":
        return "fail", f"PR #{num} is closed"
    red, pend = [], []
    for c in pr.get("statusCheckRollup") or []:
        name = c.get("name") or c.get("context") or "check"
        concl = (c.get("conclusion") or "").upper()
        st = (c.get("state") or c.get("status") or "").upper()
        if concl in RED or st in RED:
            red.append(name)
        elif concl == "" and (st in PENDING or st not in ("COMPLETED", "SUCCESS")):
            pend.append(name)
    if red:
        return "fail", f"PR #{num} checks red: " + ", ".join(red[:3])
    if pend:
        return "pending", f"PR #{num} checks pending: " + ", ".join(pend[:3])
    if not pr.get("statusCheckRollup"):
        return "pending", f"PR #{num} has no checks yet"
    return None


def own_escalation(name):
    """Our own escalation drop (tell_main fallback) shares the ticket tag; it is
    not the pane's undelivered report."""
    try:
        with open(os.path.join(tw.INBOX, name)) as f:
            return f.read(15) == "[thoven verify]"
    except Exception:
        return False


def check_report(ticket):
    if not ticket or not os.path.isdir(tw.INBOX):
        return None
    pat = re.compile(rf"^{re.escape(ticket)}(\D|$)", re.I)
    left = [f for f in os.listdir(tw.INBOX) if pat.match(f) and not own_escalation(f)]
    if left:
        return f"report not delivered: {os.path.join(tw.INBOX, left[0])}"
    return None


# ------------------------------------------------------------------ verify

def verify(pane):
    """Run all checks on a pane dict from `pane get`. Returns (status, reasons, ticket)."""
    pane_id = pane["pane_id"]
    fails, pends = [], []
    r = check_processes(pane_id, bool(pane.get("agent")))
    if r:
        fails.append(r)
    top, branch, ticket = repo_info(pane.get("foreground_cwd") or pane.get("cwd"))
    if top and branch and branch != "main":
        dirty = check_dirty(top)
        if dirty:
            fails.append(dirty)
        if branch != "HEAD":
            pr = check_pr(top, branch, bool(dirty))
            if pr:
                (fails if pr[0] == "fail" else pends).append(pr[1])
    r = check_report(ticket)
    if r:
        fails.append(r)
    status = "fail" if fails else ("pending" if pends else "ok")
    return status, fails + pends, ticket


def get_pane(pane_id):
    res = tw.herdr("pane", "get", pane_id)
    return (res or {}).get("pane")


def contract_path(pane_id):
    return os.path.join(tw.STATE, "verify", f"{tw.safe_name(pane_id)}.json")


def internal_path(pane_id):
    return os.path.join(tw.STATE, "verify-internal", f"{tw.safe_name(pane_id)}.json")


def badge_text(status, reasons):
    if status == "ok":
        return "✓"
    mark = {"fail": "✗", "fail2": "✗✗", "pending": "⏳"}[status]
    return f"{mark} {reasons[0]}"[:60] if reasons else mark


def record(pane_id, ticket, status, reasons, nudges):
    tw.write_json(contract_path(pane_id), {
        "pane_id": pane_id, "ticket": ticket, "status": status,
        "reasons": reasons, "nudges": nudges, "checked_at": tw.now_iso()})


def is_main(pane_id):
    """True for a pane marked main in any space, or that dispatched a ticket."""
    import glob
    for f in glob.glob(os.path.join(tw.STATE, "main-pane.*")):
        try:
            if open(f).read().strip() == pane_id:
                return True
        except Exception:
            pass
    for f in glob.glob(os.path.join(tw.STATE, "dispatch", "by-pane", "*.json")):
        if (tw.read_json(f, {}) or {}).get("dispatcher") == pane_id:
            return True
    return False


def in_scope(pane_id):
    gate = os.path.join(tw.STATE, "verify.only-panes")
    if not os.path.exists(gate):
        return not is_main(pane_id)
    try:
        return pane_id in open(gate).read().split()
    except Exception:
        return False


def on_event():
    ev = json.loads(os.environ.get("HERDR_PLUGIN_EVENT_JSON") or "{}")
    data = ev.get("data") or ev
    pane_id, status = data.get("pane_id"), data.get("agent_status")
    if not pane_id or not status:
        return
    tw.ensure_dirs("verify", "verify-internal")
    ipath = internal_path(pane_id)
    lock = open(ipath + ".lock", "a")
    fcntl.flock(lock, fcntl.LOCK_EX)
    try:
        internal = tw.read_json(ipath, {}) or {}
        last = internal.get("last_status")
        internal["last_status"] = status
        tw.write_json(ipath, internal)
        if status != "done":
            # Work resumed: an old ✓/✗ no longer describes the pane.
            if status == "working" and internal.get("badged"):
                tw.clear_badge(pane_id, tw.SRC_VERIFY, TOKEN)
                internal["badged"] = False
                tw.write_json(ipath, internal)
            return
        if last == "done" or not in_scope(pane_id):
            return  # repeat done (debounce), or outside the safety gate
        pane = get_pane(pane_id)
        if not pane:
            return
        agent = pane.get("agent") or data.get("agent")
        result, reasons, ticket = verify(pane)

        prev = tw.read_json(contract_path(pane_id), {}) or {}
        nudges = prev.get("nudges", 0) if prev.get("ticket") == ticket else 0
        if internal.get("ticket") != ticket:
            internal["escalated"] = False
        internal["ticket"] = ticket

        if result == "fail":
            if nudges < MAX_NUDGES:
                text = f"You reported done, but: {'; '.join(reasons)}. Fix it or explain why it is fine."
                ok, err = tw.herdr_ok("agent", "prompt", pane_id, text)
                # A nudge that cannot land (agent blocked, not promptable) still
                # counts: the cap is what guarantees escalation to main.
                nudges += 1
                tw.log(LOG, f"{pane_id} nudge {nudges} {'sent' if ok else 'FAILED ' + err}")
            else:
                result = "fail2"
                if not internal.get("escalated"):
                    tag = ticket or tw.tag_for(pane_id)
                    where = tw.tell_main(tag, (
                        f"[thoven verify] {ticket or 'no ticket'} pane {pane_id} reported done "
                        f"{MAX_NUDGES + 1} times and still: {'; '.join(reasons)}. "
                        f"Nudged {MAX_NUDGES}x; needs you."), pane_id)
                    internal["escalated"] = True
                    tw.log(LOG, f"{pane_id} escalated -> {where}")
        tw.set_badge(pane_id, tw.SRC_VERIFY, TOKEN, agent, badge_text(result, reasons))
        internal["badged"] = True
        tw.write_json(ipath, internal)
        record(pane_id, ticket, result, reasons, nudges)
        tw.log(LOG, f"{pane_id} {ticket} {result} nudges={nudges} {reasons}")
    finally:
        fcntl.flock(lock, fcntl.LOCK_UN)
        lock.close()


def on_manual():
    ctx = json.loads(os.environ.get("HERDR_PLUGIN_CONTEXT_JSON") or "{}")
    pane_id = os.environ.get("TW_PANE") or ctx.get("focused_pane_id") or os.environ.get("HERDR_PANE_ID")
    if not pane_id:
        tw.notify("verify: no focused pane")
        return
    tw.ensure_dirs("verify", "verify-internal")
    pane = get_pane(pane_id)
    if not pane:
        tw.notify("verify: pane not found", pane_id)
        return
    result, reasons, ticket = verify(pane)
    prev = tw.read_json(contract_path(pane_id), {}) or {}
    nudges = prev.get("nudges", 0) if prev.get("ticket") == ticket else 0
    record(pane_id, ticket, result, reasons, nudges)
    text = badge_text(result, reasons)
    tw.set_badge(pane_id, tw.SRC_VERIFY, TOKEN, pane.get("agent"), text)
    internal = tw.read_json(internal_path(pane_id), {}) or {}
    internal["badged"] = True
    tw.write_json(internal_path(pane_id), internal)
    title = f"{text.split(' ')[0]} {ticket or pane_id}: " + (
        "verified" if result == "ok" else result)
    tw.notify(title, "\n".join(reasons) or "all checks passed",
              None if result == "ok" else "request")
    print(json.dumps({"pane_id": pane_id, "ticket": ticket, "status": result, "reasons": reasons}))
    tw.log(LOG, f"{pane_id} manual {ticket} {result} {reasons}")


def main():
    try:
        if "--manual" in sys.argv:
            on_manual()
        else:
            on_event()
    except Exception as e:  # never crash the hook
        import traceback
        tw.log(LOG, f"ERROR {e!r} {traceback.format_exc(limit=3)!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
