// Getting started with @seneca/dynamo-store.
// Needs DynamoDB Local: `npm run services:up` (port 18001).
const Seneca = require('seneca')
const { CreateTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb')

const endpoint = process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18001'

async function main() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use(require('../..'), {
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
