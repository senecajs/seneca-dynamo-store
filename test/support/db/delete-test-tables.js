const DynamoDb = require('./client')

const ddb = DynamoDb.connect({ verbose: true })


delete_table_if_not_exists('test_foo', ddb, { verbose: true })
delete_table_if_not_exists('foo', ddb, { verbose: true })
delete_table_if_not_exists('moon_bar', ddb, { verbose: true })


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

