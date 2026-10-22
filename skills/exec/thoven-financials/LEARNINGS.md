# Learnings — thoven-financials

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — vault refresh: new vault path, launchd retired, Mercury auth is OAuth expiry

> reflect · 2026-10-22 · vault-refresh · tooling · applied · seen 1

**What happened.** Five scripts and the SKILL still pointed at `Vaults/Executive Assistant` (with a space), so the tracker and report paths no longer resolved after the vault moved. The weekly report was documented as a Monday 7am launchd and `/schedule` job, which was retired 2026-10-22. Mercury failures were being read as a rotated key.
**Why.** On `mercury` CLI 0.7.2, auth uses a browser OAuth session that expires. The CLI reads no API key. Only the Cloudflare worker's `MERCURY_API_KEY` secret is a key.
**What changed.** All paths now use `Vaults/Executive-Assistant`. The SKILL, `run_cfo_agent.sh` and `notion-cfo-worker/DEPLOY.md` mark launchd as retired, and the report runs by hand. A new Troubleshooting section, plus the check-in's error box, say to run `mercury login` and not to rotate a key. Tests: 45 pass.
