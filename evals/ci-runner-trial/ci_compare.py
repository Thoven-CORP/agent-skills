#!/usr/bin/env python3
"""Compare GitHub Actions runs of the frontend CI for speed and accuracy.

usage: ci_compare.py <out.json> <label>=<run_id> [<label>=<run_id> ...]
Speed: per-job queue and run seconds, and the runner label that actually ran the job.
Accuracy: every vitest test's outcome from the vitest-durations-N artifacts, compared
run against run (a test that passes in one run and fails in another is a disagreement).
"""
import json, os, subprocess, sys, tempfile, zipfile, io
from datetime import datetime

REPO = os.environ.get("CI_COMPARE_REPO", "Thoven-CORP/frontend-remote")
ts = lambda s: datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None

def gh(path, raw=False):
    p = subprocess.run(["gh", "api", f"repos/{REPO}/{path}"] + ([] if raw else ["--paginate"]), capture_output=True)
    if p.returncode: raise SystemExit(p.stderr.decode())
    return p.stdout if raw else json.loads(p.stdout)

def tests_of(run_id):
    outcomes = {}
    for a in gh(f"actions/runs/{run_id}/artifacts")["artifacts"]:
        if not a["name"].startswith("vitest-durations") or a["expired"]: continue
        z = zipfile.ZipFile(io.BytesIO(gh(f"actions/artifacts/{a['id']}/zip", raw=True)))
        for n in z.namelist():
            if not n.endswith(".json"): continue
            for f in json.loads(z.read(n)).get("testResults", []):
                rel = f["name"].split("/frontend-remote/")[-1].split("/frontend/")[-1]
                for t in f.get("assertionResults", []):
                    outcomes[f"{rel} :: {t.get('fullName') or t.get('title')}"] = t["status"]
    return outcomes

def run_summary(label, run_id):
    run = gh(f"actions/runs/{run_id}")
    jobs = gh(f"actions/runs/{run_id}/jobs?per_page=100")["jobs"]
    js = []
    for j in jobs:
        if j["conclusion"] == "skipped" or not j["started_at"]: continue
        js.append({"name": j["name"], "conclusion": j["conclusion"], "labels": j.get("labels", []), "runner": j.get("runner_name"),
                   "queue": round((ts(j["started_at"]) - ts(j["created_at"])).total_seconds()) if j.get("created_at") else None,
                   "seconds": round((ts(j["completed_at"]) - ts(j["started_at"])).total_seconds()) if j["completed_at"] else None})
    tests = tests_of(run_id)
    return {"label": label, "run": run_id, "sha": run["head_sha"], "event": run["event"], "conclusion": run["conclusion"],
            "wall": round((ts(run["updated_at"]) - ts(run["run_started_at"])).total_seconds()),
            "jobs": js, "tests": {"total": len(tests), "passed": sum(v == "passed" for v in tests.values()),
                                  "failed": sorted(k for k, v in tests.items() if v == "failed")}, "_outcomes": tests}

def main():
    out, specs = sys.argv[1], [s.split("=", 1) for s in sys.argv[2:]]
    runs = [run_summary(l, int(r)) for l, r in specs]
    base = runs[0]["_outcomes"]
    for r in runs:
        o = r.pop("_outcomes")
        shared = base.keys() & o.keys()
        r["agreement"] = {"vs": runs[0]["label"], "shared": len(shared), "onlyHere": len(o.keys() - base.keys()), "onlyBase": len(base.keys() - o.keys()),
                          "disagree": sorted(k for k in shared if base[k] != o[k])}
    json.dump(runs, open(out, "w"), indent=1)
    for r in runs:
        slow = max((j for j in r["jobs"] if j["seconds"]), key=lambda j: j["seconds"])
        print(f"{r['label']:14} run={r['run']} {r['conclusion']:8} wall={r['wall']}s slowest={slow['name']} {slow['seconds']}s "
              f"tests={r['tests']['total']} failed={len(r['tests']['failed'])} disagree={len(r['agreement']['disagree'])} runners={sorted({','.join(j['labels']) for j in r['jobs']})}")

if __name__ == "__main__": main()
