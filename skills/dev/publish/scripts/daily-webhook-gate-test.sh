#!/usr/bin/env bash
# Proves daily_webhook_gate refuses on every state except one ACTIVE production webhook.
set -uo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_API=https://api.thoven.co
# shellcheck disable=SC2034
PROD_ENV_GROUP=evg-test
SENTINEL=dk_sentinel_never_print
failures=0

die() { echo "REFUSED: $*" >&2; exit 1; }
say() { echo "== $*"; }
retry() { "$@"; }
# shellcheck source=daily-webhook-gate.sh
. "$dir/daily-webhook-gate.sh"

URL=$PROD_API/webhooks/daily
hook() { printf '{"url":"%s","uuid":"%s","state":"%s","failedCount":%s}' "$1" "$2" "$3" "$4"; }

run_gate() {
  WEBHOOKS_BODY=$1
  out=$( ( daily_webhooks_get() { printf '%s' "$WEBHOOKS_BODY"; }; daily_webhook_gate ) 2>&1 )
  status=$?
}
check() {
  if [ "$2" = "$3" ]; then echo "PASS: $1"; else echo "FAIL: $1 (want $3, got $2)"; failures=$((failures + 1)); fi
}
contains() {
  if grep -qF -- "$2" <<<"$out"; then echo "PASS: $1"; else echo "FAIL: $1 (missing: $2)"; echo "$out"; failures=$((failures + 1)); fi
}

run_gate ''
check "empty body refuses" "$status" 1
run_gate '[]'
check "empty array refuses" "$status" 1
contains "empty array names the url" "no webhook for $URL"
run_gate "[$(hook https://staging.example/webhooks/daily u-other ACTIVE 0)]"
check "only another url refuses" "$status" 1
run_gate '{"error":"x"}'
check "non-array refuses" "$status" 1
run_gate "[$(hook "$URL" u-1 FAILED 3)]"
check "FAILED refuses" "$status" 1
contains "FAILED names uuid" "u-1"
contains "FAILED names state and count" "FAILED (failedCount 3)"
contains "FAILED prints the reactivation POST" "-X POST https://api.daily.co/v1/webhooks/u-1"
contains "reactivation carries url and retryType" "\"retryType\":\"exponential\""
run_gate "[$(hook "$URL" u-1 ACTIVE 0),$(hook "$URL" u-2 ACTIVE 0)]"
check "two matching webhooks refuse" "$status" 1
run_gate "[$(hook "$URL" u-1 ACTIVE 0),$(hook https://staging.example/webhooks/daily u-other FAILED 3)]"
check "one ACTIVE production webhook passes" "$status" 0

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cat >"$tmp/curl" <<'STUB'
#!/usr/bin/env bash
case "$*" in *dk_sentinel_never_print*) echo "key leaked into curl argv" >&2; exit 9;; esac
printf '[{"url":"https://api.thoven.co/webhooks/daily","uuid":"u-1","state":"FAILED","failedCount":3}]'
STUB
chmod +x "$tmp/curl"
out=$( ( PATH="$tmp:$PATH" DAILY_API_KEY=$SENTINEL daily_webhook_gate ) 2>&1 )
status=$?
check "real fetch path refuses on FAILED" "$status" 1
if grep -qF "$SENTINEL" <<<"$out"; then echo "FAIL: key printed"; failures=$((failures + 1)); else echo "PASS: key never appears in output or curl argv"; fi

[ "$failures" = 0 ] || { echo "$failures failed"; exit 1; }
echo "all passed"
