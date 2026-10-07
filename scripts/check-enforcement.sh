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
rm -rf "$R" "$S2"

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

echo "== 7 THV-640 router destinations"
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
O="$HOME/.agents/skills-on-demand/orchestrate"
if [ ! -x "$SD/check-skill-routes.sh" ]; then
  pass "check-skill-routes.sh not in this commit, skip"
elif [ -d "$O" ]; then
  routes_args=("$O/SKILL.md" "$O"/references/*.md)
  for s in orchestrate-frontend.json orchestrate-backend.json; do
    f="$SD/../evals/schemas/$s"
    [ -f "$f" ] && routes_args+=("$f")
  done
  "$SD/check-skill-routes.sh" "${routes_args[@]}" >/tmp/routes-$$.txt 2>&1 \
    && pass "every orchestrate destination resolves" \
    || fail "dead orchestrate destinations: $(grep -c '^DEAD' /tmp/routes-$$.txt) ($(grep '^DEAD' /tmp/routes-$$.txt | awk '{print $2}' | paste -sd, -))"
  rm -f /tmp/routes-$$.txt
else
  fail "orchestrate not installed at ~/.agents/skills-on-demand"
fi

echo "== 8 THV-640 evidence schema and verify-this"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EV="$REPO/evals/schemas/evidence.json"
CL="$REPO/enforcement/bin/classify"
VT="$REPO/enforcement/skill-overrides/verify-this.SKILL.md"
if [ ! -f "$EV" ]; then fail "evals/schemas/evidence.json missing"
elif ! jq -e '.id=="evidence" and .model and .questions.evidence.criteria.none' "$EV" >/dev/null; then fail "evidence schema lacks id, model, or none"
else pass "evidence schema is well-formed"; fi
if [ ! -x "$CL" ]; then fail "enforcement/bin/classify missing"
else
  nokey="$(env -u TYPESAFE_API_KEY "$CL" "$EV" <<<'Done, renamed LessonSummary.' 2>/dev/null)"
  [ "$(jq -r '.status + "/" + .reason' <<<"$nokey" 2>/dev/null)" = "undecided/no-key" ] \
    && pass "no key fails open with no-key" || fail "no key: $nokey"
  port=8722
  "$REPO/evals/stub-classifier.sh" "$port" echo >/dev/null 2>&1 & stub=$!
  for _ in $(seq 1 50); do curl -s -o /dev/null "http://127.0.0.1:$port/" 2>/dev/null && break; sleep 0.1; done
  echo_out="$(TYPESAFE_API_KEY=test CLASSIFY_ENDPOINT="http://127.0.0.1:$port/v1/systemone" CLASSIFY_TIMEOUT=2 \
    "$CL" "$EV" <<<'Renamed LessonSummary. Nothing runtime changed.' 2>/dev/null)"
  kill "$stub" 2>/dev/null; wait "$stub" 2>/dev/null
  [ "$(jq -r '.status + "/" + (.answers.evidence.value // "") + "/" + (.answers.evidence.binding|tostring)' <<<"$echo_out")" = "answered/type_check/true" ] \
    && pass "stub echo binds type_check on a types-only claim" || fail "stub echo: $echo_out"
fi
if [ ! -f "$VT" ]; then fail "verify-this override missing"
else
  grep -q 'classify ~/thoven/agent-skills/evals/schemas/evidence.json' "$VT" \
    && pass "verify-this override calls classify" || fail "verify-this override has no classify invocation"
  grep -q '## Fallback surfaces' "$VT" \
    && pass "six-surface list is behind the undecided pointer" || fail "fallback heading missing"
  awk '/^## Workflow$/,/^## /' "$VT" | grep -q 'CLI/TUI behavior' \
    && fail "six-surface list still sits in the always-read workflow" \
    || pass "workflow step does not contain the six-surface list"
fi
DS="$REPO/skills/dev/thoven-designer/SKILL.md"
OS="$REPO/skills/dev/orchestrate/SKILL.md"
IS="$REPO/skills/dev/investigate-thoven/SKILL.md"
if [ -f "$DS" ] && grep -q 'evals/schemas/thoven-designer.json' "$DS"; then
  framing=0
  for f in "$DS" "$OS" "$IS" "$VT"; do
    if grep -q 'classify ' "$f"; then pass "$(basename "$(dirname "$f")") calls classify"
    else fail "$(basename "$f") has no classify invocation"; framing=1; fi
  done
  if grep -qE '^#### Dimension [123]:' "$IS"; then fail "investigate still has Dimension 1-3 tables in SKILL.md"; framing=1
  else pass "investigate Dimension 1-3 tables are not in SKILL.md"; fi
  if grep -qE '^## The map$|^## When to use$|^## Not for$' "$DS"; then fail "designer still has the map or fork tables in SKILL.md"; framing=1
  else pass "designer map and fork tables are not in SKILL.md"; fi
  if grep -qE '^\| .* \| `?/' "$OS"; then fail "orchestrate SKILL.md still has the destination table"; framing=1
  else pass "orchestrate destination table is not in SKILL.md"; fi
else
  pass "THV-640 skill rewrites not in this commit, skip framing"
fi

echo "== token cost"
for f in "$HOME/.claude/CLAUDE.md" "$HOME/thoven/CLAUDE.md"; do printf '%s\t%s\n' "$(wc -c < "$f" | tr -d ' ')" "$f"; done
printf '%s\tbytes of agent description lines in ~/.claude/agents\n' "$(cat "$HOME"/.claude/agents/*.md 2>/dev/null | grep '^description:' | wc -c | tr -d ' ')"
printf '%s\tbytes in ~/.claude/rules (loaded only on path match)\n' "$(cat "$HOME"/.claude/rules/*.md 2>/dev/null | wc -c | tr -d ' ')"
exit $red
