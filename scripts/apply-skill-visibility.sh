#!/usr/bin/env bash
# Keep Codex's skill catalog small without moving any installed skill.
#
# Every skill stays where `npx skills` put it, so `npx skills update` and the
# Claude Code links keep working. Skills outside the allowlist are switched off
# for Codex only, through a managed block of `[[skills.config]] enabled = false`
# entries in ~/.codex/config.toml. Re-run `sync` after any `npx skills add` or
# update. `activate <name>` switches one skill back on for Codex.
set -euo pipefail

skills_dir="${SKILLS_DIR:-$HOME/.agents/skills}"
parked_dir="${PARKED_SKILLS_DIR:-$HOME/.agents/skills-on-demand}"
codex_config="${CODEX_CONFIG:-$HOME/.codex/config.toml}"
active_list="${ACTIVE_SKILLS_FILE:-$HOME/.agents/.codex-activated-skills}"
claude_skills_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
begin_marker="# BEGIN apply-skill-visibility (managed, do not edit by hand)"
end_marker="# END apply-skill-visibility"

if [[ ! -d "$skills_dir" ]]; then
  printf 'Skills directory does not exist: %s\n' "$skills_dir" >&2
  exit 1
fi

# The auto-invoked core is intentionally small. It contains all of Pstack,
# Thoven's daily workflow and QA surface, the explicitly retained design
# packages, and the Matt Pocock skills Andres uses routinely.
auto_skills=(
  # Pstack
  architect arena automate-me blast-radius bro create-verification-skill
  figure-it-out how interrogate maintain-verification-skill make-bot-ui
  no-comments poteto-mode recall reflect setup-pstack show-me-your-work swarm
  tdd teach technical-writing typescript-best-practices unslop why
  principle-attack-the-premise principle-boundary-discipline
  principle-build-the-lever principle-encode-lessons-in-structure
  principle-exhaust-the-design-space principle-experience-first
  principle-fix-root-causes principle-foundational-thinking
  principle-guard-the-context-window principle-laziness-protocol
  principle-make-operations-idempotent
  principle-migrate-callers-then-delete-legacy-apis
  principle-minimize-reader-load principle-model-the-domain
  principle-never-block-on-the-human principle-outcome-oriented-execution
  principle-prove-it-works principle-redesign-from-first-principles
  principle-separate-before-serializing-shared-state
  principle-sequence-verifiable-units principle-subtract-before-you-add
  principle-test-behavior-not-implementation principle-type-system-discipline

  # Product verification and daily Thoven work
  qa-flow control-cli control-ui find-skills preflight publish verify workspace
  feature-ledger investigate-thoven doc-freshness dispatch-work andres-mode

  # Official Cursor Team Kit (Cursor plugins, main)
  check-compiler-errors deslop fix-ci fix-merge-conflicts get-pr-comments
  loop-on-ci make-pr-easy-to-review new-branch-and-pr pr-review-canvas
  review-and-ship run-smoke-tests thermo-nuclear-code-quality-review
  verify-this weekly-review what-did-i-get-done workflow-from-chats
  # Retained from the retired Thoven Team Kit; no official equivalent exists.
  thermos thermo-nuclear-review

  # Explicitly retained design and writing packages
  better-accessibility better-colors
  better-interface better-layout better-typography better-ui better-writing
  emil-design-eng interface-craft interface-review transitions-dev no-ai-slop
  writing-plans writing-for-agents

  # Matt Pocock and everyday stack skills
  code-review codebase-design diagnosing-bugs domain-modeling research
  resolving-merge-conflicts

  # Official Vercel React diagnostics and browser QA
  agent-browser vercel-composition-patterns vercel-react-best-practices
  vercel-react-view-transitions
)

is_auto_skill() {
  local candidate="$1"
  local skill
  for skill in "${auto_skills[@]}"; do
    [[ "$skill" == "$candidate" ]] && return 0
  done
  return 1
}

is_activated() {
  [[ -f "$active_list" ]] && grep -qxF "$1" "$active_list"
}

# One-time move away from the old parked folder: a parked skill goes back to
# the catalog, unless npx already installed a newer copy there.
unpark_all() {
  [[ -d "$parked_dir" ]] || return 0
  local parked_skill skill_name restored=0 trashed=0
  local trash
  trash="$HOME/.Trash/skills-on-demand-$(date +%Y%m%d-%H%M%S)"
  for parked_skill in "$parked_dir"/*; do
    [[ -e "$parked_skill" ]] || continue
    skill_name="$(basename "$parked_skill")"
    # A catalog entry that is only a link into the parked folder is not a
    # second copy: the parked folder is the real skill. Put it in the link's place.
    if [[ -L "$skills_dir/$skill_name" && "$(readlink "$skills_dir/$skill_name")" == *"$(basename "$parked_dir")/$skill_name" ]]; then
      rm "$skills_dir/$skill_name"
      mv "$parked_skill" "$skills_dir/$skill_name"
      ((restored += 1))
    elif [[ -e "$skills_dir/$skill_name" ]]; then
      mkdir -p "$trash"
      mv "$parked_skill" "$trash/$skill_name"
      ((trashed += 1))
    else
      mv "$parked_skill" "$skills_dir/$skill_name"
      ((restored += 1))
    fi
  done
  rmdir "$parked_dir" 2>/dev/null || true

  # Claude Code links that pointed into the parked folder follow the skill home.
  local link target repointed=0
  if [[ -d "$claude_skills_dir" ]]; then
    for link in "$claude_skills_dir"/*; do
      [[ -L "$link" ]] || continue
      target="$(readlink "$link")"
      [[ "$target" == "$parked_dir"/* ]] || continue
      ln -sfn "$skills_dir/$(basename "$target")" "$link"
      ((repointed += 1))
    done
  fi
  printf 'Unparked: %d restored, %d stale copies moved to %s, %d Claude links repointed.\n' \
    "$restored" "$trashed" "$trash" "$repointed"
}

# Paths already switched off by hand, outside the managed block.
unmanaged_paths() {
  [[ -f "$codex_config" ]] || return 0
  awk -v b="$begin_marker" -v e="$end_marker" '
    $0 == b { skip = 1; next }
    $0 == e { skip = 0; next }
    !skip && /^path = "/ { sub(/^path = "/, ""); sub(/"$/, ""); print }
  ' "$codex_config"
}

write_block() {
  local block_file="$1"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "$codex_config" ]]; then
    awk -v b="$begin_marker" -v e="$end_marker" '
      $0 == b { skip = 1; next }
      $0 == e { skip = 0; next }
      !skip { lines[++n] = $0 }
      END { while (n > 0 && lines[n] == "") n--; for (i = 1; i <= n; i++) print lines[i] }
    ' "$codex_config" >"$tmp"
  fi
  cat "$block_file" >>"$tmp"
  if command -v python3 >/dev/null; then
    python3 -c 'import sys,tomllib; tomllib.load(open(sys.argv[1],"rb"))' "$tmp" || {
      printf 'Refusing to write %s: the result is not valid TOML.\n' "$codex_config" >&2
      rm -f "$tmp"; return 1; }
  fi
  mkdir -p "$(dirname "$codex_config")"
  if ! { [[ -f "$codex_config" ]] && chmod --reference="$codex_config" "$tmp" 2>/dev/null; }; then
    chmod 600 "$tmp"
  fi
  mv "$tmp" "$codex_config"
}

sync_catalog() {
  local skill_dir skill_file skill_name path
  local visible=0 hidden=0
  local block
  block="$(mktemp)"

  unpark_all

  local handled
  handled="$(unmanaged_paths)"

  {
    printf '\n%s\n' "$begin_marker"
    for skill_dir in "$skills_dir"/*; do
      skill_file="$skill_dir/SKILL.md"
      [[ -f "$skill_file" ]] || continue
      skill_name="$(basename "$skill_dir")"
      if is_auto_skill "$skill_name"; then
        perl -0pi -e 's/^disable-model-invocation: .*\n//m' "$skill_file"
        ((visible += 1))
        continue
      fi
      if is_activated "$skill_name"; then
        ((visible += 1))
        continue
      fi
      path="$skills_dir/$skill_name/SKILL.md"
      ((hidden += 1))
      grep -qxF "$path" <<<"$handled" && continue
      printf '[[skills.config]]\npath = "%s"\nenabled = false\n\n' "$path"
    done
    printf '%s\n' "$end_marker"
  } >"$block"

  write_block "$block"
  rm -f "$block"
  printf 'Codex catalog synced: %d model-visible, %d switched off in %s.\n' "$visible" "$hidden" "$codex_config"
}

activate_skill() {
  local skill_name="$1"
  [[ -f "$skills_dir/$skill_name/SKILL.md" ]] || { printf 'No installed skill named %s.\n' "$skill_name" >&2; return 1; }
  if is_auto_skill "$skill_name" || is_activated "$skill_name"; then
    printf '%s is already on for Codex.\n' "$skill_name"
    return 0
  fi
  printf '%s\n' "$skill_name" >>"$active_list"
  sync_catalog
  printf 'Activated %s. Start a new Codex session before invoking it.\n' "$skill_name"
}

deactivate_skill() {
  local skill_name="$1"
  if is_auto_skill "$skill_name"; then
    printf '%s is part of the protected model-visible core.\n' "$skill_name" >&2
    return 1
  fi
  if ! is_activated "$skill_name"; then
    printf '%s is already off for Codex.\n' "$skill_name"
    return 0
  fi
  grep -vxF "$skill_name" "$active_list" >"$active_list.tmp" || true
  mv "$active_list.tmp" "$active_list"
  sync_catalog
  printf 'Switched %s off for Codex. Start a new Codex session to drop it.\n' "$skill_name"
}

case "${1:-sync}" in
  sync) sync_catalog ;;
  activate) [[ $# -eq 2 ]] || { printf 'Usage: %s activate <skill-name>\n' "$0" >&2; exit 2; }; activate_skill "$2" ;;
  deactivate) [[ $# -eq 2 ]] || { printf 'Usage: %s deactivate <skill-name>\n' "$0" >&2; exit 2; }; deactivate_skill "$2" ;;
  *) printf 'Usage: %s [sync|activate <skill-name>|deactivate <skill-name>]\n' "$0" >&2; exit 2 ;;
esac
