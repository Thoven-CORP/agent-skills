#!/usr/bin/env bash

staging_control() {
  if [ "$(hostname)" = Mac.attlocal.net ]; then
    "$HOME/thoven/backend/bin/staging-lifecycle" "$@"
  else
    local command='exec "$HOME/thoven/backend/bin/staging-lifecycle"' argument
    for argument in "$@"; do printf -v command '%s %q' "$command" "$argument"; done
    ssh -o BatchMode=yes -o ConnectTimeout=10 thoven-mini-ssh "$command"
  fi
}

staging_hold_acquire() {
  local token until
  until=$(iso_utc $(( $(date +%s) + 86400 ))) || return 1
  token=$(staging_control hold --until "$until" --reason "$1" --apply) || return 1
  [[ $token =~ ^[0-9a-f]{32}$ ]] || { echo 'Staging hold returned an invalid token' >&2; return 1; }
  printf '%s' "$token"
}

staging_hold_release() {
  [ -n "$1" ] || return 0
  [[ $1 =~ ^[0-9a-f]{32}$ ]] || return 1
  staging_control release-hold --token "$1" --apply
}

staging_hold_refresh() {
  local old token
  old=$(rel '.staging_hold // empty')
  token=$(staging_hold_acquire "release $(rel .id)") || die 'cannot acquire shared staging hold; release stopped'
  rel_set --arg token "$token" '.staging_hold=$token' || die 'cannot save shared staging hold; it expires within 24 hours'
  staging_hold_release "$old" || die 'cannot release previous staging hold; replacement is active'
}
