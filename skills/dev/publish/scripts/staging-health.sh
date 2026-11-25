#!/usr/bin/env bash
# Checks that staging.thoven.co is a sound staging environment, from outside. It goes beyond the
# harness and deploy:smoke, which exercise the backend: this reads what the visitor's browser gets.
#
#   staging-health.sh [FRONTEND_SHA]    default: the tip of origin/main
#
# Exit 0: every check passed. Exit 1: a check failed. Exit 2: nothing failed but a check was skipped
# (the staging backend sleeps between sessions), so the run is not a full pass.
set -uo pipefail

FE_REPO=${FE_REPO:-$HOME/thoven/frontend}
SITE=https://staging.thoven.co
API=https://thoven-api-staging.onrender.com
PROD_API_HOST=api.thoven.co
STAGING_API_HOST=thoven-api-staging.onrender.com
PAGES=(/ /marketplace /free-resources /for-teachers /resources)

http_code() { curl -sS -o /dev/null -m 20 -w '%{http_code}' "$@" 2>/dev/null; }
http_headers() { curl -sS -I -m 20 "$@" 2>/dev/null | tr -d '\r'; }
http_body() { curl -sS -m 20 "$@" 2>/dev/null; }
allow_origin_of() { # the Access-Control-Allow-Origin a preflight from the staging site gets
  curl -sS -m 20 -D - -o /dev/null -X OPTIONS -H "Origin: $SITE" -H 'Access-Control-Request-Method: POST' "$1" 2>/dev/null |
    tr -d '\r' | sed -n 's/^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Oo]rigin: //p'
}
redirect_of() { curl -sS -o /dev/null -m 20 -w '%{http_code} %{redirect_url}' "$1" 2>/dev/null; }

RESULTS=()
FAILS=0
SKIPS=0
record() { # status name detail
  RESULTS+=("$1|$2|$3")
  case "$1" in FAIL) FAILS=$((FAILS + 1)) ;; SKIP) SKIPS=$((SKIPS + 1)) ;; esac
}
pass() { record PASS "$1" "${2:-}"; }
fail() { record FAIL "$1" "${2:-}"; }
skip() { record SKIP "$1" "${2:-}"; }

check_version() { # expected sha
  local got
  got=$(http_body "$SITE/api/version" | jq -r '.sha // empty' 2>/dev/null)
  if [ -z "$1" ]; then fail "serves the expected commit" "no expected SHA given"
  elif [ -z "$got" ]; then fail "serves the expected commit" "/api/version returned no sha"
  elif [ "$got" = "$1" ]; then pass "serves the expected commit" "${got:0:9}"
  else fail "serves the expected commit" "serves ${got:0:9}, want ${1:0:9}"; fi
}

check_noindex() {
  local headers robots
  headers=$(http_headers "$SITE/")
  robots=$(http_body "$SITE/robots.txt")
  if ! grep -qi '^x-robots-tag:.*noindex' <<<"$headers"; then fail "staging is not indexable" "no noindex X-Robots-Tag on /"
  elif ! grep -q '^Disallow: /$' <<<"$robots"; then fail "staging is not indexable" "robots.txt does not disallow /"
  else pass "staging is not indexable" "noindex header and Disallow: /"; fi
}

check_pages() {
  local path code body bad=""
  for path in "${PAGES[@]}"; do
    code=$(http_code "$SITE$path")
    body=$(http_body "$SITE$path")
    if [ "$code" != 200 ] || ! grep -qi '<title' <<<"$body"; then bad="$bad $path($code)"; fi
  done
  if [ -n "$bad" ]; then fail "public pages answer with a page" "failing:$bad"
  else pass "public pages answer with a page" "${#PAGES[@]} routes"; fi
}

check_redirects() {
  local a b
  a=$(redirect_of "$SITE/login")
  b=$(redirect_of "$SITE/how-it-works")
  if [ "$a" = "301 $SITE/" ] && [ "$b" = "301 $SITE/for-teachers" ]; then pass "config redirects are live" "/login, /how-it-works"
  else fail "config redirects are live" "/login -> '$a', /how-it-works -> '$b'"; fi
}

# The page names its backend. Staging pointing at the production API would write staging traffic
# into production data, so refuse it by name. Only the page itself is read: the bundles carry the
# production host inside an error message, so a scan of them proves nothing.
check_api_target() {
  local html
  html=$(http_body "$SITE/")
  if [ -z "$html" ]; then fail "the page targets the staging API" "empty page"
  elif grep -qF "$PROD_API_HOST" <<<"$html"; then fail "the page targets the staging API" "the page names $PROD_API_HOST"
  elif ! grep -qF "$STAGING_API_HOST" <<<"$html"; then fail "the page targets the staging API" "the page names no $STAGING_API_HOST"
  else pass "the page targets the staging API" "$STAGING_API_HOST"; fi
}

check_backend() {
  local up cors rev
  up=$(http_code "$API/up")
  if [ "$up" != 200 ]; then
    skip "staging API answers and allows the staging origin" "/up returned ${up:-nothing}: the backend is asleep or down (start-staging wakes it)"
    return
  fi
  rev=$(http_body "$API/health" | jq -r '.revision.sha // empty' 2>/dev/null)
  cors=$(allow_origin_of "$API/up")
  if [ -z "$rev" ]; then fail "staging API answers and allows the staging origin" "/health has no revision.sha"
  elif [ "$cors" != "$SITE" ]; then fail "staging API answers and allows the staging origin" "Access-Control-Allow-Origin is '${cors:-missing}', want $SITE"
  else pass "staging API answers and allows the staging origin" "revision ${rev:0:9}"; fi
}

staging_health() { # expected frontend sha
  RESULTS=(); FAILS=0; SKIPS=0
  check_version "$1"
  check_noindex
  check_pages
  check_redirects
  check_api_target
  check_backend
}

print_results() {
  local row
  printf '| Check | Result | Detail |\n|---|---|---|\n'
  for row in "${RESULTS[@]}"; do IFS='|' read -r s n d <<<"$row"; printf '| %s | %s | %s |\n' "$n" "$s" "$d"; done
}

main() {
  local sha=${1:-}
  if [ -z "$sha" ]; then
    git -C "$FE_REPO" fetch -q origin main || { echo "REFUSED: cannot fetch origin/main" >&2; return 1; }
    sha=$(git -C "$FE_REPO" rev-parse origin/main)
  fi
  staging_health "$sha"
  print_results
  [ "$FAILS" -eq 0 ] || return 1
  [ "$SKIPS" -eq 0 ] || return 2
  return 0
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then main "$@"; exit $?; fi
