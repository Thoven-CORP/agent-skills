# API decisions — <feature>

Endpoints and **payload fields**. The FE↔BE seam.

`contract-check` validates params, auth and statuses — **never response bodies** (TD-212).
So a field the frontend renders and the backend never sends passes every gate. This file is
the only place that catch lives; fill the Emitted-by column from the serializer, not the type.

| Field / endpoint | Shape | Emitted by | Consumed by | Layer | Verified |
|---|---|---|---|---|---|
| | | | | | |
