# Use with Seneca 4 or migrate from Seneca 3

Goal: run an application that uses this store on Seneca 4.

1. Install Seneca 4, the entity plugin `@seneca/entity` (it replaces
   `seneca-entity`) and version 7 of this store, which supports Seneca 4
   only. Seneca 3 users stay on `@seneca/dynamo-store@6`.

   ```sh
   npm install seneca@^4 @seneca/entity @seneca/dynamo-store
   ```

   Load the entity plugin by its full name, before the store:
   `seneca.use('@seneca/entity').use('@seneca/dynamo-store', options)`.

2. Pass plugin options through `use()` or `options.plugin['dynamo-store']`.
   Seneca 4 no longer reads a top level `options['dynamo-store']`.

3. Wait for startup with `await seneca.ready()`.

4. Errors from DynamoDB reach your callback or rejected promise as the
   original AWS SDK error (`err.name`, `err.message`), not wrapped in a
   `seneca: Action ... failed` error, because `legacy.error` is false by
   default.

5. Remove `seneca-promisify` and `.use('promisify')`: Seneca 4 has the
   promise API built in, and version 7 no longer declares it as a peer.

6. Use Node.js 24 or later.

See
[Seneca 3 and Seneca 4](../explanation/how-it-works.md#seneca-3-and-seneca-4).
