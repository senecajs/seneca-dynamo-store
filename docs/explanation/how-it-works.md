# How the store works

## Lifecycle

`seneca.use('@seneca/dynamo-store')` calls `entity/init` of
`@seneca/entity`, which registers the store patterns for the plugin.
Load `@seneca/entity` first; without it the plugin stops with an error
that says so. The
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

Version 7 supports Seneca 4 only; Seneca 3 users stay on
`@seneca/dynamo-store@6`. The plugin uses `seneca.export`, `seneca.add`,
`seneca.util.clean` and `seneca.util.deep`, and builds its option
defaults with the `valid` builders that Seneca passes in. On Seneca 4:

* the entity plugin is `@seneca/entity` 29;
* options must come from `use()` or `options.plugin`;
* DynamoDB errors are not wrapped (`legacy.error` is false).

Tests run on Seneca 4.0.0 with `@seneca/entity` 29 against DynamoDB
Local 3.3.1, on Node.js 24 or later.
