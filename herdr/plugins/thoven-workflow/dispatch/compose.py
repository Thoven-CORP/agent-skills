#!/usr/bin/env python3
"""Launch arguments and the self-brief for a dispatched pane.

Both are read at runtime from the installed dispatch-work skill, so the skill stays the one
source of truth:
  launch flags  <skill>/references/agents.md, table "Launch lines"
  STANDING and REPORT  <skill>/references/brief.md, the fenced brief block

  compose.py flags <cli>          NUL-separated argv after `--` for `herdr agent start`
  compose.py brief <cli> <json>   the self-brief text; <json> carries ticket/where/main fields
"""
import json
import os
import re
import shlex
import sys

SKILL_REFS = os.environ.get(
    "TW_DISPATCH_SKILL_REFS", os.path.expanduser("~/.agents/skills/dispatch-work/references")
)

# One row per CLI the picker offers. The model id fills agents.md's `<id>`; `fallback` is used only
# when agents.md cannot be read or its row cannot be parsed, and mirrors agents.md as of THV-1047.
CLIS = {
    "claude": {
        "label": "Claude Opus 5.5 high",
        "row": "Claude Code",
        "kind": "claude",
        "model": "claude-opus-5-5",
        "skill_prefix": "/",
        "fallback": "--model <id> --effort high --dangerously-skip-permissions",
    },
    "codex": {
        "label": "Codex gpt-6-sol high",
        "row": "Codex CLI",
        "kind": "codex",
        "model": "gpt-6-sol",
        "skill_prefix": "$",
        "fallback": '-m <id> -c model_reasoning_effort="high" --dangerously-bypass-approvals-and-sandbox',
    },
    "devin": {
        "label": "Devin swe-2-high",
        "row": "Devin",
        "kind": "devin",
        "model": "swe-2-high",
        "skill_prefix": "/",
        "fallback": "--model swe-2-high --permission-mode dangerous",
    },
}


def read(name):
    with open(os.path.join(SKILL_REFS, name), encoding="utf-8") as f:
        return f.read()


def launch_args(cli):
    spec = CLIS[cli]
    source = "agents.md"
    raw = None
    try:
        for line in read("agents.md").splitlines():
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 3 and cells[0] == spec["row"] and cells[1].strip("`") == spec["kind"]:
                raw = cells[2].strip().strip("`")
                break
    except OSError:
        pass
    if not raw:
        raw, source = spec["fallback"], "built-in fallback (agents.md row not found)"
    return shlex.split(raw.replace("<id>", spec["model"])), source


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
    spec = CLIS[cli]
    t = ctx["ticket"]
    main = ctx.get("main_pane") or ""
    inbox_file = ctx["inbox_file"]
    if main:
        send = f'~/.local/bin/herdr agent prompt {main} "$(cat <file>)" (write the message to a temp file first, delete it after)'
    else:
        send = f"writing it to {inbox_file} (no dispatcher pane and no space main at dispatch)"
    sibling = ctx.get("sibling") or "none"
    script = label_script()
    kinds = "plan -> Plan, build -> Build, design -> Design, review -> Review"
    if script:
        label_cmd = f'bash {script} {ctx.get("pane") or "$HERDR_PANE_ID"} <Kind> "<ticket title>" {t} --tab   ({kinds})'
    else:
        label_cmd = f"(label.sh not found; skip labelling and say so in your MODE message)"
    # First line carries the task: Devin drops a prompt whose first line is only a slash command.
    head = f"{spec['skill_prefix']}poteto-mode {t}: read the ticket and all its comments in Linear, pick a mode, label your tab, tell the dispatcher, then work."
    body = f"""
TICKET     {t}  {ctx.get('url') or 'https://linear.app/thoven/issue/' + t}
WHERE      Repo {ctx['path']} ({ctx['repo']}), branch {ctx['branch']}, base {ctx['base']}.
           Sibling pane on this ticket: {sibling}.
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
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "flags" and len(sys.argv) == 3 and sys.argv[2] in CLIS:
        args, source = launch_args(sys.argv[2])
        sys.stderr.write(f"compose: launch flags from {source}\n")
        sys.stdout.write("\0".join(args) + "\0")
    elif cmd == "brief" and len(sys.argv) == 4 and sys.argv[2] in CLIS:
        sys.stdout.write(brief(sys.argv[2], json.loads(sys.argv[3])))
    elif cmd == "meta" and len(sys.argv) == 3 and sys.argv[2] in CLIS:
        s = CLIS[sys.argv[2]]
        print(f"{s['kind']}\t{s['label']}\t{s['model']}")
    else:
        sys.stderr.write("usage: compose.py flags|meta <claude|codex|devin> | brief <cli> <json>\n")
        sys.exit(2)


if __name__ == "__main__":
    main()
