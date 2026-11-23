#!/usr/bin/env bash
# Tests for mine-transcripts.sh: corrections.tsv keeps what Andres typed and drops harness wrappers,
# tags each row by origin (main, subagent, pane) and credits every skill the session loaded, never
# one it only edited or mentioned.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
script="$here/mine-transcripts.sh"
fixtures="$here/fixtures/mine-transcripts"
lab="$(mktemp -d)"
trap 'rm -rf "$lab"' EXIT
failures=0

check() {
  local label="$1"; shift
  if "$@"; then printf 'ok   %s\n' "$label"; else printf 'FAIL %s\n' "$label"; ((failures += 1)); fi
}

# Mines one fixture in a fresh HOME and prints the corrections.tsv rows, header dropped.
# skills.tsv stays under $lab/<kind>.<fixture>/out for skills_of.
mine() {
  local home="$lab/$1.$2" dest
  case "$1" in
    claude) dest="$home/.claude/projects/fixture/${2%.jsonl}.jsonl" ;;
    subagent) dest="$home/.claude/projects/fixture/parent-session/subagents/agent-${2%.jsonl}.jsonl" ;;
    codex)  dest="$home/.codex/sessions/2026/11/23/rollout-${2%.jsonl}.jsonl" ;;
    empty)  dest="" ;;
  esac
  mkdir -p "$home"
  [[ -z "$dest" ]] || { mkdir -p "$(dirname "$dest")"; cp "$fixtures/$2" "$dest"; }
  HOME="$home" bash "$script" --since 2026-11-01 --out "$home/out" >/dev/null 2>&1
  tail -n +2 "$home/out/corrections.tsv"
}
rows() { [[ "$(mine "$1" "$2" | grep -c .)" == "$3" ]]; }
# skills.tsv rows of an already mined fixture as "skill origin", sorted.
skills_of() { tail -n +2 "$lab/$1.$2/out/skills.tsv" | awk -F'\t' '{print $3" "$5}' | sort | tr '\n' ';'; }

typed="$(mine claude typed.jsonl)"
check "keeps a typed correction" test "$(printf '%s\n' "$typed" | grep -c .)" = 1
check "tags the kept row with its promptSource" test "$(printf '%s' "$typed" | cut -f8)" = typed
check "drops a suggestion_accepted prompt" rows claude suggestion-accepted.jsonl 0
check "drops a CI-monitor event" rows claude ci-monitor.jsonl 0
check "drops an artifact-view wrapper with nothing typed after it" rows claude artifact-view.jsonl 0
check "drops a compaction preamble" rows claude compaction.jsonl 0
check "drops a Codex internal-context goal continuation" rows codex codex-goal.jsonl 0
viewed="$(mine claude artifact-view-typed.jsonl)"
check "keeps the typed text after an artifact-view wrapper, wrapper stripped" \
  test "$(printf '%s' "$viewed" | cut -f7)" = "these examples are wrong, look again at modern startups"
check "empty input yields no rows" rows empty none 0
check "empty input writes no skills rows" test "$(tail -n +2 "$lab/empty.none/out/skills.tsv" | grep -c .)" = 0

credit="$(mine claude skills-credit.jsonl)"
check "credits every skill loaded, in load order, skipping a dispatch prompt" \
  test "$(printf '%s' "$credit" | cut -f9)" = "andres-mode,poteto-mode,qa-flow"
check "keeps the last skill loaded" test "$(printf '%s' "$credit" | cut -f5)" = qa-flow
check "tags a main session's row main" test "$(printf '%s' "$credit" | cut -f10)" = main
check "records a Skill call, a meta-only load and a Read once each in skills.tsv" \
  test "$(skills_of claude skills-credit.jsonl)" = "andres-mode main;poteto-mode main;qa-flow main;"

for only in mention-only edit-only; do
  row="$(mine claude "$only.jsonl")"
  check "credits nothing to a correction in a $only session" test "$(printf '%s' "$row" | cut -f5,9)" = "$(printf '\t')"
  check "writes no skills.tsv row for a $only session" test "$(skills_of claude "$only.jsonl")" = ""
done

sub="$(mine subagent subagent.jsonl)"
check "mines a subagent transcript, skipping its brief" test "$(printf '%s\n' "$sub" | grep -c .)" = 1
check "tags the subagent row subagent" test "$(printf '%s' "$sub" | cut -f10)" = subagent
check "strips the teammate wrapper and sender label" \
  test "$(printf '%s' "$sub" | cut -f7)" = "wrong, keep the spec and fix its wait instead of deleting it."
check "credits the subagent's skill" test "$(printf '%s' "$sub" | cut -f9)" = test-audit
check "records the subagent's skill use by origin" test "$(skills_of subagent subagent.jsonl)" = "test-audit subagent;"

pane="$(mine claude pane.jsonl)"
check "mines a pane, skipping its brief" test "$(printf '%s\n' "$pane" | grep -c .)" = 1
check "tags the pane row pane" test "$(printf '%s' "$pane" | cut -f10)" = pane
check "strips main's relay label in a pane" \
  test "$(printf '%s' "$pane" | cut -f7)" = "that is wrong again, the stepper has two steps not three."

codex="$(mine codex codex-skill.jsonl)"
check "records Codex skill use in skills.tsv" test "$(skills_of codex codex-skill.jsonl)" = "poteto-mode main;qa-flow main;"
check "credits Codex skills on the correction row" test "$(printf '%s' "$codex" | cut -f9)" = "qa-flow,poteto-mode"
check "drops the Codex <skill> body as a turn" test "$(printf '%s\n' "$codex" | grep -c .)" = 1

csub="$(mine codex codex-subagent.jsonl)"
check "tags a Codex subagent row subagent, skipping its prompt" \
  test "$(printf '%s' "$csub" | cut -f10):$(printf '%s\n' "$csub" | grep -c .)" = subagent:1
check "keeps a Codex subagent's prompts out of prompts.tsv" \
  test "$(tail -n +2 "$lab/codex.codex-subagent.jsonl/out/prompts.tsv" | grep -c .)" = 0

((failures == 0)) && echo "all passed" || { echo "$failures failed"; exit 1; }
