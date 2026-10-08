# How the store works

## Lifecycle

`seneca.use('@seneca/dynamo-store')` calls `entity/init` of
seneca-entity, which registers the store patterns for the plugin. The
`init:dynamo-store` action then creates one `DynamoDB` client from the
`aws` option. Each store action builds an AWS SDK v3 command
(`PutItemCommand`, `GetItemCommand`, `ScanCommand`, ...) and sends it
with that client. Values are converted with `marshall` and `unmarshall`
from `@aws-sdk/util-dynamodb`.

The store's close action does nothing: the AWS SDK client keeps no
connections that block process exit.

## Why the plugin does not manage tables

DynamoDB tables carry capacity, billing and index settings that belong
to infrastructure code. The plugin only maps entities to existing
tables (`<base>_<name>` or `table.name`) and expects `id` to be the
partition key. Describe sort keys and indexes in the `entity` option so
that the plugin can use `Query` instead of `Scan`.

## Limits

* Without an index match, every `list$` is a full table `Scan` with a
  filter.
* `remove$` with `all$` sends one `BatchWriteItem` with only `id` in the
  key.
* `upsert$` is not implemented.

## Seneca 3 and Seneca 4

The plugin code does not depend on the Seneca major version. It uses
`seneca.export`, `seneca.add`, `seneca.util.clean`, `seneca.util.deep`
and `Seneca.valid.Open`, which exist in both. On Seneca 4:

* options must come from `use()` or `options.plugin`;
* DynamoDB errors are not wrapped (`legacy.error` is false);
* in 4.0.0-rc5, `await seneca.ready()` can hang on an idle instance,
  so the tests and examples use `seneca.ready(callback)`.

Tests run on Seneca 4.0.0-rc5 and the 4.0.0 build, Node 24 and 22.
