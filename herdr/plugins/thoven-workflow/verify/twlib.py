"""Shared Python helpers for thoven.workflow (verify/ and watchdog/).

Mirrors lib/common.sh: the same state dir, main-pane file and inbox, so bash and
Python modules read and write the same places. Nothing here raises on a herdr or
ps failure; callers get None / {} and decide.
"""
import datetime
import json
import os
import re
import subprocess

STATE = os.environ.get("HERDR_PLUGIN_STATE_DIR") or os.path.expanduser(
    "~/.local/state/herdr/plugins/thoven.workflow")
HERDR = os.environ.get("HERDR_BIN_PATH") or "herdr"
INBOX = os.path.join(os.environ.get("TMPDIR") or "/tmp", "dispatch", "out")

# Badge source ids. Each module owns its own metadata source so clearing one
# never wipes the other's token.
SRC_VERIFY = "thoven.workflow:verify"
SRC_WATCHDOG = "thoven.workflow:watchdog"


def now_iso():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def ensure_dirs(*subdirs):
    for d in (STATE, INBOX) + tuple(os.path.join(STATE, s) for s in subdirs):
        os.makedirs(d, exist_ok=True)


def log(name, msg):
    try:
        os.makedirs(STATE, exist_ok=True)
        with open(os.path.join(STATE, name), "a") as f:
            f.write(f"{now_iso()} {msg}\n")
    except Exception:
        pass


def run(argv, cwd=None, timeout=20):
    """(returncode, stdout, stderr); never raises."""
    try:
        p = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, p.stdout, p.stderr
    except Exception as e:  # missing binary, timeout, bad cwd
        return 127, "", str(e)


def herdr(*args, timeout=15):
    """Run a herdr CLI command; return parsed .result (dict) or None."""
    rc, out, _ = run([HERDR, *args], timeout=timeout)
    if rc != 0:
        return None
    try:
        return json.loads(out).get("result")
    except Exception:
        return {}


def herdr_ok(*args, timeout=15):
    rc, _, err = run([HERDR, *args], timeout=timeout)
    return rc == 0, err.strip()


def read_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return default


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.{os.getpid()}.tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1)
    os.replace(tmp, path)


def safe_name(pane_id):
    """Filename-safe pane id. herdr ids look like w18:p8V; ':' is legal on
    macOS/Linux, so the contract keeps the raw id. Only '/' is replaced."""
    return pane_id.replace("/", "_")


def tag_for(pane_id):
    return re.sub(r"[^A-Za-z0-9._-]", "-", pane_id)


def notify(title, body=None, sound=None):
    args = ["notification", "show", title]
    if body:
        args += ["--body", body[:400]]
    if sound:
        args += ["--sound", sound]
    return herdr_ok(*args)


def main_pane():
    try:
        with open(os.path.join(STATE, "main-pane")) as f:
            return f.read().strip() or None
    except Exception:
        return None


def tell_main(tag, text):
    """Python twin of tw_tell_main: prompt the main pane, else drop the text in
    the inbox and toast. Returns 'main' or the inbox path."""
    main = main_pane()
    if main:
        ok, _ = herdr_ok("agent", "prompt", main, text)
        if ok:
            return "main"
    os.makedirs(INBOX, exist_ok=True)
    path = os.path.join(INBOX, f"{tag}.md")
    with open(path, "w") as f:
        f.write(text + "\n")
    notify("thoven: main unreachable", f"Report saved to {path}", "request")
    return path


# ---------------------------------------------------------------- badges
#
# Why display_agent and not a $token: herdr-radar owns [ui.sidebar.agents] rows,
# and a pane token only renders when a row references it. Radar's rows reference
# only radar's own tokens ($title_*, $logo, ...), so a `tw_*` token would be
# stored but never drawn. `display_agent` is a presentation field herdr draws on
# split-pane borders (ui.show_agent_labels_on_pane_borders = true in this config)
# and in the Goto picker. Radar reads display_agent only when it is exactly a
# vendor key it has a logo for ("claude", "glm", ...); "claude ✗ dirty tree" is
# not, so radar ignores it and keeps its row. It is source-scoped, so clearing
# our source restores the native label, and it never renames the pane.
# We also set a `tw_verify` / `tw_watchdog` token so the board, or a future
# sidebar row, can read the same value.

def set_badge(pane_id, source, token, agent, text):
    args = ["pane", "report-metadata", pane_id, "--source", source,
            "--token", f"{token}={text}"]
    if agent:
        args += ["--agent", agent, "--display-agent", f"{agent} {text}"[:80]]
    return herdr_ok(*args)


def clear_badge(pane_id, source, token):
    return herdr_ok("pane", "report-metadata", pane_id, "--source", source,
                    "--clear-display-agent", "--clear-token", token)


# ---------------------------------------------------------------- processes

def ps_snapshot():
    """{pid: {ppid, pgid, cpu, cmd}} for every live process (zombies dropped:
    a <defunct> entry is an unreaped exit status, not running work)."""
    rc, out, _ = run(["ps", "-axo", "pid=,ppid=,pgid=,pcpu=,stat=,command="], timeout=10)
    procs = {}
    if rc != 0:
        return procs
    for line in out.splitlines():
        parts = line.split(None, 5)
        if len(parts) < 5 or parts[4].startswith("Z"):
            continue
        try:
            pid, ppid, pgid = int(parts[0]), int(parts[1]), int(parts[2])
            cpu = float(parts[3])
        except ValueError:
            continue
        procs[pid] = {"pid": pid, "ppid": ppid, "pgid": pgid, "cpu": cpu,
                      "cmd": parts[5].strip() if len(parts) > 5 else ""}
    return procs


def descendants(procs, root):
    """All descendants of root (not root itself), breadth-first."""
    kids = {}
    for p in procs.values():
        kids.setdefault(p["ppid"], []).append(p["pid"])
    out, queue = [], list(kids.get(root, []))
    while queue:
        pid = queue.pop(0)
        if pid in procs:
            out.append(procs[pid])
            queue.extend(kids.get(pid, []))
    return out


def pane_procs(pane_id, has_agent=True):
    """(shell_pid, agent_pid) for a pane, from `pane process-info`.

    The agent is the foreground process-group leader when the pane hosts an agent
    (herdr puts the agent and the MCP servers it spawns in that group). A pane
    without an agent has no agent pid: its foreground job is ordinary work."""
    res = herdr("pane", "process-info", "--pane", pane_id)
    info = (res or {}).get("process_info") or {}
    shell = info.get("shell_pid")
    fg = info.get("foreground_process_group_id")
    agent = fg if (has_agent and fg and fg != shell) else None
    return shell, agent


def proc_start(pid):
    rc, out, _ = run(["ps", "-p", str(pid), "-o", "lstart="], timeout=5)
    return out.strip() if rc == 0 else ""


def short_cmd(cmd, n=40):
    """`node /long/path/next dev` -> `next dev`; keeps reason strings short."""
    parts = cmd.split()
    if not parts:
        return cmd
    words = [os.path.basename(w) if "/" in w else w for w in parts]
    if words[0] in ("node", "python", "python3", "ruby", "bash", "sh", "zsh", "npm",
                    "npx", "pnpm", "bun", "Python") and len(words) > 1:
        words = words[1:]
        if words[0] == "-c" and len(words) > 1:
            words = words[1:]
    return " ".join(words)[:n]
