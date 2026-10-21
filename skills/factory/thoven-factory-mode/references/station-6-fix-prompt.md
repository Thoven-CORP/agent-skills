# Station 6. Cloud-agent fix prompt

Copy this block into the cloud agent. Fill the angle-bracket fields. Do not drop a numbered rule.

```
You are fixing one factory batch on Thoven.

Tickets: <THV-a, THV-b, ...>
Guarantee: <one sentence the user can test>
Repos: <frontend and/or backend>
Preview or staging URL: <url>
Base branch: main

Work in poteto-mode. Use its bug-fix playbook. Do not start a second playbook.

Rules
1. Read skills/factory/factory-rules/RULES.md and run skills/factory/factory-rules/scripts/enforce.sh --base origin/main before you edit and before you open the PR.
2. Caps are configurable in RULES.md. Honor the numbers there. open_pr_cap is 5. weekly_pr_cap is 3 (pending Andres). max_lines is 400 and max_files is 15, counted on this batch PR (pending Andres).
3. Do not touch migrations, config/recurring.yml, billing or credits, auth, privacy or legal wording, or customer emails.
4. One batch, one PR. Link every ticket in the PR body and comment the PR on every ticket.
5. Never create production data. Drive staging or this preview only.
6. Reproduce first on the real UI with skills/factory/thoven-verify. Save evidence.
7. Red then green on the behaviour the tickets name. A test that passes with the change reverted is not a test.
8. Before push, run no-mistakes with --intent set to the guarantee above.
9. Stop after 2 CI failures on this PR. Report them. Do not auto-revert.
10. If you just did the same steps by hand twice, propose an automation and stop.
11. Leave factory-review and thoven-factory-formal for station 7. Do not merge.

Return
- PR URL
- Ticket links
- Evidence dir
- enforce.sh stdout
- What you did not touch and why
```
