# Workspace

`workspace` derives a deterministic Project snapshot from Linear, Project-local state, git, and
workflow law. Its zero-dependency Node modules live in `tools/` and are shared by
`feature-ledger`; neither skill invokes the other or stores hidden state.

## CLI

```bash
node tools/map.js --project 'Teacher 2.0: Dashboard' --project-dir /path/to/projects/dashboard
node tools/map.js --linear-json fixture.json --project 'Teacher 2.0: Dashboard' --project-dir /path/to/project --json
node tools/map.js --feature dashboard
node tools/map.js --family teacher
```

Without Linear credentials, the snapshot still renders and marks Linear `UNKNOWN`.

## Modules

| Module | Responsibility |
|---|---|
| `workflow.js` | workflow-law parsing |
| `project-state.js` | Project state and compatibility parsing |
| `linear.js` | Linear API and JSON/stdin normalization |
| `git.js` | repository and working-tree fingerprints |
| `sessions.js` | related-session matching |
| `checks.js` | mechanical stage, concurrency, mount, and proof checks |
| `snapshot.js` | pure snapshot derivation |
| `render.js` | Project snapshot and legacy Map rendering |
| `log.js` | idempotent Project feature-log updates |

Run all tests with `node --test tools/*.test.js`.
