
const AWS = require("aws-sdk")

var config = {
  region: 'region',
  endpoint: process.env.SENECA_DYNAMO_ENDPOINT,
  accessKeyId: 'none',
  secretAccessKey: 'none'
}

console.log(config)

AWS.config.update(config)

var ddb = new AWS.DynamoDB()

ddb.createTable({
  "TableName": "foo",
  KeySchema: [
    {
      AttributeName: "id", 
      KeyType: "HASH"
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "id", 
      AttributeType: "S"
    }, 
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5, 
    WriteCapacityUnits: 5
  },
}, console.log)

