#!/usr/bin/env bash
# Failing-test coverage for the adversarial enforce.sh findings.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git_init() {
  local d="$1"
  mkdir -p "$d"
  git -C "$d" init -q
  git -C "$d" -c user.email=a@b -c user.name=c checkout -q -b main
}

# Fixture agent-skills repo whose origin/main holds RULES.md (open_pr_cap=5).
# Working tree is then dirtied to 99 so a checkout read would pass a 5-open count.
skills="$tmp/skills-repo"
mkdir -p "$skills/skills/factory/factory-rules/scripts"
cp "$DIR/../RULES.md" "$skills/skills/factory/factory-rules/RULES.md"
cp "$DIR/parse-caps.py" "$skills/skills/factory/factory-rules/scripts/parse-caps.py"
git_init "$skills"
git -C "$skills" add skills
git -C "$skills" -c user.email=a@b -c user.name=c commit -qm 'rules on main'
git -C "$skills" clone -q --bare "$skills" "$tmp/skills.git"
git -C "$skills" remote add origin "$tmp/skills.git"
git -C "$skills" fetch -q origin
git -C "$skills" branch -q --set-upstream-to=origin/main main
sed -i 's/open_pr_cap=5/open_pr_cap=99/' "$skills/skills/factory/factory-rules/RULES.md"

product="$tmp/product"
git_init "$product"
printf 'ok\n' >"$product/app.rb"
git -C "$product" add app.rb
git -C "$product" -c user.email=a@b -c user.name=c commit -qm init
git -C "$product" clone -q --bare "$product" "$tmp/product.git"
git -C "$product" remote add origin "$tmp/product.git"
git -C "$product" fetch -q origin

cat >"$tmp/small.stat" <<'EOF'
 app/models/lesson.rb | 12 ++++++------
 1 file changed, 6 insertions(+), 6 deletions(-)
EOF

run() {
  FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
    "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/small.stat" "$@"
}

expect_fail() {
  local reason="$1"
  shift
  set +e
  run "$@" >"$tmp/out" 2>"$tmp/err"
  local code=$?
  set -e
  if [[ "$code" -eq 0 ]]; then
    echo "FAIL  expected failure ($reason)" >&2
    cat "$tmp/out" "$tmp/err" >&2
    exit 1
  fi
  if ! grep -q "$reason" "$tmp/err"; then
    echo "FAIL  missing reason: $reason" >&2
    cat "$tmp/err" >&2
    exit 1
  fi
  echo "ok    $reason"
}

expect_pass() {
  local name="$1"
  shift
  set +e
  run "$@" >"$tmp/out" 2>"$tmp/err"
  local code=$?
  set -e
  if [[ "$code" -ne 0 ]]; then
    echo "FAIL  expected pass ($name)" >&2
    cat "$tmp/out" "$tmp/err" >&2
    exit 1
  fi
  echo "ok    $name"
}

python3 "$DIR/parse-caps.py" --rules "$DIR/../RULES.md" --print open_pr_cap weekly_pr_cap max_lines max_files claim_lock_hours >"$tmp/caps"
grep -qx 'open_pr_cap=5' "$tmp/caps"
grep -qx 'claim_lock_hours=24' "$tmp/caps"
echo "ok    caps parse"

cat >"$tmp/bad-caps.md" <<'EOF'
```caps
open_pr_cap=__import__("os").system("true")
weekly_pr_cap=3
max_lines=400
max_files=15
ci_failure_stop=2
claim_lock_hours=24
```
EOF
set +e
python3 "$DIR/parse-caps.py" --rules "$tmp/bad-caps.md" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'not a non-negative int' "$tmp/err"
echo "ok    parse-caps rejects non-int (no eval)"

# C1: caps from origin/main (5), not checkout (99). open_count=5 hits the main cap.
expect_fail "open loop PRs 5 >= open_pr_cap 5" --open-count 5 --weekly-count 0 --ci-failures 0
expect_pass "checkout cap 99 is ignored" --open-count 2 --weekly-count 0 --ci-failures 0

# C1: --rules and FACTORY_RULES rejected
set +e
FACTORY_SKILLS_GIT="$skills" "$DIR/enforce.sh" --rules "$DIR/../RULES.md" --open-count 0 --weekly-count 0 --ci-failures 0 --diff-stat "$tmp/small.stat" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  --rules is not allowed' "$tmp/err"
echo "ok    --rules rejected"

set +e
FACTORY_RULES="$DIR/../RULES.md" FACTORY_SKILLS_GIT="$skills" \
  "$DIR/enforce.sh" --open-count 0 --weekly-count 0 --ci-failures 0 --diff-stat "$tmp/small.stat" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  FACTORY_RULES is not allowed' "$tmp/err"
echo "ok    FACTORY_RULES rejected"

# C1: skills/factory and RULES.md forbidden
cat >"$tmp/self.stat" <<'EOF'
 skills/factory/factory-rules/RULES.md | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
EOF
set +e
FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/self.stat" --open-count 0 --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'skills/factory/' "$tmp/err"
grep -q 'RULES.md' "$tmp/err"
echo "ok    skills/factory and RULES.md forbidden"

# C3: FACTORY_SKIP_GH fails
set +e
FACTORY_SKIP_GH=1 FACTORY_SKILLS_GIT="$skills" \
  "$DIR/enforce.sh" --ci-failures 0 --diff-stat "$tmp/small.stat" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  FACTORY_SKIP_GH is not allowed' "$tmp/err"
echo "ok    FACTORY_SKIP_GH fails"

# C2: gh failure is fail-closed, not count 0
cat >"$tmp/gh-fail" <<'EOF'
#!/usr/bin/env bash
echo "gh: API error" >&2
exit 1
EOF
chmod +x "$tmp/gh-fail"
set +e
FACTORY_GH="$tmp/gh-fail" FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/small.stat" --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  gh open PR list failed' "$tmp/err"
echo "ok    gh failure fail-closed"

# C2: scoped to target repo and counts factory: title prefix
cat >"$tmp/gh-ok" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$@" >"${FAKE_GH_LOG}"
if [[ "$*" != *"--repo Thoven-CORP/frontend-remote"* ]]; then
  echo "wrong repo scope: $*" >&2
  exit 1
fi
cat <<'JSON'
[{"number":1,"title":"factory: fix button","labels":[]},{"number":2,"title":"other","labels":[{"name":"factory-loop"}]}]
JSON
EOF
chmod +x "$tmp/gh-ok"
git -C "$product" remote remove origin
git -C "$product" remote add origin "https://github.com/Thoven-CORP/frontend-remote.git"
set +e
FAKE_GH_LOG="$tmp/gh.log" FACTORY_GH="$tmp/gh-ok" FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/small.stat" --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
# open count is 2 (title prefix + label), cap 5, should pass
if [[ "$code" -ne 0 ]]; then
  echo "FAIL  scoped gh count should pass" >&2
  cat "$tmp/out" "$tmp/err" >&2
  exit 1
fi
grep -q 'open loop PRs 2 / 5' "$tmp/out"
grep -qx -- '--repo' "$tmp/gh.log"
grep -qx -- 'Thoven-CORP/frontend-remote' "$tmp/gh.log"
echo "ok    gh scoped to target repo and counts factory: titles"

# C4: unreadable base fail-closed (no uncommitted fallback)
set +e
FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --base origin/does-not-exist --open-count 0 --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  base origin/does-not-exist unreadable' "$tmp/err"
echo "ok    unreadable base fail-closed"

# IMPORTANT: --ci-failures required
set +e
FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/small.stat" --open-count 0 --weekly-count 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'FAIL  --ci-failures is required' "$tmp/err"
echo "ok    --ci-failures required"

# IMPORTANT: new forbidden tokens, lesson-session allowed
for pair in \
  "app/services/auth/login.rb|auth" \
  "app/models/password.rb|password" \
  "lib/oauth/client.rb|oauth" \
  "app/controllers/login_controller.rb|login" \
  "app/models/api_token.rb|token" \
  "app/services/payment/charge.rb|payment" \
  "app/models/invoice.rb|invoice" \
  "app/models/subscription.rb|subscription" \
  "app/views/checkout/show.rb|checkout" \
  "app/services/stripe/charge.rb|charge" \
  "config/locales/terms/en.yml|terms/" \
  "frontend/app/emails/welcome.tsx|emails/" \
  "frontend/app/templates/mail/reset.tsx|frontend templates" \
  "db/seeds.rb|db/seeds" \
  "config/session_store.rb|session"
 do
  path="${pair%%|*}"
  why="${pair#*|}"
  cat >"$tmp/forb.stat" <<EOF
 ${path} | 2 ++
 1 file changed, 2 insertions(+)
EOF
  set +e
  FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
    "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/forb.stat" --open-count 0 --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
  code=$?
  set -e
  if [[ "$code" -eq 0 ]] || ! grep -q "$why" "$tmp/err"; then
    echo "FAIL  expected forbidden $path ($why)" >&2
    cat "$tmp/err" >&2
    exit 1
  fi
done
echo "ok    expanded forbidden paths"

cat >"$tmp/lesson.stat" <<'EOF'
 app/models/lesson_session.rb | 3 +++
 1 file changed, 3 insertions(+)
EOF
expect_pass "lesson-session is not a session hit" --diff-stat "$tmp/lesson.stat" --open-count 0 --weekly-count 0 --ci-failures 0

cat >"$tmp/mig.stat" <<'EOF'
 db/migrate/20260101000000_add.rb | 10 ++++++++++
 1 file changed, 10 insertions(+)
EOF
set +e
FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/mig.stat" --open-count 0 --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'db/migrate/' "$tmp/err"
echo "ok    migration path forbidden"

{
  for i in $(seq 1 16); do
    echo " app/foo$i.rb | 1 +"
  done
  echo " 16 files changed, 16 insertions(+)"
} >"$tmp/wide.stat"
set +e
FACTORY_SKILLS_GIT="$skills" FACTORY_RULES_REF=origin/main \
  "$DIR/enforce.sh" --repo "$product" --diff-stat "$tmp/wide.stat" --open-count 0 --weekly-count 0 --ci-failures 0 >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'max_files' "$tmp/err"
echo "ok    16 files fail max_files=15"

echo "all factory-rules checks passed"
