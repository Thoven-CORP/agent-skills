# Templates — and why each column exists

Every column here is a specific failure from the 2026-08-14 Materials & Homework audit
(40 findings, six shards). Columns are load-bearing; a template filled in with the
columns dropped is not this template.

| Column | Exists because |
|---|---|
| **Layer** | "componentization is DONE" was true of the files and false of the product. Two of seven modules had zero call sites. A layer field makes that a cell, not an essay. |
| **Evidence** | A decision that *describes* a design drifts from it. `E18` described a layout in prose and specified the shape its own proto had rejected. Point; do not restate. |
| **Owner** | Four ghost owners were cited thirteen times. *"whichever gate owns X"* is not an owner. |
| **Verified** | Two docs asserted things nobody had checked — *"~20 lines"* (real: ~770) and *"surfaced to Andres, see the task report"* (no such report). Both read as fact. An empty Verified cell reads as unchecked. |
| **Commits** | When asked *"what did you build?"* the answer took three greps. One column answers it. |
