# Thoven context for product-fundamentals

Read this when the work is a Thoven product. The core skill is product-neutral.

## Actors

- **Parent:** chooses and pays. Their moment of choice is usually the decision that makes a feature worth building. It is named fresh each run, never assumed.
- **Child (student):** learns. Ask whether the child even sees the thing, and whether it serves their core job or is decoration.
- **Teacher:** teaches. Every ask of a teacher needs a payoff they can see, and effort that ends up hidden is waste.
- **Ops:** Andres and Keri approve, review and support. A rung that needs "a personal note from Andres or Keri" names their capacity.

Lexicon: a "Session" is the unit and "Lessons" is the arrangement. Demo data uses Andres Martinez or real fixtures.

## Positioning

Thoven is a fun K-8 music academy. It is not a marketplace of credential-checked teachers. The live positioning sits in the Linear Project "Academy Positioning & Public Pages" and in `~/.thoven-artifacts/academy-positioning/`. At level 1, quote the line the feature supports or strains.

## Scale

There were about 27 paying families in October 2026. An A/B test or a dashboard measures noise at this size. When the grill asks how we would know it worked, the answer is one behaviour you can see on a real record (environment and id). The cheapest test is a few real, consenting adults, never children.

## Children and privacy

- A moment that tells one actor what another searched for or declared about a child is health-adjacent. Hand it to `thoven-coppa-vpc-contracts`.
- Engagement mechanics aimed at children stay out. The list and the reasons are in `references/sources/pincus.md` → "Do not import".

## Where things live

- The Project's `.tldraw` board is the design record. Find it with `tldraw-offline` (`api.getDocs()`) and reuse it rather than starting a new one.
- Decisions live in the Linear parent and arrive through the usual ruling flow.
- An HTML page is only a view (`visual-artifacts`), and it opens in Dia.
