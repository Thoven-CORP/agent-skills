#!/usr/bin/env bash
# Promote a commit of main to 2.0 production (THV-968).
#
#   plan [--be SHA|keep] [--fe SHA|keep] [--rollback] [--schema-stays]
#   snapshot ID    Neon branch of prod; required before backend when migrations are added
#   backend  ID [--redeploy]  thoven-api (health-gated), then thoven-worker; --redeploy applies config at the pinned SHA
#   frontend ID    points thoven.co at the build of the pinned frontend SHA, waiting for the one plan started
#   tag      ID    Daily's webhook must be ACTIVE; prod/<date>-<n> in both repos, then closes the release
#   status         prints the open release
#   abort    ID    closes the open release without tagging
#
# plan is the only step that reads staging. It takes the lock, pins every SHA in a
# release file and prints the ID; each later step names that ID, so the go Andres
# gives on plan's output binds exactly what ships. Forward releases run backend,
# then frontend. Rollbacks run frontend, then backend. backend and frontend can
# each wait 30 minutes: run them in the background. When no production build of the
# frontend SHA is ready, plan starts one, so it builds while the backend steps run.
set -eEuo pipefail
trap 'echo "FAILED at line $LINENO: $BASH_COMMAND" >&2' ERR

BE_REPO=~/thoven/backend
FE_REPO=~/thoven/frontend
API_ID=srv-dar05h3ncjis73bki8qg
WORKER_ID=srv-dar05h3ncjis73bki8s0
STAGING_API_ID=srv-dao470bm8hqs73d71sh0
PROD_ENV_GROUP=evg-dar05ajncjis73bkhi40
NEON_PROJECT=dry-sound-31987419
NEON_PROD_BRANCH=br-lingering-frost-b5phtwra
VERCEL_SCOPE=andres-3203s-projects
VERCEL_PROJECT_ID=prj_kJp3i6YAA6bC5jOGbg7xypzIkPta
PROD_API=https://api.thoven.co
PROD_SITE=https://thoven.co
STAGING_SITE=https://staging.thoven.co
SNAPSHOT_MAX_AGE=7200
# A snapshot expires this many days after creation, so an erased child's data cannot
# outlive the retention promise. Call sites keep the time 1 hour under Neon's cap.
SNAPSHOT_TTL_DAYS=30
RELEASES=~/.thoven/releases
LOCK=$RELEASES/lock
REL_PTR=$LOCK/release

die() { echo "REFUSED: $*" >&2; exit 1; }
say() { echo "== $*"; }
usage() { sed -n '2,17p' "$0"; exit 2; }
# Each attempt's output is kept apart, so a failed try never prefixes the good one.
retry() {
  local out _
  for _ in 1 2 3; do
    if out=$("$@"); then printf '%s' "$out"; return 0; fi
    sleep 5
  done
  return 1
}
# RFC 3339 UTC for a Unix epoch, on BSD or GNU date.
iso_utc() {
  local out
  out=$(date -u -r "$1" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || true)
  [ -n "$out" ] || out=$(date -u -d "@$1" +%Y-%m-%dT%H:%M:%SZ)
  [ -n "$out" ] || die "cannot format $1 as RFC 3339 UTC"
  printf '%s' "$out"
}
# shellcheck source=staging-hold.sh
. "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh"

is_sha() { [[ $1 =~ ^[0-9a-f]{40}$ ]]; }

RENDER_KEY=$(awk '$1=="key:"{print $2; exit}' ~/.render/cli.yaml 2>/dev/null || true)
[ -n "$RENDER_KEY" ] || die "no Render API key in ~/.render/cli.yaml (run: render login)"
render_get() {
  curl -sS --max-time 30 --fail-with-body -H @<(printf 'Authorization: Bearer %s\n' "$RENDER_KEY") \
    "https://api.render.com/v1$1"
}
# shellcheck source=daily-webhook-gate.sh
. "$(dirname "${BASH_SOURCE[0]}")/daily-webhook-gate.sh"
vercel_api() { vercel api "$@" --scope "$VERCEL_SCOPE"; }

live_commit() {
  local out
  out=$(retry render_get "/services/$1/deploys?limit=50") || return 1
  jq -r '[.[].deploy | select(.status=="live")][0].commit.id // empty' <<<"$out"
}
site_sha() {
  local out
  out=$(curl -sS --max-time 20 "$PROD_SITE/api/version") || return 1
  jq -r '.sha // empty' <<<"$out"
}
# What thoven.co serves: the site's own answer, else Vercel's production target.
prod_fe() {
  local s
  s=$(retry site_sha || true)
  if ! is_sha "$s"; then
    s=$(vercel_api "/v9/projects/$VERCEL_PROJECT_ID" | jq -r '.targets.production.meta.githubCommitSha // empty') || return 1
  fi
  is_sha "$s" && echo "$s"
}
auto_assign_off() {
  local s
  s=$(vercel_api "/v9/projects/$VERCEL_PROJECT_ID" | jq -r .autoAssignCustomDomains) || die "cannot read the Vercel project"
  [ "$s" = false ]
}

# A forward target is a merge point on main's first-parent line.
# grep without -q reads all input, so rev-list never dies of SIGPIPE under pipefail.
on_main_line() { git -C "$1" rev-list --first-parent origin/main | grep -x "$2" >/dev/null; }
# A rollback target must be a commit that a prod/* tag on origin points at.
was_prod() { [ -n "$(git -C "$1" ls-remote origin 'refs/tags/prod/*' | awk -v s="$2" '$1==s')" ]; }
remote_prod_tags() { git -C "$1" ls-remote origin 'refs/tags/prod/*' | awk '{print $2}' | sed 's#refs/tags/##; s#\^{}##' | sort -u; }

migrations_added() { git -C "$BE_REPO" diff --no-renames --diff-filter=A --name-only "$1" "$2" -- db/migrate/; }
policy_permits() {
  git -C "$BE_REPO" show "$1:config/migration-policy.yml" | ruby -ryaml -e '
    p = YAML.safe_load($stdin.read) || {}
    ok = (p["permitted"] || []).map(&:to_s).include?(ARGV[0]) && !(p["held"] || []).map(&:to_s).include?(ARGV[0])
    exit(ok ? 0 : 1)' "$2"
}

# A non-default branch without expires_at keeps a full copy of the database forever, so an
# erased child's data could outlive the retention promise. A forward plan refuses until each
# carries an expiry. Suggested time is created_at + 30 days, or now + 30 days - 1 hour when
# that is already past or beyond Neon's 30-day cap.
guard_snapshot_ttl() {
  local out msg
  out=$(neonctl branches list --project-id "$1" -o json) || die "cannot list the Neon branches of $1"
  msg=$(jq -r --arg ttl "$SNAPSHOT_TTL_DAYS" --arg proj "$1" '
    ($ttl | tonumber) as $days
    | [ .[] | select(.default != true) | select(.expires_at == null) ] as $bad
    | if ($bad | length) == 0 then empty else
        "\($bad | length) non-default branch(es) in Neon project \($proj) have no expires_at, so each holds a database copy that can outlive the retention promise. Give each one an expiry, then plan again:",
        ( $bad[]
          | (.created_at | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) as $ca
          | ($ca + $days * 86400) as $target
          | (now + $days * 86400 - 3600) as $cap
          | (if $target <= now or $target > $cap then $cap else $target end | floor | todateiso8601) as $at
          | "   neonctl branches set-expiration \(.id) --project-id \($proj) --expires-at \($at)  # \(.name)" )
      end' <<<"$out") || die "cannot read the expiries of the Neon branches of $1"
  [ -z "$msg" ] || die "$msg"
}

# Prints "<uid> <url> <STAGED|PROMOTED>" of a READY production build of the SHA in the prod project.
# Forward releases also require the build to be newer than the last production env change.
# The sha filter reaches builds of any age, not only the newest 100.
find_build() {
  local sha=$1 fresh=$2 env_at=0 out
  if [ "$fresh" = 1 ]; then
    env_at=$(vercel_api "/v10/projects/$VERCEL_PROJECT_ID/env" \
      | jq '[.envs[] | select((.target // []) | index("production")) | .updatedAt // .createdAt] | max // 0') || return 1
  fi
  out=$(vercel_api "/v7/deployments?projectId=$VERCEL_PROJECT_ID&target=production&state=READY&sha=$sha&limit=100") || return 1
  jq -r --arg p "$VERCEL_PROJECT_ID" --arg s "$sha" --argjson e "$env_at" '
    [.deployments[] | select(.projectId==$p and .target=="production" and .meta.githubCommitSha==$s and .createdAt>=$e)]
    | .[0] | if . then "\(.uid) \(.url) \(.readySubstate // "STAGED")" else empty end' <<<"$out"
}

# shellcheck source=vercel-build.sh
. "$(dirname "${BASH_SOURCE[0]}")/vercel-build.sh"

cmd=${1:-help}; shift || true
ID=""; BE_ARG=""; FE_ARG=""; ROLLBACK=0; SCHEMA_STAYS=0; REDEPLOY=0
if [ "$cmd" = plan ]; then
  while [ $# -gt 0 ]; do
    case "$1" in
      --be) BE_ARG=${2:?--be needs a SHA or keep}; shift 2 ;;
      --fe) FE_ARG=${2:?--fe needs a SHA or keep}; shift 2 ;;
      --rollback) ROLLBACK=1; shift ;;
      --schema-stays) SCHEMA_STAYS=1; shift ;;
      *) die "unknown argument $1" ;;
    esac
  done
else
  ID=${1:-}; [ $# -eq 0 ] || shift
  if [ "$cmd" = backend ] && [ "${1:-}" = --redeploy ]; then
    REDEPLOY=1; shift
  fi
  [ $# -eq 0 ] || die "unexpected arguments for $cmd"
fi
mkdir -p "$RELEASES"

REL=""
open_release() {
  [ -f "$REL_PTR" ] || die "no open release; run plan first"
  REL=$(cat "$REL_PTR")
  jq -e '.id and .be.to and .fe.to' "$REL" >/dev/null 2>&1 || die "release file $REL is unreadable"
  [ -n "$ID" ] || die "name the release: $cmd $(jq -r .id "$REL")"
  [ "$(jq -r .id "$REL")" = "$ID" ] || die "open release is $(jq -r .id "$REL"), not $ID"
  staging_hold_refresh
}
rel() { jq -r "$1" "$REL"; }
rel_set() { local tmp; tmp=$(mktemp); jq "$@" "$REL" >"$tmp" && mv "$tmp" "$REL"; }
close_release() { staging_hold_release "$(rel '.staging_hold // empty')" || die "cannot release staging hold; release remains open"; mkdir -p "$RELEASES/$1"; mv "$REL" "$RELEASES/$1/"; rm -f "$REL_PTR"; rmdir "$LOCK"; }

# Refuses when a half moved since plan: prod must be at .from or already at .to.
still_planned() {
  [ "$1" = "$2" ] || [ "$1" = "$3" ] \
    || die "$4 is on ${1:-unknown}, not ${2:0:9} (plan) or ${3:0:9}; prod moved since plan. abort and plan again"
}

guard_auto_assign() {
  vercel_api "/v9/projects/$VERCEL_PROJECT_ID" -X PATCH -F autoAssignCustomDomains=false >/dev/null \
    || die "could not switch autoAssignCustomDomains off; do it now, or the next merge to main goes live"
  auto_assign_off || die "autoAssignCustomDomains is ON; the next merge to main goes live. Switch it off now"
}

health_gate() {
  local up="" rev="" _
  for _ in $(seq 12); do
    up=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$PROD_API/up" || true)
    rev=$(curl -s --max-time 10 "$PROD_API/health" | jq -r '.revision.sha // empty' 2>/dev/null || true)
    if [ "$up" = 200 ] && [ -n "$rev" ] && [ "${1#"$rev"}" != "$1" ]; then return 0; fi
    sleep 10
  done
  die "thoven-api is live on ${1:0:9} but $PROD_API reports up=$up revision=${rev:-none}. The worker was not deployed. To undo: abort, then plan --be $(rel .be.from) --fe keep --rollback"
}

deploy() {
  local svc=$1 sha=$2 t0 body code dep="" out st last="" deadline _
  t0=$(date -u +%Y-%m-%dT%H:%M:%S)
  body=$(mktemp)
  code=$(curl -sS --max-time 30 -o "$body" -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    -H @<(printf 'Authorization: Bearer %s\n' "$RENDER_KEY") \
    -d "{\"commitId\":\"$sha\",\"clearCache\":\"do_not_clear\"}" \
    "https://api.render.com/v1/services/$svc/deploys") || code=000
  case "$code" in
    201) dep=$(jq -r '.id // empty' "$body") ;;
    202) for _ in $(seq 12); do
           out=$(retry render_get "/services/$svc/deploys?limit=10") || break
           dep=$(jq -r --arg s "$sha" --arg t "$t0" \
             '[.[].deploy | select(.commit.id==$s and .createdAt>=$t)][0].id // empty' <<<"$out")
           [ -n "$dep" ] && break
           sleep 5
         done ;;
    *) die "Render answered $code for $svc: $(head -c 300 "$body")" ;;
  esac
  rm -f "$body"
  [ -n "$dep" ] || die "Render accepted a deploy of $svc but it could not be found; check the dashboard before rerunning"
  say "$svc deploy $dep started at ${sha:0:9}"
  deadline=$(( $(date +%s) + 1800 ))
  while :; do
    [ "$(date +%s)" -lt "$deadline" ] || die "$svc deploy $dep still running after 30 minutes; it keeps going on Render"
    st=$(retry render_get "/services/$svc/deploys/$dep" | jq -r '.status // empty' || true)
    if [ -n "$st" ] && [ "$st" != "$last" ]; then say "$svc $st"; last=$st; fi
    case "$st" in
      live) return 0 ;;
      build_failed|update_failed|canceled|pre_deploy_failed|deactivated)
        die "$svc deploy $dep ended $st. api=$(live_commit "$API_ID" | cut -c1-9) worker=$(live_commit "$WORKER_ID" | cut -c1-9)" ;;
    esac
    sleep 15
  done
}

case "$cmd" in
  plan)
    mkdir "$LOCK" 2>/dev/null || die "a release is open ($(jq -r .id "$(cat "$REL_PTR" 2>/dev/null)" 2>/dev/null || echo unknown)); finish it or run abort"
    planned=0; plan_hold=""
    trap '[ "$planned" = 1 ] || { staging_hold_release "$plan_hold" || true; rm -f "$REL_PTR"; rmdir "$LOCK" 2>/dev/null || true; }' EXIT
    plan_hold=$(staging_hold_acquire "release planning") || die "cannot acquire shared staging hold; plan stopped"
    [ "$ROLLBACK" = 1 ] || guard_snapshot_ttl "$NEON_PROJECT"
    auto_assign_off || die "Vercel autoAssignCustomDomains is on, so merges go live by themselves. Switch it off first"
    for r in "$BE_REPO" "$FE_REPO"; do git -C "$r" fetch -q origin main; done

    PROD_BE=$(live_commit "$API_ID") || die "cannot read thoven-api deploys"
    PROD_WORKER=$(live_commit "$WORKER_ID") || die "cannot read thoven-worker deploys"
    is_sha "$PROD_BE" && is_sha "$PROD_WORKER" || die "no live deploy found on thoven-api or thoven-worker"
    if [ "$PROD_BE" != "$PROD_WORKER" ]; then
      target=$(git -C "$BE_REPO" rev-parse --verify -q "${BE_ARG:-none}^{commit}" 2>/dev/null || true)
      [ "$ROLLBACK" = 1 ] && [ "$target" = "$PROD_WORKER" ] \
        || die "thoven-api is on ${PROD_BE:0:9} and thoven-worker on ${PROD_WORKER:0:9}. To undo the half-deployed backend: plan --be $PROD_WORKER --fe keep --rollback"
      say "api and worker disagree; judging the rollback against the api's ${PROD_BE:0:9}"
    fi
    PROD_FE=$(prod_fe) || die "cannot tell what thoven.co serves (site and Vercel both failed)"

    if [ -z "$BE_ARG" ] || [ -z "$FE_ARG" ]; then
      staging_require_ready || die "staging execution probe failed; plan stopped"
    fi
    STAGE_BE=""; STAGE_FE=""
    if [ -z "$BE_ARG" ]; then STAGE_BE=$(live_commit "$STAGING_API_ID") || die "cannot read staging deploys"; fi
    if [ -z "$FE_ARG" ]; then
      STAGE_FE=$(retry curl -sS --max-time 20 "$STAGING_SITE/api/version" | jq -r '.sha // empty') || die "staging did not answer"
    fi
    pick() {
      case "$2" in
        keep) echo "$3" ;;
        "") git -C "$1" rev-parse --verify -q "$4^{commit}" || die "$(basename "$1") does not have staging's ${4:-SHA}" ;;
        *) [[ $2 =~ ^[0-9a-fA-F]{7,40}$ ]] || die "SHA must be hex, got '$2'"
           git -C "$1" rev-parse --verify -q "$(tr 'A-F' 'a-f' <<<"$2")^{commit}" || die "$(basename "$1") does not have $2" ;;
      esac
    }
    BE=$(pick "$BE_REPO" "$BE_ARG" "$PROD_BE" "$STAGE_BE")
    FE=$(pick "$FE_REPO" "$FE_ARG" "$PROD_FE" "$STAGE_FE")
    [ "$BE" != "$PROD_BE" ] || [ "$FE" != "$PROD_FE" ] || die "prod already runs backend ${BE:0:9} and frontend ${FE:0:9}"

    check_half() {
      local repo=$1 to=$2 from=$3 name
      name=$(basename "$repo")
      [ "$to" = "$from" ] && return 0
      git -C "$repo" cat-file -e "$from^{commit}" 2>/dev/null || die "prod's ${from:0:9} is not in the local $name repo; fetch it first"
      if git -C "$repo" merge-base --is-ancestor "$from" "$to"; then
        [ "$ROLLBACK" = 0 ] || die "${to:0:9} is ahead of prod in $name; drop --rollback"
        on_main_line "$repo" "$to" || die "${to:0:9} is not a merge point on $name's main line"
      else
        [ "$ROLLBACK" = 1 ] || die "${to:0:9} is behind prod ${from:0:9} in $name; pass --rollback"
        was_prod "$repo" "$to" || die "${to:0:9} never ran in prod (no prod/* tag on origin) in $name"
      fi
    }
    check_half "$BE_REPO" "$BE" "$PROD_BE"
    check_half "$FE_REPO" "$FE" "$PROD_FE"

    if [ "$ROLLBACK" = 1 ]; then
      MIGS=$(migrations_added "$BE" "$PROD_BE")
      [ -z "$MIGS" ] || [ "$SCHEMA_STAYS" = 1 ] || die "rolling back past these migrations leaves the schema ahead of the code:
$MIGS
Pass --schema-stays only if the older code runs on the newer schema."
    else
      MIGS=$(migrations_added "$PROD_BE" "$BE")
      for m in $MIGS; do
        v=$(basename "$m" | cut -d_ -f1)
        policy_permits "$BE" "$v" || die "migration $v is not permitted in config/migration-policy.yml at ${BE:0:9}; controlled-migrate would refuse it"
      done
    fi

    BUILD=""; STARTED=""
    if [ "$FE" != "$PROD_FE" ]; then
      BUILD=$(find_build "$FE" "$([ "$ROLLBACK" = 1 ] && echo 0 || echo 1)") || die "cannot query Vercel deployments"
      if [ -z "$BUILD" ]; then
        STARTED=$(trap - ERR; start_build "$VERCEL_PROJECT_ID" thoven "$FE" false) || say "could not start a production build of ${FE:0:9}; the frontend step builds one"
      fi
    fi
    if [ "$ROLLBACK" = 1 ]; then ORDER='["frontend","backend","tag"]'
    elif [ -n "$MIGS" ]; then ORDER='["snapshot","backend","frontend","tag"]'
    else ORDER='["backend","frontend","tag"]'; fi

    id="$(TZ=America/New_York date +%Y%m%d-%H%M%S)-${BE:0:7}-${FE:0:7}"
    REL="$RELEASES/$id.json"
    jq -n --arg id "$id" --arg be "$BE" --arg pbe "$PROD_BE" --arg fe "$FE" --arg pfe "$PROD_FE" \
      --arg migs "$MIGS" --arg build "$BUILD" --arg started "$STARTED" --arg staging_hold "$plan_hold" --argjson rb "$ROLLBACK" --argjson order "$ORDER" \
      '{id:$id, staging_hold:$staging_hold, rollback:($rb==1), order:$order, be:{from:$pbe,to:$be}, fe:{from:$pfe,to:$fe},
        migrations:($migs|split("\n")|map(select(.!=""))), build_at_plan:$build, build_started:(if $started == "" then null else $started end),
        snapshot:null, snapshot_at:null, tag:null,
        done:{snapshot:false, backend:false, api_healthy:false, frontend:false}}' >"$REL"
    echo "$REL" >"$REL_PTR"
    planned=1

    say "release $id$([ "$ROLLBACK" = 1 ] && echo '  (ROLLBACK: frontend first)')"
    say "backend  ${PROD_BE:0:9} -> ${BE:0:9}$([ "$BE" = "$PROD_BE" ] && echo '  (unchanged)')"
    say "frontend ${PROD_FE:0:9} -> ${FE:0:9}$([ "$FE" = "$PROD_FE" ] && echo '  (unchanged)')"
    if [ -n "$MIGS" ]; then say "migrations:"; echo "$MIGS" | sed 's/^/   /'; else say "migrations: none"; fi
    if [ "$FE" != "$PROD_FE" ]; then
      if [ -n "$BUILD" ]; then say "frontend build: $BUILD"
      elif [ -n "$STARTED" ]; then say "frontend build: started $STARTED; the frontend step waits for it (about 5 min)"
      else say "frontend build: none ready, the frontend step builds one (about 5 min)"; fi
    fi
    say "next, one go each:"
    jq -r --arg id "$id" '.[] | "   promote.sh \(.) \($id)"' <<<"$ORDER"
    ;;

  snapshot)
    open_release
    if [ "$(rel '.migrations|length')" = 0 ] || [ "$(rel .rollback)" = true ]; then say "no snapshot needed for this release"; exit 0; fi
    from=$(rel .be.from)
    [ "$(live_commit "$API_ID")" = "$from" ] || die "thoven-api already left ${from:0:9}; a snapshot now would be taken after the migrations"
    host=$(retry render_get "/env-groups/$PROD_ENV_GROUP" | jq -r '.envVars[] | select(.key=="EXPECTED_DB_HOST") | .value | split(".")[0]')
    ep=$(neonctl connection-string "$NEON_PROD_BRANCH" --project-id "$NEON_PROJECT" --role-name neondb_owner | sed -E 's#^.*@([^/:?]+).*$#\1#' | cut -d. -f1 | sed 's/-pooler$//')
    [[ $ep =~ ^ep-[a-z0-9-]+$ ]] || die "could not read the endpoint of Neon branch $NEON_PROD_BRANCH"
    [ "$ep" = "$host" ] || die "prod connects to ${host:-unknown} but Neon branch $NEON_PROD_BRANCH serves $ep; fix NEON_PROD_BRANCH"
    be=$(rel .be.to)
    name="pre-promote-${be:0:9}-$(TZ=America/New_York date +%Y%m%d%H%M)"
    expires_at=$(iso_utc $(( $(date +%s) + SNAPSHOT_TTL_DAYS * 86400 - 3600 )))
    neonctl branches create --project-id "$NEON_PROJECT" --parent "$NEON_PROD_BRANCH" \
      --name "$name" --no-compute --no-secrets --expires-at "$expires_at" -o json >/dev/null
    neonctl branches list --project-id "$NEON_PROJECT" -o json | jq -e --arg n "$name" 'any(.[]; .name==$n)' >/dev/null \
      || die "snapshot $name not found after create"
    rel_set --arg n "$name" --argjson t "$(date +%s)" '.snapshot=$n | .snapshot_at=$t | .done.snapshot=true'
    say "snapshot $name of $ep"
    ;;

  backend)
    open_release
    BE=$(rel .be.to); FROM=$(rel .be.from)
    if [ "$(rel .rollback)" = true ] && [ "$(rel .fe.to)" != "$(rel .fe.from)" ] && [ "$(rel .done.frontend)" != true ]; then
      die "a rollback moves the frontend first: run frontend $ID"
    fi
    if [ "$(rel '.migrations|length')" != 0 ] && [ "$(rel .rollback)" = false ]; then
      [ "$(rel .done.snapshot)" = true ] || die "this release adds migrations; run snapshot $ID first"
      age=$(( $(date +%s) - $(rel .snapshot_at) ))
      [ "$age" -le "$SNAPSHOT_MAX_AGE" ] || die "snapshot $(rel .snapshot) is $((age / 60)) minutes old; take a fresh one"
      neonctl branches list --project-id "$NEON_PROJECT" -o json | jq -e --arg n "$(rel .snapshot)" 'any(.[]; .name==$n)' >/dev/null \
        || die "snapshot $(rel .snapshot) no longer exists in Neon"
    fi
    api=$(live_commit "$API_ID") || die "cannot read thoven-api deploys"
    worker=$(live_commit "$WORKER_ID") || die "cannot read thoven-worker deploys"
    still_planned "$api" "$FROM" "$BE" thoven-api
    still_planned "$worker" "$FROM" "$BE" thoven-worker
    for svc in "$API_ID" "$WORKER_ID"; do
      out=$(retry render_get "/services/$svc/deploys?limit=10") || die "cannot read $svc deploys"
      busy=$(jq -r '[.[].deploy | select(.status|test("created|queued|in_progress"))][0].id // empty' <<<"$out")
      [ -z "$busy" ] || die "$svc already has deploy $busy running; wait for it, then rerun"
    done

    [ "$REDEPLOY" = 0 ] && [ "$api" = "$BE" ] || deploy "$API_ID" "$BE"
    health_gate "$BE"
    rel_set '.done.api_healthy=true'
    [ "$REDEPLOY" = 0 ] && [ "$worker" = "$BE" ] || deploy "$WORKER_ID" "$BE"
    [ "$(live_commit "$WORKER_ID")" = "$BE" ] || die "thoven-worker is not live on ${BE:0:9}"
    rel_set '.done.backend=true'
    daily_webhook_gate
    rel_set '.done.daily_webhook=true'
    say "backend on ${BE:0:9} (api healthy, worker live)"
    ;;

  frontend)
    open_release
    FE=$(rel .fe.to); FROM=$(rel .fe.from); BE=$(rel .be.to)
    if [ "$(rel .rollback)" = false ]; then
      for svc in "$API_ID" "$WORKER_ID"; do
        [ "$(live_commit "$svc")" = "$BE" ] || die "$svc is not live on ${BE:0:9}; run backend $ID first"
      done
      [ "$BE" = "$(rel .be.from)" ] || [ "$(rel .done.api_healthy)" = true ] || die "the api health gate has not passed; run backend $ID"
    fi
    now=$(prod_fe || true)
    if [ "$now" = "$FE" ]; then rel_set '.done.frontend=true'; say "thoven.co already serves ${FE:0:9}"; exit 0; fi
    if [ -n "$now" ] || [ "$(rel .rollback)" = false ]; then still_planned "$now" "$FROM" "$FE" thoven.co; fi
    auto_assign_off || die "Vercel autoAssignCustomDomains is on; switch it off before promoting"

    fresh=$([ "$(rel .rollback)" = true ] && echo 0 || echo 1)
    pair=$(find_build "$FE" "$fresh") || die "cannot query Vercel deployments"
    started=$(rel '.build_started // empty')
    if [ -z "$pair" ] && [ -n "$started" ]; then
      say "waiting for the build plan started, $started"
      ( trap - ERR; wait_build "$started" >/dev/null ) \
        || { rel_set '.build_started=null'; die "the build plan started did not finish; run frontend $ID again to build a fresh one"; }
      pair=$(find_build "$FE" "$fresh") || die "cannot query Vercel deployments"
      [ -n "$pair" ] || say "the build plan started predates the last production env change"
    fi
    if [ -z "$pair" ]; then
      say "no usable production build of ${FE:0:9}; building one"
      dep=$(start_build "$VERCEL_PROJECT_ID" thoven "$FE" false) || die "Vercel refused to create a deployment"
      pair=$(wait_build "$dep") || exit 1
    fi
    read -r uid url substate <<<"$pair"

    trap 'guard_auto_assign' EXIT
    # Vercel refuses to promote a build that served production before; those go back through rollback.
    if [ "${substate:-STAGED}" = PROMOTED ]; then
      say "rolling back to https://$url, which served production before"
      vercel_api "/v1/projects/$VERCEL_PROJECT_ID/rollback/$uid" -X POST >/dev/null \
        || say "the rollback request failed; checking what thoven.co serves"
    else
      say "promoting https://$url"
      vercel_api "/v10/projects/$VERCEL_PROJECT_ID/promote/$uid" -X POST >/dev/null \
        || say "the promote request failed; checking what thoven.co serves"
    fi
    guard_auto_assign
    got=""
    for _ in $(seq 30); do got=$(site_sha || true); [ "$got" = "$FE" ] && break; sleep 10; done
    [ "$got" = "$FE" ] || die "thoven.co serves ${got:-nothing}, not ${FE:0:9}, after 5 minutes"
    rel_set --arg u "$url" '.build=$u | .done.frontend=true'
    say "thoven.co serves ${FE:0:9}"
    ;;

  tag)
    open_release
    daily_webhook_gate
    rel_set '.done.daily_webhook=true'
    BE=$(rel .be.to); FE=$(rel .fe.to)
    [ "$(live_commit "$API_ID")" = "$BE" ] && [ "$(live_commit "$WORKER_ID")" = "$BE" ] \
      || die "prod backend is not live on ${BE:0:9} on both services"
    [ "$(prod_fe || true)" = "$FE" ] || die "thoven.co does not serve ${FE:0:9}"

    t=$(rel '.tag // empty')
    if [ -z "$t" ]; then
      d=$(TZ=America/New_York date +%Y-%m-%d)
      taken=$( { remote_prod_tags "$BE_REPO"; remote_prod_tags "$FE_REPO"; } | grep "^prod/$d-" || true)
      n=1; while grep -x "prod/$d-$n" >/dev/null <<<"$taken"; do n=$((n + 1)); done
      t="prod/$d-$n"
      rel_set --arg t "$t" '.tag=$t'
    fi
    msg="release $(rel .id)
backend  $(rel .be.from | cut -c1-9) -> ${BE:0:9}
frontend $(rel .fe.from | cut -c1-9) -> ${FE:0:9}
snapshot $(rel '.snapshot // "none"')
build    $(rel '.build // .build_at_plan // "unchanged"')"
    push_tag() {
      if [ -n "$(git -C "$1" ls-remote origin "refs/tags/$t")" ]; then return 0; fi
      git -C "$1" tag -d "$t" >/dev/null 2>&1 || true
      git -C "$1" tag -a "$t" "$2" -m "$msg"
      LEFTHOOK=0 git -C "$1" push -q --no-verify origin "refs/tags/$t"
    }
    push_tag "$BE_REPO" "$BE" || die "backend tag push failed; nothing was tagged. Rerun tag $ID"
    push_tag "$FE_REPO" "$FE" || die "frontend tag push failed; the backend has $t. Rerun tag $ID to finish"
    close_release "done"
    say "tagged $t; release $ID closed"
    ;;

  status)
    [ -f "$REL_PTR" ] || { say "no open release"; exit 0; }
    jq . "$(cat "$REL_PTR")"
    ;;

  abort)
    open_release
    moved=$(rel '[.done | to_entries[] | select(.value) | .key] | join(", ")')
    [ -z "$moved" ] || say "already done in this release: $moved. Prod may be partly moved; plan a follow-up"
    close_release aborted
    say "release $ID closed without a tag"
    ;;

  *) usage ;;
esac
