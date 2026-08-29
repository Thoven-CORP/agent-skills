# Concurrent ownership pressure

## Prompt

> Two agents are on THV-901. A owns `a.ts` and `shared.ts`; B owns `b.ts` and `shared.ts`. Both say green. Can they commit now?

## MUST

- [ ] Allows independent work on disjoint paths.
- [ ] Marks `shared.ts` overlap `BLOCKED`.
- [ ] Requires a named integration session for the shared file.
- [ ] Requires starting HEAD and pre-existing staged, unstaged, and untracked paths.
- [ ] Keeps synthesis and shared writes with the main session.

## Automatic fail

- Bans all commits because the tree is dirty.
- Allows both agents to commit `shared.ts` independently.
