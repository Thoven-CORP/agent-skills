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
staging_control() { return 1; }
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
echo 'all passed'
