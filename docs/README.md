# Documentation

Documentation for `@seneca/dynamo-store`, organised as
[Diátaxis](https://diataxis.fr) sections.

## Tutorials

| Page | Description |
| ---- | ----------- |
| [Getting started](tutorials/getting-started.md) | Save, load, list and remove entities in DynamoDB Local. |

## How-to guides

| Page | Description |
| ---- | ----------- |
| [Configure tables, keys and indexes](how-to/configure-tables.md) | Custom table names, sort keys, secondary indexes, date fields. |
| [Run the tests locally](how-to/run-tests-locally.md) | Docker compose, environment variables, test scripts. |
| [Use with Seneca 4](how-to/migrate-from-seneca-3.md) | Upgrade an application from Seneca 3. |

## Reference

| Page | Description |
| ---- | ----------- |
| [Options](reference/options.md) | Every option and entity setting. |
| [Messages](reference/messages.md) | Store patterns, query directives, errors. |
| [Queries](reference/queries.md) | Operators and how Query or Scan is chosen. |
| [Exports](reference/api.md) | `get_client` and module exports. |

## Explanation

| Page | Description |
| ---- | ----------- |
| [How the store works](explanation/how-it-works.md) | Lifecycle, design, limits, Seneca 3 and 4. |

## Feature index

| Feature | Kind | Page |
| ------- | ---- | ---- |
| `aws` | option | [Options](reference/options.md) |
| `merge` | option | [Options](reference/options.md) |
| `entity` | option | [Options](reference/options.md#entity-settings) |
| `entity.<canon>.table.name` | option | [Options](reference/options.md#entity-settings) |
| `entity.<canon>.table.key` | option | [Options](reference/options.md#entity-settings) |
| `entity.<canon>.table.index` | option | [Options](reference/options.md#entity-settings) |
| `entity.<canon>.fields.<field>.type` | option | [Options](reference/options.md#entity-settings) |
| `marshall` | option | [Options](reference/options.md) |
| `unmarshall` | option | [Options](reference/options.md) |
| `client` | option | [Options](reference/options.md) |
| `test` | option | [Options](reference/options.md) |
| `generate_id` | option | [Options](reference/options.md) |
| `init:dynamo-store` | action | [Messages](reference/messages.md#init) |
| `role:entity,cmd:save` | action | [Messages](reference/messages.md) |
| `role:entity,cmd:load` | action | [Messages](reference/messages.md) |
| `role:entity,cmd:list` | action | [Messages](reference/messages.md) |
| `role:entity,cmd:remove` | action | [Messages](reference/messages.md) |
| `role:entity,cmd:close` | action | [Messages](reference/messages.md) |
| `role:entity,cmd:native` | action | [Messages](reference/messages.md) |
| `merge$`, `upsert$`, `id$`, `sort$`, `fields$`, `all$`, `load$` | directives | [Messages](reference/messages.md#query-directives) |
| `gt$`, `gte$`, `lt$`, `lte$`, `eq$`, `ne$` | query operators | [Queries](reference/queries.md) |
| `get_client` | export | [Exports](reference/api.md) |
| errors (none defined) | errors | [Messages](reference/messages.md#errors) |
| `SENECA_DYNAMO_ENDPOINT` | test env variable | [Run the tests locally](how-to/run-tests-locally.md) |
