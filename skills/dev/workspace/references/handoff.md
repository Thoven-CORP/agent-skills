# Handoff across sessions or machines

Before handing off, read the current Linear issue and comments, parent decisions, Project brief,
relevant linked documents and latest Project Update. Carry their governing content into the brief:
source title and URL/id, retrieval time, relevant decision ids and their actual meaning, unresolved
questions, and any required source that could not be read. A URL or fetched issue list alone is not
proof of reading. Keep the packet relevant to the assigned task; do not copy the whole workspace.

The receiver reads that content and states the governing decisions before editing. Re-read live
sources when available; if a required source is unavailable and absent from the packet, report
`NEEDS_CONTEXT`. Do not substitute an old local document silently. A packet records what was read
at its retrieval time; it cannot prove that later rulings do not exist.

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
