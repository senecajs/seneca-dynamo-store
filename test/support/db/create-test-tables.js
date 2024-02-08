const DynamoDb = require('./client')

const ddb = DynamoDb.connect({ verbose: true })


const schema = [
  {
    TableName: 'ENT0',
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
      WriteCapacityUnits: 5
    }
  },

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
      WriteCapacityUnits: 5
    }
  },

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
      WriteCapacityUnits: 5
    }
  },

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
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'players',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'racers',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'users',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'customers',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'products',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'custom01',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: 'uniq01',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },

  {
    TableName: "query01",
    KeySchema: [
      {
        KeyType: "HASH",
        AttributeName: "id"
      },
      {
        KeyType: "RANGE",
        AttributeName: "sk0"
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: "is1",
        AttributeType: "N"
      },
      {
        AttributeName: "id",
        AttributeType: "S"
      },
      {
        AttributeName: "sk0",
        AttributeType: "S"
      },
      {
        AttributeName: "ip0",
        AttributeType: "S"
      },
      {
        AttributeName: "ip1",
        AttributeType: "S"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi_0",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "ip0",
            KeyType: "HASH"
          },
        ],
      },
      {
        IndexName: "gsi_1",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "ip1",
            KeyType: "HASH"
          },
          {
            AttributeName: "is1",
            KeyType: "RANGE"
          }
        ],
      }
    ]
  },
  
  {
    TableName: "query02",
    KeySchema: [
      {
        KeyType: "HASH",
        AttributeName: "id"
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "is2",
        AttributeType: "N"
      },
      {
        AttributeName: "id",
        AttributeType: "S"
      },
      /*
      {
        AttributeName: "sk1",
        AttributeType: "S"
      },
      */
      {
        AttributeName: "ip2",
        AttributeType: "S"
      },
      {
        AttributeName: "ip3",
        AttributeType: "S"
      }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [
      {
        IndexName: "gsi_2",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "ip2",
            KeyType: "HASH"
          },
        ],
      },
      {
        IndexName: "gsi_3",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "ip3",
            KeyType: "HASH"
          },
          {
            AttributeName: "is2",
            KeyType: "RANGE"
          }
        ],
      }
    ]
  },
  
  {
    TableName: "query03",
    KeySchema: [
      {
        KeyType: "HASH",
        AttributeName: "id"
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S"
      },
      {
        AttributeName: "kind",
        AttributeType: "S"
      },
      {
        AttributeName: "t_c",
        AttributeType: "N"
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
    
    GlobalSecondaryIndexes: [
      {
        IndexName: "kind-t_c-index",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "kind",
            KeyType: "HASH"
          },
          {
            AttributeName: "t_c",
            KeyType: "RANGE"
          }
        ],
      }
    ],
    
  },
  
  {
    TableName: "query04",
    KeySchema: [
      {
        KeyType: "HASH",
        AttributeName: "id"
      },
      {
        KeyType: "RANGE",
        AttributeName: "t_c"
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S"
      },
      {
        AttributeName: "kind",
        AttributeType: "S"
      },
      {
        AttributeName: "t_c",
        AttributeType: "N"
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
    
    GlobalSecondaryIndexes: [
      {
        IndexName: "kind-t_c-index",
        Projection: {
          ProjectionType: "ALL"
        },
        KeySchema: [
          {
            AttributeName: "kind",
            KeyType: "HASH"
          },
        ],
      }
    ],
    
  }, 
]

for (const table_desc of schema) {
  create_table(table_desc, ddb, { verbose: true })
}


function create_table(table_desc, ddb, opts = {}) {
  return ddb.createTable(table_desc, (err) => {
    if (err) {
      const table = table_desc.TableName || 'undefined'
      console.error('Error creating table "' + table + '":', err.message)
      return
    }

    if (opts.verbose) {
      const table = table_desc.TableName
      console.log('Table "' + table + '" has been created successfully.')
    }

    return
  })
}

