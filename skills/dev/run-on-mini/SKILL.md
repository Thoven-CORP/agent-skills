---
name: run-on-mini
description: Runs a test, build, browser check or bin/verify on the Mac mini against the laptop's saved changes, waits on the run, and frees mini disk. Use when the Bash guard routes heavy work to the mini.
---

# Run on mini

Heavy work (bin/verify, builds, e2e, whole suites, browser captures) runs on the mini, the host whose `~/.config/thoven/host.json` says `mini`. The laptop's Bash guard refuses it locally and names this skill. Product code is never edited on the mini through this skill: coding there uses its own worktree and the normal branch and PR.

## Pitfalls

- Read mini-side logs and screenshots yourself over the ssh host in `~/.config/thoven/host.json`. (LEARNINGS 2026-10-31)
- "could not read Username for 'https://github.com'" on the mini means a clone's origin is https with an expired `gh` token. Fix it with ssh remotes: `ssh <host> git -C ~/thoven/<repo> remote set-url origin git@github.com:Thoven-CORP/<repo>-remote.git`. `remote-verify` checks the fetch first and exits 5 with that fix. If `gh` itself is needed there, `! ssh -t <host> gh auth login -h github.com`, and put the one-time code and `https://github.com/login/device` in the reply. (2026-11-17)
- On the 8 GB mini, run one check or browser at a time, and free space first when `df -h /` is under 15 GiB.

## Pick the route

| What runs | Route |
|---|---|
| `bin/verify` | `remote-verify`, below |
| Any other test, build or browser check of saved changes | [references/mirror-run.md](references/mirror-run.md) |
| Mini disk under 15 GiB, or asked to free space | [references/free-space.md](references/free-space.md) |

## remote-verify

From inside the laptop's frontend or backend checkout: `~/thoven/agent-skills/enforcement/bin/remote-verify --base <integration branch>`. It ships HEAD, the uncommitted patch and untracked files (never secrets, `node_modules` or build output) to a throwaway worktree on the mini and runs `bin/verify` there. HEAD must be on an origin branch. `--help` lists the flags and exit codes. Paste its `THOVEN_VERIFY` block verbatim, `THOVEN_VERIFY_BEGIN` through `THOVEN_VERIFY_END`; `concurrency: 1` in it means the mini was busy. When the mini is unreachable, report verify blocked.

**Done when:** the block is in your report, with each FAIL row fixed or raised by name.

## Wait for a mini run

A mini run outlasts one foreground call, and a bare `sleep N` is blocked. Start it in the background writing a laptop log that ends in a marker, then wait on the marker with one Monitor loop whose `timeout_ms` is the run's budget:

```bash
log=<scratch dir>/<run>.log
{ remote-verify --base <branch>; echo "RUN_END exit=$?"; } > "$log" 2>&1   # background
until grep -q '^RUN_END' "$log"; do sleep 5; done; tail -n 40 "$log"     # Monitor
```

Wrap an `ssh <host> 'thoven/bin/remote-check …'` call the same way. macOS has no `timeout`, so `timeout_ms` is the bound.

**Done when:** `RUN_END` is in the log and you have read its exit code and the run's last lines.

## Report

The exact command, the host, the source paths, branches, HEADs and dirty-input identity, the exit code, and the log or screenshot paths. A green mini run proves that captured input passed that command, not a causal fix (that is `prove-claim`), hosted CI or production behaviour.
