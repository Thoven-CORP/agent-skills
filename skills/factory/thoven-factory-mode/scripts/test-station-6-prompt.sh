#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prompt="$DIR/../references/station-6-fix-prompt.md"
skill="$DIR/../SKILL.md"

grep -q 'Open the PR as a draft only' "$prompt"
grep -q 'Do not mark the PR ready' "$prompt"
grep -q '~/thoven/agent-skills/skills/factory/factory-rules/scripts/enforce.sh' "$prompt"
if grep -E 'run skills/factory/factory-rules/scripts/enforce\.sh' "$prompt"; then
  echo "FAIL  prompt still points at enforce.sh inside the target repo" >&2
  exit 1
fi
if grep -q '^disable-model-invocation:' "$skill"; then
  echo "FAIL  thoven-factory-mode still sets disable-model-invocation" >&2
  exit 1
fi
echo "ok    station-6 prompt is draft-only and uses agent-skills enforce.sh"
echo "ok    disable-model-invocation removed"
echo "all station-6 prompt checks passed"
