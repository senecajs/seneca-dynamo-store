# Options

Defaults are in `module.exports.defaults` in `dynamo-store.js`. Pass
options with `seneca.use('@seneca/dynamo-store', { ... })`.

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `aws` | object (open) | `{}` | Passed to `new DynamoDB(config)` of `@aws-sdk/client-dynamodb` when the plugin initialises. Top level properties that are `null` or `undefined` are removed first. Typical keys: `region`, `endpoint`, `credentials`. |
| `merge` | boolean | `true` | Default for saving an entity that has an id. `true`: `UpdateItem` sets each given field and keeps the others. `false`: the item is written with `PutItem`, which currently fails for an existing id with `ConditionalCheckFailedException` ([#27](https://github.com/senecajs/seneca-dynamo-store/issues/27)). The `merge$` query directive overrides it per call. |
| `entity` | object | `{}` | Per entity settings, keyed by canon string. See below. |
| `marshall` | object (open) | `{ removeUndefinedValues: true, convertEmptyValues: false, convertClassInstanceToMap: true }` | Options for `marshall` of `@aws-sdk/util-dynamodb` when writing items and query values. |
| `unmarshall` | object (open) | `{ wrapNumbers: false }` | Options for `unmarshall` when reading items. |
| `client` | object (open) | `{ convertEmptyValues: false }` | Declared but not read by the current code. |
| `test` | boolean | `false` | Declared but not read by the current code. |
| `generate_id` | function | `entity/generate_id` export of seneca-entity | Creates ids for new entities without `id$`. Set internally; override only to change id generation. |

## Connection settings

There are no separate host or port options. Everything goes in `aws`:

```js
aws: {
  region: 'eu-west-1',
  endpoint: 'http://localhost:18001', // omit for AWS
  credentials: { accessKeyId: '...', secretAccessKey: '...' },
}
```

Without `credentials` the AWS SDK uses its default credential chain.

## `entity` settings

Keys are matched against the entity canon in this order: the full canon
(`zone/base/name`, with `-` for empty parts), then the canon without a
leading `-/`, then without `-/-/`, then `base/name` without the zone.

| Setting | Type | Effect |
| ------- | ---- | ------ |
| `table.name` | string | Table name. Default: `<base>_<name>`, or `<name>` without a base. |
| `table.key.partition` | string | Documentation only. The code always uses `id` as the partition key. |
| `table.key.sort` | string | Sort key attribute. Included in the key for load, update and remove, and never updated. |
| `table.index` | array | Secondary indexes: `{ name, key: { partition, sort } }`. Used by `list$` and `load$` with a query, see [Queries](queries.md). |
| `fields.<field>.type` | `'date'` | `Date` values are saved as ISO strings and turned back into `Date` objects when read. |
