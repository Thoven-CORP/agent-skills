---
name: thoven-factory-mode
description: Working style for Thoven's bug-and-fix factory loop. Use for /thoven-factory-mode, factory station 6, or a cloud-agent fix on a batched loop PR. Separate from andres-mode. Do not use for ordinary product builds.
disable-model-invocation: true
---

# Thoven factory mode

Conventions for factory loop agents. Product-session rules stay in `skills/andres-mode/SKILL.md`. Read that file when a factory ticket also needs Linear-as-record or spec parity. Do not copy it here.

## Autonomy

Do reversible factory work without asking. Pause for production writes, customer messages, deploys, and anything in the forbidden-area list.

No is an acceptable answer. A ticket that needs auth, billing, a migration, or legal copy is a bounce, not a clever workaround.

## Process

1. Load `skills/factory/factory-rules/RULES.md` and run `factory-rules/scripts/enforce.sh` before the first edit and before opening the PR.
2. One batch of linked tickets is one PR. Size caps apply to that PR.
3. Station 6 uses the prompt in [references/station-6-fix-prompt.md](references/station-6-fix-prompt.md). Paste it into the cloud agent. Do not invent a shorter brief.
4. Frame the work with poteto-mode. Gate the push with no-mistakes. Drive the user path with `thoven-verify`.
5. Stop after `ci_failure_stop` red CI runs. Never auto-revert.
6. If you just did the same steps by hand twice, propose an automation and stop.

## Review and verify

Done means the user path is dead on staging or the preview, with evidence that survived cleanup. A green unit test alone is not done.

Station 7 runs `factory-review`, which invokes `thoven-factory-formal`. This mode does not replace that review.

## Skills

- `skills/andres-mode/SKILL.md` for Thoven records and parity
- `skills/factory/factory-rules/SKILL.md` for caps
- `skills/factory/thoven-verify/SKILL.md` for the drive
- `skills/dev/no-mistakes/SKILL.md` for the local gate
- poteto-mode for playbook framing
