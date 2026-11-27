# Adversarial review: factory-classify

Method: I ran the interrogate skill's steps myself as the single reviewer. This run has no Task tool, so the two-model reviewer panel (Reviewer A and Reviewer B) could not be spawned. Treat these findings as one reviewer's view, not a cross-model agreement.

## Intent

A rubric so each Triage issue gets exactly one of four verdicts or stops with a note, with bug moves and accuracy scoring defined.

## Act on (fixed)

1. Tracking gap and idea used invented examples. Fixed. Both now cite real Linear issues found in the run (THV-1318 and THV-1330). Bug (THV-421) and Sentry noise (THV-1269, THV-1294) were already real.
2. The rubric told QA to move, close or route issues with no approval gate. Those are Linear writes outside QA's loop permissions. Fixed. A new "Writes need approval" section and SKILL.md step 5 make every action a proposal unless Andres approved writes for that run.

## Consider (not changed)

The line between bug and Sentry noise is thin when an error only shows in the console. THV-1312 hit it and was stopped. If many issues stop for this reason, the rubric may need a fifth verdict for "harmless console error". I did not add one because the ticket names four verdicts.

## Noted

Accuracy is defined but unmeasured. None of the three run issues has an Andres decision card yet.

## Dismissed

Using DEP Triage issues for the run. DEP Triage holds only factory build tickets, so THV was the right source.
