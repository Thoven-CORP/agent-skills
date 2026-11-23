#!/usr/bin/env bash
# Tests for check-no-filing.sh: refuses empty input, catches a filing line, passes the allowlisted case.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
script="$here/check-no-filing.sh"
allow="$here/check-no-filing.allow"
lab="$(mktemp -d)"
trap 'rm -rf "$lab"' EXIT
failures=0

check() {
  local label="$1"; shift
  if "$@"; then printf 'ok   %s\n' "$label"; else printf 'FAIL %s\n' "$label"; ((failures += 1)); fi
}

# Writes one line to a fresh skill file and prints the check's exit code for it.
code_for() {
  local dir="$lab/$1"
  mkdir -p "$dir"
  printf '%s' "$2" > "$dir/SKILL.md"
  bash "$script" --allow "$allow" "$dir" >/dev/null 2>&1 && echo 0 || echo $?
}

check "refuses an empty file" test "$(code_for empty '')" = 2
mkdir -p "$lab/nothing"
check "refuses a folder with no markdown" test "$(bash "$script" --allow "$allow" "$lab/nothing" >/dev/null 2>&1 && echo 0 || echo $?)" = 2
check "refuses a missing allowlist" test "$(bash "$script" --allow "$lab/none.allow" "$here" >/dev/null 2>&1 && echo 0 || echo $?)" = 2
check "hits a minor finding filed as a follow-up" test "$(code_for bad1 $'- A cosmetic miss elsewhere is a follow-up, not a NO-GO.\n')" = 1
check "hits a finding that becomes its own ticket" test "$(code_for bad2 $'2. Each minor finding becomes its own ticket by where it sits.\n')" = 1
check "hits filing the rest in Linear" test "$(code_for bad3 $'Fix the top items he picks, file the rest in Linear.\n')" = 1
check "hits findings sent to a tracking skill" test "$(code_for bad5 $'| Audit | \`/tech-debt\` (to log findings), \`/manage-todos\` (to track remediation) |\n')" = 1
check "hits a defect sent to Backlog" test "$(code_for bad4 $'- A product defect goes to Backlog as linear.\n')" = 1
sanctioned=$'- An agreed deferral is filed as a follow-up after Andres\'s yes, with a priority.\n'
check "passes the allowlisted agreed deferral" test "$(code_for good1 "$sanctioned")" = 0
: > "$lab/empty.allow"
check "hits the same line with an empty allowlist" test "$(bash "$script" --allow "$lab/empty.allow" "$lab/good1" >/dev/null 2>&1 && echo 0 || echo $?)" = 1
check "passes a fix in the round" test "$(code_for good2 $'- Fix a finding in its round, or make it a sub-issue of its ticket.\n')" = 0
check "skips LEARNINGS.md history" test "$(mkdir -p "$lab/hist" && printf 'ok line\n' > "$lab/hist/SKILL.md" && printf 'it was filed as a follow-up\n' > "$lab/hist/LEARNINGS.md" && bash "$script" --allow "$allow" "$lab/hist" >/dev/null 2>&1 && echo 0 || echo $?)" = 0

((failures == 0)) && echo "all passed" || { echo "$failures failed"; exit 1; }
