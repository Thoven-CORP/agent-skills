#!/usr/bin/env bash

staging_control() {
  local command='if [ -f "$HOME/.config/thoven/staging-lifecycle.env" ]; then set -a; . "$HOME/.config/thoven/staging-lifecycle.env" || exit; set +a; fi; exec "$HOME/thoven/backend/bin/staging-lifecycle"' argument
  for argument in "$@"; do printf -v command '%s %q' "$command" "$argument"; done
  if [ "$(hostname)" = Mac.attlocal.net ]; then
    bash -c "$command"
  else
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


staging_require_ready() {
  staging_control probe --apply || {
    echo 'Combined staging is not verified. Acquire a hold, run staging-lifecycle up --apply with STAGING_ADMIN_TOKEN on the mini, then explicitly deploy the reviewed main SHA to the running service and verify its revision and a fresh probe before planning from staging. Stop the legacy worker before the first combined cutover.' >&2
    return 1
  }
}
