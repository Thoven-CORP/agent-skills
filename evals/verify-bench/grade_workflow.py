#!/usr/bin/env python3
"""Grade workflow-eval candidates: hidden behaviour tests, diff scope, and process from the transcript.

usage: grade_workflow.py <workflow-dir>   (reads arms.json, timing.json; writes grading.json)
"""
import json, os, re, subprocess, sys, shutil

W = sys.argv[1]
arms = json.load(open(f"{W}/arms.json"))
timing = json.load(open(f"{W}/timing.json")) if os.path.exists(f"{W}/timing.json") else {}
SCOPE = {"initials": {"lib/initials.ts", "lib/initials.test.ts"}, "sort": {"lib/resource-sort.ts", "lib/resource-sort.test.ts"}}
RUN = re.compile(r"(?:^|&&|;|\|\||\n)\s*(?:\S*thoven-load-gate\S*\s+(?:--\S+\s+)*--\s+)?(?:\./)?bin/verify\b[^\n;&|]*")
FULL_SUITE = re.compile(r"(pnpm|npm)\s+(run\s+)?test(:run)?\s*($|[;&|])|vitest\s+run\s*($|[;&|])|pnpm\s+run\s+test:coverage")

def sh(cmd, cwd):
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True); return p.returncode, p.stdout + p.stderr

def transcript(path):
    cmds, seen, verify_blocks, final = [], set(), [], ""
    for line in open(path):
        try: d = json.loads(line)
        except ValueError: continue
        msg = d.get("message") or {}
        for c in msg.get("content") or [] if isinstance(msg.get("content"), list) else []:
            if c.get("type") == "tool_use" and c.get("name") == "Bash" and c.get("id") not in seen:
                seen.add(c.get("id")); cmds.append(c["input"].get("command", ""))
            if c.get("type") == "tool_result":
                body = c.get("content"); body = body if isinstance(body, str) else json.dumps(body)
                for m in re.finditer(r"THOVEN_VERIFY_BEGIN\\n(\{.+?\})\\nTHOVEN_VERIFY_END|THOVEN_VERIFY_BEGIN\n(\{.+?\})\nTHOVEN_VERIFY_END", body):
                    raw = (m.group(1) or m.group(2)).replace('\\"', '"')
                    try: verify_blocks.append(json.loads(raw))
                    except ValueError: pass
            if d.get("type") == "assistant" and c.get("type") == "text": final = c["text"]
    return cmds, verify_blocks, final

out = []
for a in arms:
    tree, task = a["tree"], a["task"]
    os.makedirs(f"{tree}/hidden-check", exist_ok=True)
    shutil.copy(f"{W}/hidden/{task}.hidden.test.ts", f"{tree}/hidden-check/{task}.test.ts")
    code, log = sh(["node_modules/.bin/vitest", "run", f"hidden-check/{task}.test.ts", "--reporter=dot"], tree)
    shutil.rmtree(f"{tree}/hidden-check")
    _, committed = sh(["git", "diff", "--name-only", f"{a['base']}..HEAD"], tree)
    _, dirty = sh(["git", "status", "--porcelain"], tree)
    changed = set(committed.split()) | {l[3:] for l in dirty.splitlines() if l.strip()}
    cmds, blocks, final = transcript(a["transcript"])
    invocations = [m.group(0) for c in cmds for m in RUN.finditer(c)]
    help_runs = [i for i in invocations if "--help" in i]
    verify_runs = [i for i in invocations if "--help" not in i and "--check-evidence" not in i]
    gated = [c for c in verify_runs if "thoven-load-gate" in c]
    full = [c for c in cmds if FULL_SUITE.search(c)]
    exp = [
        {"text": "Hidden behaviour tests pass", "passed": code == 0, "evidence": log.strip().splitlines()[-3:] if log else []},
        {"text": "Diff stays in the helper and its test", "passed": bool(changed) and changed <= SCOPE[task], "evidence": sorted(changed)},
        {"text": "Work is committed", "passed": committed.strip() != "" and not dirty.strip(), "evidence": dirty.strip() or "clean"},
        {"text": "bin/verify ran exactly once", "passed": len(verify_runs) == 1, "evidence": verify_runs + [f"plus {len(help_runs)} --help call(s)"] * bool(help_runs)},
        {"text": "bin/verify ran plain, not through the load gate", "passed": bool(verify_runs) and not gated, "evidence": gated[:2]},
        {"text": "No full-suite run", "passed": not full, "evidence": full[:3]},
        {"text": "Final report carries the verify block", "passed": "THOVEN_VERIFY" in final, "evidence": "present" if "THOVEN_VERIFY" in final else "absent"},
    ]
    last = blocks[-1] if blocks else None
    out.append({**a, "expectations": exp, "pass_rate": sum(e["passed"] for e in exp) / len(exp), "bash_calls": len(cmds),
                "verify": None if not last else {"status": last.get("status"), "seconds": last.get("seconds"), "rows": [[r["id"], r["status"], round(r.get("seconds") or 0, 1)] for r in last.get("rows", [])]},
                "timing": timing.get(a["run"]), "final": final})
json.dump(out, open(f"{W}/grading.json", "w"), indent=1)
for r in out: print(r["run"], r["task"], r["arm"], f"{r['pass_rate']:.0%}", [e["text"][:22] + ("✓" if e["passed"] else "✗") for e in r["expectations"]], r["verify"] and (r["verify"]["status"], r["verify"]["seconds"]))
