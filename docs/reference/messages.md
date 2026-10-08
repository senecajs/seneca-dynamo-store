# Messages

The plugin is a seneca-entity store. `seneca-entity` registers the
standard store patterns for it; you normally call them through the
entity API (`save$`, `load$`, `list$`, `remove$`, `native$`).

| Pattern | Entity API | DynamoDB operation | Reply |
| ------- | ---------- | ------------------ | ----- |
| `role:entity,cmd:save` | `ent.save$()` | New entity: `PutItem` with `attribute_not_exists(id)`. Existing entity with merge: `UpdateItem`. Existing without merge: `PutItem` with the same condition, which currently fails with `ConditionalCheckFailedException` ([#27](https://github.com/senecajs/seneca-dynamo-store/issues/27)). Then `GetItem` to reload. | The saved entity, as read back. |
| `role:entity,cmd:load` | `ent.load$(q)` | Query with `id`: `GetItem` (add the sort key for tables with one). Other query: list rules, first result. Empty query: no call. | Entity or `null`. |
| `role:entity,cmd:list` | `ent.list$(q)` | `Scan` or `Query`, all pages. See [Queries](queries.md). | Array of entities. |
| `role:entity,cmd:remove` | `ent.remove$(q)` | With `id`: `DeleteItem`. Otherwise the first match of a list, or with `all$: true` every match through one `BatchWriteItem`. Currently only `id` is used as the key (tables with a sort key fail), and more than 25 matches are rejected by DynamoDB ([#28](https://github.com/senecajs/seneca-dynamo-store/issues/28)). | `null`, or the old entity with `load$: true`. |
| `role:entity,cmd:close` | `seneca.close()` | None. | Empty. |
| `role:entity,cmd:native` | `ent.native$()` | None. | `{ client }`: the `DynamoDB` client. |

Each pattern also carries the entity's `base`/`name` and the store
name `dynamo-store`; see the seneca-entity documentation.

## Query directives

| Directive | Command | Effect |
| --------- | ------- | ------ |
| `merge$` | save | `false` replaces the item, otherwise fields are merged. Overrides the `merge` option. |
| `upsert$` | save | Not implemented: an array value throws `DO NOT USE - UNDER CONSTRUCTION`. |
| `id$` | save | Use this id for a new entity. |
| `sort$` | list, load | `{ field: 1 }` ascending, `{ field: -1 }` descending (`ScanIndexForward`, so it orders by the sort key of the table or index that is queried). |
| `fields$` | list, load | Array of field names, sent as `ProjectionExpression`. |
| `all$` | remove | Remove every match. |
| `load$` | remove | Reply with the removed entity. |

## Init

The plugin adds `init:dynamo-store` (with its tag), which creates the
`DynamoDB` client from the `aws` option.

## Errors

The plugin defines no error codes (`module.exports.errors` is `{}`).
DynamoDB errors are passed back unchanged, for example
`ConditionalCheckFailedException` when saving a new entity with an
`id$` that already exists. Invalid query operators throw
`Invalid Comparison Operator: <op>`; two conditions on a sort key throw
`Only one condition per sortkey: <n> is given.`
