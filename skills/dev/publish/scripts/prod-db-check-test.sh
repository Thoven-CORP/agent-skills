#!/usr/bin/env bash
# Input refusals of prod-db-check.sh. None of these cases reaches the network or the database:
# a stub neonctl on PATH stands in for one that is signed out.
set -u
here=$(cd "$(dirname "$0")" && pwd)
fail=0
expect() { # <label> <want_exit> <stderr_pattern> <env...> -- <args...>
  local label=$1 want=$2 pat=$3; shift 3
  local envs=(); while [ "$1" != -- ]; do envs+=("$1"); shift; done; shift
  local err rc
  err=$(env "${envs[@]}" "$here/prod-db-check.sh" "$@" 2>&1 >/dev/null); rc=$?
  if [ "$rc" = "$want" ] && grep -q "$pat" <<<"$err"; then echo "ok   $label"
  else echo "FAIL $label: exit $rc, stderr: $err"; fail=1; fi
}
fakebin=$(mktemp -d); trap 'rm -rf "$fakebin"' EXIT
printf '#!/bin/sh\nexit 1\n' > "$fakebin/neonctl"; chmod +x "$fakebin/neonctl"
expect "no deploy time refuses"          2 usage PATH=/usr/bin:/bin --
expect "empty deploy time refuses"       2 usage PATH=/usr/bin:/bin -- ""
expect "local time refuses"              2 usage PATH=/usr/bin:/bin -- "2026-10-15 22:24"
expect "missing neonctl refuses"         2 "neonctl is not installed" PATH=/usr/bin:/bin -- 2026-10-15T22:24:00Z
expect "empty connection string refuses" 2 "cannot fetch the production connection string" PATH="$fakebin:/usr/bin:/bin" -- 2026-10-15T22:24:00Z
exit $fail
