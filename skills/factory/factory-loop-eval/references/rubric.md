# Live-run rubric

Score 25% of live eval runs. The judge does not see which factory config produced the run.

| Check | Pass |
|---|---|
| Ticket used as the only prompt | The runner received the ticket text, not the landed patch. |
| Parent commit | Work happened on the parent of the fix, not on the fix. |
| Hidden check | The hidden repro or test exits 0. |
| No production data | Staging or fixture only. |

A scored failure on a station counts toward `station_fail_k` (**PENDING ANDRES**).
