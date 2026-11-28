# Disk budget for checks

Read before a temporary checkout, dependency install, build or capture, your own or delegated.

- Pick the smallest check that answers the claim, and reuse CI evidence from the same revision when it proves the same claim. A local production build needs Andres's request or the parent's full verify.
- Read free disk on the host and estimate the peak from checkouts, dependencies, caches and captures together. Leave at least 5 GB free after it, or the host profile's `minDiskFreeGiB` when higher (the mini's is 15, and its load gate refuses below it). When the estimate does not fit, use CI or the mini, or report the check blocked.
- Keep runtime scratch in a task-named directory outside retained evidence. Make a temporary worktree only to run a separate revision, and compare revisions one at a time.
- Keep revisions, commands, verdicts, the failure and success logs, and the screenshots you cite. Save traces and heap dumps only for a named open claim.
- On success, failure or cancellation, stop your processes and remove your temporary checkouts, dependencies and build caches (`.next/cache` included). Remove worktrees with plain `git worktree remove`, never forced, and never delete shared, unpushed or another session's work. Report leftover scratch with its owner and reason.
