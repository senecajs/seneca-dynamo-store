// Map an entity to a table with a sort key and a global secondary index.
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

  await new Promise((resolve) => seneca.ready(resolve))

  const client = seneca.export('dynamo-store/get_client')()
  await client.send(
    new CreateTableCommand({
      TableName: 'events01',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'at', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'at', AttributeType: 'N' },
        { AttributeName: 'kind', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'kind_at',
          KeySchema: [
            { AttributeName: 'kind', KeyType: 'HASH' },
            { AttributeName: 'at', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    }),
  )

  const event = seneca.entity('app/event')
  for (const [id, kind, at] of [['e1', 'click', 30], ['e2', 'click', 10], ['e3', 'view', 20]]) {
    await event.make$().data$({ id$: id, kind, at }).save$()
  }

  // kind is the partition key of index kind_at: this list is a Query on the index.
  const newest = await event.list$({ kind: 'click', sort$: { at: -1 } })
  console.log('click, newest first:', newest.map((e) => e.id + '@' + e.at))

  // Comparison operator on the index sort key.
  const later = await event.list$({ kind: 'click', at: { gt$: 15 } })
  console.log('click, at > 15:', later.map((e) => e.id))

  // Load and remove by full primary key (partition and sort key).
  const e3 = await event.load$({ id: 'e3', at: 20 })
  console.log('loaded:', e3.id, e3.kind)
  await event.remove$({ id: 'e3', at: 20 })
  console.log('after remove:', (await event.list$()).length, 'items')

  await client.send(new DeleteTableCommand({ TableName: 'events01' }))
  await new Promise((resolve) => seneca.close(resolve))
}

main()
