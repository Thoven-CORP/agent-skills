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
set -uo pipefail

cd "$(dirname "$0")"
SRC="$PWD/hooks"
APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

# Only harnesses that already reference a hook get one. This never installs a
# hook into a harness that was not already running it.
TARGETS=("$HOME/.claude/hooks" "$HOME/.codex/hooks")

drift=0
for dest in "${TARGETS[@]}"; do
  [ -d "$dest" ] || continue
  for src in "$SRC"/*; do
    name="$(basename "$src")"
    [ -f "$dest/$name" ] || continue        # not wired here, leave it alone
    if diff -q "$src" "$dest/$name" >/dev/null 2>&1; then
      continue
    fi
    drift=$((drift + 1))
    if [ "$APPLY" -eq 1 ]; then
      cp "$src" "$dest/$name" && chmod +x "$dest/$name"
      printf 'updated  %s\n' "${dest/#$HOME/~}/$name"
    else
      printf 'DRIFT    %s  (repo %sL, harness %sL)\n' "${dest/#$HOME/~}/$name" \
        "$(wc -l <"$src" | tr -d ' ')" "$(wc -l <"$dest/$name" | tr -d ' ')"
    fi
  done
done

if [ "$drift" -eq 0 ]; then
  echo "every harness copy matches the repo"
elif [ "$APPLY" -eq 0 ]; then
  echo
  echo "$drift file(s) differ. Run ./sync.sh --apply to push the repo version out."
  exit 1
fi
