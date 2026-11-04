# Which SHA a site runs

A push, a green CI run, or a finished deploy is not proof. The site answering with the SHA is.

| Site | Check | Passes when |
|---|---|---|
| 2.0 frontend, staging | `curl -s https://staging.thoven.co/api/version` | `sha` equals the full SHA |
| 2.0 frontend, production | `curl -s https://thoven.co/api/version` | `sha` equals the full SHA |
| 2.0 backend web, staging | `curl -s https://thoven-api-staging.onrender.com/health` | `revision.sha` is a prefix of the SHA |
| 2.0 backend web, production | `curl -s https://api.thoven.co/health` | `revision.sha` is a prefix of the SHA |
| 2.0 backend, each service | `render deploys list <service-id> -o json --confirm \| jq '.[0] \| {status, commit: .commit.id}'` | `status` is `live` and `commit` equals the SHA |
| 2.0 backend liveness | `curl -s -o /dev/null -w '%{http_code}' https://api.thoven.co/up` (staging: `https://thoven-api-staging.onrender.com/up`) | `200` |
| 1.0 frontend | `npm run verify:prod` | exit 0 |
| 1.0 backend | `curl -s https://thovenbackend-am-andres234.replit.app/health` | `revision.sha` is a prefix of the release SHA |

Both Vercel projects serve builds of `main`, so the host, not `ref`, tells staging from production. Service IDs: the Render runbook's services table.

Done when every row you were asked about has its check output and a pass or fail.
