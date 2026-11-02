#!/usr/bin/env bash
# Input refusals of prod-db-check.sh. None of these cases reaches the network or the database.
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
empty_env=$(mktemp); trap 'rm -f "$empty_env"' EXIT
expect "no deploy time refuses"        2 usage   THOVEN_PROD_ENV=/dev/null --
expect "empty deploy time refuses"     2 usage   THOVEN_PROD_ENV=/dev/null -- ""
expect "local time refuses"            2 usage   THOVEN_PROD_ENV=/dev/null -- "2026-10-15 22:24"
expect "missing env file refuses"      2 "cannot read" THOVEN_PROD_ENV=/nonexistent/thoven-prod.env -- 2026-10-15T22:24:00Z
expect "env without the database url"  2 "THOVEN_PROD_DATABASE_URL is not set" THOVEN_PROD_ENV="$empty_env" THOVEN_PROD_DATABASE_URL= -- 2026-10-15T22:24:00Z
exit $fail
