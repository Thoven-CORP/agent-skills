#!/usr/bin/env bash
# Tests for mine-transcripts.sh: corrections.tsv keeps what Andres typed and drops harness wrappers.
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
mine() {
  local home="$lab/$1.$2" dest
  case "$1" in
    claude) dest="$home/.claude/projects/fixture/${2%.jsonl}.jsonl" ;;
    codex)  dest="$home/.codex/sessions/2026/11/23/rollout-${2%.jsonl}.jsonl" ;;
    empty)  dest="" ;;
  esac
  mkdir -p "$home"
  [[ -z "$dest" ]] || { mkdir -p "$(dirname "$dest")"; cp "$fixtures/$2" "$dest"; }
  HOME="$home" bash "$script" --since 2026-11-01 --out "$home/out" >/dev/null 2>&1
  tail -n +2 "$home/out/corrections.tsv"
}
rows() { [[ "$(mine "$1" "$2" | grep -c .)" == "$3" ]]; }

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

((failures == 0)) && echo "all passed" || { echo "$failures failed"; exit 1; }
