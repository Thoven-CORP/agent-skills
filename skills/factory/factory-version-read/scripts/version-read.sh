#!/usr/bin/env bash
# Read-only version read for factory stations 11 and 12 (DEP-9). Sends GET requests only.
# Usage:
#   version-read.sh staging <FE_full_sha> <BE_full_sha>
#   version-read.sh prod    <FE_full_sha> <BE_full_sha> <fe_tags.json> <be_tags.json>
# Tag files are JSON arrays of {"name","sha"} built from every page of cursor-github list_tags.
set -uo pipefail

ENV="${1:-}"; FE_EXPECTED="${2:-}"; BE_EXPECTED="${3:-}"; FE_TAGS="${4:-}"; BE_TAGS="${5:-}"
usage() { sed -n '3,6p' "$0" >&2; exit 2; }
[[ "$ENV" == "staging" || "$ENV" == "prod" ]] || usage
[[ "$FE_EXPECTED" =~ ^[0-9a-f]{40}$ && "$BE_EXPECTED" =~ ^[0-9a-f]{40}$ ]] || usage
if [[ "$ENV" == "prod" ]]; then [[ -r "$FE_TAGS" && -r "$BE_TAGS" ]] || usage; fi

if [[ "$ENV" == "staging" ]]; then
  FE_URL="https://staging.thoven.co/api/version"; API_URL="https://thoven-api-staging.onrender.com/health"
else
  FE_URL="https://thoven.co/api/version"; API_URL="https://api.thoven.co/health"
fi

# The bypass secret goes to curl on stdin as a config line, so it is never in argv or output.
fetch() {
  local url="$1" body code attempt
  body="$(mktemp)"
  for attempt in 1 2 3 4; do
    # Bypass is staging-only. Never send it to prod.
    if [[ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" && "$ENV" == "staging" && "$url" == *staging.thoven.co/api/version ]]; then
      local s="${VERCEL_AUTOMATION_BYPASS_SECRET//\\/\\\\}"; s="${s//\"/\\\"}"
      code="$(printf 'header = "x-vercel-protection-bypass: %s"\n' "$s" \
        | curl -sS -m 20 -K - -o "$body" -w '%{http_code}' "$url" 2>/dev/null)"
    else
      code="$(curl -sS -m 20 -o "$body" -w '%{http_code}' "$url" 2>/dev/null)"
    fi
    [[ "$code" == "403" && "$attempt" -lt 4 ]] || break
    sleep 2
  done
  echo "${code:-000}"; cat "$body"; rm -f "$body"
}

json_get() { python3 -c 'import json,sys
try: d=json.load(sys.stdin)
except Exception: print(""); sys.exit()
for k in sys.argv[1].split("."): d=d.get(k) if isinstance(d,dict) else None
print(d if isinstance(d,str) else "")' "$1"; }

latest_prod_tag() { python3 -c 'import json,re,sys
tags=[t for t in json.load(open(sys.argv[1])) if re.fullmatch(r"prod/\d{4}-\d{2}-\d{2}-\d+",t["name"])]
if not tags: print("NONE"); sys.exit()
k=lambda t:(t["name"][5:15],int(t["name"][16:]))
t=max(tags,key=k); print(t["name"],t["sha"],len(tags))' "$1"; }

FAIL=0
echo "Version read for $ENV at $(date '+%Y-%m-%d %H:%M %Z')"

if [[ "$ENV" == "prod" ]]; then
  read -r FE_TAG FE_TAG_SHA FE_N <<<"$(latest_prod_tag "$FE_TAGS")"
  read -r BE_TAG BE_TAG_SHA BE_N <<<"$(latest_prod_tag "$BE_TAGS")"
  if [[ "$FE_TAG" == "NONE" || "$BE_TAG" == "NONE" ]]; then
    echo "FAIL tag: no prod/YYYY-MM-DD-N tag exists in frontend ($FE_TAG) or backend ($BE_TAG). A prod read cannot pass without one."; FAIL=1
  else
    if [[ "$FE_TAG" != "$BE_TAG" ]]; then
      echo "FAIL tag: newest frontend tag $FE_TAG and newest backend tag $BE_TAG differ."; FAIL=1
    fi
    if [[ "$FE_TAG_SHA" == "$FE_EXPECTED" && "$BE_TAG_SHA" == "$BE_EXPECTED" ]]; then
      echo "PASS tag: $FE_TAG points at the expected FE and BE SHAs ($FE_N FE and $BE_N BE prod tags read)."
    else
      echo "FAIL tag: $FE_TAG points at FE $FE_TAG_SHA and BE $BE_TAG_SHA, which do not both equal the expected SHAs."; FAIL=1
    fi
  fi
fi

FE_RESP="$(fetch "$FE_URL")"; FE_CODE="$(head -n1 <<<"$FE_RESP")"; FE_LIVE="$(tail -n +2 <<<"$FE_RESP" | json_get sha)"
if [[ "$FE_CODE" == "200" && "$FE_LIVE" == "$FE_EXPECTED" ]]; then
  echo "PASS frontend: $FE_URL sha $FE_LIVE equals the expected full SHA."
else
  echo "FAIL frontend: $FE_URL returned HTTP $FE_CODE with sha '$FE_LIVE'. Expected $FE_EXPECTED."; FAIL=1
fi

API_RESP="$(fetch "$API_URL")"; API_CODE="$(head -n1 <<<"$API_RESP")"; API_LIVE="$(tail -n +2 <<<"$API_RESP" | json_get revision.sha)"
if [[ "$API_CODE" == "200" && "${#API_LIVE}" -ge 7 && "$BE_EXPECTED" == "$API_LIVE"* ]]; then
  echo "PASS api: $API_URL revision.sha $API_LIVE is a prefix of the expected $BE_EXPECTED."
else
  echo "FAIL api: $API_URL returned HTTP $API_CODE with revision.sha '$API_LIVE', which is not a 7+ character prefix of $BE_EXPECTED."; FAIL=1
fi

echo "WORKER: unverified, inferred from prod tag. No Render read access exists yet (open decision 5)."
if [[ "$FAIL" == "0" ]]; then echo "RESULT: PASS"; exit 0; else echo "RESULT: MISMATCH"; exit 1; fi
