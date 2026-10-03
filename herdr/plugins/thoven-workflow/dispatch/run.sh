#!/usr/bin/env bash
# Dispatch worker: the worktree(s), one new tab in the space you clicked from (never a new space,
# THV-1064), one agent that reaches every chosen repo (THV-1065), and the self-brief. picker.sh starts this detached so the session-modal popup can close while a
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

# Reports go to the pane that dispatched (TW_DISPATCHER), else the space's main, else the inbox.
space="${TW_DISPATCH_WS:-}"
dispatcher="${TW_DISPATCHER:-}"
[ -n "$space" ] || { [ -n "$dispatcher" ] && space="$(tw_pane_workspace "$dispatcher")"; }
[ -n "$space" ] || { echo "no current space: dispatch from a pane, so the new tab knows where to open" >&2; exit 2; }
report_to="$dispatcher"
[ -n "$report_to" ] || report_to="$(tw_space_main "$space" || true)"
export TW_REPORT_TO="$report_to"
# Per-repo values live in pane_fe, path_be, ...: macOS ships bash 3.2, which has no associative arrays.
setv() { printf -v "$1_$2" '%s' "$3"; }
getv() { local v="$1_$2"; printf '%s' "${!v:-}"; }

# Step 1: the worktrees, in parallel (THV-1065). thoven-worktree's path is deterministic, so an
# existing tree at that path is reused as it is, whatever branch it carries.
tmp="$(mktemp -d)"
for r in "${repos[@]}"; do
  path="$THOVEN_ROOT/$(repo_dir "$r")-thv-$n"
  if [ -d "$path" ] && git -C "$path" rev-parse --show-toplevel >/dev/null 2>&1; then
    log "$r: reusing existing worktree $path on $(git -C "$path" branch --show-current 2>/dev/null || echo '?')"
    printf '%s\n' "$path" > "$tmp/$r"
  elif [ "$dry" = 1 ]; then
    show "$WORKTREE_BIN" create "$r" "$area" "$n"
    printf '%s\n' "$path" > "$tmp/$r"
  else
    log "$r: $WORKTREE_BIN create $r $area $n"
    ( out="$("$WORKTREE_BIN" create "$r" "$area" "$n")" && printf '%s\n' "$out" | tail -n 1 > "$tmp/$r" ) &
  fi
done
wait
for r in "${repos[@]}"; do
  if [ -s "$tmp/$r" ]; then setv path "$r" "$(cat "$tmp/$r")"; else fail "$r: thoven-worktree create failed (see this log)"; fi
done
rm -rf "$tmp"

# One pane for the ticket, even across both repos: frontend is home and the backend is added
# (THV-1065). A feature spans both repos, so one agent works across them.
home="" other=""
for r in "${repos[@]}"; do
  [ -n "$(getv path "$r")" ] || continue
  if [ -z "$home" ]; then home="$r"; else other="$r"; fi
done
[ -n "$home" ] || exit 1
path="$(getv path "$home")"
other_path=""; [ -n "$other" ] && other_path="$(getv path "$other")"
name="thv-$n"
label="$ticket"
if [ -n "$other" ]; then
  label="$ticket $home+$other"
  # Claude and Codex take a second writable directory; Devin in dangerous mode already reaches any path.
  case "$kind" in claude | codex) flags+=(--add-dir "$other_path") ;; esac
fi

# Step 2: a tab in the current space, its shell pane, the agent.
if [ "$dry" != 1 ] && "$TW_HERDR" agent get "$name" >/dev/null 2>&1; then
  fail "an agent named $name is already live; not starting a second one"
  exit 1
fi
if [ "$dry" = 1 ]; then
  show "$TW_HERDR" tab create --workspace "$space" --cwd "$path" --label "$label" --no-focus
  pane="<root_pane of tab '$label'>"
else
  created="$("$TW_HERDR" tab create --workspace "$space" --cwd "$path" --label "$label" --no-focus)" || { fail "tab create in $space failed"; exit 1; }
  pane="$(jq -r '.result.root_pane.pane_id' <<<"$created")"
  [ -n "$pane" ] && [ "$pane" != null ] || { fail "tab create returned no root pane"; exit 1; }
  # The verifier and tw_tell_main read this to route the pane's escalations back to the dispatcher.
  jq -nc --arg d "$dispatcher" --arg w "$space" --arg t "$ticket" '{dispatcher:$d,workspace:$w,ticket:$t}' \
    > "$TW_STATE/dispatch/by-pane/$(tw_key "$pane").json"
  # agent start needs the shell at its prompt; wait until the shell has drawn something.
  "$TW_HERDR" pane wait-output "$pane" --regex '\S' --timeout 15000 >/dev/null 2>&1 || true
  sleep 1
fi

if [ "$dry" = 1 ]; then
  show "$TW_HERDR" agent start "$name" --kind "$kind" --pane "$pane" --timeout 120000 -- "${flags[@]}"
else
  log "agent start $name --kind $kind --pane $pane -- ${flags[*]}"
  if ! started="$("$TW_HERDR" agent start "$name" --kind "$kind" --pane "$pane" --timeout 120000 -- "${flags[@]}" 2>&1)"; then
    # blocked at startup (a trust or bypass dialog) returns agent_not_ready; a human answers it.
    if grep -q agent_not_ready <<<"$started"; then
      log "$name is blocked at startup, waiting up to 120s for idle"
      "$TW_HERDR" agent wait "$name" --until idle --until done --timeout 120000 >/dev/null 2>&1 ||
        { fail "$name in $pane is blocked at startup (dialog needs an answer); brief not sent"; exit 1; }
    else
      fail "agent start failed in $pane: $(tail -n 1 <<<"$started")"
      exit 1
    fi
  fi
fi

# Step 3: the self-brief.
branch="$(git -C "$path" branch --show-current 2>/dev/null || true)"
base="$(git -C "$path" rev-parse --short HEAD 2>/dev/null || true)"
[ -n "$branch" ] || branch="$area/thv-$n (created by thoven-worktree)"
[ -n "$base" ] || base="origin/main at creation"
other_desc=""
if [ -n "$other" ]; then
  ob="$(git -C "$other_path" branch --show-current 2>/dev/null || echo "$area/thv-$n")"
  obase="$(git -C "$other_path" rev-parse --short HEAD 2>/dev/null || echo "origin/main")"
  other_desc="$other_path ($(repo_dir "$other")), branch $ob, base $obase"
fi
ctx="$(jq -nc --arg ticket "$ticket" --arg url "$url" --arg path "$path" --arg repo "$(repo_dir "$home")" \
  --arg branch "$branch" --arg base "$base" --arg main "$report_to" --arg pane "$pane" \
  --arg inbox "$TW_INBOX/$ticket.md" --arg other "$other_desc" \
  '{ticket:$ticket,url:$url,path:$path,repo:$repo,branch:$branch,base:$base,main_pane:$main,inbox_file:$inbox,other_repo:$other,pane:$pane}')"
brief="$(python3 "$HERE/compose.py" brief "$cli" "$ctx")"
if [ "$dry" = 1 ]; then
  show "$TW_HERDR" agent prompt "$name" "<self-brief below>"
  printf -- '----- self-brief for %s -----\n%s\n----- end -----\n' "$name" "$brief"
else
  "$TW_HERDR" agent wait "$name" --until idle --until done --timeout 60000 >/dev/null 2>&1 || true
  # A long brief can land in Claude Code's input box after the submit key, so it sits there unsent
  # and the pane stays idle (THV-981, 2026-10-03). Confirm the agent started; press Enter once if not.
  if ! "$TW_HERDR" agent prompt "$name" "$brief" --wait --until working --until blocked --timeout 30000 >/dev/null 2>&1; then
    log "$name did not start on the brief; pressing Enter"
    "$TW_HERDR" agent send-keys "$name" enter >/dev/null 2>&1 || true
    "$TW_HERDR" agent wait "$name" --until working --until blocked --until done --timeout 30000 >/dev/null 2>&1 ||
      { fail "$name in $pane never started on the brief; it may sit unsent in the input box"; exit 1; }
  fi
fi

where="$label ($pane)"
mut "$TW_HERDR" notification show "$ticket dispatched: $cli_label in $where" --sound done
if [ "$dry" = 1 ]; then
  show tw_tell_main "$ticket-dispatch" "DISPATCHED $ticket: $cli_label ($model) in $where"
else
  tw_tell_main "$ticket-dispatch" "DISPATCHED $ticket: $cli_label ($model) in $where; self-brief sent, expect its MODE message next." || true
fi
