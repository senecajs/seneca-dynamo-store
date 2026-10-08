# Getting started

This tutorial stores, loads, lists and removes entities in DynamoDB
through Seneca. You run DynamoDB Local in Docker, so no AWS account is
needed.

## 1. Install

```sh
npm install seneca seneca-entity seneca-promisify @seneca/dynamo-store
npm install @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
```

`seneca-entity`, `seneca-promisify` and the two AWS SDK v3 packages are
peer dependencies: the plugin uses the copies your application installs.

## 2. Start DynamoDB Local

From a clone of this repository:

```sh
npm run services:up
```

This starts `amazon/dynamodb-local` on `http://localhost:18001`. Any
other DynamoDB endpoint works the same way.

## 3. The program

The program is [`docs/examples/getting-started.js`](../examples/getting-started.js):

```js
const Seneca = require('seneca')
const { CreateTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb')

const endpoint = process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18001'

async function main() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use('@seneca/dynamo-store', {
      aws: {
        region: 'local',
        endpoint,
        credentials: { accessKeyId: 'none', secretAccessKey: 'none' },
      },
    })

  await new Promise((resolve) => seneca.ready(resolve))

  // The plugin does not create tables. Create one with the exported client.
  const client = seneca.export('dynamo-store/get_client')()
  await client.send(
    new CreateTableCommand({
      TableName: 'shop_product',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  )

  const product = seneca.entity('shop/product')
  const apple = await product.make$().data$({ name: 'apple', price: 1 }).save$()
  await product.make$().data$({ name: 'pear', price: 2 }).save$()

  const loaded = await product.load$(apple.id)
  console.log('loaded:', loaded.name, loaded.price)

  const cheap = await product.list$({ price: 1 })
  console.log('price 1:', cheap.map((p) => p.name))

  await loaded.remove$()
  const all = await product.list$()
  console.log('remaining:', all.map((p) => p.name))

  await client.send(new DeleteTableCommand({ TableName: 'shop_product' }))
  await new Promise((resolve) => seneca.close(resolve))
}

main()
```

(The example file in the repository uses `require('../..')` instead of
the package name.) Run it:

```sh
node docs/examples/getting-started.js
```

Output, with `seneca@4.0.0-rc5`:

```
loaded: apple 1
price 1: [ 'apple' ]
remaining: [ 'pear' ]
```

## 4. What happened

* `aws` is passed unchanged to the `DynamoDB` client constructor of
  `@aws-sdk/client-dynamodb`.
* The entity `shop/product` maps to the table `shop_product`
  (`<base>_<name>`). The table must exist and have the partition key `id`
  of type string.
* `save$` without an id generated one and wrote the item with
  `PutItem`; `load$` used `GetItem`; `list$` with a query used `Scan`
  with a filter expression; `remove$` used `DeleteItem`.
* Waiting with the callback form of `ready` avoids a hang of
  `await seneca.ready()` on an idle instance in 4.0.0-rc5.

## Next steps

* [Configure tables, keys and indexes](../how-to/configure-tables.md)
* [Options reference](../reference/options.md)
* [How the store works](../explanation/how-it-works.md)
