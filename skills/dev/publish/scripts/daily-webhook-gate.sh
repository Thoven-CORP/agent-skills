# shellcheck shell=bash
# Sourced by promote.sh. Needs die, render_get, PROD_API and PROD_ENV_GROUP from it.
# One Daily account serves every environment; its only production webhook is $PROD_API/webhooks/daily.
# After 3 failed deliveries Daily marks a webhook FAILED and stops sending (THV-981, THV-1490).

daily_api_key() {
  local key=${DAILY_API_KEY:-}
  if [ -z "$key" ]; then
    key=$(retry render_get "/env-groups/$PROD_ENV_GROUP" | jq -r '.envVars[] | select(.key=="DAILY_API_KEY") | .value // empty') \
      || die "cannot read DAILY_API_KEY from Render env group $PROD_ENV_GROUP; export DAILY_API_KEY and rerun"
  fi
  [ -n "$key" ] || die "no DAILY_API_KEY in the environment or Render env group $PROD_ENV_GROUP"
  printf '%s' "$key"
}

daily_webhooks_get() {
  local key
  key=$(daily_api_key) || return 1
  curl -sS --max-time 30 --fail-with-body -H @<(printf 'Authorization: Bearer %s\n' "$key") \
    https://api.daily.co/v1/webhooks
}

# Refuses unless exactly one Daily webhook targets production and it is ACTIVE. Never reactivates.
daily_webhook_gate() {
  local url="$PROD_API/webhooks/daily" body hooks n uuid state failed
  body=$(daily_webhooks_get) || die "cannot read Daily's webhooks (GET /v1/webhooks failed); production webhook state is unknown"
  hooks=$(jq -c --arg u "$url" 'if type=="array" then [.[] | select(.url==$u)] else error("not an array") end' <<<"$body") \
    || die "Daily's webhook list is not a JSON array"
  n=$(jq length <<<"$hooks")
  [ "$n" != 0 ] || die "Daily has no webhook for $url; production sends no events"
  [ "$n" = 1 ] || die "Daily has $n webhooks for $url (uuids: $(jq -r 'map(.uuid) | join(", ")' <<<"$hooks")); expected exactly one"
  uuid=$(jq -r '.[0].uuid // "unknown"' <<<"$hooks")
  state=$(jq -r '.[0].state // "unknown"' <<<"$hooks")
  failed=$(jq -r '.[0].failedCount // "unknown"' <<<"$hooks")
  [ "$state" = ACTIVE ] || die "Daily's production webhook $uuid is $state (failedCount $failed) and sends nothing. After checking that $url answers 200, reactivate it (Andres's call):
   curl -sS -X POST https://api.daily.co/v1/webhooks/$uuid -H \"Authorization: Bearer \$DAILY_API_KEY\" -H 'Content-Type: application/json' -d '{\"url\":\"$url\",\"retryType\":\"exponential\"}'"
  say "Daily production webhook $uuid is ACTIVE"
}
