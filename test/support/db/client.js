const AWS = require('@aws-sdk/client-dynamodb')
const config = require('./config')

module.exports = {
  connect(opts = {}) {
    if (opts.verbose) {
      console.log('Connecting to DynamoDb with config:\n', config)
      console.log()
    }

    return new AWS.DynamoDB(config)
  }
}

