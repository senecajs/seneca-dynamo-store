const DynamoDb = require('./client')

const ddb = DynamoDb.connect({ verbose: true })

ddb.listTables({}, (err, result) => {
  if (err) {
    console.error('Error:', err.message)
    return process.exit(1)
  }

  console.log(result)
})

