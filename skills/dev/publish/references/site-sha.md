# Which SHA a site runs

A push, a green CI run, or a finished deploy is not proof. The site answering with the SHA is.

| Site | Check | Passes when |
|---|---|---|
| Frontend, staging | `curl -s https://staging.thoven.co/api/version` | `sha` equals the full SHA |
| Frontend, production | `curl -s https://thoven.co/api/version` | `sha` equals the full SHA |
| Backend web, staging | `curl -s https://thoven-api-staging.onrender.com/health` | `revision.sha` is a prefix of the SHA |
| Backend web, production | `curl -s https://api.thoven.co/health` | `revision.sha` is a prefix of the SHA |
| Backend, each service | `render deploys list <service-id> -o json --confirm \| jq '.[0] \| {status, commit: .commit.id}'` | `status` is `live` and `commit` equals the SHA |
| Backend liveness | `curl -s -o /dev/null -w '%{http_code}' https://api.thoven.co/up` (staging: `https://thoven-api-staging.onrender.com/up`) | `200` |

Both Vercel projects serve builds of `main`, so the host, not `ref`, tells staging from production. Service IDs: the Render runbook's services table.

Done when every row you were asked about has its check output and a pass or fail.
