#!/usr/bin/env python3
"""Launch arguments and the self-brief for a dispatched pane.

Both come from the dispatch-work skill at runtime, so nothing here names a model:
  CLI, model, effort, launch flags  agents.py over config/agents.toml (THV-1077)
  STANDING and REPORT               <skill>/references/brief.md, the fenced brief block

  compose.py flags <cli> <model> [effort]   NUL-separated argv after `--` for `herdr agent start`
  compose.py meta <cli> <model> [effort]    kind, label, model (TSV)
  compose.py brief <cli> <json>             the self-brief text; <json> carries ticket/where/main fields
"""
import json
import os
import re
import sys

SKILL_REFS = os.environ.get(
    "TW_DISPATCH_SKILL_REFS", os.path.expanduser("~/.agents/skills/dispatch-work/references")
)

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


def read(name):
    with open(os.path.join(SKILL_REFS, name), encoding="utf-8") as f:
        return f.read()


def brief_block():
    """The fenced text block of brief.md, or None."""
    m = re.search(r"```text\n(.*?)\n```", read("brief.md"), re.S)
    return m.group(1) if m else None


def standing_and_report(ticket, main_pane, inbox_file):
    try:
        block = brief_block()
    except OSError:
        block = None
    if not block or "\nSTANDING" not in block:
        return f"(STANDING and REPORT unavailable: could not read {SKILL_REFS}/brief.md)"
    tail = block[block.index("\nSTANDING") + 1 :]
    tail = tail.replace("THV-<id>", ticket)
    if main_pane:
        tail = tail.replace("{{MAIN_PANE}}", main_pane)
    else:
        # No dispatcher and no space main: the report goes to the inbox file tw_tell_main also uses.
        tail = re.sub(
            r"with\s+\S*herdr agent prompt \{\{MAIN_PANE\}\} and the message as one quoted argument\.",
            f"by writing it to {inbox_file} (no dispatcher pane and no space main at dispatch).",
            tail,
        )
        tail = tail.replace("{{MAIN_PANE}}", f"(no main pane; write to {inbox_file})")
    return tail


def label_script():
    """label.sh from the checkout this plugin is linked from, else the installed skill (THV-1064)."""
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (
        os.path.normpath(os.path.join(here, "..", "..", "..", "..", "skills", "dev", "dispatch-work", "scripts", "label.sh")),
        os.path.expanduser("~/.agents/skills/dispatch-work/scripts/label.sh"),
    ):
        if os.path.exists(path):
            return path
    return None


def brief(cli, ctx):
    ag = agents()
    prefix = ag.cli_spec(ag.load(), cli).get("skill_prefix", "/")
    t = ctx["ticket"]
    main = ctx.get("main_pane") or ""
    inbox_file = ctx["inbox_file"]
    if main:
        send = f'~/.local/bin/herdr agent prompt {main} "$(cat <file>)" (write the message to a temp file first, delete it after)'
    else:
        send = f"writing it to {inbox_file} (no dispatcher pane and no space main at dispatch)"
    other = ctx.get("other_repo") or ""
    where_other = (
        f"\n           Also yours: {other}. Work across both repos from this pane and commit in each"
        "\n           repo by exact path."
        if other else ""
    )
    script = label_script()
    kinds = "plan -> Plan, build -> Build, design -> Design, review -> Review"
    if script:
        label_cmd = f'bash {script} {ctx.get("pane") or "$HERDR_PANE_ID"} <Kind> "<ticket title>" {t} --tab   ({kinds})'
    else:
        label_cmd = f"(label.sh not found; skip labelling and say so in your MODE message)"
    # First line carries the task: Devin drops a prompt whose first line is only a slash command.
    head = f"{prefix}poteto-mode {t}: read the ticket and all its comments in Linear, pick a mode, label your tab, tell the dispatcher, then work."
    body = f"""
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
           Then send the dispatcher ONE screen, by {send}:
             MODE <mode> {t}
             WHY <two lines>
             FIRST STEPS <three to five bullets>
           Then continue without waiting. If you cannot choose with confidence, send
           "NEEDS_CONTEXT {t}" with your question the same way, and wait for the answer.
"""
    return head + "\n" + body + "\n" + standing_and_report(t, main, inbox_file) + "\n"


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
    else:
        sys.stderr.write("usage: compose.py flags|meta <cli> <model> [effort] | brief <cli> <json>\n")
        sys.exit(2)


if __name__ == "__main__":
    main()
