#!/usr/bin/env bash
# Pushes this repo's hooks out to every harness that runs them.
#
# On 2026-09-18 the Claude copy of thoven-require-evidence was rewritten from a
# gate that demanded a test artifact into a question, and the Codex copy was not.
# Codex kept forcing full suites for a day. Four copies of each hook existed and
# two were stale. This makes the repo the source and everything else a copy.
#
#   ./sync.sh          report drift, write nothing
#   ./sync.sh --apply  overwrite each harness copy from the repo
#
# It then checks the thoven-law block in each repo's CLAUDE.md through
# install/law.py, over $THOVEN_LAW_REPOS if set, else law.py's defaults. --apply writes the
# block only into THOVEN_LAW_REPOS: the defaults are the main checkouts, which other sessions
# share, so there the block arrives by merge and sync only reports.
set -uo pipefail

cd "$(dirname "$0")"
SRC="$PWD/hooks"
APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

# Only harnesses that already reference a hook get one. This never installs a
# hook into a harness that was not already running it.
TARGETS=("$HOME/.claude/hooks" "$HOME/.codex/hooks" "$HOME/.cursor/hooks"
  "$HOME/.config/devin/hooks" "$HOME/.config/opencode/hooks")

# Files that are not hooks: "repo path|harness path", same only-if-present rule.
PAIRS=("$PWD/opencode/thoven-guard.js|$HOME/.config/opencode/plugins/thoven-guard.js"
  "$PWD/opencode/thoven-uncommitted.js|$HOME/.config/opencode/plugins/thoven-uncommitted.js")

drift=0
check() {
  local src="$1" dst="$2" mode="$3"
  [ -f "$dst" ] || return 0                 # not wired here, leave it alone
  diff -q "$src" "$dst" >/dev/null 2>&1 && return 0
  drift=$((drift + 1))
  if [ "$APPLY" -eq 1 ]; then
    cp "$src" "$dst" && { [ -z "$mode" ] || chmod "$mode" "$dst"; }
    printf 'updated  %s\n' "${dst/#$HOME/~}"
  else
    printf 'DRIFT    %s  (repo %sL, harness %sL)\n' "${dst/#$HOME/~}" \
      "$(wc -l <"$src" | tr -d ' ')" "$(wc -l <"$dst" | tr -d ' ')"
  fi
}

for dest in "${TARGETS[@]}"; do
  [ -d "$dest" ] || continue
  for src in "$SRC"/*; do
    check "$src" "$dest/$(basename "$src")" +x
  done
done
for pair in "${PAIRS[@]}"; do
  check "${pair%%|*}" "${pair#*|}" ""
done

law_args=()
[ "$APPLY" -eq 1 ] && [ -n "${THOVEN_LAW_REPOS:-}" ] && law_args+=(--apply)
# Unquoted on purpose: THOVEN_LAW_REPOS is a space-separated list of repo paths.
# shellcheck disable=SC2086
law_out="$(python3 install/law.py ${law_args[@]+"${law_args[@]}"} ${THOVEN_LAW_REPOS:-})"
law_rc=$?
[ -n "$law_out" ] && printf '%s\n' "$law_out"
if [ "$law_rc" -ne 0 ] || [ -n "$law_out" ]; then
  drift=$((drift + 1))
fi

if [ "$drift" -eq 0 ]; then
  echo "every harness copy matches the repo"
elif [ "$APPLY" -eq 0 ]; then
  echo
  echo "$drift file(s) differ. Run ./sync.sh --apply to push the repo version out."
  exit 1
fi
