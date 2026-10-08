# Use with Seneca 4 or migrate from Seneca 3

Goal: run an application that uses this store on Seneca 4.

1. Install Seneca 4 (prerelease until 4.0.0 is published) and current
   peers:

   ```sh
   npm install seneca@^4.0.0-rc5 seneca-entity@^28.1.0 seneca-promisify@^3.7.2
   ```

2. Pass plugin options through `use()` or `options.plugin['dynamo-store']`.
   Seneca 4 no longer reads a top level `options['dynamo-store']`.

3. Wait for startup with the callback form while you use 4.0.0-rc5:

   ```js
   await new Promise((resolve) => seneca.ready(resolve))
   ```

4. Errors from DynamoDB reach your callback or rejected promise as the
   original AWS SDK error (`err.name`, `err.message`), not wrapped in a
   `seneca: Action ... failed` error, because `legacy.error` is false by
   default.

5. `seneca-promisify` is still needed on Seneca 3. On Seneca 4 it does
   nothing and can stay in place.

The plugin code is the same on both versions; see
[Seneca 3 and Seneca 4](../explanation/how-it-works.md#seneca-3-and-seneca-4).
