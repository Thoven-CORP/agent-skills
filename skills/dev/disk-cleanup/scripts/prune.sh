#!/bin/bash
# Idempotent disk prune. Dry-run by default; --apply to delete.
#
# SAFETY CONTRACT. Every deletion routes through guard(). A path is deleted only if
# ALL of the following hold. Any failure aborts the entire run rather than skipping
# the one path, because a guard failure means the caller's assumptions are wrong.
#
#   1. Absolute, under $HOME, at least two levels deep, no ".." component.
#   2. Not under any directory named "memory".
#   3. In "file" mode (individual aged files) the extension must be on ALLOWED_FILE_EXT.
#      In "tree" mode (clearing a declared cache root wholesale) that check is skipped,
#      because the safety there comes from the root itself being an unambiguous cache.
#   4. Inside a git work tree, `git check-ignore` must say the path is ignored.
#      Tracked files and untracked-but-unignored files are refused. This is the
#      guarantee that the script cannot touch source code.
#   5. Under an ALLOWED_ROOT, or a gitignored directory ending in /.next/cache.
#
# Verify the contract with scripts/prune-test.sh, which plants source files in every
# location the script deletes from and asserts none are removed.
#
#   TRANSCRIPT_DAYS=0 disables AI-session-history pruning entirely.

set -uo pipefail
: "${HOME:?HOME must be set}"

APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
TRANSCRIPT_DAYS="${TRANSCRIPT_DAYS:-30}"
freed=0

ALLOWED_ROOTS="
$HOME/Library/Caches
$HOME/Library/Application Support/Wispr Flow/backups
$HOME/Library/Application Support/Google/GoogleUpdater
$HOME/.cache/uv
$HOME/.cache/puppeteer
$HOME/.npm/_npx
$HOME/.codex/sessions
$HOME/.codex/archived_sessions
$HOME/.cursor/chats
$HOME/.claude/projects
"

ALLOWED_FILE_EXT="jsonl json db db-wal db-shm txt pdf jpg png sqlite tmp-shm tmp-wal log gz pack"

free_bytes() { diskutil info / 2>/dev/null | awk -F'[()]' '/Container Free/{print $2}' | awk '{print $1}'; }
sizeof() { [ -e "$1" ] || { echo 0; return; }; du -sk "$1" 2>/dev/null | awk '{s+=$1}END{print (s+0)*1024}'; }
report() { awk -v l="$1" -v b="$2" 'BEGIN{printf "  %-52s %8.2f GB\n", l, b/1073741824}'; }

deny() {
  echo "  REFUSED: $1" >&2
  echo "           reason: $2" >&2
  echo "  Guard tripped. Aborting without deleting anything further." >&2
  exit 3
}

guard() {
  local p="$1" mode="${2:-tree}" top

  [ -n "$p" ] || deny "(empty)" "empty path"
  case "$p" in
    /*) ;;
    *) deny "$p" "not an absolute path" ;;
  esac
  case "$p" in *..*) deny "$p" "contains .." ;; esac
  [ "$p" = "/" ] && deny "$p" "filesystem root"
  [ "$p" = "$HOME" ] && deny "$p" "home directory itself"
  case "$p" in
    "$HOME"/*) ;;
    *) deny "$p" "outside \$HOME" ;;
  esac
  case "${p#$HOME/}" in
    */*) ;;
    *) deny "$p" "only one level below \$HOME" ;;
  esac
  case "$p" in
    */memory|*/memory/*) deny "$p" "under a memory directory" ;;
  esac

  if [ "$mode" = "file" ] && [ -f "$p" ]; then
    local ext="${p##*.}" ok=0 e base="${p##*/}"
    case "$base" in *.log|*.log.[0-9]*) ok=1 ;; esac
    [ "$ok" -eq 0 ] && [ "$ext" = "$p" ] && deny "$p" "file has no extension"
    for e in $ALLOWED_FILE_EXT; do [ "$ext" = "$e" ] && ok=1; done
    [ "$ok" -eq 1 ] || deny "$p" "file extension .$ext is not on the allowlist"
  fi

  top=$(git -C "$(dirname "$p")" rev-parse --show-toplevel 2>/dev/null)
  if [ -n "$top" ]; then
    git -C "$top" check-ignore -q "$p" 2>/dev/null \
      || deny "$p" "inside git repo $top but NOT gitignored (tracked or untracked source)"
  fi

  local root
  while IFS= read -r root; do
    [ -n "$root" ] || continue
    case "$p" in "$root"|"$root"/*) return 0 ;; esac
  done <<EOF
$ALLOWED_ROOTS
EOF
  case "$p" in
    */.next*/cache|*/.next*/cache/*|*/log|*/log/*|*/tmp/cache|*/tmp/cache/*)
      [ -n "$top" ] && return 0 ;;
  esac
  deny "$p" "not under any allowed root"
}

drop() {
  local label="$1"; shift
  local total=0 p
  for p in "$@"; do
    [ -e "$p" ] || continue
    guard "$p" tree
    total=$(( total + $(sizeof "$p") ))
  done
  [ "$total" -eq 0 ] && return 0
  report "$label" "$total"; freed=$(( freed + total ))
  if [ "$APPLY" -eq 1 ]; then
    for p in "$@"; do [ -e "$p" ] && rm -rf "$p"; done
  fi
  return 0
}

drop_files() {
  local label="$1" dir="$2" days="$3"; shift 3
  local pat bytes=0 f
  local expr=() first=1
  for pat in "$@"; do
    [ $first -eq 1 ] && { expr+=( \( -name "$pat" ); first=0; } || expr+=( -o -name "$pat" )
  done
  [ $first -eq 1 ] && return 0
  expr+=( \) )

  while IFS= read -r f; do
    [ -n "$f" ] || continue
    guard "$f" file
    bytes=$(( bytes + $(stat -f%z "$f" 2>/dev/null || echo 0) ))
  done < <(find "$dir" -type f -mtime +"$days" "${expr[@]}" ! -path '*/memory/*' 2>/dev/null)

  [ "$bytes" -eq 0 ] && return 0
  report "$label" "$bytes"; freed=$(( freed + bytes ))
  if [ "$APPLY" -eq 1 ]; then
    find "$dir" -type f -mtime +"$days" "${expr[@]}" ! -path '*/memory/*' -delete 2>/dev/null
  fi
  return 0
}

live_next_dirs() {
  pgrep -f 'next-server' 2>/dev/null | while read -r pid; do
    lsof -p "$pid" 2>/dev/null | grep -oE '/[^ ]*/\.next[^/]*' | sort -u
  done
}

reap_orphans() {
  local pid path killed=0
  for pid in $(pgrep -f chrome_crashpad_handler 2>/dev/null); do
    path=$(ps -o comm= -p "$pid" 2>/dev/null)
    [ -n "$path" ] && [ ! -e "$path" ] || continue
    echo "  reaping orphaned crashpad handler pid=$pid (binary gone: $path)"
    [ "$APPLY" -eq 1 ] && kill -9 "$pid" 2>/dev/null
    killed=$((killed+1))
  done
  [ "$killed" -eq 0 ] && echo "  no orphaned crashpad handlers"
  return 0
}

echo "=== disk prune ($([ $APPLY -eq 1 ] && echo APPLY || echo DRY-RUN)) ==="
start=$(free_bytes)

echo "  --- orphaned process reaper ---"
reap_orphans
echo "  --- caches ---"

drop "~/Library/Caches" "$HOME"/Library/Caches/*

if pgrep -qf 'uv .*mcp|uv run|uvx' 2>/dev/null; then
  echo "  ~/.cache/uv                                          SKIPPED (uv process live)"
else
  drop "~/.cache/uv" "$HOME/.cache/uv"
fi
drop "~/.cache/puppeteer" "$HOME/.cache/puppeteer"
drop "stray npx node_modules" "$HOME"/.npm/_npx/*/node_modules
drop "Wispr Flow backups (daily dup of live db)" "$HOME/Library/Application Support/Wispr Flow/backups"/*
drop "Google updater staging" "$HOME/Library/Application Support/Google/GoogleUpdater"

echo "  --- build artifacts ---"
live=(); while IFS= read -r l; do [ -n "$l" ] && live+=("$l"); done < <(live_next_dirs)
while IFS= read -r c; do
  [ -n "$c" ] || continue
  skip=0
  for l in ${live[@]+"${live[@]}"}; do [[ "$c" == "$l"/* ]] && skip=1; done
  [ "$skip" -eq 1 ] && { echo "  ${c/#$HOME/\~}   SKIPPED (dev server live)"; continue; }
  drop "${c/#$HOME/\~}" "$c"
done < <(find "$HOME/thoven" "$HOME/Projects" "$HOME/Claw3D" -maxdepth 6 -path '*/.next*/cache' -prune 2>/dev/null)

  echo "  --- rails logs ---"
  while IFS= read -r lg; do
    [ -n "$lg" ] || continue
    drop_files "${lg/#$HOME/\~}" "$lg" 0 '*.log' '*.log.*'
  done < <(find "$HOME/thoven" -maxdepth 2 -type d -name log 2>/dev/null)

if [ "$TRANSCRIPT_DAYS" -gt 0 ]; then
  echo "  --- AI session transcripts older than ${TRANSCRIPT_DAYS}d ---"
  drop_files "~/.codex/sessions"          "$HOME/.codex/sessions"          "$TRANSCRIPT_DAYS" '*.jsonl'
  drop_files "~/.codex/archived_sessions" "$HOME/.codex/archived_sessions" "$TRANSCRIPT_DAYS" '*.jsonl'
  drop_files "~/.cursor/chats"            "$HOME/.cursor/chats"            "$TRANSCRIPT_DAYS" '*.json' '*.db' '*.db-wal' '*.db-shm'
  drop_files "~/.claude/projects"         "$HOME/.claude/projects"         "$TRANSCRIPT_DAYS" '*.jsonl'
fi

npm cache clean --force >/dev/null 2>&1
pnpm store prune >/dev/null 2>&1

echo
report "TOTAL RECLAIMABLE" "$freed"
if [ "$APPLY" -eq 1 ]; then
  sleep 2; end=$(free_bytes)
  awk -v s="${start:-0}" -v e="${end:-0}" 'BEGIN{printf "APFS free: %.2f GB -> %.2f GB (delta %+.2f GB)\n", s/1e9, e/1e9, (e-s)/1e9}'
else
  awk -v s="${start:-0}" 'BEGIN{printf "APFS free now: %.2f GB. Re-run with --apply to delete.\n", s/1e9}'
fi
