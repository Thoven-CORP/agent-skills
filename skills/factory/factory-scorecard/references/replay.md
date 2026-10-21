# Replay eval

After every tenth **real** factory ticket closes, run `skills/factory/factory-loop-eval`.

That skill checks out the parent of each fix, uses the ticket as the prompt, and passes only if the hidden repro or test passes. It scores 25% of live runs with a blinded judge, stays under the monthly eval budget (**PENDING ANDRES**), and opens a draft improvement PR after K station failures (**PENDING ANDRES**). The bot never merges that PR.

Do not replay production data. Do not count synthetic tickets toward the 10.
