// The Linear state read and the read-back lines `/workspace update` prints.

/**
 * The answer to linear.ts STATE_QUERY for THV-945, 978, 979, 980 and 1038, from
 * `POST https://api.linear.app/graphql` on 2026-10-03 (read only; HTTP 200 in 0.56 s), byte for byte.
 * Every ticket in it was Done that day; tests that need another state derive it from this text and say so.
 */
export const LINEAR_STATES_945_1038 = "{\"data\":{\"issues\":{\"nodes\":[{\"identifier\":\"THV-1038\",\"state\":{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},\"parent\":null},{\"identifier\":\"THV-980\",\"state\":{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},\"parent\":{\"identifier\":\"THV-945\",\"title\":\"Daily video: webhooks, recordings and rooms\"}},{\"identifier\":\"THV-979\",\"state\":{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},\"parent\":{\"identifier\":\"THV-945\",\"title\":\"Daily video: webhooks, recordings and rooms\"}},{\"identifier\":\"THV-978\",\"state\":{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},\"parent\":{\"identifier\":\"THV-945\",\"title\":\"Daily video: webhooks, recordings and rooms\"}},{\"identifier\":\"THV-945\",\"state\":{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},\"parent\":null}]},\"teams\":{\"nodes\":[{\"states\":{\"nodes\":[{\"name\":\"Triage\",\"type\":\"triage\",\"position\":0},{\"name\":\"Speccing\",\"type\":\"started\",\"position\":-953.44},{\"name\":\"Done\",\"type\":\"completed\",\"position\":3},{\"name\":\"Backlog\",\"type\":\"backlog\",\"position\":0},{\"name\":\"Canceled\",\"type\":\"canceled\",\"position\":4},{\"name\":\"Todo\",\"type\":\"unstarted\",\"position\":1},{\"name\":\"Duplicate\",\"type\":\"duplicate\",\"position\":5},{\"name\":\"Ready\",\"type\":\"started\",\"position\":1002},{\"name\":\"In Progress\",\"type\":\"started\",\"position\":2}]}}]}}}\n"

/**
 * Read-back lines. No transcript holds one yet: set-status.js landed the same day (THV-1047). Each
 * is the form `skills/dev/workspace/tools/set-status.js` prints (its header comment, line 8, and its
 * console.log calls, lines 54 and 57), filled in with the spec's own literals ("↻ round trip", "↻ error").
 */
export const READBACK_DONE_THV_1038 = "THV-1038 Done\n"
export const READBACK_ERROR_THV_1038 = "THV-1038 ERROR not found\n"
