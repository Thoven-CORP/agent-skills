#!/usr/bin/env bash
# Runs the predicates in check-enforcement.md. Exit 1 on any red line.
set -u
H="$HOME/.claude/hooks"; S="/tmp/claude-thoven/check-$$"; red=0
pass(){ printf 'PASS  %s\n' "$1"; }; fail(){ printf 'FAIL  %s\n' "$1"; red=1; }
CWD="${1:-$HOME/thoven/frontend}"
payload(){ jq -cn --arg sid "check-$$" --arg cwd "$CWD" "$1"; }

echo "== 3 THV-594 bash guard"
deny(){ echo "$1" | "$H/thoven-guard-bash" | jq -e '.hookSpecificOutput.permissionDecision=="deny"' >/dev/null 2>&1; }
mkdir -p "$S"; : > "$S/edited"; printf '%s\n' "$CWD/components/ui/a.tsx" >> "$S/edited"
p=$(payload '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"npx vitest run --exclude foo"}}');   deny "$p" && pass "vitest --exclude denied" || fail "vitest --exclude allowed"
p=$(payload '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"npm test && git stash push"}}');      deny "$p" && pass "chained bare stash denied" || fail "chained bare stash allowed"
p=$(payload '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"git stash push -- components/ui/a.tsx"}}'); deny "$p" && fail "stash of own file denied" || pass "stash of own file allowed"
p=$(payload '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"git status"}}');                     deny "$p" && fail "git status denied" || pass "git status allowed"
p=$(payload '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"npx vitest run --exclude foo"}}');   echo "$p" | "$H/thoven-guard-bash" | grep -q 'failures that do not exist' && pass "denial names the phantom-failure cause" || fail "denial reason missing"

echo "== 3b THV-593/594 edits made through Bash are tracked"
R="$HOME/.herdr/worktrees/check-repo-$$"; mkdir -p "$R/components/ui" && git -C "$R" init -q && : > "$R/README.md" && git -C "$R" add -A && git -C "$R" -c user.email=a@b -c user.name=c commit -qm init
S2="/tmp/claude-thoven/check2-$$"; rm -rf "$S2"; mkdir -p "$S2"; touch "$S2/started"; sleep 1
printf 'export const A = 1\n' > "$R/components/ui/a.tsx"
out=$(jq -cn --arg sid "check2-$$" --arg cwd "$R" '{session_id:$sid,cwd:$cwd,tool_name:"Bash",tool_input:{command:"cat > components/ui/a.tsx <<EOF"}}' | "$H/thoven-track-edits")
grep -qx "$R/components/ui/a.tsx" "$S2/edited" 2>/dev/null && pass "heredoc-written file recorded from git status" || fail "heredoc-written file not recorded"
echo "$out" | jq -e '.hookSpecificOutput.additionalContext | test("thoven-designer")' >/dev/null 2>&1 && pass "UI rule injected on first components/ touch" || fail "UI rule not injected"
p=$(jq -cn --arg sid "check2-$$" --arg cwd "$R" '{session_id:$sid,cwd:$cwd,hook_event_name:"Stop",last_assistant_message:"Done, the badge is built."}')
echo "$p" | "$H/thoven-require-evidence" 2>/dev/null; [ $? -eq 2 ] && pass "done-claim after Bash-only edits exits 2" || fail "Bash-only edits invisible to stop gate"
rm -rf "$R" "$S2"

echo "== 2 THV-593 evidence gate"
G="$HOME/.herdr/worktrees/gate-check-$$"; S3="/tmp/claude-thoven/gate-$$"
setup(){ rm -rf "$G" "$S3"; mkdir -p "$G" "$S3"; git -C "$G" init -q; touch "$S3/started"; sleep 1
  printf 'export const a = 1\n' > "$G/a.ts"; printf '%s\n' "$G/a.ts" > "$S3/edited"; touch "$S3/last-edit"; }
claim(){ jq -cn --arg sid "gate-$$" --arg cwd "$G" '{session_id:$sid,cwd:$cwd,hook_event_name:"Stop",last_assistant_message:"Done, it is built."}' | "$H/thoven-require-evidence" 2>/dev/null; echo $?; }
setup; [ "$(claim)" = 2 ] && pass "no artifact anywhere exits 2" || fail "unproven claim allowed"
setup; mkdir -p "$G/test-results"; touch "$G/test-results/anything.json"; [ "$(claim)" = 0 ] && pass "any file under test-results clears it" || fail "test-results ignored"
setup; mkdir -p "$G/reports/lighthouse/x"; touch "$G/reports/lighthouse/x/manifest.json"; [ "$(claim)" = 0 ] && pass "nested file under reports clears it" || fail "nested reports ignored"
setup; mkdir -p "$G/coverage"; touch "$G/coverage/lcov.info"; [ "$(claim)" = 0 ] && pass "any file type counts, no tool prescribed" || fail "coverage ignored"
setup; echo '{"evidence_roots":["out"]}' > "$G/.evidence.json"; mkdir -p "$G/test-results"; touch "$G/test-results/x.json"; [ "$(claim)" = 2 ] && pass "declared roots replace the defaults" || fail "override ignored"
mkdir -p "$G/out"; touch "$G/out/x.json"; [ "$(claim)" = 0 ] && pass "declared root satisfies it" || fail "declared root ignored"
setup; printf '# doc\n' > "$G/README.md"; printf '%s\n' "$G/README.md" > "$S3/edited"; [ "$(claim)" = 0 ] && pass "docs-only session exits 0" || fail "docs-only blocked"
setup; mkdir -p "$G/test-results"; touch -t 202001010000 "$G/test-results/old.json"; [ "$(claim)" = 2 ] && pass "artifact older than the edit exits 2" || fail "stale artifact accepted"
rm -rf "$G" "$S3"
echo '{"session_id":"z","cwd":"/tmp","hook_event_name":"Stop","last_assistant_message":"done"}' | "$H/thoven-require-evidence" 2>/dev/null; [ $? -eq 0 ] && pass "outside the thoven roots exits 0" || fail "gated outside thoven"

echo "== 6 THV-597 prompt framing"
fw(){ echo "{\"session_id\":\"fw-$$-$2\",\"cwd\":\"$CWD\",\"prompt\":$1}" | "$H/thoven-frame-work" | jq -r '.hookSpecificOutput.additionalContext // empty'; }
[ -n "$(fw '"build THV-578 the drawer"' a)" ] && pass "fires on a build request naming a ticket" || fail "framing never fires"
[ -z "$(fw '"what is THV-578 about?"' b)" ] && pass "stays silent on a question" || fail "framing over-triggers on questions"
[ -z "$(fw '"build the drawer"' c)" ] && pass "stays silent with no ticket" || fail "framing fires without a ticket"
rm -rf /tmp/claude-thoven/fw-$$-*

echo "== 4 THV-595 agents"
for a in verifier ui-builder explorer; do [ -f "$HOME/.claude/agents/$a.md" ] && pass "agents/$a.md exists" || fail "agents/$a.md missing"; done
grep -Eq '^disallowedTools:.*Edit' "$HOME/.claude/agents/verifier.md" 2>/dev/null && grep -Eq '^disallowedTools:.*Write' "$HOME/.claude/agents/verifier.md" && pass "verifier disallows Edit and Write" || fail "verifier can edit"
grep -Eq '^skills:.*thoven-designer' "$HOME/.claude/agents/ui-builder.md" 2>/dev/null && pass "ui-builder loads thoven-designer" || fail "ui-builder lacks thoven-designer"

echo "== 5 THV-598 rules"
grep -lE '^paths:' "$HOME"/.claude/rules/*.md 2>/dev/null | grep -q . && pass "rules with paths: exist" || fail "no path-scoped rules"
grep -qs 'components/\*\*' "$HOME/.claude/rules/thoven-ui.md" && grep -qs 'thoven-designer' "$HOME/.claude/rules/thoven-ui.md" && pass "thoven-ui rule scoped to components and points at designer" || fail "thoven-ui rule wrong"
grep -qs 'graphify affected' "$HOME/.claude/rules/thoven-graph.md" && pass "thoven-graph rule names graphify affected" || fail "thoven-graph rule wrong"

echo "== 1 THV-592 artifacts (reads the last run in $CWD)"
[ -f "$CWD/test-results/results.json" ] && jq -e '[.. | .specs? // empty | .[] | .tests[].results[].status] | length > 0' "$CWD/test-results/results.json" >/dev/null 2>&1 && pass "results.json has per-test status" || fail "results.json missing or empty"
find "$CWD/test-results" -name trace.zip 2>/dev/null | grep -q . && pass "trace.zip present" || fail "no trace.zip"

echo "== token cost"
for f in "$HOME/.claude/CLAUDE.md" "$HOME/thoven/CLAUDE.md"; do printf '%s\t%s\n' "$(wc -c < "$f" | tr -d ' ')" "$f"; done
printf '%s\tbytes of agent description lines in ~/.claude/agents\n' "$(cat "$HOME"/.claude/agents/*.md 2>/dev/null | grep '^description:' | wc -c | tr -d ' ')"
printf '%s\tbytes in ~/.claude/rules (loaded only on path match)\n' "$(cat "$HOME"/.claude/rules/*.md 2>/dev/null | wc -c | tr -d ' ')"
exit $red
