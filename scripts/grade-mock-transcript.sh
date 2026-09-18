#!/usr/bin/env bash
# Grades a mock session's JSONL for the enforcement predicates. Usage: grade-mock-transcript.sh <session.jsonl> <worktree>
set -u
J="$1"; W="$2"
line(){ printf '%-6s %s\n' "$1" "$2"; }
n_turns=$(grep -c '"type":"assistant"' "$J"); echo "assistant turns: $n_turns"
first_comp=$(grep -n 'file_path.\{0,6\}[^"]*components/' "$J" | head -1 | cut -d: -f1)
rule_line=$(grep -n 'Thoven UI rule: before changing a component' "$J" | head -1 | cut -d: -f1)
[ -n "$rule_line" ] && line PASS "UI rule injected by the tracker (transcript line $rule_line)" || line FAIL "UI rule never injected"
grep -q 'Skill.*thoven-designer\|"skill":"thoven-designer"\|<command-name>/thoven-designer' "$J" && line PASS "thoven-designer skill invoked" || line INFO "thoven-designer skill not invoked (rule asks for it)"
grep -q 'playwright test' "$J" && line PASS "playwright test was run" || line FAIL "playwright never run"
grep -q 'THOVEN_AGENT=1' "$J" && line PASS "run used THOVEN_AGENT=1" || line INFO "THOVEN_AGENT=1 not used (trace only on retry then)"
grep -q 'reported done, but no test artifact' "$J" && line INFO "Stop hook blocked a premature done-claim" || line INFO "Stop hook never had to block"
grep -q '"permissionDecision":"deny"\|permissionDecisionReason' "$J" && line INFO "bash guard denied a command" || line INFO "bash guard never had to deny"
[ -f "$W/test-results/results.json" ] && line PASS "results.json on disk: $(jq -c '[.. | .specs? // empty | .[] | .tests[].results[].status]' "$W/test-results/results.json")" || line FAIL "no results.json"
find "$W/test-results" -name trace.zip 2>/dev/null | grep -q . && line PASS "trace.zip on disk" || line FAIL "no trace.zip"
last=$(grep '"type":"assistant"' "$J" | tail -1 | jq -r '[.message.content[]? | select(.type=="text") | .text] | join(" ")' 2>/dev/null | head -c 400); echo "last assistant text: $last"
