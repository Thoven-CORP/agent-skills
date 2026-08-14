# Qualify-gate (deterministic boolean over gathered facts)

Identity is handled UPSTREAM by `dedup-check`, not here — the gate runs only on candidates that came back `new`. A `dup` is never gated; an `ambiguous` is parked by the driver for async review (see below). So "already known" is not a gate reason in v2.

HARD FILTERS — auto-reject:
- not US-reachable
- runs a direct teacher-side music competitor
- no findable contact path (LinkedIn minimum)
- current fund-manager (GP / Managing Partner / Partner / Principal at a named VC firm) → reason `vc-gp`
- NOT a founder / exec-with-exit / known angel — i.e. an employee or individual contributor (Product Designer, Engineer, PM, non-exec staff) at a company they did NOT found → reason `not-checkwriter`. ICs don't write angel checks, so relevance of the company is irrelevant. Graph traversal from a company anchor surfaces its whole roster — most are ICs; the gate must reject them here, not defer to the scorer. (Cautionary example: Vani Mehta / Sawyer — a Product Designer, not a founder or investor.) If role can't be confirmed as founder / exec-with-exit / investor, treat as REJECT `not-checkwriter` (do not pass a role-unknown node).

LP RULE: being an LP in a fund is NOT a disqualifier — it's a wealth/angel signal. The VC reject
keys on *current fund-manager role*, never fund-association. Scouts/operator-angels with minor fund
ties, and Partners at a family office / personal vehicle that only LPs into funds (writes no checks
itself) → keep + flag. The `vc-gp` reject fires ONLY on an active check-writing role at a named VC firm.

ANGEL SIGNAL — need ≥1 (widened from exit-only):
- confirmed angel activity (portfolio / AngelList / named angel deals), OR
- a liquidity event (founder-exit, early-employee of an IPO/acquired co, or acquihired), OR
- named as an investor in a startup

A liquidity event alone qualifies — an early employee of an acquired/IPO'd company with NO public
angel deals still PASSES the angel-signal test. Thin public angel history is not a reject reason
when a liquidity event is present.

MISSION-FIT GATE (down-rank marketplace-structural-only nodes): a node whose ONLY tie to Thoven is
generic two-sided-marketplace structural overlap — a pure e-commerce / retail / commerce marketplace
founder with NO education / family / learning / kids-enrichment / mission adjacency — must NOT pass on
marketplace structure alone. Set `qualify:false` with `reject_reason` `marketplace-only` (or, if the
founder/angel gate is otherwise met and you want it surfaced, set `qualify:true` but flag
`weak-fit:marketplace-only` in signals so the post-loop scorer caps it). Traversal from consumer-marketplace
anchors surfaces many such weak nodes — the gate catches them here, it does not defer to the scorer.
(Cautionary example: the 2026-07-22 e-commerce cohort — LTK, One Kings Lane, HauteLook, Whatnot —
structurally marketplaces, but weak fit for a cold music-education advice ask.)

On PASS: set `qualify:true` in the decisions file (the driver writes `add-person --status qualified` + provenance edge). On REJECT: set `qualify:false` with a `reject_reason` (the driver records it). No scoring in the loop — the post-loop prospect-scorer narrows.

ASYNC REVIEW (never blocks the loop): a maybe-same-person is NOT a qualify/reject call. dedup-check returns `ambiguous` and the driver parks it (`status='ambiguous'`) for `review-queue` after the run. Don't force a gate verdict on a borderline identity, and don't stall the round waiting to resolve it — park and move on.
