# Adversarial review: factory-version-read

Method: I ran the interrogate skill's steps myself as the single reviewer. This run has no Task tool, so the two-model reviewer panel (Reviewer A and Reviewer B) could not be spawned. Treat these findings as one reviewer's view, not a cross-model agreement.

## Intent

The script proves the live frontend and API commits for staging or prod against expected full SHAs, and for prod also proves that the newest prod tag points at those SHAs. It must be read only and must never print the bypass secret.

## Act on (fixed)

1. A bypass secret containing a double quote or backslash would have broken the curl config line and silently sent no header. Fixed by escaping both characters before writing the config line. Rerun after the fix passed on staging and prod (evidence/run-2026-10-21-after-review.txt).
2. The draft had no prod tag check. Added. The script reads tag files built from every page of cursor-github list_tags (130 frontend tags over 2 pages, 33 backend tags on 1 page), picks the newest prod/YYYY-MM-DD-N tag by date then number, and fails if the two repos disagree or the tag SHAs differ from the expected ones. An empty tag list fails with a plain message (negative control in evidence/run-2026-10-21.txt).
3. The draft accepted any length of API revision.sha as a prefix, so an empty or very short value could pass. The check now needs at least 7 characters.

## Consider (not changed)

1. The tag check needs both repos to carry the same newest tag name. If Andres ever promotes only one repo, the prod read fails. I kept the strict rule because the factory map pairs FE and BE per tag. Andres can relax it.
2. The script cannot call the connector itself, so the agent must build the tag files. A stale tag file would give a stale answer. The SKILL.md step 2 asks for fresh pages every run.

## Noted

The worker stays unverified until Render read access exists (open decision 5). The script uses the newest tag, so a rollback to an older tag would fail the read until a new tag is cut.

## Dismissed

Sending the bypass header to the API hosts. It is only sent to the thoven.co /api/version hosts, so this concern does not apply.
