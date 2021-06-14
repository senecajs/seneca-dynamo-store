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
