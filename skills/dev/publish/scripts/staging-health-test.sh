#!/usr/bin/env bash
# Proves staging-health.sh refuses on empty or wrong answers and passes only on a sound staging.
set -uo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHA=0123456789abcdef0123456789abcdef01234567
failures=0
# shellcheck source=staging-health.sh
. "$dir/staging-health.sh"

# The world a test sets: each variable is one thing staging serves.
world() {
  W_SHA=$SHA W_API_UP=200 W_ROBOTS_HEADER='x-robots-tag: noindex, nofollow' W_ROBOTS_TXT='Disallow: /'
  W_PAGE_CODE=200 W_HOME="<title>Thoven</title> $STAGING_API_HOST" W_LOGIN="301 $SITE/" W_HOW="301 $SITE/for-teachers"
  W_HEALTH='{"revision":{"sha":"abcdef012"}}' W_CORS=$SITE
}
http_code() { case "$1" in "$API/up") printf '%s' "$W_API_UP" ;; *) printf '%s' "$W_PAGE_CODE" ;; esac; }
http_headers() { printf 'HTTP/2 200\n%s\n' "$W_ROBOTS_HEADER"; }
http_body() {
  case "$1" in
    "$SITE/api/version") [ -n "$W_SHA" ] && printf '{"sha":"%s"}' "$W_SHA" ;;
    "$SITE/robots.txt") printf '%s' "$W_ROBOTS_TXT" ;;
    "$SITE/") printf '%s' "$W_HOME" ;;
    "$API/health") printf '%s' "$W_HEALTH" ;;
    *) [ "$W_PAGE_CODE" = 200 ] && printf '<title>x</title>' ;;
  esac
}
redirect_of() { case "$1" in "$SITE/login") printf '%s' "$W_LOGIN" ;; *) printf '%s' "$W_HOW" ;; esac; }
allow_origin_of() { printf '%s' "$W_CORS"; }

check() { if [ "$2" = "$3" ]; then echo "PASS: $1"; else echo "FAIL: $1 (want $3, got $2)"; failures=$((failures + 1)); fi; }
run() { # name expected-sha
  out=$(main "$2" 2>&1); status=$?
}
has() { if grep -qF -- "$2" <<<"$out"; then echo "PASS: $1"; else echo "FAIL: $1 (missing: $2)"; echo "$out"; failures=$((failures + 1)); fi; }

world; run sound "$SHA"
check "a sound staging passes" "$status" 0

world; run empty ""
FE_REPO=/nonexistent run empty ""
check "no expected sha and no repo refuses" "$status" 1

world; W_SHA='' W_HOME='' W_ROBOTS_HEADER='' W_ROBOTS_TXT='' W_PAGE_CODE='' W_LOGIN='' W_HOW='' W_API_UP='' W_HEALTH='' W_CORS=''
run allempty "$SHA"
check "every answer empty fails" "$status" 1
check "every answer empty fails five checks" "$(grep -c '| FAIL |' <<<"$out")" 5
check "every answer empty skips the backend" "$(grep -c '| SKIP |' <<<"$out")" 1

world; W_SHA=fedcba9876543210fedcba9876543210fedcba98; run oldsha "$SHA"
check "another commit fails" "$status" 1
has "another commit names both" "serves fedcba987, want 012345678"

world; W_ROBOTS_HEADER=''; run indexable "$SHA"
check "no noindex header fails" "$status" 1

world; W_ROBOTS_TXT='Allow: /'; run indexable2 "$SHA"
check "robots.txt allowing crawlers fails" "$status" 1

world; W_HOME="<title>x</title> https://$PROD_API_HOST $STAGING_API_HOST"; run prodapi "$SHA"
check "a page that names the production API fails" "$status" 1
has "it names the production host" "the page names $PROD_API_HOST"

world; W_HOME='<title>x</title>'; run noapi "$SHA"
check "a page that names no staging API fails" "$status" 1

world; W_LOGIN="302 $SITE/"; run redirect "$SHA"
check "a changed redirect fails" "$status" 1

world; W_PAGE_CODE=500; run page500 "$SHA"
check "a page that errors fails" "$status" 1

world; W_API_UP=503; run asleep "$SHA"
check "a sleeping backend is a skip, not a pass" "$status" 2

world; W_CORS=https://thoven.co; run cors "$SHA"
check "a wrong allowed origin fails" "$status" 1

world; W_HEALTH='{}'; run norev "$SHA"
check "a health answer with no revision fails" "$status" 1

if [ "$failures" -eq 0 ]; then echo "ALL PASS"; else echo "$failures FAILED"; exit 1; fi
