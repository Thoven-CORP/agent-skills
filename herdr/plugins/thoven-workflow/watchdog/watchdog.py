#!/usr/bin/env python3
"""cpu-watchdog: flag panes whose process tree pins the CPU, and kill the hot child.

  --ensure-daemon  start the detached sweep loop unless it is already running.
  --kill-hot       (prefix+k) kill the recorded hot child of the focused pane.
  --sweep-loop     internal: the loop itself (what --ensure-daemon spawns).

Every INTERVAL s the loop sums %CPU over each pane's whole process tree (root =
the pane shell from `pane process-info`). At >= THRESHOLD for >= WINDOW s
continuously it flags the pane once per episode: a notification (sound request),
a badge, and the hottest descendant that is neither the agent nor the pane shell
recorded as the kill target in $STATE/watchdog/<pane_id>.json. Dropping below
THRESHOLD clears the flag, the badge and the target.

Env overrides (tests only; defaults are the real policy):
  TW_WATCHDOG_THRESHOLD=90  TW_WATCHDOG_WINDOW=180  TW_WATCHDOG_INTERVAL=15
  TW_WATCHDOG_ONLY="w55:p1 w55:p2"  restrict the sweep to these pane ids.
"""
import json
import os
import signal
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "verify"))
import twlib as tw  # noqa: E402

THRESHOLD = float(os.environ.get("TW_WATCHDOG_THRESHOLD", "90"))
WINDOW = float(os.environ.get("TW_WATCHDOG_WINDOW", "180"))
INTERVAL = float(os.environ.get("TW_WATCHDOG_INTERVAL", "15"))
ONLY = set(os.environ.get("TW_WATCHDOG_ONLY", "").split())
TOKEN = "tw_watchdog"
LOG = "watchdog.log"
PIDFILE = os.path.join(tw.STATE, "watchdog.pid")


def record_path(pane_id):
    return os.path.join(tw.STATE, "watchdog", f"{tw.safe_name(pane_id)}.json")


# ------------------------------------------------------------------ daemon

def daemon_pid():
    """The live daemon's pid, or None. Checks the command line so a recycled pid
    is not mistaken for the daemon."""
    try:
        pid = int(open(PIDFILE).read().strip())
        os.kill(pid, 0)
    except Exception:
        return None
    rc, out, _ = tw.run(["ps", "-p", str(pid), "-o", "command="], timeout=5)
    return pid if rc == 0 and "watchdog.py" in out and "--sweep-loop" in out else None


def ensure_daemon():
    tw.ensure_dirs("watchdog")
    pid = daemon_pid()
    if pid:
        print(f"watchdog already running: pid {pid}")
        return
    # Double fork + setsid: the loop must outlive this one-shot hook and must not
    # sit in herdr's process group.
    child = os.fork()
    if child > 0:
        os.waitpid(child, 0)
        time.sleep(0.5)
        print(f"watchdog started: pid {daemon_pid()}")
        return
    os.setsid()
    if os.fork() > 0:
        os._exit(0)
    devnull = os.open(os.devnull, os.O_RDWR)
    logfd = os.open(os.path.join(tw.STATE, LOG), os.O_WRONLY | os.O_CREAT | os.O_APPEND)
    os.dup2(devnull, 0)
    os.dup2(logfd, 1)
    os.dup2(logfd, 2)
    os.execv(sys.executable, [sys.executable, os.path.abspath(__file__), "--sweep-loop"])


def socket_gone():
    sock = os.environ.get("HERDR_SOCKET_PATH")
    return bool(sock) and not os.path.exists(sock)


def sweep_loop():
    with open(PIDFILE, "w") as f:
        f.write(str(os.getpid()))
    tw.log(LOG, f"daemon up pid={os.getpid()} threshold={THRESHOLD} window={WINDOW} "
                f"interval={INTERVAL} only={sorted(ONLY) or 'all'}")
    stop = []
    signal.signal(signal.SIGTERM, lambda *_: stop.append(1))
    hot_since, failures = {}, 0
    while not stop:
        if socket_gone():
            tw.log(LOG, "herdr socket gone; exiting")
            break
        res = tw.herdr("pane", "list")
        if res is None:
            failures += 1
            if failures >= 3:
                tw.log(LOG, "herdr unreachable 3 sweeps in a row; exiting")
                break
        else:
            failures = 0
            try:
                sweep(res.get("panes") or [], hot_since)
            except Exception as e:
                tw.log(LOG, f"sweep error {e!r}")
        time.sleep(INTERVAL)
    try:
        if open(PIDFILE).read().strip() == str(os.getpid()):
            os.remove(PIDFILE)
    except Exception:
        pass
    tw.log(LOG, "daemon down")


def sweep(panes, hot_since):
    procs = tw.ps_snapshot()
    now = time.time()
    live = set()
    for pane in panes:
        pane_id = pane.get("pane_id")
        if not pane_id or (ONLY and pane_id not in ONLY):
            continue
        live.add(pane_id)
        agent_label = pane.get("agent")
        shell, agent = tw.pane_procs(pane_id, bool(agent_label))
        if not shell or shell not in procs:
            continue
        tree = [procs[shell]] + tw.descendants(procs, shell)
        total = round(sum(p["cpu"] for p in tree), 1)
        path = record_path(pane_id)
        rec = tw.read_json(path, {}) or {}
        if total < THRESHOLD:
            hot_since.pop(pane_id, None)
            if rec.get("flagged"):
                tw.clear_badge(pane_id, tw.SRC_WATCHDOG, TOKEN)
                tw.write_json(path, {"pane_id": pane_id, "status": "ok", "flagged": False,
                                     "cpu": total, "target": None, "checked_at": tw.now_iso()})
                tw.log(LOG, f"{pane_id} cleared cpu={total}")
            continue
        start = hot_since.setdefault(pane_id, now)
        if now - start < WINDOW:
            continue
        # Kill target: hottest descendant that is not the agent or the shell.
        candidates = [p for p in tree if p["pid"] not in (shell, agent)]
        if not candidates:
            continue
        hot = max(candidates, key=lambda p: p["cpu"])
        minutes = max(1, round((now - start) / 60))
        target = {"pid": hot["pid"], "cmd": hot["cmd"][:200], "cpu": hot["cpu"],
                  "lstart": tw.proc_start(hot["pid"])}
        first = not rec.get("flagged")
        tw.write_json(path, {
            "pane_id": pane_id, "status": "hot", "flagged": True, "cpu": total,
            "since": rec.get("since") if not first else
            time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime(start)),
            "flagged_at": rec.get("flagged_at") if not first else tw.now_iso(),
            "shell_pid": shell, "agent_pid": agent, "target": target,
            "checked_at": tw.now_iso()})
        if first:
            label = pane_label(pane)
            msg = f"{label}: {tw.short_cmd(hot['cmd'], 40)} pid {hot['pid']} pinned {minutes}m"
            tw.notify(msg, f"tree {total}% CPU. prefix+k kills pid {hot['pid']}.", "request")
            tw.set_badge(pane_id, tw.SRC_WATCHDOG, TOKEN, agent_label,
                         f"🔥 {tw.short_cmd(hot['cmd'], 24)} {int(total)}%")
            tw.log(LOG, f"{pane_id} FLAG {msg} tree={total}")
    for gone in set(hot_since) - live:
        hot_since.pop(gone, None)


def pane_label(pane):
    ws = tw.herdr("workspace", "get", pane.get("workspace_id", "")) or {}
    wl = (ws.get("workspace") or {}).get("label")
    return f"{wl} {pane['pane_id']}" if wl else pane["pane_id"]


# ------------------------------------------------------------------ kill-hot

def alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    # A zombie still answers kill(0); it is dead for our purposes.
    rc, out, _ = tw.run(["ps", "-p", str(pid), "-o", "stat="], timeout=5)
    return rc == 0 and out.strip() != "" and not out.strip().startswith("Z")


def kill_hot():
    ctx = json.loads(os.environ.get("HERDR_PLUGIN_CONTEXT_JSON") or "{}")
    pane_id = os.environ.get("TW_PANE") or ctx.get("focused_pane_id") or os.environ.get("HERDR_PANE_ID")

    def done(msg):
        tw.notify(f"kill-hot: {msg}")
        tw.log(LOG, f"kill-hot {pane_id}: {msg}")
        print(msg)

    if not pane_id:
        return done("no focused pane")
    path = record_path(pane_id)
    rec = tw.read_json(path, {}) or {}
    target = rec.get("target") or {}
    pid = target.get("pid")
    if not pid:
        return done(f"refused, no hot child recorded for {pane_id}")
    pane = (tw.herdr("pane", "get", pane_id) or {}).get("pane") or {}
    shell, agent = tw.pane_procs(pane_id, bool(pane.get("agent")))
    if pid in (shell, agent, rec.get("shell_pid"), rec.get("agent_pid")):
        return done(f"refused, pid {pid} is the {'pane shell' if pid in (shell, rec.get('shell_pid')) else 'agent'}")
    procs = tw.ps_snapshot()
    if not shell or pid not in {p["pid"] for p in tw.descendants(procs, shell)}:
        return done(f"refused, pid {pid} is no longer in {pane_id}'s tree")
    if target.get("lstart") and tw.proc_start(pid) != target["lstart"]:
        return done(f"refused, pid {pid} was recycled")
    # Signals only. Never send input to the frozen pane.
    os.kill(pid, signal.SIGTERM)
    how = "SIGTERM"
    for _ in range(30):
        if not alive(pid):
            break
        time.sleep(0.1)
    else:
        os.kill(pid, signal.SIGKILL)
        how = "SIGKILL after 3s"
        time.sleep(0.2)
    rec["target"] = None
    tw.write_json(path, rec)
    done(f"killed {tw.short_cmd(target.get('cmd', ''), 40)} pid {pid} ({how})"
         + ("" if not alive(pid) else ", STILL ALIVE"))


def main():
    try:
        if "--sweep-loop" in sys.argv:
            sweep_loop()
        elif "--kill-hot" in sys.argv:
            kill_hot()
        else:
            ensure_daemon()
    except Exception as e:
        tw.log(LOG, f"ERROR {e!r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
