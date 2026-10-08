# Configure tables, keys and indexes

Goal: store an entity in a table of your choice that has a sort key and
a global secondary index, and query through the index.

The runnable version is
[`docs/examples/table-and-index.js`](../examples/table-and-index.js).

1. Create the table in DynamoDB yourself (the plugin never creates or
   changes tables). The partition key must be called `id`.

2. Describe the table under the `entity` option, keyed by the entity
   canon (`base/name`, `zone/base/name` or `name`):

   ```js
   seneca.use('@seneca/dynamo-store', {
     aws: { /* client config */ },
     entity: {
       'app/event': {
         table: {
           name: 'events01',
           key: { partition: 'id', sort: 'at' },
           index: [{ name: 'kind_at', key: { partition: 'kind', sort: 'at' } }],
         },
       },
     },
   })
   ```

3. Load and remove with the full primary key:

   ```js
   await event.load$({ id: 'e3', at: 20 })
   await event.remove$({ id: 'e3', at: 20 })
   ```

4. List with the index partition key to get a `Query` instead of a
   `Scan`. Use `sort$` for the order and a comparison operator on the
   index sort key:

   ```js
   await event.list$({ kind: 'click', sort$: { at: -1 } })
   await event.list$({ kind: 'click', at: { gt$: 15 } })
   ```

   Output of the example:

   ```
   click, newest first: [ 'e1@30', 'e2@10' ]
   click, at > 15: [ 'e1' ]
   loaded: e3 view
   after remove: 2 items
   ```

5. Optional: mark date fields so that `Date` values are stored as ISO
   strings and returned as `Date` objects:

   ```js
   entity: { 'app/event': { fields: { when: { type: 'date' } } } }
   ```

See [Query rules](../reference/queries.md) for how the plugin chooses
between `Query` and `Scan`.
