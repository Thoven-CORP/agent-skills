#!/usr/bin/env bash
# Write frontend version and API health JSON into an evidence dir.
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

if [[ -z "$out" ]]; then
  echo "usage: version.sh --out DIR [--fe URL] [--be URL]" >&2
  exit 2
fi
mkdir -p "$out"

fe_url="${fe%/}/api/version"
be_url="${be%/}/health"

curl -fsS --max-time 20 "$fe_url" -o "$out/fe-version.json"
curl -fsS --max-time 20 "$be_url" -o "$out/be-health.json"

{
  printf 'fe %s\n' "$fe"
  printf 'be %s\n' "$be"
  printf 'fe_version_url %s\n' "$fe_url"
  printf 'be_health_url %s\n' "$be_url"
  printf 'run_id %s\n' "${THOVEN_VERIFY_RUN_ID:-}"
} >"$out/target.txt"

printf 'wrote %s and %s\n' "$out/fe-version.json" "$out/be-health.json"
