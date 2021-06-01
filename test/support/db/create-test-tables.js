const AWS = require('aws-sdk')
const config = require('./config')

console.log(config)

AWS.config.update(config)

var ddb = new AWS.DynamoDB()

ddb.listTables({}, console.log)
