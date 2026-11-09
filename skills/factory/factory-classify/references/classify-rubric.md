# Station 2: Classify rubric, one verdict or stop (draft for DEP-7)

Status: draft. Source: the DEP-7 acceptance criteria, factory map station 2, and the benny triage pattern in pstack (one verdict or stop) summarized in /workspace/ship-log/deployment-guy/factory-research.md.

## How to use it

QA reads each new DEP Triage issue and its evidence link. QA gives exactly one of the four verdicts below. If no single verdict fits, QA stops (see "Stop rule"). QA never guesses.

## Verdicts

### 1. Bug

Definition: real product behavior is wrong for a user, the symptom is specific, and it can plausibly be reproduced on staging.

Example (real, from Linear): THV-421, "Sentry silently drops production errors when the container is busy," labeled Bug. The symptom was specific (events discarded with only a log line) and was found in deployment logs.

Action: move from Triage to Backlog with the Fix loop label.

### 2. Sentry noise

Definition: a Sentry event that does not reflect a broken experience for a user, such as crawler, scanner or browser extension errors, or expected states reported as errors.

Example (real, from Linear): THV-1269. Sentry issue JAVASCRIPT-NEXTJS-15 came from an injected script (top frame addEL_hook at <anonymous>:675:29) and was archived as crawler noise. THV-1294 is a second real case, where blocked storage on iOS Safari (JAVASCRIPT-NEXTJS-17) was reported as an error.

Action: close with a note naming the Sentry issue, or route to a noise-filter ticket owned by Andres.

### 3. Tracking gap

Definition: the product may work, but an analytics event or Sentry capture is missing or wrong, so the team cannot see what happened.

Example (real, from Linear): THV-1318. A signup landed on a teacher profile, created an account and booked an intro call, but the create-account and intro-call events carry no first-touch source.

Action: route to Product Guy with the evidence link. It does not enter the fix loop unless Andres says so.

### 4. Idea

Definition: a request for new or changed behavior, with nothing broken.

Example (real, from Linear): THV-1330. An advisor found parent onboarding "fun and fast" and suggested showing 3 to 5 recommended teachers on the final step.

Action: route to the product brainstorm (a Linear project description, per Product Guy's rules), then close the Triage issue with a link.

## Writes need approval

Every action above is a Linear write. QA makes it only when Andres has approved Linear writes for that run. Otherwise QA records the proposed action in the evidence log and changes nothing.

## Stop rule

When no single verdict fits, or two verdicts fit equally, QA does not pick one. QA leaves the issue in Triage and adds a note that says which verdicts were considered, what evidence is missing, and who can supply it. The issue waits for Andres.

## Measuring classify accuracy

1. For every classified issue, QA records the verdict and the date in the scorecard data.
2. Andres's decision on the decision card (station 5) is the ground truth.
3. Classify accuracy equals the number of issues where QA's verdict matches Andres's card decision, divided by all issues that reached a card decision.
4. Stopped issues are counted separately as the stop rate and are not counted as wrong.
