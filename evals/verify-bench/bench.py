#!/usr/bin/env python3
"""Run planted-diff cases through two bin/verify engines and record verdicts and timings.

usage: bench.py <old-tree> <new-tree> <out.json> [--reps N] [--only id,id]
Each case edits files in the tree, runs `bin/verify --base HEAD`, then restores the
originals byte for byte. Sides alternate per rep so drift hits both.
"""
import json, os, re, subprocess, sys, time, argparse

CASES = [
    {"id": "docs", "label": "Docs-only note", "expect": "PASS", "catcher": None,
     "edits": [{"path": "docs/UI_MAP.md", "append": "\nA note added for a docs-only change.\n"}]},
    {"id": "refactor", "label": "Behaviour-preserving refactor", "expect": "PASS", "catcher": None,
     "edits": [{"path": "lib/title-from-filename.ts", "find": "const stem = base.replace(/\\.[^./\\\\]+$/, '').trim()\n  if (!stem) return ''\n  return stem.slice(0, maxLen)",
                "repl": "const name = base.replace(/\\.[^./\\\\]+$/, '').trim()\n  if (!name) return ''\n  return name.slice(0, maxLen)"}]},
    {"id": "test-only", "label": "New test case", "expect": "PASS", "catcher": None,
     "edits": [{"path": "lib/initials.test.ts", "append": "\nit('keeps a single initial for one word', () => {\n  expect(initialsOf('Cher')).toBe('C')\n})\n"}]},
    {"id": "logic-initials", "label": "Logic bug: wrong last word", "expect": "FAIL", "catcher": "related",
     "edits": [{"path": "lib/initials.ts", "find": "words[words.length - 1].charAt(0)", "repl": "words[1].charAt(0)"}]},
    {"id": "logic-basename", "label": "Logic bug: path not stripped", "expect": "FAIL", "catcher": "related",
     "edits": [{"path": "lib/title-from-filename.ts", "find": "filename.replace(/^.*[/\\\\]/, '').trim()", "repl": "filename.trim()"}]},
    {"id": "type-error", "label": "Type error in a return type", "expect": "FAIL", "catcher": "typecheck",
     "edits": [{"path": "lib/resource-sort.ts", "find": "(items: T[]): T[] {", "repl": "(items: T[]): string[] {"}]},
    {"id": "lint", "label": "Floating promise", "expect": "FAIL", "catcher": "oxlint",
     "edits": [{"path": "lib/initials.ts", "append": "\nexport async function warmInitials(): Promise<void> {\n  Promise.resolve(initialsOf('A B'))\n}\n"}]},
    {"id": "claude-config", "label": ".claude config only", "expect": "PASS", "catcher": None,
     "edits": [{"path": ".claude/settings.json", "json_env": ["THOVEN_BENCH_NOTE", "1"]}]},
    {"id": "wireframe", "label": "Wireframe-only edit", "expect": "PASS", "catcher": None,
     "edits": [{"path": "wireframe/0610-colour-system/dark-palette.html", "append": "\n<!-- palette note -->\n"}]},
]

def apply(tree, edits):
    saved = []
    for e in edits:
        p = os.path.join(tree, e["path"])
        before = open(p, "rb").read() if os.path.exists(p) else None
        saved.append((p, before))
        text = before.decode() if before is not None else ""
        if "append" in e: text += e["append"]
        elif "find" in e:
            assert text.count(e["find"]) == 1, f"{e['path']}: anchor not unique or missing"
            text = text.replace(e["find"], e["repl"])
        elif "json_env" in e:
            d = json.loads(text); d.setdefault("env", {})[e["json_env"][0]] = e["json_env"][1]; text = json.dumps(d, indent=2) + "\n"
        open(p, "w").write(text)
    return saved

def restore(saved):
    for p, before in reversed(saved):
        if before is None: os.remove(p)
        else: open(p, "wb").write(before)

def run(tree, timeout):
    env = {**os.environ, "THOVEN_GATE_DISABLE": "1", "FORCE_COLOR": "0", "NO_COLOR": "1"}
    t0 = time.monotonic()
    try:
        p = subprocess.run(["bin/verify", "--base", "HEAD"], cwd=tree, capture_output=True, text=True, timeout=timeout, env=env)
        out, code = p.stdout + p.stderr, p.returncode
    except subprocess.TimeoutExpired as ex:
        out, code = (ex.stdout or b"").decode(errors="replace") if isinstance(ex.stdout, bytes) else (ex.stdout or ""), "timeout"
    wall = time.monotonic() - t0
    m = re.search(r"THOVEN_VERIFY_BEGIN\n(.+?)\nTHOVEN_VERIFY_END", out, re.S)
    ev = json.loads(m.group(1)) if m else None
    return wall, code, ev, out

def score(case, ev):
    if not ev: return {"status": "NO_EVIDENCE", "correct": False, "caughtBy": None}
    failing = [r["id"] for r in ev["rows"] if r["status"] in ("FAIL", "BLOCKED")]
    status = ev["status"]
    if case["expect"] == "PASS":
        return {"status": status, "correct": status == "PASS", "caughtBy": None, "falseAlarm": failing}
    return {"status": status, "correct": status != "PASS" and case["catcher"] in failing, "caughtBy": failing}

def main():
    a = argparse.ArgumentParser(); a.add_argument("old"); a.add_argument("new"); a.add_argument("out")
    a.add_argument("--reps", type=int, default=3); a.add_argument("--only", default=""); a.add_argument("--timeout", type=int, default=1500)
    o = a.parse_args()
    cases = [c for c in CASES if not o.only or c["id"] in o.only.split(",")]
    results = json.load(open(o.out)) if os.path.exists(o.out) else []
    done = {(r["case"], r["engine"], r["rep"]) for r in results}
    for rep in range(o.reps):
        for i, case in enumerate(cases):
            order = [("old", o.old), ("new", o.new)] if (rep + i) % 2 == 0 else [("new", o.new), ("old", o.old)]
            for engine, tree in order:
                if (case["id"], engine, rep) in done: continue
                saved = apply(tree, case["edits"])
                try: wall, code, ev, out = run(tree, o.timeout)
                finally: restore(saved)
                dirty = subprocess.run(["git", "status", "--porcelain"], cwd=tree, capture_output=True, text=True).stdout.strip()
                assert not dirty, f"{tree} not restored:\n{dirty}"
                r = {"case": case["id"], "label": case["label"], "expect": case["expect"], "catcher": case["catcher"], "engine": engine, "rep": rep,
                     "wall": round(wall, 1), "exit": code, "engineSeconds": ev and ev.get("seconds"), "load": os.getloadavg()[0],
                     "rows": [{"id": r["id"], "status": r["status"], "seconds": round(r.get("seconds") or 0, 1), "reason": r.get("reason")} for r in (ev or {}).get("rows", [])],
                     **score(case, ev), "tail": None if ev else out[-1500:]}
                results.append(r); json.dump(results, open(o.out, "w"), indent=1)
                print(f"{case['id']:15} {engine} rep{rep} {r['status']:12} correct={r['correct']} wall={r['wall']}s rows={[x['id']+':'+x['status'] for x in r['rows']]}", flush=True)

if __name__ == "__main__": main()
