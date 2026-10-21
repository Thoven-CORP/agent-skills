#!/usr/bin/env bash
# Enforce factory RULES.md against a product repo diff and optional PR counts.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES="${FACTORY_RULES:-$DIR/../RULES.md}"
repo="."
base="origin/main"
open_count=""
weekly_count=""
ci_failures=""
diff_stat=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    --open-count) open_count="$2"; shift 2 ;;
    --weekly-count) weekly_count="$2"; shift 2 ;;
    --ci-failures) ci_failures="$2"; shift 2 ;;
    --diff-stat) diff_stat="$2"; shift 2 ;;
    --rules) RULES="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

eval "$(python3 "$DIR/parse-caps.py" --rules "$RULES" | sed 's/^/cap_/')"

fail=0
say() { printf '%s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1" >&2; fail=1; }
ok() { printf 'ok    %s\n' "$1"; }

say "caps open_pr_cap=$cap_open_pr_cap weekly_pr_cap=$cap_weekly_pr_cap ($cap_weekly_pr_cap_status) max_lines=$cap_max_lines max_files=$cap_max_files ($cap_pr_size_status)"

if [[ -z "$open_count" && -n "${FACTORY_SKIP_GH:-}" ]]; then
  open_count=0
fi
if [[ -z "$weekly_count" && -n "${FACTORY_SKIP_GH:-}" ]]; then
  weekly_count=0
fi

if [[ -z "$open_count" ]] && command -v gh >/dev/null 2>&1; then
  open_count="$(gh pr list --state open --search 'label:factory-loop' --json number --jq 'length' 2>/dev/null || echo 0)"
fi
if [[ -z "$weekly_count" ]] && command -v gh >/dev/null 2>&1; then
  since="$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)"
  weekly_count="$(gh pr list --state all --search "label:factory-loop created:>=${since}" --json number --jq 'length' 2>/dev/null || echo 0)"
fi

if [[ -n "$open_count" ]]; then
  if [[ "$open_count" -ge "$cap_open_pr_cap" ]]; then
    bad "open loop PRs $open_count >= open_pr_cap $cap_open_pr_cap"
  else
    ok "open loop PRs $open_count / $cap_open_pr_cap"
  fi
else
  say "skip  open PR count (pass --open-count or use gh)"
fi

if [[ -n "$weekly_count" ]]; then
  if [[ "$weekly_count" -ge "$cap_weekly_pr_cap" ]]; then
    bad "weekly loop PRs $weekly_count >= weekly_pr_cap $cap_weekly_pr_cap (pending Andres)"
  else
    ok "weekly loop PRs $weekly_count / $cap_weekly_pr_cap (pending Andres)"
  fi
else
  say "skip  weekly PR count (pass --weekly-count or use gh)"
fi

stat_file="$diff_stat"
if [[ -z "$stat_file" ]]; then
  stat_file="$(mktemp)"
  git -C "$repo" diff --stat "$base"...HEAD >"$stat_file" || git -C "$repo" diff --stat >"$stat_file"
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

names_file="$(mktemp)"
if [[ -n "$diff_stat" ]]; then
  awk -F' +\\|' '/\|/ {print $1}' "$stat_file" | sed 's/[[:space:]]*$//' >"$names_file"
else
  git -C "$repo" diff --name-only "$base"...HEAD >"$names_file" 2>/dev/null \
    || git -C "$repo" diff --name-only >"$names_file"
fi

python3 - "$names_file" <<'PY' || fail=1
import sys
from pathlib import Path
names = [ln.strip() for ln in Path(sys.argv[1]).read_text().splitlines() if ln.strip()]
forbidden_substrings = (
    "db/migrate/",
    "db/schema.rb",
    "db/structure.sql",
    "config/recurring.yml",
)
forbidden_tokens = (
    ("billing", ("billing", "credit", "wallet", "stripe")),
    ("auth", ("devise", "jwt", "session", "omniauth", "student-auth", "student_auth")),
    ("legal", ("privacy", "terms-of", "terms_of", "legal")),
    ("mail", ("mailer", "app/mailers/", "customer-email")),
)
hits = []
for name in names:
    lower = name.lower()
    for needle in forbidden_substrings:
        if needle in lower:
            hits.append(f"{name} ({needle})")
    for label, tokens in forbidden_tokens:
        if any(tok in lower for tok in tokens):
            hits.append(f"{name} ({label})")
if hits:
    print("FAIL  forbidden paths", file=sys.stderr)
    for h in hits:
        print(f"  {h}", file=sys.stderr)
    sys.exit(1)
print(f"ok    no forbidden paths in {len(names)} files")
PY

if [[ -n "$ci_failures" ]]; then
  if [[ "$ci_failures" -ge "$cap_ci_failure_stop" ]]; then
    bad "CI failures $ci_failures >= ci_failure_stop $cap_ci_failure_stop. Stop. Do not auto-revert."
  else
    ok "CI failures $ci_failures / $cap_ci_failure_stop"
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  echo "factory-rules failed" >&2
  exit 1
fi
echo "factory-rules passed"
exit 0
