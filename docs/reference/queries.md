# Queries

How `list$` (and `load$` without an `id`) turn a Seneca query into a
DynamoDB request. Source: `intern.listent` in `dynamo-store.js`.

## Values and operators

| Query value | Meaning |
| ----------- | ------- |
| `{ f: v }` | `f = v` |
| `{ f: [a, b] }` | `f = a or f = b` |
| `{ f: { gt$: v } }` | Operators: `gt$` (`>`), `gte$` (`>=`), `lt$` (`<`), `lte$` (`<=`), `eq$` (`=`), `ne$` (`!=`). Several operators on one field are joined with `and`. |
| non object query (string or array) | Treated as `{ id: q }`. |

Any other `$` key inside a field object throws
`Invalid Comparison Operator`.

## Choosing Query or Scan

1. If the table has `table.key.sort`, the query has `id`, and `sort$`
   has a truthy value for the sort key, the plugin sends a `Query` on
   the table with `id = <id> and <sort> = <sort$ value>`.
2. Otherwise the first entry of `table.index` whose partition key is in
   the query, and whose sort key is in the query, is absent, or is the
   field named in `sort$`, is used: a `Query` on that index. The index
   partition key and (if present in the query) sort key become the key
   condition. Only one condition is allowed on the sort key.
3. Otherwise a `Scan`.

All remaining fields become a `FilterExpression`. Field names are always
sent through `ExpressionAttributeNames`, so reserved words and
injection attempts in values are safe.

The plugin follows `LastEvaluatedKey` until every page has been read.
