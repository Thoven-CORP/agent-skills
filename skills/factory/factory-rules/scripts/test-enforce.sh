#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

python3 "$DIR/parse-caps.py" --rules "$DIR/../RULES.md" --print open_pr_cap weekly_pr_cap max_lines max_files >"$tmp/caps"
grep -qx 'open_pr_cap=5' "$tmp/caps"
grep -qx 'weekly_pr_cap=3' "$tmp/caps"
grep -qx 'max_lines=400' "$tmp/caps"
grep -qx 'max_files=15' "$tmp/caps"
echo "ok    caps parse"

# small legal diff
cat >"$tmp/small.stat" <<'EOF'
 app/models/lesson.rb | 12 ++++++------
 1 file changed, 6 insertions(+), 6 deletions(-)
EOF
FACTORY_SKIP_GH=1 "$DIR/enforce.sh" --rules "$DIR/../RULES.md" --diff-stat "$tmp/small.stat" --open-count 2 --weekly-count 1 --ci-failures 1
echo "ok    small batch passes"

# too many files
{
  for i in $(seq 1 16); do
    echo " app/foo$i.rb | 1 +"
  done
  echo " 16 files changed, 16 insertions(+)"
} >"$tmp/wide.stat"
set +e
FACTORY_SKIP_GH=1 "$DIR/enforce.sh" --rules "$DIR/../RULES.md" --diff-stat "$tmp/wide.stat" --open-count 0 --weekly-count 0 >/dev/null
code=$?
set -e
[[ "$code" -ne 0 ]]
echo "ok    16 files fail max_files=15"

# forbidden path
cat >"$tmp/mig.stat" <<'EOF'
 db/migrate/20260101000000_add.rb | 10 ++++++++++
 1 file changed, 10 insertions(+)
EOF
set +e
FACTORY_SKIP_GH=1 "$DIR/enforce.sh" --rules "$DIR/../RULES.md" --diff-stat "$tmp/mig.stat" --open-count 0 --weekly-count 0 >/dev/null
code=$?
set -e
[[ "$code" -ne 0 ]]
echo "ok    migration path forbidden"

# open cap
set +e
FACTORY_SKIP_GH=1 "$DIR/enforce.sh" --rules "$DIR/../RULES.md" --diff-stat "$tmp/small.stat" --open-count 5 --weekly-count 0 >/dev/null
code=$?
set -e
[[ "$code" -ne 0 ]]
echo "ok    5 open PRs hit open_pr_cap"

echo "all factory-rules checks passed"
