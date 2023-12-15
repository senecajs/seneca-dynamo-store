const AWS = require('@aws-sdk/client-dynamodb')

var config = {
  region: 'region',
  endpoint: process.env.SENECA_DYNAMO_ENDPOINT || 'http://localhost:18000',
  credentials: {
    accessKeyId: 'none',
    secretAccessKey: 'none'
  }
}

console.log(config)

// AWS.config.update(config)

var ddb = new AWS.DynamoDB(config)

ddb.listTables({}, console.log)
