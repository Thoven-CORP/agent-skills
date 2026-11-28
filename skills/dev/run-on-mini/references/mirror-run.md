# Run a check through the test mirrors

Each laptop checkout syncs to a disposable mini mirror (`~/thoven/mirrors/<repo>`) through a named Mutagen session, laptop to mini, `one-way-replica`. The mini-side `thoven/bin/remote-check` runs a command against a frozen copy of the mirrors, never the mirrors themselves, and prints the run folder on its last line.

## 1. Pick the input and the command

Resolve the frontend and backend pair the task names, never whichever tree is current, and record each path, branch, HEAD and saved dirty files (unsaved editor buffers do not travel). Choose the smallest command that tests the claim from the checkout's `TESTING.md`, and say whether it needs a real backend, browser, database or provider.

**Done when:** the pair and the command are written down.

## 2. Check the sessions

`mutagen sync list` shows a session per selected checkout, targeting a mirror under `~/thoven/mirrors*/` or `~/thoven-test-mirrors/` and never a coding tree, primary clone or home itself. A missing session is a setup gap: creating one needs Andres's setup go-ahead. A new session ignores VCS metadata, `.env` and secret paths, keys, `node_modules`, caches, build output, logs and local DB volumes, and keeps source, migrations, fixtures and lockfiles ([Mutagen ignores](https://mutagen.io/documentation/synchronization/ignores/)). Never sync a credential to make a test pass.

**Done when:** each session targets its mirror and shows no errors or conflicts.

## 3. Capture and run

```bash
mutagen sync flush <session>...
ssh <host> 'thoven/bin/remote-check --label <name> --in frontend|backend --meta branch=<b> --meta head=<sha> -- <command>'
mutagen sync flush <session>...
ssh <host> 'thoven/bin/remote-check --verify <run dir>'
```

Run it in the background and wait as SKILL.md, "Wait for a mini run", says. `--verify` prints STABLE when no laptop edit arrived mid-capture; CHANGED (exit 90) means rerun on a stable capture. Exit 91 is a missing mirror, 92 a failed dependency install. The run uses mini-local env, an isolated test database and unique ports, never production data.

For a browser check, the browser runs headless on the mini with a test profile. A laptop Chrome or Computer Use connector controls the laptop, not the mini.

**Done when:** the run folder, exit code and `--verify` verdict are in hand, and every service the run started is stopped.
