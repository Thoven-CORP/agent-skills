# Edge taxonomy (expansion order = angel-yield order)

Tier 1 (expand first): early_angel (check-writers into the anchor), founder (post-exit
founders/co-founders of the anchor), acquihired_founder (founders of companies the anchor bought).
Tier 2: early_employee (first ~50; eng/product/growth who rode an IPO/acquisition), exec
(C-suite with a liquidity event).
Tier 3 (graph fuel): adjacent (adjacent/competitor companies in the vertical — founders are
prospects AND each becomes a new anchor).

Self-feeding: any qualified leaf who founded/ran a vertical-fit company → push that company as a
new anchor (record `person --founded--> company`). This keeps the frontier fresh and is what drives
provenance chains past 1 hop (the Depth dimension).
