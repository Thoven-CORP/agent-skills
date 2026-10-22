#!/usr/bin/env python3
"""Launch arguments and the self-brief for a dispatched pane.

Both come from the dispatch-work skill at runtime, so nothing here names a model:
  CLI, model, effort, launch flags  agents.py over config/agents.toml (THV-1077)
  STANDING, ASK, REPORT             <skill>/references/brief.md, the fenced brief block, filled with
                                    dispatch_lib's fill_brief; the pane reports with `dispatch post`
                                    and a peer message to main

  compose.py flags <cli> <model> [effort]   NUL-separated argv after `--` for `herdr agent start`
  compose.py meta <cli> <model> [effort]    kind, label, model (TSV)
  compose.py brief <cli> <json>             the self-brief text; <json> carries ticket, where, main_pane, workspace
  compose.py dispatch                       path of the dispatch-work `dispatch` CLI (exit 1 if none)
"""
import json
import os
import re
import subprocess
import sys


def agents():
    """agents.py from the checkout this plugin is linked from, else the installed skill."""
    import importlib.util
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (
        os.path.normpath(os.path.join(here, "..", "..", "..", "..", "skills", "dev", "dispatch-work", "scripts", "agents.py")),
        os.path.expanduser("~/.agents/skills/dispatch-work/scripts/agents.py"),
    ):
        if os.path.exists(path):
            spec = importlib.util.spec_from_file_location("agents", path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod
    sys.exit("compose: agents.py not found in the checkout or the installed dispatch-work skill")


def dispatch_script():
    """`dispatch` from the checkout this plugin is linked from, else the installed skill (THV-1064)."""
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (
        os.path.normpath(os.path.join(here, "..", "..", "..", "..", "skills", "dev", "dispatch-work", "scripts", "dispatch")),
        os.path.expanduser("~/.agents/skills/dispatch-work/scripts/dispatch"),
    ):
        if os.path.exists(path):
            return path
    return None


def dispatch_lib():
    """The dispatch_lib package beside `dispatch`, so the brief is filled and the board found the way spawn does it."""
    script = dispatch_script()
    if not script:
        sys.exit("compose: dispatch not found in the checkout or the installed dispatch-work skill")
    folder = os.path.dirname(os.path.realpath(script))
    if folder not in sys.path:
        sys.path.insert(0, folder)
    from dispatch_lib import cli, store
    return cli, store


def refs_dir():
    """brief.md from the same skill copy as the `dispatch` CLI, unless TW_DISPATCH_SKILL_REFS says otherwise."""
    script = dispatch_script()
    default = (os.path.join(os.path.dirname(os.path.dirname(script)), "references") if script
               else os.path.expanduser("~/.agents/skills/dispatch-work/references"))
    return os.environ.get("TW_DISPATCH_SKILL_REFS") or default


def brief_block():
    """The fenced text block of brief.md, or None."""
    with open(os.path.join(refs_dir(), "brief.md"), encoding="utf-8") as f:
        m = re.search(r"```text\n(.*?)\n```", f.read(), re.S)
    return m.group(1) if m else None


def herdr_json(*args):
    """.result of a herdr CLI call, or None."""
    try:
        p = subprocess.run([os.environ.get("HERDR_BIN_PATH") or "herdr", *args], capture_output=True, text=True,
                           timeout=15)
        return json.loads(p.stdout).get("result") if p.returncode == 0 else None
    except Exception:
        return None


def main_session(pane):
    """Peer name of the Claude session running in a herdr pane, or "". Claude writes
    sessions/<pid>.json, and herdr reports the agent as the pane's foreground group leader."""
    if not pane:
        return ""
    info = (herdr_json("pane", "process-info", "--pane", pane) or {}).get("process_info") or {}
    pid = info.get("foreground_process_group_id")
    if not pid:
        return ""
    cli, _ = dispatch_lib()
    return next((s["name"] for s in cli.claude_sessions(cli.sessions_dir())
                 if s.get("pid") == pid and s.get("name")), "")


def project_for(main, workspace):
    """The board's project: main's only registered project, else the slug of the herdr space label
    (one space per Linear Project), else "herdr"."""
    _, store = dispatch_lib()
    mine = {r.project for r in store.registrations() if main and r.main_name == main}
    if len(mine) == 1:
        return mine.pop()
    label = ((herdr_json("workspace", "get", workspace) or {}).get("workspace") or {}).get("label") if workspace else ""
    slug = re.sub(r"[^a-z0-9]+", "-", (label or "").lower()).strip("-")
    return slug or "herdr"


def standing_ask_report(ticket, fields):
    """STANDING to the end of brief.md's block (ASK, BUDGET, REPORT), filled like `dispatch spawn` fills it."""
    try:
        block = brief_block()
    except OSError:
        block = None
    if not block or "\nSTANDING" not in block:
        return f"(STANDING, ASK and REPORT unavailable: could not read {refs_dir()}/brief.md)"
    cli, _ = dispatch_lib()
    tail = cli.fill_brief(block[block.index("\nSTANDING") + 1 :].replace("THV-<id>", ticket), fields)
    left = sorted(set(re.findall(r"\{\{[^{}]*\}\}", tail)))
    if left:
        sys.exit(f"compose: brief.md has fields the herdr picker cannot fill: {', '.join(left)}")
    return tail


def brief(cli, ctx):
    ag = agents()
    prefix = ag.cli_spec(ag.load(), cli).get("skill_prefix", "/")
    t = ctx["ticket"]
    script = dispatch_script() or "dispatch"
    main = ctx["main_session"] if "main_session" in ctx else main_session(ctx.get("main_pane"))
    project = ctx.get("project") or project_for(main, ctx.get("workspace"))
    _, store = dispatch_lib()
    fields = {
        "AGENT_NAME": ctx.get("agent") or t.lower(),
        "MAIN_SESSION": main or ("(none: the dispatcher pane runs no named Claude session; skip every "
                                 "SendMessage and print the line in this pane)"),
        "PROJECT": project,
        "BOARD": store.board_md(project),
        "SNAPSHOT": store.snapshot_path(project, t),
    }
    other = ctx.get("other_repo") or ""
    where_other = (
        f"\n           Also yours: {other}. Work across both repos from this pane and commit in each"
        "\n           repo by exact path."
        if other else ""
    )
    kinds = "plan -> Plan, build -> Build, design -> Design, review -> Review"
    label_cmd = (f'$DISPATCH label --backend herdr {ctx.get("pane") or "$HERDR_PANE_ID"} <Kind> "<ticket title>" {t}'
                 f' --tab   ({kinds})')
    # First line carries the task: Devin drops a prompt whose first line is only a slash command.
    head = f"{prefix}poteto-mode {t}: read the ticket and all its comments in Linear, pick a mode, label your tab, tell main, then work."
    body = f"""
You are {fields["AGENT_NAME"]}. Main is the Claude session {fields["MAIN_SESSION"]}. Project board: {fields["BOARD"]}.
DISPATCH = {script}

TICKET     {t}  {ctx.get('url') or 'https://linear.app/thoven/issue/' + t}
WHERE      Repo {ctx['path']} ({ctx['repo']}), branch {ctx['branch']}, base {ctx['base']}.{where_other}
FIRST      Read {t} in full with the Linear tools, then read ALL of its comments, oldest to
           newest. A ruling in a comment binds and beats the description.
MODE       Choose one:
             plan    a multi-phase plan, when the ticket is too big for one session or undecided
             build   the feature, bug-fix or refactoring playbook, when the spec is decided
             design  prototype or building-components, when the ticket is a surface still shaped
             review  verify-this then code-review, when the work exists and needs judging
           Then label this tab with that mode:
             {label_cmd}
           Then SendMessage to {fields["MAIN_SESSION"]} ONE screen (Codex: print it in this pane):
             MODE <mode> {t}
             WHY <two lines>
             FIRST STEPS <three to five bullets>
           Then continue without waiting. If you cannot choose with confidence, ask as ASK says.
"""
    return head + "\n" + body + "\n" + standing_ask_report(t, fields) + "\n"


def main():
    cmd, args = (sys.argv[1], sys.argv[2:]) if len(sys.argv) > 1 else ("", [])
    if cmd in ("flags", "meta") and len(args) in (2, 3):
        ag = agents()
        cfg = ag.load()
        cli, model, effort = args[0], args[1], args[2] if len(args) == 3 else ""
        if cmd == "flags":
            sys.stdout.write("\0".join(ag.launch(cfg, cli, model, effort)) + "\0")
        else:
            print(f"{ag.cli_spec(cfg, cli)['kind']}\t{ag.label(cfg, cli, model, effort)}\t{model}")
    elif cmd == "brief" and len(args) == 2:
        sys.stdout.write(brief(args[0], json.loads(args[1])))
    elif cmd == "dispatch" and not args:
        script = dispatch_script()
        if not script:
            sys.exit("compose: dispatch not found in the checkout or the installed dispatch-work skill")
        print(script)
    else:
        sys.stderr.write("usage: compose.py flags|meta <cli> <model> [effort] | brief <cli> <json> | dispatch\n")
        sys.exit(2)


if __name__ == "__main__":
    main()
