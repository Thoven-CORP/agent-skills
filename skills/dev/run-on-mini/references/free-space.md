# Free mini space

Run when the mini's `df -h /` is under its `minDiskFreeGiB` (15 GiB), where the load gate refuses heavy runs, or when asked.

1. **List** over ssh, with size and last change: run folders in `~/thoven/runs/`; scratch and evidence checkouts in `~/thoven/tmp/` and `~/thoven/tmp-evidence/`; captures in `~/.thoven-artifacts/`; mirrors in `~/thoven/mirrors*/` and `~/thoven-test-mirrors/`; every `git worktree list` entry of the mini's frontend, backend and agent-skills clones other than the clone itself.
2. **Keep** what is owned: a path a running process has as its cwd (`lsof -d cwd -Fn`), a mirror a laptop `mutagen sync list` session targets, evidence of a ticket in progress, and a worktree with dirty files, a HEAD on no origin branch (`git branch -r --contains HEAD` prints nothing) or a branch with an open PR (`gh pr list --head <branch>`). The rest is the removal set.
3. **Show** the removal set as a table (path, size, age, why unowned) with the free space it should leave, then remove exactly that set: `git worktree remove` without `--force` and `git worktree prune` for worktrees, `rm -rf` for the rest.
4. **Report** each removed path with its size, and `df -h /` before and after.

**Done when:** free space is above 15 GiB, or the report names what still holds the space and who owns it.
