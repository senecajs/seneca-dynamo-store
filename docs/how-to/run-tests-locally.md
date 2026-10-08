# Run the tests locally

Goal: run the test suite against DynamoDB Local in Docker.

1. Use Node 24 (or 22) and install:

   ```sh
   npm install
   ```

2. Start DynamoDB Local (`amazon/dynamodb-local:3.3.1`, container
   `seneca-dynamo-store-dynamodb`, host port 18001):

   ```sh
   npm run services:up
   ```

   This runs `docker compose up -d --wait` and returns when the
   container is healthy.

3. Run the tests:

   ```sh
   npm test
   ```

   `pretest` creates the test tables (`test/support/db/create-test-tables.js`).
   Tables that already exist are reported as
   `Cannot create preexisting table` and kept. `npm test` does not start
   Docker.

4. Stop and remove the container:

   ```sh
   npm run services:down
   ```

## Environment variables

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `SENECA_DYNAMO_ENDPOINT` | `http://localhost:18001` | DynamoDB endpoint used by the tests, the table scripts and the examples. |

To test against another endpoint:

```sh
SENECA_DYNAMO_ENDPOINT=http://localhost:8000 npm test
```

Other scripts: `npm run test-list-tables`, `npm run test-delete-db`
(deletes every table on the endpoint), `npm run test-some -- <grep>`.

## Test against the Seneca 4.0.0 build

```sh
npm install --no-save /path/to/seneca-4.0.0.tgz
npm test
npm install   # restore the devDependency
```
