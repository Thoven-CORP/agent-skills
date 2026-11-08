#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh"
scratch=$(mktemp -d)
trap 'python3 -c "import shutil,sys; shutil.rmtree(sys.argv[1])" "$scratch"' EXIT
iso_utc() { date -u -r "$1" +%Y-%m-%dT%H:%M:%SZ; }
die() { echo "$*" >&2; exit 1; }
rel() { jq -r "$1" "$scratch/release.json"; }
rel_set() { jq "$@" "$scratch/release.json" > "$scratch/next.json" && mv "$scratch/next.json" "$scratch/release.json"; }
staging_control() {
  printf '%s\n' "$*" >> "$scratch/calls"
  case "$1" in
    hold) printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' ;;
    release-hold) echo released ;;
    probe) echo 'worker execution readiness: verified on thoven-api-staging' ;;
    *) return 1 ;;
  esac
}
token=$(staging_hold_acquire 'release test')
[ "$token" = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ]
printf '{"id":"test","staging_hold":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}' > "$scratch/release.json"
: > "$scratch/calls"
staging_hold_refresh > /dev/null
[ "$(rel .staging_hold)" = "$token" ]
[ "$(sed -n '1p' "$scratch/calls" | cut -d' ' -f1)" = hold ]
[ "$(sed -n '2p' "$scratch/calls")" = 'release-hold --token bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --apply' ]
echo 'PASS: refresh acquires and persists replacement before releasing the old hold'
staging_require_ready > /dev/null
[ "$(tail -1 "$scratch/calls")" = 'probe --apply' ]
echo 'PASS: staging selection requires a combined-service execution probe'
staging_control() { return 1; }
if staging_require_ready > "$scratch/probe-failure" 2>&1; then exit 1; fi
grep -q 'explicitly deploy the reviewed main SHA' "$scratch/probe-failure"
echo 'PASS: unavailable probe refuses staging readiness with explicit recovery steps'
if (staging_hold_refresh) > "$scratch/failure" 2>&1; then exit 1; fi
[ "$(rel .staging_hold)" = "$token" ]
echo 'PASS: unavailable control host blocks release without discarding the saved hold'
staging_control() { echo invalid; }
if staging_hold_acquire test > /dev/null 2>&1; then exit 1; fi
if staging_hold_release invalid > /dev/null 2>&1; then exit 1; fi
echo 'PASS: invalid tokens are refused'
mkdir -p "$scratch/home/.render" "$scratch/bin"
printf 'key: fixture\n' > "$scratch/home/.render/cli.yaml"
cat > "$scratch/bin/hostname" <<'SCRIPT'
#!/usr/bin/env bash
echo fixture-laptop
SCRIPT
cat > "$scratch/bin/ssh" <<'SCRIPT'
#!/usr/bin/env bash
exit 1
SCRIPT
cat > "$scratch/bin/curl" <<'SCRIPT'
#!/usr/bin/env bash
echo 'UNEXPECTED_PROVIDER_REQUEST' >&2
exit 99
SCRIPT
chmod +x "$scratch/bin/hostname" "$scratch/bin/ssh" "$scratch/bin/curl"
if HOME="$scratch/home" PATH="$scratch/bin:$PATH" bash "$(dirname "${BASH_SOURCE[0]}")/promote.sh" plan > "$scratch/plan-output" 2>&1; then exit 1; fi
grep -q 'cannot acquire shared staging hold; plan stopped' "$scratch/plan-output"
if grep -q UNEXPECTED_PROVIDER_REQUEST "$scratch/plan-output"; then exit 1; fi
[ ! -d "$scratch/home/.thoven/releases/lock" ]
echo 'PASS: actual promote plan refuses unavailable staging control before provider requests and cleans its lock'
mkdir -p "$scratch/home/.config/thoven" "$scratch/home/thoven/backend/bin"
printf 'RENDER_API_KEY=fixture\nSTAGING_ADMIN_TOKEN=fixture-secret\n' > "$scratch/home/.config/thoven/staging-lifecycle.env"
chmod 600 "$scratch/home/.config/thoven/staging-lifecycle.env"
cat > "$scratch/home/thoven/backend/bin/staging-lifecycle" <<'SCRIPT'
#!/usr/bin/env bash
[ "$RENDER_API_KEY" = fixture ] && [ "$STAGING_ADMIN_TOKEN" = fixture-secret ] && [ "$*" = 'probe --apply' ] || exit 1
echo ready
SCRIPT
chmod +x "$scratch/home/thoven/backend/bin/staging-lifecycle"
cat > "$scratch/bin/ssh" <<'SCRIPT'
#!/usr/bin/env bash
bash -c "${@: -1}"
SCRIPT
HOME="$scratch/home" PATH="$scratch/bin:$PATH" bash -c 'source "$1"; staging_require_ready' _ "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh" > "$scratch/remote-probe"
[ "$(cat "$scratch/remote-probe")" = ready ]
echo 'PASS: remote probe loads private mini credentials without logging them'
cat > "$scratch/bin/hostname" <<'SCRIPT'
#!/usr/bin/env bash
echo Mac.attlocal.net
SCRIPT
printf '{"role":"laptop"}\n' > "$scratch/home/.config/thoven/host.json"
cat > "$scratch/bin/ssh" <<'SCRIPT'
#!/usr/bin/env bash
echo remote-selected
SCRIPT
HOME="$scratch/home" PATH="$scratch/bin:$PATH" bash -c 'source "$1"; staging_control probe --apply' _ "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh" > "$scratch/route"
[ "$(cat "$scratch/route")" = remote-selected ]
echo 'PASS: a laptop named Mac.attlocal.net still routes through the mini'
printf '{"role":"mini"}\n' > "$scratch/home/.config/thoven/host.json"
for control_hostname in Mac Mac.local; do
  printf '#!/usr/bin/env bash\necho %s\n' "$control_hostname" > "$scratch/bin/hostname"
  HOME="$scratch/home" PATH="$scratch/bin:$PATH" bash -c 'source "$1"; staging_control probe --apply' _ "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh" > "$scratch/route"
  [ "$(cat "$scratch/route")" = ready ]
done
echo 'PASS: the canonical mini executes locally with or without a DHCP suffix'
source "$(dirname "${BASH_SOURCE[0]}")/staging-hold.sh"
t=$(STAGING_CONTROL=local staging_hold_acquire local 2>/dev/null)
[ "$t" = 00000000000000000000000000000000 ]
STAGING_CONTROL=local staging_hold_release "$t"
if STAGING_CONTROL=local staging_control 2>/dev/null; then exit 1; fi
echo 'PASS: STAGING_CONTROL=local takes no hold, releases nothing, and refuses an unknown command'
echo 'all passed'
