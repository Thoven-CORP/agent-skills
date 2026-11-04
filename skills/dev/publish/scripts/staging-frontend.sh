#!/usr/bin/env bash
# Puts a frontend commit of main on staging.thoven.co (Vercel thoven-staging), built from GitHub.
#
#   staging-frontend.sh [SHA]    default: the tip of origin/main
#
# thoven-staging has no Git link, so merges do not deploy it. A release starts by running this
# with no SHA, so staging, and the release plan that reads it, carries every merged commit.
# Building from GitHub rather than a local tree keeps untracked and ignored files out of the build.
set -eEuo pipefail
trap 'echo "FAILED at line $LINENO: $BASH_COMMAND" >&2' ERR

FE_REPO=~/thoven/frontend
VERCEL_SCOPE=andres-3203s-projects
# shellcheck disable=SC2034  # vercel-build.sh reads the repo id from this Git-linked project
VERCEL_PROJECT_ID=prj_kJp3i6YAA6bC5jOGbg7xypzIkPta
STAGING_PROJECT_ID=prj_ntC0WSpEsmwiVQ0hfgW6sA327FfT
STAGING_SITE=https://staging.thoven.co

die() { echo "REFUSED: $*" >&2; exit 1; }
say() { echo "== $*"; }
retry() {
  local out _
  for _ in 1 2 3; do
    if out=$("$@"); then printf '%s' "$out"; return 0; fi
    sleep 5
  done
  return 1
}
vercel_api() { vercel api "$@" --scope "$VERCEL_SCOPE"; }
# shellcheck source=vercel-build.sh
. "$(dirname "${BASH_SOURCE[0]}")/vercel-build.sh"
staging_sha() { curl -sS --max-time 20 "$STAGING_SITE/api/version" | jq -r '.sha // empty'; }

[ $# -le 1 ] || die "usage: staging-frontend.sh [SHA]"
git -C "$FE_REPO" fetch -q origin main
if [ $# -eq 1 ]; then
  [[ $1 =~ ^[0-9a-fA-F]{7,40}$ ]] || die "SHA must be hex, got '$1'"
  SHA=$(git -C "$FE_REPO" rev-parse --verify -q "$(tr 'A-F' 'a-f' <<<"$1")^{commit}") || die "frontend does not have $1"
else
  SHA=$(git -C "$FE_REPO" rev-parse origin/main)
fi
git -C "$FE_REPO" rev-list --first-parent origin/main | grep -x "$SHA" >/dev/null \
  || die "${SHA:0:9} is not a merge point on main's line"

now=$(retry staging_sha || true)
if [ "$now" = "$SHA" ]; then say "staging already serves ${SHA:0:9}"; exit 0; fi
say "building ${SHA:0:9} for staging, which serves ${now:0:9}"
dep=$(start_build "$STAGING_PROJECT_ID" thoven-staging "$SHA" true) || die "Vercel refused to create a deployment"
wait_build "$dep" >/dev/null
got=""
for _ in $(seq 30); do got=$(staging_sha || true); [ "$got" = "$SHA" ] && break; sleep 10; done
[ "$got" = "$SHA" ] || die "staging serves ${got:-nothing}, not ${SHA:0:9}, after 5 minutes"
say "staging serves ${SHA:0:9}"
