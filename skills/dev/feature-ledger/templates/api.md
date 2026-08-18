<!-- SCAFFOLD — delete this line when the first real row lands -->
# API decisions — <feature>

Endpoints and **payload fields**. The frontend/backend seam. `A#` is this file's series.

## Done when

Every field the frontend reads has a row, and each row says whether the backend emits it today.

## Fields and endpoints

`contract-check` validates params, auth and statuses, **never response bodies** (TD-212), so a field
the frontend renders and the backend never sends passes every gate. This file is the only place that
catch lives. Fill **Emitted by** from the serializer, never from the type file.

| `A#` | Field / endpoint | Shape | Emitted by | Consumed by | Layer | Verified |
|---|---|---|---|---|---|---|
| A1 | | | serializer: | | | |
