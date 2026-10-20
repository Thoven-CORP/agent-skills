# /verify, live layer

Ruling 2026-10-19: this is not a separate skill. It is the live-app layer of `skills/dev/verify/`: scripts under `verify/live/`, the feature map under `verify/features/`, and one `parity` row in `bin/verify` that runs when a UI diff touches `app/` or `components/`. One skill, one receipt. Generated with `create-verification-skill`; not yet proven end to end (generator step 4), which is the first build task.

## Launch

- Backend: `cd ~/thoven/backend && TEST_DATABASE_URL=... bin/rails s -b 0.0.0.0 -p 3001` from the slice's worktree. Ready when `curl -s localhost:3001/up` returns 200.
- Frontend: `cd <frontend worktree> && PORT=<free port> pnpm run dev --port <port>` with `NEXT_PUBLIC_API_URL=http://localhost:3001`. Ready when `/api/health` answers. Each worktree gets its own port and its own `.next-<port>` dir, never a shared `.next`.
- Never through `thoven-load-gate` (servers hold a slot forever, memory `project_load_gate_servers_deadlock`). Record both PIDs in `~/.thoven-artifacts/THV-<id>/run.json`; cleanup kills by PID.

## Doctor

One read-only script, `verify/live/doctor.sh <port>`: frontend port answers and its PID is in `run.json`; backend `/up` 200; a seeded dogfood login succeeds and returns a JWT; disk free above 5 GB; load under 10. Any red line means do not drive. (V10, O7.)

## Drive

Playwright via the repo's `e2e/` config with a `baseURL` of the launched port, or `agent-browser` from the pane only. Routes come from the feature map, never `/dev/*` or lab routes (V7). Selectors: ARIA roles and `data-testid` that already exist in `components/`. Escape is dispatched in-page, never via `press Escape` (memory `project_agent_browser_escape_pegs_renderer`).

## Evidence

Folder `~/.thoven-artifacts/THV-<id>/evidence/`:
- `states/<state>-1440.png` and `-390.png`, taken after the content has drawn (wait on a selector, never a sleep; a blank image is a failed capture, E3).
- `flow.webm` of the path.
- `grid.html`: board frame beside both shots per state, built by `verify/live/grid.mjs`. This is what main opens in chat before asking anything.
- `side-effects.json`: the rows or records the flow should have written, read back through the API (test the artifact, rule 10).
Evidence survives cleanup; the close step uploads `grid.html` and the PNGs to the Linear issue and deletes the folder only after the user has looked.

## Cleanup

`verify/live/cleanup.sh THV-<id>`: kills the PIDs in `run.json`, closes the browser it opened, removes `.next-<port>`, leaves `evidence/`. Never `pkill -f next-server` or `pkill -f agent-browser` (O7 hit other panes).

## Helpers

`scripts/launch.sh`, `verify/live/doctor.sh`, `scripts/capture.mjs <state> <route>`, `verify/live/grid.mjs`, `verify/live/cleanup.sh`. All executable, each invoked above.

## Feature map (`verify/features/`)

Seed with the five surfaces the audit's false-done list hit: `login-and-session.md`, `book-lessons.md`, `private-lessons-session-note.md`, `scheduling-calendar.md`, `live-lesson-portal.md`. Each file: Sub-features, How to get to it (user POV), Driving it with Playwright, Gotchas. `features/README.md` is the index.
