---
name: factory-version-read
description: Use at factory station 11 (staging recheck) and station 12 (prod) to prove which frontend and backend commits are live before a loop ticket moves on, and before any loop ticket is set to Done. Read only. Not for deploying, promoting, tagging or rolling back.
---

# Factory version read

This skill proves what is live. A merge, a green CI run or a finished deploy is not proof. The URLs and pass rules come from `skills/dev/publish/references/site-sha.md` in the Thoven agent-skills repo. Read that file if a URL here looks stale. This skill does not restate the publish skill.

## Steps

1. Get the expected full SHAs. For staging, read the head of `main` in Thoven-CORP/frontend-remote and Thoven-CORP/backend-remote through the cursor-github connector (`list_commits`, `sha: main`, `perPage: 1`). For prod, use the SHAs Andres tagged. Never type a SHA from memory.
2. For prod only, build the tag files. Call cursor-github `list_tags` with `perPage: 100` for each repo and keep paging while the result has a `rel="next"` link. Save every tag as `{"name","sha"}` into one JSON array per repo. If no prod/YYYY-MM-DD-N tag exists, the script says so and fails. Do not make one up.
3. Run the script. `VERCEL_AUTOMATION_BYPASS_SECRET` is required for staging only. Prod reads never send it. The script never prints it.

   ```bash
   scripts/version-read.sh staging <FE_full_sha> <BE_full_sha>
   scripts/version-read.sh prod <FE_full_sha> <BE_full_sha> fe-tags.json be-tags.json
   ```

4. Read the result. `RESULT: PASS` with exit 0 means every row passed. Any `FAIL` line and exit 1 means the stage has not passed. Report the failing line to Andres word for word. The Vercel bypass secret is sent only on staging GETs. Prod reads never receive it.
5. The worker line always says "unverified, inferred from prod tag" until Render read access exists (open decision 5). Never report the worker as verified.
6. A loop ticket moves to Done only after a prod run prints `RESULT: PASS`. This skill never moves a ticket itself.
7. Save the output under `evidence/` with the date in the file name.
8. Confirm this run's version-read output with thoven-verify. For staging, also doctor the staging hosts. Do not point doctor at production hosts.

   ```bash
   ../thoven-verify/scripts/check-station-output.sh --kind version-read --file evidence/<run>.txt
   ../thoven-verify/scripts/doctor.sh --fe https://staging.thoven.co --be https://thoven-api-staging.onrender.com --out "$THOVEN_VERIFY_EVIDENCE_DIR"
   ```

## What each check means

| Check | Passes when |
|---|---|
| Prod tag (prod only) | The newest prod/YYYY-MM-DD-N tag in both repos has the same name and points at the expected FE and BE SHAs. |
| Frontend | GET /api/version returns HTTP 200 and `sha` equals the expected full SHA. |
| API | `/health` returns HTTP 200 and `revision.sha` is a prefix of at least 7 characters of the expected BE SHA. |
| Worker | Never checked. Always labeled unverified. |
