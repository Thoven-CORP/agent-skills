---
name: remote-check
description: Run a requested check on the Mac mini using saved MacBook changes, return logs or screenshots, and preserve the existing Git branch and PR workflow. Uses dedicated Mutagen test mirrors, separate from remote coding worktrees.
---

# Remote check

Use this for a test, build or browser check of saved local changes. For coding on the mini, use a
separate Git worktree and the normal branch/PR process. Never edit product code in the sync mirror.
When the check is `bin/verify`, run `remote-verify` from the MacBook checkout instead: it ships HEAD
plus the dirty and untracked files to a throwaway worktree on the mini and never touches a mirror.

## Pitfalls

- Read mini-side logs and screenshots yourself over the ssh host in `~/.config/thoven/host.json`. (LEARNINGS 2026-10-31)

## Select the input

Read the relevant Linear task and governing document bodies. Follow
[handoff.md](../workspace/references/handoff.md) for context, host and repository provenance.
Resolve the requested frontend/backend pair; do not select whichever tree happens to be current.
Record source paths, branches, HEADs and saved dirty/untracked changes. Unsaved editor buffers
cannot be transferred. No product commit, branch switch or extra PR is required for this check.

Choose the smallest command that tests the claim, using the target checkout's `TESTING.md` and
existing verification skills. State whether it needs a real backend, browser, database or external
provider. Do not silently substitute mocked proof. Check mini load/disk before starting heavy work;
on an 8 GB host, start with one check/browser at a time.

## Verify the mapping

Use named Mutagen sessions from each selected MacBook source to dedicated disposable mini roots,
for example `~/thoven-test-mirrors/<pair>/frontend` and `backend`. Confirm actual expanded paths,
SSH user/host and direction. Reject a destination equal to, inside, or containing a coding tree,
primary clone or another session's work. Reject home itself and its ancestors; a dedicated child
mirror under home is allowed. Resolve symlinks before comparing paths.
Do not retarget an existing session to a different source branch/worktree silently.

Use `one-way-replica`: MacBook is alpha; mini mirror is beta. Beta-only edits may be overwritten
or deleted. A destination must be empty or already owned by this test workflow; never adopt a
populated unknown directory. Check installed `mutagen sync create --help` before creating sessions.
Creating a mapping requires setup authority, not just a request to run a check.

Review exclusions before the first transfer. Ignore VCS metadata explicitly (`--ignore-vcs` and
`.git`, including worktree pointer files); env/secret files and directories; SSH/key material;
`node_modules`, dependency bundles, caches/build outputs, logs, reports, browser profiles and local
DB/storage volumes. Enumerate the selected project's actual secret paths without reading values.
Mutagen does not automatically inherit Git ignores. Do not exclude source, migrations, fixtures,
lockfiles, required binary/LFS assets or executable configuration just because Git ignores them.
Resolve necessary ignored assets deliberately; never sync credentials to make a test pass.

Mutagen's [mode documentation](https://mutagen.io/documentation/synchronization/),
[ignore rules](https://mutagen.io/documentation/synchronization/ignores/) and
[SSH transport](https://mutagen.io/documentation/transports/ssh/) describe these controls. Ignored
paths remain outside sync ownership, so destination dependencies and secrets must be provisioned
separately. Keep artifacts and database volumes outside the mirror where practical. Use lockfiles
and project runtime pins to install mini-native dependencies; do not transfer laptop installations.

## Capture and run

1. Validate noninteractive SSH and the named session endpoints. Do not disable host-key checking
   or authenticate for the user. A missing login is a named setup gap. Never expose browser/CDP,
   database or dev-server ports publicly; use SSH forwarding or an already approved private route.
2. Briefly keep source files stable while capturing the pair. Save edits, flush each selected
   session, then pause all selected sessions. Inspect status for errors, conflicts or pending work.
   Confirm the synchronized source-file manifest/hashes matches the destination for both repos,
   using the reviewed exclusions, and that source hashes did not change during capture. If it
   changed or differs, resume, flush and recapture; do not start a check on mismatched inputs.
   Stop on repeated mismatch and name the concurrent writer. Sequential flushes alone do not
   establish an atomic frontend/backend pair.
3. Record input identities and capture time. The MacBook can now keep changing; leave these sync
   sessions paused throughout the check. Do not reset the laptop or stop unrelated processes.
4. Run the requested command in the mini mirror with host-local env, an isolated development/test
   database, unique ports and only the needed services. Establish their ownership first. Never use
   production data or shared destructive fixtures. If the check needs Git metadata or files outside
   the mapping, identify that dependency and select a supported disposable setup before proceeding;
   excluded `.git` means source branch identity comes from the captured MacBook provenance.
5. Capture exit status, relevant logs/screenshots and resulting input hashes. Unexpected source
   mutation invalidates the input claim; disclose it before retrying. Return artifacts over the
   approved SSH/private channel to a requested local location, or provide accessible remote paths.
   Keep cookies, auth headers, personal data and secrets out of returned logs and screenshots.
6. Stop only services this run owns. Confirm no check remains before resuming the selected sync
   sessions. On interruption, leave them paused and explain why; do not resume into a running test.

For browser work, identify where the browser and automation tool actually execute. A headless
browser on the mini can run without a physical monitor. A laptop Computer Use/Chrome connector
controls its connected host/session; Rex and SSH do not relocate it to the mini. Verify a supported
remote automation connection, or use mini-local browser automation. Desktop interaction requires an
available graphical session and that host's permissions; report that gap instead of claiming remote
GUI access. Use a separate test profile, not a synchronized personal browser profile.

## Return the result

Report the exact command, execution host, paired source paths/branches/HEADs and captured dirty
input identity, exit/result, proof type and accessible log/screenshot paths. State skipped checks
and missing context. A green remote run proves that captured input passed that command; it does
not prove a causal fix, hosted CI or production behavior. Reuse the existing verification skill
for a baseline/treatment comparison when the task is to prove a fix.
