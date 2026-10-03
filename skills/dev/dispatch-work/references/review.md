# Review: main's verify pass

The builder's own report is a claim. The verifier turns it into evidence. It runs in a fresh pane
on the model `agents.md` names, so it is not reviewing its own work.

## Working if

Check these against the builder's pane transcript and the branch before starting the verifier.
Each one that fails is a finding.

- The pane opened by reading the ticket and restating what it would build.
- A red run exists before the green one, for the proof the ticket names.
- Type-check and the touched test files ran during the build. No full suite or full lint ran.
- Commits land on the named branch, by exact path, each ending in the ticket id.
- `git diff --stat <base>..HEAD` touches the ticket's Paths, and every other file has a stated reason.
- The report labels each claim measured, inferred or guess.

## Verifier brief

Start the verifier as in step 3 and send:

```text
/poteto-mode Verify THV-<id> "<ticket title>"
Read Linear THV-<id> in full. The builder's report is below. Treat every line of it as a claim.
Repo <path>, branch <branch>, diff <base>..<head>. Read and run only; leave the code as it is.
1. /verify-this over every Acceptance line and every claim in the report.
2. /code-review against <base>.
3. /thermo-nuclear-code-quality-review when the diff crosses a module or passes ~300 lines.
4. /deslop findings only.
Reply to main with herdr agent prompt {{MAIN_PANE}} "VERIFIED THV-<id>" or "FINDINGS THV-<id>",
then a table: Acceptance line or claim, verdict, evidence. Findings carry file:line and a
severity: critical, important or minor.

<builder's report, pasted>
```

## Handling findings

- **Critical or important:** a fix round (`brief.md`, fix-round brief) into the builder's pane,
  then a verifier re-run scoped to the fix diff. Rounds 1 to 3 in the builder's pane. Rounds 4
  and 5 in a fresh pane one tier up. The ticket stays **Ready** throughout.
- **After round 5:** main rules on each open finding. Wrong or contestable: park it with the
  reason. Real but nothing builds on it: park it and file a follow-up. Real and something builds
  on it: rule the smallest change and send it as one more fix round. Record each ruling in the
  Linear comment.
- **Minor:** a follow-up ticket at close. Minor findings never start a fix round.

**Done when:** the verifier replied VERIFIED, or every finding is fixed or parked with a ruling,
and Andres has the evidence table.
