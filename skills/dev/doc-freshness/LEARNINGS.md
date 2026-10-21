# Learnings — doc-freshness

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-08-17 — Three audits returned emptiness that read as clean

> reflect · 2026-08-17 · memory:feedback_doc_freshness_zsh_false_green · tooling · applied · seen 1

**What happened.** One run hit three false greens. Under zsh the git-distance one-liner passed several code paths as one bogus pathspec, so `git rev-list --count` returned 0 for every doc, including one 138 commits behind. The backend registry's content checks read db/schema.rb, which the backend does not have. And the frontend design-system doc generator had been throwing for weeks while its test stayed green, because the test scanned the committed HTML.
**Why.** All three fail by returning emptiness, which reads as clean rather than broken. An audit reporting zero staleness everywhere is the signal, not the result.
**What changed.** Pitfall line: run the git-distance commands under `bash -c`, and falsify an all-clean audit by hand-checking the oldest doc. The registry already reads db/structure.sql, and `references/frontend.md` already runs `pnpm run docs:design` for a clean diff, so the generator is exercised.
