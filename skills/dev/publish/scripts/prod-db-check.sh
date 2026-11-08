#!/usr/bin/env bash
# Read-only checks of the production database after a backend promote (references/production.md step 9).
# Every query runs in a read-only transaction with a 15 s timeout.
# Usage: prod-db-check.sh <backend_deploy_utc>   e.g. prod-db-check.sh 2026-10-15T22:24:00Z
# Exit 0 when every check passed, 1 when one failed, 2 on bad input, 3 when one must wait and rerun.
set -uo pipefail
DEPLOY_UTC=${1:-}
if ! [[ $DEPLOY_UTC =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
  echo "usage: prod-db-check.sh <backend_deploy_utc>, e.g. 2026-10-15T22:24:00Z (the time promote.sh backend printed its done line)" >&2
  exit 2
fi
# The connection string comes from neonctl on every run, as promote.sh's snapshot does, so no stored
# password can go stale (2026-11-04: the one in thoven-prod.env had, and every check failed to connect).
NEON_PROJECT=dry-sound-31987419
NEON_PROD_BRANCH=br-lingering-frost-b5phtwra
command -v neonctl >/dev/null || { echo "neonctl is not installed; promote.sh needs it too" >&2; exit 2; }
THOVEN_PROD_DATABASE_URL=$(neonctl connection-string "$NEON_PROD_BRANCH" --project-id "$NEON_PROJECT" --role-name neondb_owner 2>/dev/null)
[ -n "$THOVEN_PROD_DATABASE_URL" ] || { echo "cannot fetch the production connection string from neonctl; run neonctl auth" >&2; exit 2; }
export THOVEN_PROD_DATABASE_URL

fails=0; waits=0
record() { [ "$1" = FAIL ] && fails=$((fails+1)); [ "$1" = WAIT ] && waits=$((waits+1)); printf '%-5s %-40s %s\n' "$1" "$2" "$3"; }

h=$(curl -s --max-time 15 https://api.thoven.co/health)
be_sha=$(jq -r '.revision.sha // empty' <<<"$h" 2>/dev/null)
[ -n "$be_sha" ] || { record FAIL "api reports its SHA" "${h:-no response}"; exit 1; }

# The URL carries the password, so it goes into a chmod-600 service file and never onto a command line.
dbf=$(mktemp); chmod 600 "$dbf"; trap 'rm -f "$dbf"' EXIT
python3 -I - > "$dbf" <<'PY'
import os, urllib.parse as u
r = u.urlsplit(os.environ["THOVEN_PROD_DATABASE_URL"])
qs = dict(u.parse_qsl(r.query))
print("[thoven_prod]")
for k, v in [("host", r.hostname), ("port", r.port or 5432), ("dbname", r.path[1:]), ("user", u.unquote(r.username)),
             ("password", u.unquote(r.password)), ("sslmode", qs.get("sslmode", "require")), ("connect_timeout", 10)]:
    print(f"{k}={v}")
PY
q() { PGSERVICEFILE="$dbf" PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=15000' psql service=thoven_prod -XAtq -F '|' -v ON_ERROR_STOP=1 -c "$1"; }
num() { [[ $1 =~ ^[0-9]+$ ]]; }

echo "== production database at backend $be_sha (read-only, since $DEPLOY_UTC)"

git -C ~/thoven/backend fetch -q origin main
versions=$(git -C ~/thoven/backend ls-tree --name-only "$be_sha" db/migrate/ 2>/dev/null | sed -E 's#^db/migrate/([0-9]+)_.*#\1#' | grep -E '^[0-9]+$')
if [ -z "$versions" ]; then
  record FAIL "every migration at ${be_sha:0:9} applied" "could not list db/migrate at $be_sha in ~/thoven/backend"
else
  list=$(while read -r v; do printf "'%s'," "$v"; done <<<"$versions")
  if missing=$(q "select v from unnest(array[${list%,}]) v where v not in (select version from schema_migrations)" 2>&1); then
    if [ -z "$missing" ]; then record PASS "every migration at ${be_sha:0:9} applied" "$(wc -l <<<"$versions" | tr -d ' ') files"
    else record FAIL "every migration at ${be_sha:0:9} applied" "missing: $(tr '\n' ' ' <<<"$missing")"; fi
  else record FAIL "every migration at ${be_sha:0:9} applied" "query failed: $missing"; fi
fi

ed=$(q "select count(*), coalesce(string_agg(distinct mailer_action, ', '),''), coalesce(string_agg(distinct status, ', '),'') from email_deliveries where created_at > '$DEPLOY_UTC'" 2>&1)
mails=$(q "select count(*) from solid_queue_jobs where class_name in ('ActionMailer::MailDeliveryJob','LessonReminderMailJob') and finished_at is not null and created_at > '$DEPLOY_UTC'" 2>&1)
rows=${ed%%|*}
if ! num "$rows" || ! num "$mails"; then record FAIL "email ledger covers sent mail" "query failed: $ed $mails"
elif [ "$rows" -ge "$mails" ]; then record PASS "email ledger covers sent mail" "mail jobs=$mails, ledger rows|actions|statuses=$ed"
else record FAIL "email ledger covers sent mail" "mail jobs=$mails but ledger rows=$rows ($ed)"; fi

if fe=$(q "select j.class_name, count(*) from solid_queue_failed_executions f join solid_queue_jobs j on j.id=f.job_id where f.created_at > '$DEPLOY_UTC' group by 1 order by 2 desc" 2>&1); then
  if [ -z "$fe" ]; then record PASS "no failed jobs since deploy" "0"; else record FAIL "no failed jobs since deploy" "$(tr '\n' ' ' <<<"$fe")"; fi
else record FAIL "no failed jobs since deploy" "query failed: $fe"; fi

# LessonReminderJob is recurring every 15 minutes (backend config/recurring.yml), so it is judged
# only once 16 minutes have passed since the deploy.
age_min=$(( ($(date -u +%s) - $(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$DEPLOY_UTC" +%s)) / 60 ))
rj=$(q "select count(*), count(finished_at) from solid_queue_jobs where class_name='LessonReminderJob' and created_at > '$DEPLOY_UTC'" 2>&1)
if ! num "${rj%%|*}"; then record FAIL "LessonReminderJob ran since deploy" "query failed: $rj"
elif [ "${rj%%|*}" -gt 0 ]; then record PASS "LessonReminderJob ran since deploy" "enqueued|finished = $rj"
elif [ "$age_min" -lt 16 ]; then record WAIT "LessonReminderJob ran since deploy" "deploy was $age_min min ago; rerun after 16"
else record FAIL "LessonReminderJob ran since deploy" "none enqueued in $age_min min"; fi

echo "== $fails failed, $waits waiting"
[ "$fails" -gt 0 ] && exit 1
[ "$waits" -gt 0 ] && exit 3
exit 0
