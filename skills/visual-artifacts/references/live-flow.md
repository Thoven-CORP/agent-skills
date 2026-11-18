# Live flow

A live flow is a Mermaid diagram the reader walks one step at a time. A dot travels each arrow, a ring marks where things stand, and one sentence says what just happened. Use it when the reader's question is "what happens, in what order, in this case": a state machine, a data flow between systems, a product journey, a process with a failure path. A diagram with one obvious path stays a plain diagram.

## Write one

1. Draw the diagram in `<pre class="mermaid" data-live="<name>">`: a `flowchart`, a `stateDiagram-v2` or a `sequenceDiagram`. Give each node a short id, since the cases name nodes by id.
2. Put the cases straight after it, in `<script type="application/json" data-live-for="<name>">`.
3. Run `node scripts/finish.mjs <file>`. It joins each arrow to its two nodes, checks every step against the diagram, and inlines the player. A step the diagram cannot play stops the run, and the message names the step and the arrows that do leave that node.

```html
<pre class="mermaid" data-live="session">
flowchart LR
  pool([Family pool]) -->|family books| requested[Requested]:::info
  requested -->|teacher approves| booked[Booked]:::info
  booked -->|start passes| spent[Spent]:::accent
  spent -->|daily run closes it| closed([Closed]):::ok
  booked -->|cancelled with notice| returned[Returned]:::dim
  returned -.->|back in the pool| pool
</pre>
<script type="application/json" data-live-for="session">
{
  "lenses": ["The parent sees", "The teacher sees", "Thoven stores"],
  "cases": [
    { "id": "normal", "name": "A normal session", "steps": [
      { "at": "pool", "when": "Start", "say": "The teacher accepts the student, and Thoven charges the plan.",
        "cards": ["Thoven charges 180 for 4 sessions.", "A new student.", "Pool: 4 of 4."] },
      { "at": "requested", "when": "Monday", "say": "Andres Martinez books a 30-minute session for Tuesday at 4:00 pm.",
        "cards": ["The request waits for the teacher.", "A request to approve or decline.", "Session `requested`."] },
      { "at": "closed", "via": ["booked", "spent"], "say": "The teacher approves, the session happens, and the daily run closes it.",
        "cards": ["The session is in the family's history.", "The session is locked.", "Session `closed`."] }
    ] }
  ]
}
</script>
<p class="cap">One line on what to notice, and anything the diagram leaves out.</p>
```

## Fields

| Field | On | Meaning |
|---|---|---|
| `lenses` | top | One to four card titles: the viewpoints that change at every step (what each person sees, what is stored, the rule). Leave it out for no cards. |
| `id`, `name` | case | `id` goes in the link (letters, digits, hyphens). `name` is the tab. |
| `absent` | case | Node ids this case's design does not have. They are drawn faint. |
| `at` | step | The node id where the dot rests. Repeat the previous id for a step that stays put ("a day passes"). |
| `via` | step | Node ids passed on the way, when one step crosses several arrows. |
| `msg` | step | Sequence diagrams: the message number, counted from 1 at the top. The dot rests on the receiver. |
| `say` | step | One sentence: who does what. The reader reads this line first. |
| `when` | step | A short time label, such as "Monday" or "Same run". |
| `label` | step | The name on the step rail. It defaults to the node's label, or the message text. |
| `cards` | step | One text per lens, in order. Backticks mark code. |

In a state diagram `[*]` is `root_start` or `root_end`. When an id is wrong, the finisher's message lists the ids the diagram has.

## What the reader can do

Say this once on the page, in the reader's words. The player prints the short form under the diagram.

- Click a state, a step on the rail or an arrow label to go there. Clicking a state the open case never reaches opens a case that does.
- Press ← and → to step, 1 to 9 to pick a case, Home and End for the first and last step. The keys act on the flow nearest the middle of the window, so the reader does not click the diagram first.
- Play waits on each step for as long as its sentence takes to read.
- The address holds the place as `#<name>:<case>.<step>`, so a refresh keeps it. Link to an exact step from prose or from chat: `<a href="#session:late.4">the late cancel</a>`.

## Cases that teach

- **One concrete story per case.** Real names, amounts and days: "Andres Martinez books a 30-minute session for Tuesday at 4:00 pm". The first case is the normal path. Each later case is one that changes a decision: a cancel, a failure, a retry.
- **Each case reads alone.** Repeat the opening steps in every case, so a reader who opens case 3 first is not lost.
- **Short text.** One sentence in `say`, one or two in a card. Detail the step does not need stays out.
- **Lenses stay fixed.** Pick the two to four viewpoints once. A card that has nothing new says so in a few words ("Nothing changes for the family").
- **The diagram stands alone.** With scripts off, in print and in a Quick Look preview, the reader sees the plain diagram, so it must be right without the cases.
- **Draw only what is decided.** Leave an undecided state out and say so in the caption, or put it in a case named as proposed and mark it `absent` in the others.
- **Shape follows length.** A chain of up to about six nodes reads well as `LR`. A longer or branching one goes `TB`, and the player then puts the sentence and cards beside it.
- **Colour means kind.** Node colour comes from the themed classes in the Diagram component. The ring, the dot and the controls stay monochrome.

## Changing the player

The build half is [liveflow.mjs](../scripts/liveflow.mjs), the browser half is [liveflow.js](../assets/liveflow.js), and the styles are the "live flow" block of [artifact.css](../assets/artifact.css). After a change, run this from the skill's directory, then finish a page that has a live flow and open it:

```bash
node --test scripts/liveflow.test.mjs scripts/liveflow.player.test.mjs
```
