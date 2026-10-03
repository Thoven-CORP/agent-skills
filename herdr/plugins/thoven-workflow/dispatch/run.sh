#!/usr/bin/env bash
# Dispatch worker: for each repo, a worktree, a workspace rooted there, an agent in its shell pane,
# and the self-brief. picker.sh starts this detached so the session-modal popup can close while a
# fresh worktree installs dependencies.
#
#   run.sh <n> <fe|be|both> <claude|codex|devin> <area> [url]
#   TW_DISPATCH_DRYRUN=1  print every command that would run, run nothing that writes
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/../lib/common.sh"

n="$1" repo_choice="$2" cli="$3" area="$4" url="${5:-}"
ticket="THV-$n"
dry="${TW_DISPATCH_DRYRUN:-0}"
THOVEN_ROOT="${THOVEN_ROOT:-$HOME/thoven}"
WORKTREE_BIN="${TW_WORKTREE_BIN:-$HOME/thoven/agent-skills/enforcement/bin/thoven-worktree}"

[[ "$n" =~ ^[0-9]+$ ]] || { echo "ticket number must be digits, got '$n'" >&2; exit 2; }
[[ "$area" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "area must match ^[a-z0-9][a-z0-9-]*\$, got '$area'" >&2; exit 2; }
case "$repo_choice" in fe) repos=(fe) ;; be) repos=(be) ;; both) repos=(fe be) ;; *) echo "repo must be fe, be or both" >&2; exit 2 ;; esac
IFS=$'\t' read -r kind cli_label model < <(python3 "$HERE/compose.py" meta "$cli")

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
show() { printf '+'; printf ' %q' "$@"; printf '\n'; }
# mut <cmd...>: a command that changes something. Dry-run prints it instead.
mut() { if [ "$dry" = 1 ]; then show "$@"; else "$@"; fi; }
fail() {
  log "FAILED $ticket: $*"
  [ "$dry" = 1 ] && return 0
  "$TW_HERDR" notification show "$ticket dispatch failed" --body "$*" --sound request >/dev/null 2>&1 || true
  tw_tell_main "$ticket-dispatch" "DISPATCH FAILED $ticket: $*" || true
}

repo_dir() { case "$1" in fe) echo frontend ;; be) echo backend ;; esac; }

flags=()
while IFS= read -r -d '' a; do flags+=("$a"); done < <(python3 "$HERE/compose.py" flags "$cli")

main_pane="$(tw_main_pane || true)"
# Per-repo values live in pane_fe, path_be, ...: macOS ships bash 3.2, which has no associative arrays.
setv() { printf -v "$1_$2" '%s' "$3"; }
getv() { local v="$1_$2"; printf '%s' "${!v:-}"; }

# Step 1, per repo: the worktree. thoven-worktree's path is deterministic, so an existing tree at
# that path is reused as it is, whatever branch it carries (thoven-worktree would refuse it).
for r in "${repos[@]}"; do
  path="$THOVEN_ROOT/$(repo_dir "$r")-thv-$n"
  if [ -d "$path" ] && git -C "$path" rev-parse --show-toplevel >/dev/null 2>&1; then
    log "$r: reusing existing worktree $path on $(git -C "$path" branch --show-current 2>/dev/null || echo '?')"
  elif [ "$dry" = 1 ]; then
    show "$WORKTREE_BIN" create "$r" "$area" "$n"
  else
    log "$r: $WORKTREE_BIN create $r $area $n"
    out="$("$WORKTREE_BIN" create "$r" "$area" "$n")" || { fail "$r: thoven-worktree create failed (see $TW_STATE/dispatch logs)"; continue; }
    path="$(printf '%s\n' "$out" | tail -n 1)"
  fi
  setv path "$r" "$path"
done

# Step 2, per repo: workspace, shell pane, agent, brief.
for r in "${repos[@]}"; do
  [ -n "$(getv path "$r")" ] || continue
  path="$(getv path "$r")"
  name="thv-$n-$r"
  label="$ticket $r"
  setv label "$r" "$label"

  if [ "$dry" != 1 ] && "$TW_HERDR" agent get "$name" >/dev/null 2>&1; then
    fail "$r: an agent named $name is already live; not starting a second one"
    continue
  fi

  if [ "$dry" = 1 ]; then
    show "$TW_HERDR" workspace create --cwd "$path" --label "$label" --no-focus
    pane="<root_pane of '$label'>"
  else
    created="$("$TW_HERDR" workspace create --cwd "$path" --label "$label" --no-focus)" || { fail "$r: workspace create failed"; continue; }
    pane="$(jq -r '.result.root_pane.pane_id' <<<"$created")"
    [ -n "$pane" ] && [ "$pane" != null ] || { fail "$r: workspace create returned no root pane"; continue; }
    # agent start needs the shell at its prompt; wait until the shell has drawn something.
    "$TW_HERDR" pane wait-output "$pane" --regex '\S' --timeout 15000 >/dev/null 2>&1 || true
    sleep 1
  fi
  setv pane "$r" "$pane"

  if [ "$dry" = 1 ]; then
    show "$TW_HERDR" agent start "$name" --kind "$kind" --pane "$pane" --timeout 120000 -- "${flags[@]}"
  else
    log "$r: agent start $name --kind $kind --pane $pane -- ${flags[*]}"
    if ! started="$("$TW_HERDR" agent start "$name" --kind "$kind" --pane "$pane" --timeout 120000 -- "${flags[@]}" 2>&1)"; then
      # blocked at startup (a trust or bypass dialog) returns agent_not_ready; a human answers it.
      if grep -q agent_not_ready <<<"$started"; then
        log "$r: $name is blocked at startup, waiting up to 120s for idle"
        "$TW_HERDR" agent wait "$name" --until idle --until done --timeout 120000 >/dev/null 2>&1 ||
          { fail "$r: $name in $pane is blocked at startup (dialog needs an answer); brief not sent"; continue; }
      else
        fail "$r: agent start failed in $pane: $(tail -n 1 <<<"$started")"
        continue
      fi
    fi
  fi
done

# Step 3: the brief, once every pane exists so each brief can name its sibling.
dispatched=()
for r in "${repos[@]}"; do
  [ -n "$(getv pane "$r")" ] || continue
  path="$(getv path "$r")"
  name="thv-$n-$r"
  sibling=""
  for o in "${repos[@]}"; do
    if [ "$o" != "$r" ] && [ -n "$(getv pane "$o")" ]; then
      sibling="$(getv pane "$o") (agent thv-$n-$o, $(repo_dir "$o") at $(getv path "$o"))"
    fi
  done
  branch="$(git -C "$path" branch --show-current 2>/dev/null || true)"
  base="$(git -C "$path" rev-parse --short HEAD 2>/dev/null || true)"
  [ -n "$branch" ] || branch="$area/thv-$n (created by thoven-worktree)"
  [ -n "$base" ] || base="origin/main at creation"
  ctx="$(jq -nc --arg ticket "$ticket" --arg url "$url" --arg path "$path" --arg repo "$(repo_dir "$r")" \
    --arg branch "$branch" --arg base "$base" --arg main "$main_pane" --arg inbox "$TW_INBOX/$ticket.md" \
    --arg sibling "$sibling" \
    '{ticket:$ticket,url:$url,path:$path,repo:$repo,branch:$branch,base:$base,main_pane:$main,inbox_file:$inbox,sibling:$sibling}')"
  brief="$(python3 "$HERE/compose.py" brief "$cli" "$ctx")"
  if [ "$dry" = 1 ]; then
    show "$TW_HERDR" agent prompt "$name" "<self-brief below>"
    printf -- '----- self-brief for %s -----\n%s\n----- end -----\n' "$name" "$brief"
  else
    "$TW_HERDR" agent prompt "$name" "$brief" >/dev/null || { fail "$r: agent prompt to $name failed"; continue; }
  fi
  dispatched+=("$r")
done

[ "${#dispatched[@]}" -gt 0 ] || exit 1
where=""
for r in "${dispatched[@]}"; do where="${where:+$where, }$(getv label "$r") ($(getv pane "$r"))"; done
mut "$TW_HERDR" notification show "$ticket dispatched: $cli_label in $where" --sound done
if [ "$dry" = 1 ]; then
  show tw_tell_main "$ticket-dispatch" "DISPATCHED $ticket: $cli_label ($model) in $where"
else
  tw_tell_main "$ticket-dispatch" "DISPATCHED $ticket: $cli_label ($model) in $where; self-brief sent, expect its MODE message next." || true
fi
