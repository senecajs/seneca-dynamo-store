const DynamoDb = require('./client')

const ddb = DynamoDb.connect({ verbose: true })

ddb.listTables({}, (err, res) => {
  for(let table of res.TableNames) {
    delete_table_if_not_exists(table, ddb, { verbose: true })
  }
})

function delete_table_if_not_exists(table, ddb, opts = {}) {
  return ddb.deleteTable({ TableName: table }, (err) => {
    if (err) {
      const found_table = 'ResourceNotFoundException' !== err.code

      if (found_table) {
        console.error('Error:', err.message)
        return
      }

      if (opts.verbose) {
        console.log('Table "' + table + '" does not exist.')
      }

      return
    }

      if (opts.verbose) {
        console.log('Table "' + table + '" has been deleted successfully.')
      }
  })
}

