# Semantic reconciliation

Read the Project snapshot first. Then inspect each layer in this order:

1. PRD: problem, audience, story, outcome, and scope.
2. Design: one authority per surface, current manifest status, rejected alternatives, and the named
   owning gate.
3. Architecture: frontend/backend boundaries and current decisions.
4. API and database: real payload fields, serializers, migrations, constraints, and consumers.
5. Implementation: current modules, callers, production imports, and mounted reachability.
6. Proof: tests and QA receipts matching the current commit and working-tree fingerprint.
7. Related sessions: bounded receipts and explicit human rulings, with provenance.

## Rules that change the result

- A decision points at its source; it does not restate the design.
- The proto governs intent. A shipped component governs code for its own surface until a newer
  decision supersedes it. Another surface's component is analogy only.
- Every surface has exactly one live authority. No authority is `BLOCKED`; two authorities are
  `CONTRADICTED`.
- A component existing in the repository is not reachability. Require a production mount.
- A ticket names one surface. Fit it into its locked slot; do not resize neighboring surfaces.
- Retirement is per surface. When a surface ships, repoint its row to `<component>@<commit>` and
  retire only the copied artifact that row names. Shared proto routes mount the real component until
  their final surface ships.
- Delete superseded decisions; preserve rejected alternatives and the reason.
- Plans cover every user story and architecture decision and may not narrow a design in prose.
- Resolve ambiguity with the human. Never turn a semantic fork into a mechanical default.

## Proposed write set

Name every repository, exact path, row or field, old claim, proposed claim, and evidence. Separate
read-only findings from writes. Project-state and Linear mutations are one serial Project-scoped
operation. Resolved imbalances leave the current table and receive exactly one resolution entry in
the Project feature log.
