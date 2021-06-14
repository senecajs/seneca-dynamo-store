const AWS = require('aws-sdk')

var config = {
  region: 'region',
  endpoint: process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18000',
  accessKeyId: 'none',
  secretAccessKey: 'none',
}

console.log(config)

AWS.config.update(config)

var ddb = new AWS.DynamoDB()

ddb.listTables({}, console.log)

/*

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
  console.log
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
  console.log
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
  console.log
)
*/
