#!/usr/bin/env bash
# publish.sh "<summary>" <agents.py command and args...>
# Applies one agents.toml change on a fresh branch of origin/main, merges it into agent-skills, and
# pulls ~/thoven/agent-skills, which is the checkout herdr's plugin and the installed skills read.
# The edit never touches that checkout directly, so it stays clean and versioned (THV-1078).
# TW_PUBLISH_DRYRUN=1 applies and checks the change, then stops before any commit.
set -euo pipefail
REPO="${THOVEN_AGENT_SKILLS:-$HOME/thoven/agent-skills}"
summary="$1"; shift

git -C "$REPO" fetch -q origin
br="config/agents-$(date +%Y%m%d-%H%M%S)"
wt="$(mktemp -d)/agent-skills"
git -C "$REPO" worktree add -q -b "$br" "$wt" origin/main --no-track
merged=0
cleanup() {
  git -C "$REPO" worktree remove --force "$wt" >/dev/null 2>&1 || true
  # A squash merge leaves this branch's commit off main, so -d refuses; the PR holds the history.
  git -C "$REPO" branch -D "$br" >/dev/null 2>&1 || true
  [ "$merged" = 1 ] || git -C "$REPO" push -q origin --delete "$br" >/dev/null 2>&1 || true
}
trap cleanup EXIT

export THOVEN_AGENTS_CONFIG="$wt/config/agents.toml"
agents="$wt/skills/dev/dispatch-work/scripts/agents.py"
python3 "$agents" "$@"
if ! python3 "$agents" check >/dev/null; then
  python3 "$agents" check | grep PROBLEM || true
  echo "agents.toml check failed; nothing published"
  exit 1
fi
if git -C "$wt" diff --quiet -- config/agents.toml; then
  echo "no change to publish"
  exit 0
fi
if [ "${TW_PUBLISH_DRYRUN:-0}" = 1 ]; then
  git -C "$wt" --no-pager diff -- config/agents.toml
  echo "DRY RUN: not committed"
  exit 0
fi

git -C "$wt" add config/agents.toml
git -C "$wt" commit -q -m "$summary" -m "Published from the herdr agents menu (THV-1078)."
git -C "$wt" push -q -u origin "$br"
url="$(cd "$wt" && gh pr create --base main --head "$br" --title "$summary" \
  --body "Published from the herdr agents menu (THV-1078). One change to config/agents.toml, checked with agents.py check.")"
# No --delete-branch: gh then checks out main locally, which fails while ~/thoven/agent-skills has it.
(cd "$wt" && gh pr merge "$url" --squash >/dev/null)
merged=1
git -C "$REPO" push -q origin --delete "$br" >/dev/null 2>&1 || true
echo "merged: $url"
if git -C "$REPO" pull -q --ff-only 2>/dev/null; then
  echo "live: ~/thoven/agent-skills is at $(git -C "$REPO" rev-parse --short HEAD)"
else
  echo "merged on GitHub, but ~/thoven/agent-skills did not fast-forward; run: git -C $REPO pull"
fi
