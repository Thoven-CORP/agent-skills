# Handoff across sessions or machines

Before handing off, read the current issue and its comments, the Project brief, the Spec and Architecture sections the task touches, and the latest Project Update. In the packet, name each source with its link and the time you read it, and name any required source you could not read. The receiver reads the sources themselves: the packet carries links, not summaries.

The receiver re-reads live sources before editing. A required source that is unavailable and absent from the packet is `NEEDS_CONTEXT`; an old local document never stands in for it.

Include the execution details:

- Task and mode: local coding, remote coding, or remote check; source and execution host.
- Each repository's absolute path, branch, starting HEAD, upstream and paired repository/worktree.
  Record staged, unstaged, untracked and unpushed work; distinguish owned paths from other sessions.
- Requested change or exact check, relevant service/port/database needs, and permitted writes.
- Where the browser, automation server and app run; what access was actually verified.
- Applicable proof, its revision/input identity, result and artifact paths; skipped or blocked checks.
- Next concrete action and unresolved dependencies. Keep secrets out; name env variables and secret
  file paths only. Authenticate separately on the destination.

A remote test uses a disposable mirror. Coding uses a separate Git worktree. Keep the existing
branch and PR route when changing hosts. Uncommitted saved changes may be checked remotely without
creating a product commit or another PR.
