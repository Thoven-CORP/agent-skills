#!/usr/bin/env python3
"""Mine Andres's main Claude Code and Codex sessions into a reflect digest.

Usage: python3 -I mine.py [--since YYYY-MM-DD] [--out DIR]
Default window: since the last recorded run, else the past 7 days.
Writes DIR/digest.md (for reviewers) and DIR/moments.jsonl (one flagged moment per line).
"""
import argparse, collections, datetime as dt, glob, json, os, re

HOME = os.path.expanduser("~")
STATE = os.path.join(HOME, ".local/state/thoven-reflect/last-run")

CORRECTION = re.compile(
    r"\b(i told you|i said|i already|we already|already (told|said|decided|did)|as i (said|mentioned)|"
    r"again\b|remember|you forgot|forgot|we (talked|discussed|decided|agreed)|last time|how many times|"
    r"you keep|keep (doing|asking)|stop (doing|asking)|not what i|that'?s wrong|wrong\b|why did you|"
    r"i never said|settled|stale|re-?ask|same (mistake|thing)|i'?m (so )?(confused|lost)|instead of)\b",
    re.I,
)
NOISE = (
    "This session is being continued", "<teammate-message", "[Subagent hand-back",
    "Another Claude session", "[SYSTEM NOTIFICATION", "Caveat:",
)
BRIEF = re.compile(r"DONE WHEN|REPORT TO|Writes to:|## Brief|herdr pane", re.I)
SKILL_PATH = re.compile(r"skills/(?:[\w.-]+/)*?([\w.-]+)/SKILL\.md")


def is_brief(text):
    return len(text) > 1500 and BRIEF.search(text)


def real_prompt(text):
    t = text.strip()
    return t and not t.startswith("<") and not t.startswith(NOISE)


def claude_sessions(since_ts):
    for path in glob.glob(f"{HOME}/.claude/projects/*/*.jsonl"):
        if os.path.getmtime(path) < since_ts:
            continue
        prompts, skills, active, last_text = [], collections.Counter(), "", ""
        for line in open(path, errors="ignore"):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            msg = d.get("message") or {}
            if d.get("type") == "assistant":
                for c in msg.get("content") or []:
                    if not isinstance(c, dict):
                        continue
                    if c.get("type") == "text":
                        last_text = c["text"]
                    elif c.get("type") == "tool_use":
                        inp = c.get("input") or {}
                        name = inp.get("skill") if c.get("name") == "Skill" else None
                        m = SKILL_PATH.search(json.dumps(inp)) if not name else None
                        name = name or (m.group(1) if m else None)
                        if name:
                            active = name.split(":")[-1]
                            skills[active] += 1
            elif d.get("type") == "user" and isinstance(msg.get("content"), str) and not d.get("isMeta"):
                prompts.append((d.get("timestamp", ""), msg["content"], last_text, active))
        yield "claude", path, prompts, skills


def codex_sessions(since_day):
    for path in glob.glob(f"{HOME}/.codex/sessions/*/*/*/*.jsonl"):
        y, m, d = path.split("/")[-4:-1]
        if f"{y}-{m}-{d}" < since_day:
            continue
        prompts, skills, active, last_text = [], collections.Counter(), "", ""
        for line in open(path, errors="ignore"):
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            p = ev.get("payload") or {}
            kind = p.get("type")
            if kind in ("function_call", "custom_tool_call"):
                m2 = SKILL_PATH.search(str(p.get("arguments") or p.get("input") or ""))
                if m2:
                    active = m2.group(1)
                    skills[active] += 1
            elif kind == "message":
                text = " ".join(c.get("text", "") for c in p.get("content", []) if isinstance(c, dict))
                if p.get("role") == "assistant":
                    last_text = text
                elif p.get("role") == "user" and "AGENTS.md" not in text[:300]:
                    prompts.append((ev.get("timestamp", ""), text, last_text, active))
        yield "codex", path, prompts, skills


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since")
    ap.add_argument("--out", default=os.path.join(os.environ.get("TMPDIR", "/tmp"), "thoven-reflect", dt.date.today().isoformat()))
    args = ap.parse_args()
    since = args.since
    if not since and os.path.exists(STATE):
        since = open(STATE).read().strip()
    since = since or (dt.date.today() - dt.timedelta(days=7)).isoformat()
    since_ts = dt.datetime.fromisoformat(since).timestamp()
    os.makedirs(args.out, exist_ok=True)

    sessions, moments = [], []
    skill_total = collections.Counter()
    n_prompts = 0
    for tool, path, prompts, skills in list(claude_sessions(since_ts)) + list(codex_sessions(since)):
        prompts = [p for p in prompts if p[0][:10] >= since and real_prompt(p[1])]
        if not prompts or is_brief(prompts[0][1]):
            continue
        n_prompts += len(prompts)
        skill_total.update(skills)
        flagged = []
        for ts, text, before, active in prompts:
            if CORRECTION.search(text) and len(text.split()) > 3:
                mo = {"tool": tool, "session": path, "ts": ts[:16], "last_skill": active,
                      "andres": text.strip()[:1200], "agent_before": before.strip()[-400:]}
                flagged.append(mo)
                moments.append(mo)
        sessions.append((tool, path, prompts[0][0][:16], len(prompts), skills, flagged))

    with open(os.path.join(args.out, "moments.jsonl"), "w") as f:
        for mo in moments:
            f.write(json.dumps(mo) + "\n")
    with open(os.path.join(args.out, "digest.md"), "w") as f:
        f.write(f"# Reflect digest, {since} to {dt.date.today()}\n\n")
        f.write(f"{len(sessions)} main sessions, {n_prompts} prompts by Andres, {len(moments)} flagged moments.\n\n")
        f.write("Skills used (calls): " + ", ".join(f"{k} {v}" for k, v in skill_total.most_common(30)) + "\n\n")
        for tool, path, start, n, skills, flagged in sorted(sessions, key=lambda s: s[2]):
            if not flagged:
                continue
            f.write(f"## {tool} · {start} · {n} prompts · {path}\n")
            f.write("Skills: " + (", ".join(skills) or "none") + "\n\n")
            for mo in flagged:
                f.write(f"- **{mo['ts']}** (last skill loaded: {mo['last_skill'] or 'none'})\n")
                f.write(f"  - Agent before: {mo['agent_before'][-300:]!r}\n")
                f.write(f"  - Andres: {mo['andres']!r}\n")
            f.write("\n")
    print(json.dumps({"since": since, "sessions": len(sessions), "prompts": n_prompts,
                      "flagged": len(moments), "out": args.out}))


if __name__ == "__main__":
    main()
