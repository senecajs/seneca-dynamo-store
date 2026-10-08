# Exports

| Export | Type | Description |
| ------ | ---- | ----------- |
| `dynamo-store/get_client` | function | Returns the `DynamoDB` client (`@aws-sdk/client-dynamodb`) created at init, or `undefined` before init. With a tag use `dynamo-store$<tag>/get_client`. |

```js
const client = seneca.export('dynamo-store/get_client')()
```

The module also exports `defaults`, `errors` (`{}`) and `intern`
(internal helpers, used by the tests).
