#!/usr/bin/env bash
# Runs every case through both arms and scores the classification each produced.
#
#   run-eval.sh              run both arms against the live classifier endpoint
#   run-eval.sh --stub       run with a local stub standing in for the endpoint
#   run-eval.sh --score-only re-score the last run without re-running any agent
#
# Each arm is a worktree with its own project .agents/skills, so the two skills
# cannot see each other. Devin refuses a fresh worktree in print mode, so the run
# passes. Starting devin interactively once in
# each worktree trusts it permanently and makes that flag unnecessary. Scoring reads the classification label the skill emits
# in both arms, which is the one observable they share, plus the classifier's
# own marker file where the treatment arm wrote one.
set -uo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cases="$repo/evals/cases/cases.json"
out="$repo/evals/runs/$(date +%Y%m%d-%H%M%S)"
stub_port=8741
mode="${1:-}"

if [ "$mode" = "--score-only" ]; then
  out=""
  for previous_run in "$repo"/evals/runs/*/; do
    [ -d "$previous_run" ] || continue
    out="$previous_run"
  done
  [ -n "$out" ] || { echo "no previous run to score" >&2; exit 1; }
else
  mkdir -p "$out"
fi

start_stub() {
  "$repo/evals/stub-classifier.sh" "$stub_port" echo & stub_pid=$!
  for _ in $(seq 1 50); do curl -s -o /dev/null "http://127.0.0.1:$stub_port/" 2>/dev/null && break; sleep 0.1; done
  export CLASSIFY_ENDPOINT="http://127.0.0.1:$stub_port/v1/systemone"
  export TYPESAFE_API_KEY="stub"
}
stop_stub() {
  [ -n "${stub_pid:-}" ] || return 0
  kill "$stub_pid" 2>/dev/null
  wait "$stub_pid" 2>/dev/null
}

run_arm() {
  local arm="$1"
  local wt="$HOME/.herdr/worktrees/thv640-$arm"
  [ -d "$wt" ] || { echo "missing worktree for $arm, run build-arms.sh" >&2; return 1; }
  local n; n="$(jq '.cases | length' "$cases")"
  for i in $(seq 0 $((n - 1))); do
    local id prompt marker
    id="$(jq -r ".cases[$i].id" "$cases")"
    # The prompt is the report and nothing else. A case id or a named skill tells
    # the agent it is being measured, and the first run proved it acts on that.
    prompt="$(jq -r ".cases[$i].turns | join(\"\n\n\")" "$cases")"
    marker="$out/$arm.$id.marker.jsonl"
    : > "$marker"
    ( cd "$wt" && printf '%s\n' "$prompt" \
        | THV_MARKER="$marker" CLASSIFY_MARKER="$marker" CLASSIFY_TIMEOUT=10 \
          devin -p --permission-mode smart --prompt-file /dev/stdin ) \
      > "$out/$arm.$id.out" 2> "$out/$arm.$id.err"
    printf '  %-10s %-24s exit=%s  %5s bytes  %s classifier calls\n' \
      "$arm" "$id" "$?" "$(wc -c < "$out/$arm.$id.out" | tr -d ' ')" "$(wc -l < "$marker" | tr -d ' ')"
  done
}

score() {
  echo
  printf '%-24s %-10s %-9s %s\n' CASE ARM LABEL MARKER
  jq -r '.cases[].id' "$cases" | while read -r id; do
    for arm in control treatment; do
      local_out="$out/$arm.$id.out"
      marker="$out/$arm.$id.marker.jsonl"
      label="$(grep -oE '🏷️ Classification:.*' "$local_out" 2>/dev/null | head -1)"
      bound="$(jq -s '[.[] | select(.status=="answered") | .answers | to_entries[] | select(.value.binding)] | length' "$marker" 2>/dev/null || echo 0)"
      printf '%-24s %-10s %-9s %s bound\n' "$id" "$arm" "$([ -n "$label" ] && echo yes || echo no)" "${bound:-0}"
    done
  done
  echo
  echo "artifacts in ${out/#$HOME/~}"
}

if [ "$mode" != "--score-only" ]; then
  [ "$mode" = "--stub" ] && start_stub
  trap stop_stub EXIT
  command -v devin >/dev/null || { echo "devin not on PATH" >&2; exit 1; }
  echo "running both arms, $(jq '.cases|length' "$cases") cases each"
  run_arm control
  run_arm treatment
fi
score
