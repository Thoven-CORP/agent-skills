#!/usr/bin/env bash
# Calls the classifier once per case and reports each answer against its gold
# label and against the binding floor.
#
# The agent eval measures whether a skill follows a classifier. This measures
# whether the classifier says anything the skill is allowed to follow: an answer
# below CLASSIFY_FLOOR is advisory, so a run where nothing clears the floor is a
# run where the treatment arm and the control arm are the same skill.
set -uo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${1:-$repo/evals/runs/floor-$(date +%H%M%S)}"; mkdir -p "$out"
cases="${2:-$repo/evals/cases/cases.json}"
schema="${3:-$repo/evals/schemas/investigate-intake.json}"

n="$(jq -r '.cases | length' "$cases")"
for i in $(seq 0 $((n - 1))); do
  id="$(jq -r ".cases[$i].id" "$cases")"
  jq -r ".cases[$i].turns | join(\"\n\")" "$cases" \
    | "$repo/enforcement/bin/classify" "$schema" \
    > "$out/$id.json"
done

python3 - "$cases" "$out" <<'PY'
import json, sys, glob, os
cases = {c["id"]: c for c in json.load(open(sys.argv[1]))["cases"]}
floor = float(os.environ.get("CLASSIFY_FLOOR", "0.7"))
print(f"{'CASE':<26} {'QUESTION':<20} {'ANSWER':<20} {'CONF':>5} {'BIND':>5} {'GOLD':<20} HIT")
tot = hit = bind = bindhit = 0
for path in sorted(glob.glob(f"{sys.argv[2]}/*.json")):
    cid = os.path.basename(path)[:-5]
    r = json.load(open(path))
    if r["status"] != "answered":
        print(f"{cid:<26} {'-':<20} {r['status']+': '+r['reason']}")
        continue
    gold = cases[cid].get("gold") or {}
    for q, a in r["answers"].items():
        if q not in gold:
            continue
        g = gold[q]
        v = a["value"]
        ok = (round(v) == g) if isinstance(v, (int, float)) and not isinstance(v, bool) and isinstance(g, (int, float)) else (v == g)
        tot += 1; hit += ok
        if a["binding"]:
            bind += 1; bindhit += ok
        print(f"{cid:<26} {q:<20} {str(v):<20} {a['confidence']:>5.2f} {str(a['binding']):>5} {str(g):<20} {'Y' if ok else 'N'}")
print()
print(f"answers {tot}   correct {hit} ({hit/tot:.0%})" if tot else "no answers")
print(f"cleared the {floor} floor {bind}/{tot} ({bind/tot:.0%})" + (f"   correct among those {bindhit}/{bind}" if bind else ""))
PY
echo "records in $out"
