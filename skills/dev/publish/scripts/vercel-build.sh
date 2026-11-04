# shellcheck shell=bash
# Vercel builds from GitHub, shared by promote.sh and staging-frontend.sh.
# The caller defines die, retry, vercel_api and VERCEL_PROJECT_ID (the Git-linked thoven project).

# start_build <project id> <project name> <sha> <assign: true|false>
# Starts a production-target build of the SHA from GitHub and prints its deployment id.
# The repo id comes from the thoven project, since thoven-staging has no Git link.
# forceNew=1 stops Vercel handing back an older deployment of the same commit.
start_build() {
  local rid d dep
  rid=$(vercel_api "/v9/projects/$VERCEL_PROJECT_ID" | jq -r .link.repoId) || return 1
  [[ $rid =~ ^[0-9]+$ ]] || { echo "cannot read the GitHub repo id of the Vercel project" >&2; return 1; }
  d=$(jq -n --arg p "$1" --arg n "$2" --arg s "$3" --argjson a "$4" --argjson r "$rid" \
      '{name:$n, project:$p, target:"production", autoAssignCustomDomains:$a,
        gitSource:{type:"github", repoId:$r, ref:"main", sha:$s}}' \
    | vercel_api "/v13/deployments?forceNew=1" -X POST --input -) || return 1
  dep=$(jq -r '.id // empty' <<<"$d")
  [ -n "$dep" ] || return 1
  echo "$dep"
}

# Waits up to 20 minutes for a build and prints "<uid> <url>" once it is READY.
wait_build() {
  local dep=$1 d deadline=$(( $(date +%s) + 1200 ))
  while :; do
    [ "$(date +%s)" -lt "$deadline" ] || die "build $dep not READY after 20 minutes"
    if ! d=$(retry vercel_api "/v13/deployments/$dep"); then sleep 15; continue; fi
    case "$(jq -r .readyState <<<"$d")" in
      READY) echo "$dep $(jq -r .url <<<"$d")"; return 0 ;;
      ERROR) die "build $dep failed: https://$(jq -r .url <<<"$d")" ;;
      CANCELED) die "build $dep was canceled. vercel-ignore-build.sh skips docs-only commits; use the last code commit instead" ;;
    esac
    sleep 15
  done
}
