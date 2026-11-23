#!/usr/bin/env bash
# check-no-filing.sh — find skill lines that teach filing a found problem instead of fixing it.
#
# The law's "Own what you find" fixes a problem in its round, makes it a
# sub-issue, or takes it to Andres. On 2026-11-23 about twenty skill lines
# still said "file it as a follow-up", so each fix in the law leaked back out.
#
# Usage:
#   check-no-filing.sh [--allow FILE] [PATH ...]
#
# With no PATH it scans skills/**/*.md (LEARNINGS.md and archive/ excluded) and
# the law. A PATH may be a file or a directory. A hit line that matches an
# allowlist pattern (one extended regex per line, # comments) is a sanctioned
# case. Exits 1 on a hit, 2 when there is nothing to scan: a check that read no
# line proves nothing.
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
allow="$root/scripts/check-no-filing.allow"
if [[ "${1:-}" == "--allow" ]]; then allow="${2:?--allow needs a file}"; shift 2; fi
[[ -f "$allow" ]] || { echo "REFUSE allowlist not found: $allow" >&2; exit 2; }

# Phrasings that send a found problem to a ticket or a list instead of a fix.
patterns=(
  '\bas (an? |named |its own )?follow-?ups?\b'
  '\b(is|are|becomes?) (an? |its own )?follow-?ups?\b'
  '\b(log|list|record|file|leave)( one| each| the| a)?( concrete| maintenance| named)* follow-?ups?\b'
  '\bfollow-?ups? (filed|ticket)'
  '\b(becomes?|is) its own( [a-z]+)? ticket\b'
  '\bfile (it|them|each( one)?|the rest|a finding|every [a-z]+) (as|in|into|to|with)\b'
  '\b(goes|go|put [a-z ]+) (in|to|into) (the )?backlog\b'
  '\bLinear line\b'
  'future-improvements'
  '/(tech-debt|manage-todos)\b'
  '\b(log|track|record) (the |each |all )?findings\b'
)

files=()
add() {
  local p="$1"
  if [[ -d "$p" ]]; then
    while IFS= read -r f; do files+=("$f"); done < <(find "$p" -name '*.md' -not -name LEARNINGS.md -not -path '*/archive/*' -type f | sort)
  elif [[ -f "$p" ]]; then
    files+=("$p")
  fi
}
if [[ "$#" -eq 0 ]]; then
  add "$root/skills"
  add "$root/enforcement/rules/thoven-law.md"
else
  for p in "$@"; do add "$p"; done
fi

lines=0
[[ "${#files[@]}" -gt 0 ]] && lines="$(cat "${files[@]}" | grep -c '')"
if [[ "$lines" -eq 0 ]]; then
  echo "REFUSE nothing to scan (${#files[@]} files, 0 lines)" >&2
  exit 2
fi

joined="$(IFS='|'; echo "${patterns[*]}")"
allowed="$(grep -v -e '^#' -e '^[[:space:]]*$' "$allow" | paste -sd'|' -)"
hits="$(grep -HnEi -- "$joined" "${files[@]}" | { if [[ -n "$allowed" ]]; then grep -vEi -- "$allowed"; else cat; fi; } || true)"

if [[ -n "$hits" ]]; then
  printf '%s\n' "$hits" | sed "s#^$root/##"
  echo "FAIL $(printf '%s\n' "$hits" | grep -c '') line(s) teach filing a found problem; point them at the law's \"Own what you find\" or allowlist a sanctioned case in ${allow#"$root/"}"
  exit 1
fi
echo "ok   ${#files[@]} files, $lines lines, no line teaches filing a found problem"
