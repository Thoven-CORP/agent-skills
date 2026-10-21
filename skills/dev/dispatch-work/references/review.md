# Review: main's verify pass

The builder's own report is a claim. A fresh verifier pane turns it into evidence on a feature
slice, on the model `agents.md` names, so it is not reviewing its own work. Cleanup and hardening
work is reviewed by a Sonnet subagent of main with the same brief.

## Main's pass

1. Rerun only the files the builder touched, one per run, and compare with the report.
2. On a UI ticket, open every parity image and show Andres. `SKILL.md` close step 6.1 uploads them
   after he confirms.
3. Merge backend before the frontend that reads it. UI merges after Andres sees the evidence.
4. The verify cadence is andres-mode "Check your own work": `bin/verify --base <integration branch>` once before DONE, CI on the integration PR.

## Working if

Check these against the builder's pane transcript and the branch before starting the verifier.
Each one that fails is a finding.

- The pane opened by reading the ticket and restating what it would build.
- A red run exists before the green one, for the proof the ticket names.
- Type-check, the touched test files (one file per run) and lint on those files ran during the build.
- Commits land on the named branch, by exact path, each ending in the ticket id.
- `git diff --stat <base>..HEAD` touches the ticket's Paths, and every other file has a stated reason.
- The report labels each claim measured, inferred or guess.
- A UI ticket's report links a parity capture folder with every touched state at 1440 and 390
  beside its board frame, and no blank image.

## Verifier brief

Start the verifier as in step 3 and send:

```text
/poteto-mode Verify THV-<id> "<ticket title>"
Read Linear THV-<id> in full. The builder's report is below. Treat every line of it as a claim.
Repo <path>, branch <branch>, diff <base>..<head>. Builder pane <builder pane id>. Read and run
only; leave the code as it is.
Evidence first. Read the builder's pane with
`herdr agent read <builder pane> --source recent-unwrapped --lines 120`, and read the receipt for
the head SHA at `git rev-parse --git-path thoven-verify.json`. A fresh receipt for the same
fingerprint proves its tests: re-run nothing it covers. No receipt means the run did not pass:
run `bin/verify --base <integration branch>` yourself and paste the block.
1. SPEC PARITY. Read the parent's "Decisions (canonical)". Trace every Acceptance line and every
   behaviour in the diff to a decision id. Name invented scope, a decision the diff missed or
   changed, and lexicon slips.
2. DESIGN PARITY, on a UI ticket. Open the builder's `~/.thoven-artifacts/<branch>/parity/grid.html`
   first, then the board frames each decision cites. Compare every state yourself and recapture only a state that looks wrong. Run
   /better-ui and /thoven-designer over the built screens. A difference from a frame that Andres
   did not confirm is an important finding.
3. A SKIPPED `mutation` row on a diff touching `lib/`, a service or a model is a finding: run with `--mutation`. Claims the receipt does not cover get a direct check. /verify-this covers those claims only.
4. /mattpocock-skills:code-review against <base>.
5. /thermo-nuclear-code-quality-review when the diff crosses a module or passes ~300 lines. Past
   ~1k added lines, shard it by surface from `git diff --numstat`: one shared BRIEF.md with the
   rules and the pinned head, one small findings file per shard, sonnet for structural and
   lower-risk shards.
6. /deslop findings only.
Round 2 and later: read the fix diff only.
Write findings into your reply and into the ticket's one evidence folder
(`~/.thoven-artifacts/THV-<id>/evidence/`). Create no parallel suite and no second evidence tree.
Reply to main with herdr agent prompt {{MAIN_PANE}} "VERIFIED THV-<id>" or "FINDINGS THV-<id>",
then a SPEC PARITY table (decision id, verdict, evidence), a DESIGN PARITY table (state,
frame, verdict, image) on a UI ticket, and a table: Acceptance line or claim, verdict, evidence. Findings carry file:line and a
severity: critical, important or minor.

<builder's report, pasted>
```

## Handling findings

- **Gate repair, CI fixes and redesigns are not fix rounds.** They are one line to Andres with a choice.
- **Critical or important:** a fix round (`brief.md`, fix-round brief) into the builder's pane,
  then a verifier re-run scoped to the fix diff. There are 3 fix rounds. Rounds 1 and 2 go to the
  builder's pane. Round 3 goes to a fresh pane one tier up. The ticket stays **Ready** throughout.
- **After round 3:** main rules on each open finding. Wrong or contestable: park it with the
  reason. Real but nothing builds on it: park it with the reason in the comment. Real and something builds
  on it: rule the smallest change and send it as one more fix round. Record each ruling in the
  Linear comment.
- **Minor:** fixed on the branch before Done, or dropped with the reason in the close comment. Minor findings never start a fix round and never become tickets.

**Done when:** the verifier replied VERIFIED, or every finding is fixed or parked with a ruling,
and Andres has the evidence table.
