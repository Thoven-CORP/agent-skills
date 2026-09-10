#!/usr/bin/env bash
# Keep the global catalog usable in Codex without deleting installed skills.
#
# Skills outside the allowlist are parked beside the active catalog. Re-run
# `sync` after any `npx skills add` or update command. Use `activate <name>`
# before explicitly invoking a parked skill.
set -euo pipefail

skills_dir="${SKILLS_DIR:-$HOME/.agents/skills}"
parked_dir="${PARKED_SKILLS_DIR:-$HOME/.agents/skills-on-demand}"

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
  feature-ledger investigate-thoven doc-freshness

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
)

is_auto_skill() {
  local candidate="$1"
  local skill
  for skill in "${auto_skills[@]}"; do
    [[ "$skill" == "$candidate" ]] && return 0
  done
  return 1
}

activate_skill() {
  local skill_name="$1"
  local parked_skill="$parked_dir/$skill_name"
  local active_skill="$skills_dir/$skill_name"

  if is_auto_skill "$skill_name"; then
    printf '%s is already part of the model-visible core.\n' "$skill_name"
    return 0
  fi
  if [[ -e "$active_skill" ]]; then
    printf '%s is already active.\n' "$skill_name"
    return 0
  fi
  if [[ ! -d "$parked_skill" ]]; then
    printf 'No parked skill named %s.\n' "$skill_name" >&2
    return 1
  fi

  mv "$parked_skill" "$active_skill"
  printf 'Activated %s. Start a new Codex session before invoking it.\n' "$skill_name"
}

deactivate_skill() {
  local skill_name="$1"
  local parked_skill="$parked_dir/$skill_name"
  local active_skill="$skills_dir/$skill_name"

  if is_auto_skill "$skill_name"; then
    printf '%s is part of the protected model-visible core.\n' "$skill_name" >&2
    return 1
  fi
  if [[ ! -d "$active_skill" ]]; then
    printf '%s is not active.\n' "$skill_name" >&2
    return 1
  fi
  if [[ -e "$parked_skill" ]]; then
    printf 'Cannot park %s because an older parked copy already exists.\n' "$skill_name" >&2
    return 1
  fi

  mkdir -p "$parked_dir"
  mv "$active_skill" "$parked_skill"
  printf 'Parked %s. Start a new Codex session to remove it from the catalog.\n' "$skill_name"
}

sync_catalog() {
  local skill_dir skill_file skill_name parked_skill
  local visible=0
  local parked=0
  local duplicates=0

  mkdir -p "$parked_dir"

  # Restore a core skill if a prior catalog pass parked it.
  for skill_name in "${auto_skills[@]}"; do
    if [[ ! -e "$skills_dir/$skill_name" && -d "$parked_dir/$skill_name" ]]; then
      mv "$parked_dir/$skill_name" "$skills_dir/$skill_name"
    fi
  done

  for skill_dir in "$skills_dir"/*; do
    skill_file="$skill_dir/SKILL.md"
    [[ -f "$skill_file" ]] || continue
    skill_name="$(basename "$skill_dir")"
    parked_skill="$parked_dir/$skill_name"

    if is_auto_skill "$skill_name"; then
      perl -0pi -e 's/^disable-model-invocation: .*\n//m' "$skill_file"
      ((visible += 1))
      continue
    fi

    if [[ -e "$parked_skill" ]]; then
      printf 'Skipped %s: a parked copy exists; resolve its update deliberately.\n' "$skill_name" >&2
      ((duplicates += 1))
      continue
    fi

    mv "$skill_dir" "$parked_skill"
    ((parked += 1))
  done

  printf 'Skill catalog synced: %d model-visible, %d newly parked' "$visible" "$parked"
  if (( duplicates > 0 )); then
    printf ', %d duplicate updates require review' "$duplicates"
  fi
  printf '.\n'
}

case "${1:-sync}" in
  sync) sync_catalog ;;
  activate) [[ $# -eq 2 ]] || { printf 'Usage: %s activate <skill-name>\n' "$0" >&2; exit 2; }; activate_skill "$2" ;;
  deactivate) [[ $# -eq 2 ]] || { printf 'Usage: %s deactivate <skill-name>\n' "$0" >&2; exit 2; }; deactivate_skill "$2" ;;
  *) printf 'Usage: %s [sync|activate <skill-name>|deactivate <skill-name>]\n' "$0" >&2; exit 2 ;;
esac
