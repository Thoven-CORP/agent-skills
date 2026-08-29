# Templates: what each part is for

Every column here is load-bearing. A template filled in with the columns dropped is not this
template.

## Which level each template belongs to

**The workflow and continuation state live at the Project.** Audience-level state remains a
read-only compatibility input until each existing Project is migrated.

| Template | Level | Copies |
|---|---|---|
| `CONTINUE_HERE.md` | **project** | one per Project |
| `STATE.md` | **project** | one per Project |
| `PRD.md` | **project** | one per Project |
| `architecture.md` · `api.md` · `database.md` | **project**, in `decisions/` | one set per Project |
| `DESIGN_PROJECT.md` | **project** | one per Project, renamed for what it designs: `DESIGN_DASHBOARD.md` |

A Project's `PRD + Architecture` milestone is done when that Project's files are done. One `PRD.md`
covering a whole audience could never reach 100%.

## In every file

| Part | Exists because |
|---|---|
| **`<!-- SCAFFOLD -->` marker** | An untouched template reads exactly like a finished one. `reconcile` greps for this marker, so an empty file cannot pass a gate. Delete the line when the first real row lands. |
| **`## Done when`** | A file with no completion test is finished whenever someone feels finished. This block states the check for this file specifically, and an issue's own `Done when` should quote it. |
| **The id prefix** | The prefix names the kind: `E#` PRD.md · `ADR#` architecture.md · `A#` api.md · `DB#` database.md · `D#` `DESIGN_<PROJECT>.md`. A kind runs one series across the audience, so `D84` resolves by grep no matter which Project owns it. |

## Columns

| Column | Where | Exists because |
|---|---|---|
| **Layer** | PRD, architecture, api, database | "componentization is DONE" was true of the files and false of the product: two of seven modules had zero call sites. A layer field makes that a cell, not an essay. |
| **Evidence** | PRD, architecture | A decision that *describes* a design drifts from it. Point; do not restate. |
| **Verified** | all decision files | Two docs asserted things nobody had checked, and both read as fact. An empty Verified cell reads as unchecked. |
| **Emitted by** | api.md | Filled from the serializer, never the type file. `contract-check` never validates response bodies, so this column is the only place a phantom field is caught. |
| **Migration** | database.md | Answers "why does this column exist" in one place, and the named migration has to exist. |
| **What to build from** | DESIGN.md | A drawing, a proto route plus screen, or a component and the commit it was canon at. Anything vaguer sends a builder to guess. |
| **Owning gate** | DESIGN.md | Where the final prototype is going to be. A path that opens (`app/dev/<feature>/page.tsx`). |
| **REJECTED, and why** | DESIGN.md | The rejected alternative is what catches a decision quietly reintroducing a shape already thrown out. Delete superseded rows; keep this. |
| **Surfaces covered** | DESIGN.md, cross-surface rules | A rule scoped wider than its pointers leaves a surface inside the scope with no authority at all. |
| **Authority / mount / proof pointers** | STATE.md Coverage | File presence was repeatedly mistaken for a built, reachable surface. |
| **Work unit / Commit / Repo / Issue / Paths / Receipt** | STATE.md | Preserves exact ownership and lets dirty-tree-safe commits be audited. |
