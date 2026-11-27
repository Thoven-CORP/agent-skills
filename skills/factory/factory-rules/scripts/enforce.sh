#!/usr/bin/env bash
# Enforce factory caps from origin/main, not the checkout.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_GIT="${FACTORY_SKILLS_GIT:-}"
if [[ -z "$SKILLS_GIT" ]]; then
  SKILLS_GIT="$(git -C "$DIR/../../../.." rev-parse --show-toplevel 2>/dev/null || true)"
fi
RULES_REF="${FACTORY_RULES_REF:-origin/main}"
RULES_PATH="skills/factory/factory-rules/RULES.md"
repo="."
base="origin/main"
open_count=""
weekly_count=""
ci_failures=""
diff_stat=""
gh_bin="${FACTORY_GH:-gh}"

if [[ -n "${FACTORY_RULES:-}" ]]; then
  echo "FAIL  FACTORY_RULES is not allowed; caps come from ${RULES_REF}:${RULES_PATH}" >&2
  exit 1
fi
if [[ -n "${FACTORY_SKIP_GH:-}" ]]; then
  echo "FAIL  FACTORY_SKIP_GH is not allowed" >&2
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    --open-count) open_count="$2"; shift 2 ;;
    --weekly-count) weekly_count="$2"; shift 2 ;;
    --ci-failures) ci_failures="$2"; shift 2 ;;
    --diff-stat) diff_stat="$2"; shift 2 ;;
    --rules)
      echo "FAIL  --rules is not allowed; caps come from ${RULES_REF}:${RULES_PATH}" >&2
      exit 1
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$ci_failures" ]]; then
  echo "FAIL  --ci-failures is required" >&2
  exit 1
fi
if ! [[ "$ci_failures" =~ ^[0-9]+$ ]]; then
  echo "FAIL  --ci-failures must be an integer" >&2
  exit 1
fi

if [[ -z "$SKILLS_GIT" ]] || ! git -C "$SKILLS_GIT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FAIL  cannot resolve agent-skills git root" >&2
  exit 1
fi

caps_src="$(mktemp)"
if ! git -C "$SKILLS_GIT" show "${RULES_REF}:${RULES_PATH}" >"$caps_src" 2>/dev/null; then
  echo "FAIL  cannot read ${RULES_REF}:${RULES_PATH}" >&2
  exit 1
fi

caps_txt="$(python3 "$DIR/parse-caps.py" --rules "$caps_src")" || {
  echo "FAIL  caps in ${RULES_REF}:${RULES_PATH} are invalid" >&2
  exit 1
}

cap_open_pr_cap=""
cap_weekly_pr_cap=""
cap_max_lines=""
cap_max_files=""
cap_ci_failure_stop=""
cap_claim_lock_hours=""
cap_replay_min_tickets=""
cap_live_score_pct=""
cap_station_fail_k=""
cap_monthly_eval_budget=""
cap_weekly_pr_cap_status=""
cap_pr_size_status=""
cap_station_fail_k_status=""
cap_monthly_eval_budget_status=""
cap_judge_blind_status=""
while IFS='=' read -r k v; do
  case "$k" in
    open_pr_cap) cap_open_pr_cap="$v" ;;
    weekly_pr_cap) cap_weekly_pr_cap="$v" ;;
    max_lines) cap_max_lines="$v" ;;
    max_files) cap_max_files="$v" ;;
    ci_failure_stop) cap_ci_failure_stop="$v" ;;
    claim_lock_hours) cap_claim_lock_hours="$v" ;;
    replay_min_tickets) cap_replay_min_tickets="$v" ;;
    live_score_pct) cap_live_score_pct="$v" ;;
    station_fail_k) cap_station_fail_k="$v" ;;
    monthly_eval_budget) cap_monthly_eval_budget="$v" ;;
    weekly_pr_cap_status) cap_weekly_pr_cap_status="$v" ;;
    pr_size_status) cap_pr_size_status="$v" ;;
    station_fail_k_status) cap_station_fail_k_status="$v" ;;
    monthly_eval_budget_status) cap_monthly_eval_budget_status="$v" ;;
    judge_blind_status) cap_judge_blind_status="$v" ;;
    *) echo "FAIL  unknown cap $k" >&2; exit 1 ;;
  esac
  if [[ -z "$v" ]]; then
    echo "FAIL  empty cap $k" >&2
    exit 1
  fi
done <<<"$caps_txt"

for n in "$cap_open_pr_cap" "$cap_weekly_pr_cap" "$cap_max_lines" "$cap_max_files" "$cap_ci_failure_stop" "$cap_claim_lock_hours" "$cap_replay_min_tickets" "$cap_live_score_pct" "$cap_station_fail_k" "$cap_monthly_eval_budget"; do
  if ! [[ "$n" =~ ^[0-9]+$ ]]; then
    echo "FAIL  cap value is not an int: $n" >&2
    exit 1
  fi
done

fail=0
say() { printf '%s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1" >&2; fail=1; }
ok() { printf 'ok    %s\n' "$1"; }

say "caps open_pr_cap=$cap_open_pr_cap weekly_pr_cap=$cap_weekly_pr_cap ($cap_weekly_pr_cap_status) max_lines=$cap_max_lines max_files=$cap_max_files ($cap_pr_size_status) from ${RULES_REF}:${RULES_PATH}"

origin_repo() {
  python3 - "$1" <<'PY'
import sys, re
url = sys.argv[1].strip()
m = re.search(r'[:/]([^/]+)/([^/]+?)(?:\.git)?$', url)
if not m:
    raise SystemExit(1)
print(f"{m.group(1)}/{m.group(2)}")
PY
}

count_loop_prs() {
  local state="$1"
  local extra=()
  if [[ -n "${2:-}" ]]; then
    extra+=(--search "$2")
  fi
  local remote url repo_slug out
  remote="$(git -C "$repo" remote get-url origin 2>/dev/null || true)"
  if [[ -z "$remote" ]]; then
    echo "FAIL  git origin missing; cannot scope PR count" >&2
    return 1
  fi
  url="$(origin_repo "$remote")" || {
    echo "FAIL  cannot parse origin $remote" >&2
    return 1
  }
  repo_slug="$url"
  if ! command -v "$gh_bin" >/dev/null 2>&1; then
    echo "FAIL  gh not found" >&2
    return 1
  fi
  out="$(mktemp)"
  if ! "$gh_bin" pr list --repo "$repo_slug" --state "$state" --limit 100 --json number,title,labels "${extra[@]}" >"$out" 2>"$out.err"; then
    echo "FAIL  gh ${state} PR list failed" >&2
    cat "$out.err" >&2 || true
    return 1
  fi
  python3 - "$out" <<'PY'
import json, sys
rows = json.load(open(sys.argv[1]))
n = 0
for pr in rows:
    title = pr.get("title") or ""
    labels = [((lab.get("name") if isinstance(lab, dict) else lab) or "") for lab in pr.get("labels") or []]
    if title.startswith("factory:") or "factory-loop" in labels:
        n += 1
print(n)
PY
}

if [[ -z "$open_count" ]]; then
  if ! open_count="$(count_loop_prs open)"; then
    exit 1
  fi
fi
if [[ -z "$weekly_count" ]]; then
  since="$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)"
  if ! weekly_count="$(count_loop_prs all "created:>=${since}")"; then
    exit 1
  fi
fi

if ! [[ "$open_count" =~ ^[0-9]+$ && "$weekly_count" =~ ^[0-9]+$ ]]; then
  echo "FAIL  PR counts are not integers" >&2
  exit 1
fi

if [[ "$open_count" -ge "$cap_open_pr_cap" ]]; then
  bad "open loop PRs $open_count >= open_pr_cap $cap_open_pr_cap"
else
  ok "open loop PRs $open_count / $cap_open_pr_cap"
fi

if [[ "$weekly_count" -ge "$cap_weekly_pr_cap" ]]; then
  bad "weekly loop PRs $weekly_count >= weekly_pr_cap $cap_weekly_pr_cap (pending Andres)"
else
  ok "weekly loop PRs $weekly_count / $cap_weekly_pr_cap (pending Andres)"
fi

stat_file="$diff_stat"
names_file="$(mktemp)"
if [[ -z "$stat_file" ]]; then
  if ! git -C "$repo" rev-parse --verify "$base" >/dev/null 2>&1; then
    echo "FAIL  base $base unreadable" >&2
    exit 1
  fi
  stat_file="$(mktemp)"
  if ! git -C "$repo" diff --stat "$base"...HEAD >"$stat_file"; then
    echo "FAIL  git diff --stat $base...HEAD failed" >&2
    exit 1
  fi
  if ! git -C "$repo" diff --name-only "$base"...HEAD >"$names_file"; then
    echo "FAIL  git diff --name-only $base...HEAD failed" >&2
    exit 1
  fi
else
  awk -F' +\\|' '/\|/ {print $1}' "$stat_file" | sed 's/[[:space:]]*$//' >"$names_file"
fi

python3 - "$stat_file" "$cap_max_lines" "$cap_max_files" <<'PY' || fail=1
import re, sys
path, max_lines, max_files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
text = open(path).read()
files = [ln for ln in text.splitlines() if " | " in ln]
summary = text.splitlines()[-1] if text.strip() else ""
m = re.search(r"(\d+) insertion", summary)
n = re.search(r"(\d+) deletion", summary)
changed = (int(m.group(1)) if m else 0) + (int(n.group(1)) if n else 0)
file_count = len(files)
ok = True
if changed > max_lines:
    print(f"FAIL  batch PR {changed} lines > max_lines {max_lines} (pending Andres)", file=sys.stderr)
    ok = False
else:
    print(f"ok    batch PR {changed} lines / {max_lines} (pending Andres)")
if file_count > max_files:
    print(f"FAIL  batch PR {file_count} files > max_files {max_files} (pending Andres)", file=sys.stderr)
    ok = False
else:
    print(f"ok    batch PR {file_count} files / {max_files} (pending Andres)")
sys.exit(0 if ok else 1)
PY

python3 - "$names_file" <<'PY' || fail=1
import re, sys
from pathlib import Path

names = [ln.strip() for ln in Path(sys.argv[1]).read_text().splitlines() if ln.strip()]
hits = []

def add(name, why):
    hits.append(f"{name} ({why})")

for name in names:
    lower = name.lower().lstrip("./")
    if lower.endswith("rules.md") or lower == "rules.md":
        add(name, "RULES.md")
    if "skills/factory/" in lower or lower.startswith("skills/factory"):
        add(name, "skills/factory/")
    for needle in (
        "db/migrate/",
        "db/schema.rb",
        "db/structure.sql",
        "db/seeds",
        "config/recurring.yml",
        "app/mailers/",
        "customer-email",
    ):
        if needle in lower:
            add(name, needle)
    if re.search(r"(^|/)terms/", lower):
        add(name, "terms/")
    if re.search(r"(^|/)emails/", lower):
        add(name, "emails/")
    if re.search(r"(^|/)frontend/.*/templates/", lower) or re.search(r"(^|/)frontend/templates/", lower):
        add(name, "frontend templates")
    if "session" in lower and not re.search(r"lesson[-_]?session", lower):
        add(name, "session")
    tokens = (
        "auth", "password", "oauth", "login", "token",
        "payment", "invoice", "subscription", "checkout", "charge",
        "billing", "credit", "wallet", "stripe",
        "devise", "jwt", "omniauth", "student-auth", "student_auth",
        "privacy", "legal", "mailer",
    )
    parts = re.split(r"[/_.,-]+", lower)
    for tok in tokens:
        if tok in parts:
            add(name, tok)

if hits:
    print("FAIL  forbidden paths", file=sys.stderr)
    for h in hits:
        print(f"  {h}", file=sys.stderr)
    sys.exit(1)
print(f"ok    no forbidden paths in {len(names)} files")
PY

if [[ "$ci_failures" -ge "$cap_ci_failure_stop" ]]; then
  bad "CI failures $ci_failures >= ci_failure_stop $cap_ci_failure_stop. Stop. Do not auto-revert."
else
  ok "CI failures $ci_failures / $cap_ci_failure_stop"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "factory-rules failed" >&2
  exit 1
fi
echo "factory-rules passed"
exit 0
