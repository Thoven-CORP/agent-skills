#!/usr/bin/env bash
# Read-only: is this instance worth driving?
# Host decides environment. JSON env fields on staging currently say production.
set -euo pipefail

fe="https://staging.thoven.co"
be="https://thoven-api-staging.onrender.com"
out=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fe) fe="$2"; shift 2 ;;
    --be) be="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

host_of() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
}

is_prod_host() {
  local h="$1"
  [[ "$h" == "thoven.co" || "$h" == "www.thoven.co" || "$h" == "api.thoven.co" ]]
}

is_allowed_fe_host() {
  local h="$1"
  [[ "$h" == "staging.thoven.co" ]] && return 0
  [[ "$h" == *thoven-staging*.vercel.app ]] && return 0
  return 1
}

is_allowed_be_host() {
  local h="$1"
  [[ "$h" == "thoven-api-staging.onrender.com" ]] && return 0
  return 1
}

fe_host="$(host_of "$fe")"
be_host="$(host_of "$be")"
report=""
fail=0
if [[ -n "$out" ]]; then
  mkdir -p "$out"
fi

if is_prod_host "$fe_host" || is_prod_host "$be_host"; then
  report="REFUSE production host fe=$fe_host be=$be_host"
  echo "$report" >&2
  [[ -n "$out" ]] && printf '%s\n' "$report" >"$out/doctor.txt"
  exit 2
fi

if ! is_allowed_fe_host "$fe_host"; then
  echo "REFUSE unknown frontend host: $fe_host" >&2
  fail=1
fi
if ! is_allowed_be_host "$be_host"; then
  echo "REFUSE unknown API host: $be_host (need thoven-api-staging.onrender.com)" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  [[ -n "$out" ]] && printf 'unknown host fe=%s be=%s\n' "$fe_host" "$be_host" >"$out/doctor.txt"
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if ! curl -fsS --max-time 20 "${fe%/}/api/version" -o "$tmp/fe-version.json"; then
  echo "FAIL frontend version ${fe%/}/api/version" >&2
  fail=1
fi
if ! curl -fsS --max-time 20 "${be%/}/health" -o "$tmp/be-health.json"; then
  echo "FAIL API health ${be%/}/health" >&2
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then
  python3 - "$tmp/fe-version.json" "$tmp/be-health.json" <<'PY' || fail=1
import json, sys
fe = json.load(open(sys.argv[1]))
be = json.load(open(sys.argv[2]))
if "sha" not in fe:
    raise SystemExit("frontend version JSON missing sha")
if not be.get("status"):
    raise SystemExit("API health JSON missing status")
print(f"fe_sha={fe.get('sha')} fe_ref={fe.get('ref')} fe_env_field={fe.get('env')}")
print(f"be_status={be.get('status')} be_env_field={be.get('environment')} be_sha={be.get('revision', {}).get('sha')}")
PY
fi

if [[ -n "$out" ]]; then
  mkdir -p "$out"
  if [[ -f "$tmp/fe-version.json" ]]; then cp "$tmp/fe-version.json" "$out/fe-version.json"; fi
  if [[ -f "$tmp/be-health.json" ]]; then cp "$tmp/be-health.json" "$out/be-health.json"; fi
fi

if [[ "$fail" -ne 0 ]]; then
  report="NOT worth driving fe=$fe_host be=$be_host"
  echo "$report" >&2
  [[ -n "$out" ]] && printf '%s\n' "$report" >"$out/doctor.txt"
  exit 1
fi

report="worth driving fe=$fe_host be=$be_host (host is the environment signal; JSON env fields may say production)"
echo "$report"
[[ -n "$out" ]] && printf '%s\n' "$report" >"$out/doctor.txt"
exit 0
