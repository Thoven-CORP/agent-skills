#!/bin/bash
# Proves prune.sh cannot delete source code, memory files, or tracked repo content.
# Builds a throwaway HOME, plants files that MUST survive next to junk that MUST go,
# runs prune.sh --apply against it, and asserts on the result.
# Touches nothing outside its own temp directory.

set -uo pipefail
SCRIPT="$(cd "$(dirname "$0")" && pwd)/prune.sh"
T=$(mktemp -d /tmp/prune-test.XXXXXX)
trap 'rm -rf "$T"' EXIT

pass=0; fail=0
ok()   { pass=$((pass+1)); printf "  \033[32mPASS\033[0m %s\n" "$1"; }
bad()  { fail=$((fail+1)); printf "  \033[31mFAIL\033[0m %s\n" "$1"; }
survives() { [ -e "$1" ] && ok "survived: ${1#$T/}" || bad "DELETED (must survive): ${1#$T/}"; }
removed()  { [ -e "$1" ] && bad "still present (should be gone): ${1#$T/}" || ok "removed: ${1#$T/}"; }

mk() { mkdir -p "$(dirname "$1")"; printf '%s' "${2:-x}" > "$1"; }
age() { touch -t 202001010000 "$@"; }

H="$T/home"

mk "$H/Library/Caches/SomeApp/blob.db"
mk "$H/Library/Caches/SomeApp/bundle.js"          # cache dir containing js, must still go
mk "$H/.cache/puppeteer/chrome/binary.db"
mk "$H/.npm/_npx/abc123/node_modules/pkg/index.js"

mk "$H/Library/Application Support/Wispr Flow/backups/backup-2026.sqlite"
mk "$H/Library/Application Support/Google/GoogleUpdater/staging.db"

repo="$H/thoven/frontend-parent-2.0"
mkdir -p "$repo"
git -C "$repo" init -q 2>/dev/null
printf '/.next/\nnode_modules/\n' > "$repo/.gitignore"
mk "$repo/package.json" '{}'
mk "$repo/src/app/page.tsx"     'export default function Page(){}'
mk "$repo/src/lib/billing.ts"   'export const chargeCard = () => {}'
mk "$repo/scripts/deploy.sh"    'echo deploy'
mk "$repo/.next/cache/webpack/0.pack"
mk "$repo/.next/cache/images/x.jpg"
mk "$repo/.next/BUILD_ID"                          # in .next but NOT .next/cache
mk "$repo/node_modules/left-pad/index.js"          # gitignored but not an allowed root
git -C "$repo" add -A >/dev/null 2>&1
git -C "$repo" -c user.email=t@t -c user.name=t commit -qm init >/dev/null 2>&1

mk "$H/.claude/projects/-proj/memory/MEMORY.md"        '# index'
mk "$H/.claude/projects/-proj/memory/user_andres.md"   'facts'
mk "$H/.claude/projects/-proj/session-abc.jsonl"       'transcript'
mk "$H/.claude/projects/-proj/notes.md"                'a markdown doc'
mk "$H/.claude/projects/-proj/tool-results/report.pdf" 'pdf'
mk "$H/.claude/projects/-proj/tool-results/snippet.js" 'const secret = 1'
mk "$H/.codex/sessions/s1.jsonl"                       'transcript'
mk "$H/.codex/sessions/keep-me.py"                     'import os'
mk "$H/.cursor/chats/c1.db"                            'chat'
mk "$H/.cursor/chats/config.yaml"                      'settings'

age "$H/.claude/projects/-proj/memory/MEMORY.md" \
    "$H/.claude/projects/-proj/memory/user_andres.md" \
    "$H/.claude/projects/-proj/session-abc.jsonl" \
    "$H/.claude/projects/-proj/notes.md" \
    "$H/.claude/projects/-proj/tool-results/report.pdf" \
    "$H/.claude/projects/-proj/tool-results/snippet.js" \
    "$H/.codex/sessions/s1.jsonl" "$H/.codex/sessions/keep-me.py" \
    "$H/.cursor/chats/c1.db" "$H/.cursor/chats/config.yaml"

echo "=== running prune.sh --apply against a throwaway HOME ==="
HOME="$H" TRANSCRIPT_DAYS=30 bash "$SCRIPT" --apply >"$T/out.log" 2>&1
rc=$?
echo "  exit=$rc"
grep -q "REFUSED" "$T/out.log" && { echo "  guard tripped:"; sed -n '/REFUSED/,+2p' "$T/out.log"; }

echo
echo "=== MUST SURVIVE: source code ==="
survives "$repo/package.json"
survives "$repo/src/app/page.tsx"
survives "$repo/src/lib/billing.ts"
survives "$repo/scripts/deploy.sh"
survives "$repo/.gitignore"
survives "$repo/.next/BUILD_ID"
survives "$repo/node_modules/left-pad/index.js"

echo
echo "=== MUST SURVIVE: memory and documents ==="
survives "$H/.claude/projects/-proj/memory/MEMORY.md"
survives "$H/.claude/projects/-proj/memory/user_andres.md"
survives "$H/.claude/projects/-proj/notes.md"
survives "$H/.claude/projects/-proj/tool-results/report.pdf"
survives "$H/.claude/projects/-proj/tool-results/snippet.js"
survives "$H/.codex/sessions/keep-me.py"
survives "$H/.cursor/chats/config.yaml"

echo
echo "=== MUST BE REMOVED: caches and aged transcripts ==="
removed "$H/Library/Caches/SomeApp/blob.db"
removed "$H/Library/Caches/SomeApp/bundle.js"
removed "$H/.cache/puppeteer/chrome/binary.db"
removed "$H/Library/Application Support/Wispr Flow/backups/backup-2026.sqlite"
removed "$H/Library/Application Support/Google/GoogleUpdater/staging.db"
removed "$repo/.next/cache/webpack/0.pack"
removed "$H/.claude/projects/-proj/session-abc.jsonl"
removed "$H/.codex/sessions/s1.jsonl"
removed "$H/.cursor/chats/c1.db"

echo
echo "================================================"
printf "  %d passed, %d failed\n" "$pass" "$fail"
[ "$fail" -eq 0 ] && echo "  SAFETY CONTRACT HOLDS" || echo "  CONTRACT VIOLATED - DO NOT RUN prune.sh"
echo "================================================"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
