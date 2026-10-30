# The artifact page

Built with the `visual-artifacts` skill at
`~/.thoven-artifacts/product/text-feedback/<YYYY-MM-DD>-<slug>.html`, beside earlier runs. The
2026-10-29 run, `2026-10-29-three-weeks-of-texts.html`, is the model: open it before composing.

The page is **segmented by theme**, because this is product feedback that arrived as text
messages. Each heading is a claim, and each theme section quotes its signals verbatim.

## Sections, in order

1. **At a glance**: the window, threads and messages read, test accounts excluded, and the three
   findings that matter most.
2. **Bugs**: one row per bug: what the person saw, the verdict, the record, the evidence.
   A sequence diagram for any bug whose cause crosses the frontend and backend.
3. **One section per theme** with two or more signals, or one signal backed by a production
   number (such as expiry rates or answer times). Quotes first, then the number, then the
   proposal for that theme.
4. **Delivery**: the anomalies from `anomalies.json`, counted by kind, each kind with one example
   record.
5. **Going well**: positive feedback, quoted.
6. **Proposal**: the improvements, ordered by what to ship first, each tied to its theme's
   evidence. When a proposal changes how a system works, run `/architect` on it and show the
   chosen shape here.
7. **Full conversations**: `threads_fragment.html` from `render_threads.py`, then a table of
   the notification-only threads (teacher, parent, count, anything wrong with them).

## Privacy

The page stays on this machine. Children's names and message bodies never leave it: Linear
tickets carry record ids, adult names, and the shortest quote a ticket needs.
