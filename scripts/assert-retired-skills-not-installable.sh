#!/usr/bin/env bash
# Fail if a retired Thoven skill is installable again.
# npx skills discovers any SKILL.md in this repo (including archive/).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
fail=0

must_not_exist=(
  "skills/dev/brainstorm/SKILL.md"
  "skills/dev/investigate/SKILL.md"
  "skills/dev/dev/SKILL.md"
  "skills/dev/codebase-memory/SKILL.md"
  "skills/dev/dialkit/SKILL.md"
  "skills/dev/thoven-rails-security/SKILL.md"
  "skills/dev/thoven-db-migration-security/SKILL.md"
  "skills/dev/herdr/SKILL.md"
  "skills/dev/feature-orchestrator/SKILL.md"
  "skills/dev/design-workflow-outline/SKILL.md"
  "skills/dev/building-thoven-ui/SKILL.md"
)

echo "assert-retired-skills-not-installable"
for rel in "${must_not_exist[@]}"; do
  if [[ -f "$root/$rel" ]]; then
    echo "FAIL  live path is back: $rel"
    fail=1
  else
    echo "ok    absent $rel"
  fi
done

if [[ -d "$root/archive" ]]; then
  while IFS= read -r f; do
    echo "FAIL  installer-visible SKILL.md under archive/: ${f#"$root/"}"
    fail=1
  done < <(find "$root/archive" -name SKILL.md -type f)
fi

if [[ "$fail" -ne 0 ]]; then
  echo "A merge restored a retired skill. Delete the live SKILL.md (keep archive/…/SKILL.md.archived)."
  exit 1
fi
echo "ok    archive has no SKILL.md; retired live paths are gone"
