// $TMPDIR/dispatch/out/, main's inbox. A pane writes its report there and deletes it once the send succeeds.

// /tmp/cockpit-fixtures/dispatch-out/listing.txt, the `## $TMPDIR/dispatch/out/` section
export const INBOX_NAMES: readonly string[] = ["THV-1004.md", "THV-1038.md", "THV-909.md", "THV-911.md", "THV-912.md", "THV-914.md", "w40-p1.md"]

// /tmp/cockpit-fixtures/dispatch-out/sample-head.txt without its first line, which names the file read:
// $TMPDIR/dispatch/out/THV-1004.md, an escalation herdr's verify plugin left, not a report.
export const OUT_ESCALATION_THV_1004 = "[thoven verify] THV-1004 pane w56:p1 reported done 3 times and still: 1 live process: sleep 30 (pid 71389). Nudged 2x; needs you.\n"

// The first three lines of $TMPDIR/dispatch/out/THV-1038.md, read 2026-10-03: a research deliverable, not a report.
export const OUT_RESEARCH_THV_1038_HEAD = "# THV-1038 step 1. What main still reads from thoven2.0, and where it moves\n\nRead-only inventory. Pinned at FE `origin/main` 5faa53ac, BE `origin/main` 1e5ffbaa, agent-skills `origin/main` c494d76c and the thoven2.0 working tree (HEAD 66b9529). Each claim is labelled **measured**, **inferred** or **guess**.\n"
