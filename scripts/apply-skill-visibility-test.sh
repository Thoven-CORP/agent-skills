#!/usr/bin/env bash
# Tests for apply-skill-visibility.sh against throwaway directories.
set -euo pipefail

script="$(cd "$(dirname "$0")" && pwd)/apply-skill-visibility.sh"
lab="$(mktemp -d)"
trap 'rm -rf "$lab"' EXIT
failures=0

export HOME="$lab/home"
export SKILLS_DIR="$lab/skills"
export CODEX_CONFIG="$lab/codex/config.toml"
export ACTIVE_SKILLS_FILE="$lab/activated"
export CLAUDE_SKILLS_DIR="$lab/claude-skills"
export PARKED_SKILLS_DIR="$lab/parked"
mkdir -p "$HOME"

install_skill() {
  mkdir -p "$SKILLS_DIR/$1"
  printf -- '---\nname: %s\n---\n' "$1" >"$SKILLS_DIR/$1/SKILL.md"
}

off_for_codex() {
  python3 -c '
import sys, tomllib
cfg = tomllib.load(open(sys.argv[1], "rb"))
off = {e["path"] for e in cfg.get("skills", {}).get("config", []) if e.get("enabled") is False}
sys.exit(0 if sys.argv[2] in off else 1)
' "$CODEX_CONFIG" "$SKILLS_DIR/$1/SKILL.md"
}

check() {
  local label="$1"; shift
  if "$@"; then printf 'ok   %s\n' "$label"; else printf 'FAIL %s\n' "$label"; ((failures += 1)); fi
}
fails() { ! "$@"; }

check "refuses when the skills directory is missing" fails bash "$script" sync

install_skill tdd
install_skill old-third-party
bash "$script" sync >/dev/null
check "first sync hides a skill outside the allowlist" off_for_codex old-third-party
check "first sync keeps an allowlisted skill on" fails off_for_codex tdd

install_skill security-audit
out="$(bash "$script" sync)"
check "a skill installed since the last sync stays on" fails off_for_codex security-audit
check "the new skill joins the activated list" grep -qxF security-audit "$ACTIVE_SKILLS_FILE"
check "the sync names the new skill" grep -q 'kept on: security-audit' <<<"$out"
check "a skill hidden before stays hidden" off_for_codex old-third-party

bash "$script" deactivate security-audit >/dev/null
check "deactivate switches the new skill off" off_for_codex security-audit
bash "$script" sync >/dev/null
check "a deactivated skill stays off on the next sync" off_for_codex security-audit

install_skill hand-hidden
printf '\n[[skills.config]]\npath = "%s"\nenabled = false\n' "$SKILLS_DIR/hand-hidden/SKILL.md" >>"$CODEX_CONFIG"
bash "$script" sync >/dev/null
check "a skill switched off by hand is not read as new" fails grep -qxF hand-hidden "$ACTIVE_SKILLS_FILE"

install_skill hand-kept
printf '\n[[skills.config]]\npath = "%s"\nenabled = false\n' "$SKILLS_DIR/hand-kept/SKILL.md" >>"$CODEX_CONFIG"
bash "$script" activate hand-hidden >/dev/null
check "activate wins over a hand-written switch-off" fails off_for_codex hand-hidden
check "activate removes that hand-written entry" fails grep -qF "$SKILLS_DIR/hand-hidden/SKILL.md" "$CODEX_CONFIG"
check "other hand-written entries are kept" off_for_codex hand-kept

if ((failures)); then printf '%d failed\n' "$failures"; exit 1; fi
printf 'all passed\n'
