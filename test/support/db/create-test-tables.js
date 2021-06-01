const DynamoDb = require('./client')

const ddb = DynamoDb.connect({ verbose: true })


<<<<<<< HEAD
ddb.listTables({}, console.log)
=======
ddb.createTable(
  {
    TableName: 'test_foo',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  after_created
)

ddb.createTable(
  {
    TableName: 'foo',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  after_created
)

ddb.createTable(
  {
    TableName: 'moon_bar',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
  after_created
)


function after_created(err) {
  if (err) {
    console.error('Error:', err.message)
    return process.exit(1)
  }
}

>>>>>>> Allow the developer to delete test databases
