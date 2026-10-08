# Patches

Changes under `.github/workflows/` could not be pushed from the session
that prepared this branch (pushing workflow files needs the GitHub
`workflow` scope), so they are delivered here as patches.

Apply them on top of this branch and commit:

```sh
git am .patches/*.patch
```

| Patch | Change |
| ----- | ------ |
| `0001-ci-dynamodb.patch` | `build.yml`: Node 24.x and 22.x on ubuntu-latest, triggers on `master` and `main`, DynamoDB Local (`amazon/dynamodb-local:3.3.1`) as a service container on host port 18001, `SENECA_DYNAMO_ENDPOINT=http://localhost:18001`. |

The `amazon/dynamodb-local` image contains no `curl`, `wget` or other
tool a `--health-cmd` could use, and GitHub service containers cannot
override the image command. The workflow therefore uses no health
options and instead has a "Wait for DynamoDB Local" step that polls the
port with bash `/dev/tcp` before `npm test`. The local
`docker-compose.yml` uses the same bash `/dev/tcp` check as a health
check, which works there because compose runs it inside the container.

Once applied, these files can be deleted.
