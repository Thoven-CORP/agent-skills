"""The agent's process tree: CPU for the FROZEN gate and leftover work for the LIVE_WORK gate.

Ported from herdr/plugins/thoven-workflow/verify/done_verifier.py check_processes. A Claude agent
puts its MCP servers, language servers and caffeinate in its own process group, so they live as
long as it does and are never work. Each Bash-tool call runs in its own `zsh -c source
.../shell-snapshots/...` group; one still alive when the agent settles is a background shell.
"""
from __future__ import annotations

import os
import re

from .runner import Runner

INFRA_RE = re.compile(
    r"(^|/)(caffeinate|herdr|rex|ps|ugrep)( |$)|mcp|language-server|(^|[/ -])lsp|gopls|"
    r"rust-analyzer|pyright|tsserver|sourcekit|statusline|herdr-agent-usage", re.I)
CODEX_INFRA_RE = re.compile(
    r"^(?:\S*/)?(?:node_repl|codex-code-mode-host)(?:\s|$)|"
    r"^(?:\S*/)?codex\s+app-server(?:\s|$)|"
    r"^(?:\S*/)?node\s+\S*/@oai/cua-repl/bin/cua-repl\.mjs(?:\s|$)")
WRAPPER_RE = re.compile(r"/shell-snapshots/|^(/bin/)?(ba|z)?sh -c ")
# A live_work name for an ssh session to the Mac mini, where a pane's heavy runs go: its CPU is remote.
MINI_SSH_RE = re.compile(r"^(?:auto)?ssh\s+(?:\S+@)?\S*\bmini\b", re.I)
SSH_ARG_FLAGS = set("BbcDEeFIiJLlmOopQRSWw")


def snapshot(run: Runner) -> dict[int, dict]:
    """{pid: {pid, ppid, pgid, cpu, cmd}}; zombies dropped, since a <defunct> entry is not running."""
    res = run(["ps", "-axo", "pid=,ppid=,pgid=,pcpu=,stat=,command="], timeout=10)
    procs = {}
    if not res.ok:
        return procs
    for line in res.out.splitlines():
        parts = line.split(None, 5)
        if len(parts) < 5 or parts[4].startswith("Z"):
            continue
        try:
            pid, ppid, pgid, cpu = int(parts[0]), int(parts[1]), int(parts[2]), float(parts[3])
        except ValueError:
            continue
        procs[pid] = {"pid": pid, "ppid": ppid, "pgid": pgid, "cpu": cpu,
                      "cmd": parts[5].strip() if len(parts) > 5 else ""}
    return procs


def descendants(procs: dict[int, dict], root: int) -> list[dict]:
    kids: dict[int, list[int]] = {}
    for p in procs.values():
        kids.setdefault(p["ppid"], []).append(p["pid"])
    out, queue = [], list(kids.get(root, []))
    while queue:
        pid = queue.pop(0)
        if pid in procs:
            out.append(procs[pid])
            queue.extend(kids.get(pid, []))
    return out


def short_cmd(cmd: str, n: int = 40) -> str:
    words = [os.path.basename(w) if "/" in w else w for w in cmd.split()]
    if not words:
        return cmd
    if words[0] in ("node", "python", "python3", "ruby", "bash", "sh", "zsh", "npm", "npx", "pnpm",
                    "bun", "Python") and len(words) > 1:
        words = words[1:]
        if words[0] == "-c" and len(words) > 1:
            words = words[1:]
    if words[0] in ("ssh", "autossh"):
        words = _ssh_without_options(words)
    return " ".join(words)[:n]


def _ssh_without_options(words: list[str]) -> list[str]:
    """ssh's options dropped, so the 40-character name still holds the destination."""
    i = 1
    while i < len(words) and words[i].startswith("-"):
        flag, i = words[i], i + 1
        if len(flag) == 2 and flag[1] in SSH_ARG_FLAGS:
            i += 1
    return words[:1] + words[i:]


def mini_ssh(names: list[str]) -> list[str]:
    """The live_work names that are an ssh session to the Mac mini."""
    return [n for n in names if MINI_SSH_RE.search(n)]


def tree_cpu(procs: dict[int, dict], agent: int) -> float | None:
    if agent not in procs:
        return None
    tree = [procs[agent]] + descendants(procs, agent)
    return round(sum(p["cpu"] for p in tree if p["pid"] == agent or not INFRA_RE.search(p["cmd"])), 1)


def live_work(procs: dict[int, dict], agent: int) -> list[str]:
    """One "<cmd> (pid N)" per process group of leftover work under the agent."""
    if agent not in procs:
        return []
    agent_pgid = procs[agent]["pgid"]
    work = [p for p in descendants(procs, agent)
            if p["pgid"] != agent_pgid
            and not p["cmd"].startswith("(")
            and not INFRA_RE.search(p["cmd"])
            and not CODEX_INFRA_RE.search(p["cmd"])]
    groups: dict[int, list[dict]] = {}
    for p in work:
        groups.setdefault(p["pgid"], []).append(p)
    names = []
    for members in groups.values():
        real = [m for m in members if not WRAPPER_RE.search(m["cmd"])] or members
        pick = real[-1]
        names.append(f"{short_cmd(pick['cmd'], 40)} (pid {pick['pid']})")
    return names
